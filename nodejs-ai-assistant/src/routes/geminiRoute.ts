import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFile } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

function saveBinaryFile(fileName: string, content: Buffer) {
  const filePath = path.join(__dirname, '../../generated', fileName);
  writeFile(filePath, content, (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`✅ File ${fileName} saved successfully.`);
  });
}

router.post('/generate-image', async (req: Request, res: Response) => {
  try {
    console.log("Heloo");
    const { prompt } = req.body;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: { imageSize: '1K' },
    };

    const model = 'gemini-2.5-flash-image';
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt || 'Generate an image of a banana wearing a costume.' }],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fileIndex = 0;
    let imageFileName = '';

    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content?.parts) continue;

      const part = chunk.candidates[0].content.parts[0];
      if (part.inlineData) {
        const inlineData = part.inlineData;
        const fileExtension = mime.getExtension(inlineData.mimeType || 'png');
        imageFileName = `generated_image_${Date.now()}_${fileIndex++}.${fileExtension}`;
        const buffer = Buffer.from(inlineData.data || '', 'base64');
        saveBinaryFile(imageFileName, buffer);
      } else if (chunk.text) {
        console.log(chunk.text);
      }
    }

    res.json({
      success: true,
      message: 'Image generated successfully',
      fileName: imageFileName,
    });
  } catch (error) {
    console.error('❌ Error generating image:', error);
    res.status(500).json({ success: false, error: 'Failed to generate image' });
  }
});

export default router;
