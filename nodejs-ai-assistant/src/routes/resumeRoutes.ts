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
    // Executive Summary
    summary: { type: SchemaType.STRING },
    atsScore: { type: SchemaType.NUMBER },
    seniority: { type: SchemaType.STRING },
    primaryRoleMatch: { type: SchemaType.STRING },
    topStrengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    criticalImprovements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    
    // ATS Compatibility
    atsScoreBreakdown: {
      type: SchemaType.OBJECT,
      properties: {
        overall: { type: SchemaType.NUMBER },
        keywordOptimization: { type: SchemaType.NUMBER },
        formatStructure: { type: SchemaType.NUMBER },
        readability: { type: SchemaType.NUMBER },
        completeness: { type: SchemaType.NUMBER },
      },
    },
    atsRedFlags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    
    // Section Analysis
    sectionsQuality: {
      type: SchemaType.OBJECT,
      properties: {
        contactInfo: { type: SchemaType.NUMBER },
        summary: { type: SchemaType.NUMBER },
        experience: { type: SchemaType.NUMBER },
        projects: { type: SchemaType.NUMBER },
        skills: { type: SchemaType.NUMBER },
        education: { type: SchemaType.NUMBER },
      },
    },
    sectionFeedback: {
      type: SchemaType.OBJECT,
      properties: {
        contactInfo: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
        experience: { type: SchemaType.STRING },
        projects: { type: SchemaType.STRING },
        skills: { type: SchemaType.STRING },
        education: { type: SchemaType.STRING },
      },
    },
    
    // Keyword Analysis
    keywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    keywordMatches: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    missingKeywords: {
      type: SchemaType.OBJECT,
      properties: {
        high: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        medium: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        low: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
    },
    keywordCoveragePct: { type: SchemaType.NUMBER },
    overusedKeywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    
    // Role Match
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
    roleMatchDetails: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          role: { type: SchemaType.STRING },
          score: { type: SchemaType.NUMBER },
          whyMatches: { type: SchemaType.STRING },
          whatsMissing: { type: SchemaType.STRING },
        },
      },
    },
    
    // Impact & Achievement
    impactAnalysis: {
      type: SchemaType.OBJECT,
      properties: {
        quantifiedAchievements: { type: SchemaType.NUMBER },
        impactMetricsUsage: { type: SchemaType.NUMBER },
        actionVerbStrength: { type: SchemaType.NUMBER },
      },
    },
    achievementRewrites: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          before: { type: SchemaType.STRING },
          after: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
        },
      },
    },
    
    // Skills & Experience
    skillsCategorized: {
      type: SchemaType.OBJECT,
      properties: {
        technical: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        soft: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        tools: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
    },
    yearsOfExperience: { type: SchemaType.NUMBER },
    educationSummary: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    certifications: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    
    // Readability
    readabilityScore: { type: SchemaType.NUMBER },
    languageAnalysis: {
      type: SchemaType.OBJECT,
      properties: {
        clarityScore: { type: SchemaType.NUMBER },
        professionalTone: { type: SchemaType.STRING },
        grammarIssues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        jargonBalance: { type: SchemaType.STRING },
        activeVsPassive: { type: SchemaType.STRING },
      },
    },
    
    // Action Plan
    actionPlan: {
      type: SchemaType.OBJECT,
      properties: {
        immediate: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        important: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        enhancements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        longTerm: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
    },
    
    // Red Flags & Warnings
    redFlags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    
    // Recommendations
    strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    improvements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    suggestedRoles: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    summaryRewrite: { type: SchemaType.STRING },
    industryInsights: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    bonusRecommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["summary", "atsScore", "seniority", "primaryRoleMatch", "topStrengths", "criticalImprovements", "actionPlan"],
} as const;

const TEXT_PROMPT = `# AI Resume Analyzer System Prompt

You are an expert ATS (Applicant Tracking System) resume analyzer and career coach. Analyze the provided resume comprehensively and generate a detailed, actionable report.

## OUTPUT FORMAT
Return ONLY valid JSON matching the provided schema. Do NOT include markdown, explanations, or any text outside the JSON.

## ANALYSIS GUIDELINES

### 1. EXECUTIVE SUMMARY
- Calculate realistic ATS Score (0-100) based on keyword coverage, format, and completeness
- Determine Experience Level: Entry (0-2 yrs), Junior (2-4 yrs), Mid (4-7 yrs), Senior (7+ yrs)
- Identify Primary Role Match from the candidate's experience
- Extract Top 3 Strengths (specific, evidence-based)
- Identify Top 3 Critical Improvements (high-impact, actionable)

### 2. ATS COMPATIBILITY ANALYSIS
Score each dimension 0-100:
- **Overall ATS Score**: Weighted average
- **Keyword Optimization**: Industry keyword coverage
- **Format & Structure**: ATS-friendly formatting
- **Readability**: Clarity and professionalism
- **Completeness**: All expected sections present

**ATS Red Flags** to identify:
- Tables, text boxes, headers/footers
- Graphics, images, charts
- Unusual fonts or formatting
- Missing critical sections
- Non-standard section names
- Multi-column layouts (problematic for ATS)

### 3. SECTION-BY-SECTION ANALYSIS
Rate each section 0-10 and provide specific feedback:
- **Contact Information**: Completeness, professional links
- **Professional Summary**: Impact, clarity, value proposition
- **Work Experience**: Quantified achievements, action verbs, relevance
- **Projects**: Technical depth, business impact
- **Skills**: Organization, relevance, proficiency
- **Education**: Completeness, relevant coursework

### 4. KEYWORD ANALYSIS
- **Matched Keywords**: Present in resume (categorize: Technical, Soft Skills, Tools)
- **Missing Keywords by Priority**:
  - High: Essential for role and ATS
  - Medium: Commonly expected
  - Low: Nice to have
- **Overused Keywords**: May appear as keyword stuffing
- **Coverage Percentage**: (matched / (matched + high priority missing)) * 100

### 5. ROLE MATCH ANALYSIS
For top 5 target roles:
- Calculate match score (0-100)
- Explain why it matches (specific experiences/skills)
- Identify what's missing for stronger match

### 6. IMPACT & ACHIEVEMENT ANALYSIS
- Count quantified achievements
- Calculate percentage using impact metrics
- Rate action verb strength (0-10)
- Provide 3-5 before/after rewrite examples with explanations

### 7. LANGUAGE & READABILITY
- **Clarity Score**: 0-100
- **Professional Tone**: Assessment (Excellent/Good/Needs Improvement)
- **Grammar Issues**: Specific problems found
- **Jargon Balance**: Too much/Too little/Appropriate
- **Active vs Passive**: Ratio and recommendation

### 8. PRIORITIZED ACTION PLAN
Organize recommendations by impact:
1. **Immediate Changes**: Highest impact, do first (3-5 items)
2. **Important Additions**: Do second (3-5 items)
3. **Enhancement Opportunities**: Do third (3-5 items)
4. **Long-term Development**: Skills/experiences to acquire (2-3 items)

### 9. RED FLAGS & WARNING SIGNS
Identify concerning elements:
- Employment gaps without explanation
- Frequent job changes (>3 in 2 years)
- Inconsistent formatting
- Typos or errors
- Outdated technologies without context
- Generic statements without specifics

### 10. SPECIFIC REWRITES
- **Summary Rewrite**: Provide improved version
- **Achievement Rewrites**: 3-5 specific before/after examples

### 11. ADDITIONAL RECOMMENDATIONS
- **Strengths**: Detailed list of strong points
- **Improvements**: Actionable improvement suggestions
- **Suggested Roles**: Best-fit positions based on experience
- **Industry Insights**: Current trends, emerging skills, certifications
- **Bonus Recommendations**: LinkedIn, portfolio, GitHub, networking tips

## SCORING GUIDELINES
- Be realistic and data-driven
- All scores are 0-100 (or 0-10 where specified)
- Consistent scoring across dimensions
- Evidence-based assessments

## TONE GUIDELINES
- Constructive and supportive, never discouraging
- Specific and actionable, never vague
- Data-driven and objective
- Encouraging growth mindset
- Professional yet accessible
- Focus on potential, not just current state

Resume text to analyze:`;

const IMAGE_PROMPT = `# AI Resume Analyzer System Prompt (Image Analysis)

You are an expert ATS (Applicant Tracking System) resume analyzer and career coach. Analyze the provided resume IMAGE comprehensively and generate a detailed, actionable report.

## OUTPUT FORMAT
Return ONLY valid JSON matching the provided schema. Do NOT include markdown, explanations, or any text outside the JSON.

Follow the same comprehensive analysis guidelines as the text prompt:
1. Extract all text and information from the resume image
2. Analyze executive summary metrics (ATS score, seniority, role match, strengths, improvements)
3. Evaluate ATS compatibility (including visual format issues)
4. Assess each section (contact, summary, experience, projects, skills, education)
5. Analyze keywords (matched, missing by priority, overused, coverage %)
6. Calculate role match scores with explanations
7. Evaluate impact & achievements with rewrite examples
8. Assess language & readability
9. Create prioritized action plan (immediate, important, enhancements, long-term)
10. Identify red flags
11. Provide specific rewrites for summary and achievements
12. Offer strengths, improvements, suggested roles, industry insights, and bonus recommendations

## ADDITIONAL CONSIDERATIONS FOR IMAGE ANALYSIS
- Note any visual formatting that would cause ATS issues (columns, graphics, non-standard fonts)
- Assess overall visual appeal vs. ATS compatibility
- Identify any text that may be difficult for ATS to parse

Be realistic, specific, actionable, and encouraging. All scores 0-100 (or 0-10 where specified).

Resume image to analyze:`;

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
