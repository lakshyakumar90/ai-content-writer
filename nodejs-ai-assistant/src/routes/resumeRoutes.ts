import express from "express";
import type { Response } from "express";
import multer from "multer";
import { AuthedRequest, requireAuth } from "../auth";
import { uploadBufferToCloudinary } from "../services/cloudinary";
import { ResumeAnalysisModel } from "../models/ResumeAnalysis";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function normalizeMime(mimeType: string) {
  if (mimeType === "image/jpg") return "image/jpeg";
  return mimeType;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text || "";
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
}

const RESULT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    improvements: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    keywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    keywordMatches: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    missingKeywords: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    keywordCoveragePct: { type: SchemaType.NUMBER },
    atsScore: { type: SchemaType.NUMBER },
    yearsOfExperience: { type: SchemaType.NUMBER },
    readabilityScore: { type: SchemaType.NUMBER },
    seniority: { type: SchemaType.STRING },
    roleMatchScores: {
      type: SchemaType.OBJECT,
      properties: {
        "Software Engineer": { type: SchemaType.NUMBER },
        "Frontend Engineer": { type: SchemaType.NUMBER },
        "Backend Engineer": { type: SchemaType.NUMBER },
        "Full-Stack Engineer": { type: SchemaType.NUMBER },
        "Data Engineer": { type: SchemaType.NUMBER },
      },
    },
    sectionsQuality: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.NUMBER },
        experience: { type: SchemaType.NUMBER },
        education: { type: SchemaType.NUMBER },
        skills: { type: SchemaType.NUMBER },
      },
    },
    skillsCategorized: {
      type: SchemaType.OBJECT,
      properties: {
        technical: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        soft: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        tools: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
    },
    educationSummary: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    certifications: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    suggestedRoles: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["summary", "strengths", "improvements", "keywords", "atsScore"],
} as const;

const TEXT_PROMPT = `You are an expert ATS and resume analyst. Given the resume text, output ONLY JSON matching this structure:
{ ... } (same as before)
Rules:
- Be realistic and consistent. Numbers must be 0-100 where specified.
- keywords should be deduped, lowercase preferred.
- Place roles present in resume toward the top of suggestedRoles.`;

const IMAGE_PROMPT = `Analyze the resume image and return ONLY JSON with the same schema as the text prompt.`;

router.post(
  "/analyze",
  requireAuth,
  upload.single("file"),
  async (req: AuthedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "File is required" });

      const mimeType = normalizeMime(file.mimetype);
      if (!ALLOWED_TYPES.has(mimeType)) {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      const fileUrl = await uploadBufferToCloudinary(
        file.buffer,
        file.originalname,
        mimeType,
        "ai-content-writer/resumes"
      );

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const modelUsed = "gemini-2.5-flash";
      const model = genAI.getGenerativeModel({
        model: modelUsed,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESULT_SCHEMA as any,
        },
      });

      let textContent = "";
      let analysis: any;

      if (mimeType === "application/pdf") {
        textContent = await extractTextFromPdf(file.buffer);
      } else if (
        mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        textContent = await extractTextFromDocx(file.buffer);
      }

      const promptInputs = mimeType.startsWith("image/")
        ? [
            { text: IMAGE_PROMPT },
            {
              inlineData: {
                mimeType,
                data: file.buffer.toString("base64"),
              },
            },
          ]
        : [{ text: TEXT_PROMPT }, { text: textContent.slice(0, 200_000) }];

      const result = await model.generateContent(promptInputs as any);

      try {
        analysis = JSON.parse(result.response.text());
      } catch (err) {
        console.error(
          "Failed to parse Gemini response:",
          result.response.text()
        );
        throw new Error("Gemini returned invalid JSON");
      }

      const doc = await ResumeAnalysisModel.create({
        userId: req.userId,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType,
        analysis,
        model: modelUsed,
      });

      res.json({
        _id: doc._id,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        analysis: doc.analysis,
        model: doc.model,
        createdAt: doc.createdAt,
      });
    } catch (error) {
      console.error("Resume analyze error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to analyze resume", details: message });
    }
  }
);

router.get(
  "/history",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const page = Math.max(
        parseInt(String(req.query.page || "1"), 10) || 1,
        1
      );
      const limit = Math.min(
        Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1),
        100
      );
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        ResumeAnalysisModel.find({ userId: req.userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ResumeAnalysisModel.countDocuments({ userId: req.userId }),
      ]);

      res.json({
        items,
        page,
        limit,
        total,
        hasMore: skip + items.length < total,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to fetch history", details: message });
    }
  }
);

router.get("/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const item = await ResumeAnalysisModel.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).lean();

    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to fetch item", details: message });
  }
});

router.delete(
  "/:id",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const item = await ResumeAnalysisModel.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to delete item", details: message });
    }
  }
);

export default router;
