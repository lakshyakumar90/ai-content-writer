import cors from "cors";
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { createAgent } from "./agents/createAgent";
import { AgentPlatform, AIAgent } from "./agents/types";
import { apiKey, serverClient } from "./serverClient";
import { connectDb } from "./db";
import { UserModel, UserDoc } from "./models/User";
import { AuthedRequest, clearAuthCookie, requireAuth, setAuthCookie, signToken } from "./auth";
import type { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Initialize OpenRouter client for image analysis
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.WEB_ORIGIN || "http://localhost:5173",
    "X-Title": "AI Content Writer",
  },
});

const app = express();
app.use(express.json());
app.use(cookieParser());

// CORS - Simplified configuration
app.use(
  cors({
    origin: process.env.WEB_ORIGIN as string ,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// Connect MongoDB
connectDb().catch((e) => {
  console.error("Failed to connect MongoDB", e);
  process.exit(1);
});

// Map to store the AI Agent instances
// [user_id string]: AI Agent
const aiAgentCache = new Map<string, AIAgent>();
const pendingAiAgents = new Set<string>();

// TODO: temporary set to 8 hours, should be cleaned up at some point
const inactivityThreshold = 480 * 60 * 1000;
// Periodically check for inactive AI agents and dispose of them
setInterval(async () => {
  const now = Date.now();
  for (const [userId, aiAgent] of aiAgentCache) {
    if (now - aiAgent.getLastInteraction() > inactivityThreshold) {
      console.log(`Disposing AI Agent due to inactivity: ${userId}`);
      await disposeAiAgent(aiAgent);
      aiAgentCache.delete(userId);
    }
  }
}, 5000);

app.get("/", (req, res) => {
  res.json({
    message: "AI Writing Assistant Server is running",
    apiKey: apiKey,
    activeAgents: aiAgentCache.size,
  });
});

// -------- AUTH ROUTES --------
app.post("/auth/register", async (req, res) => {
  const { email, username, password } = req.body || {};
  if (!email || !username || !password) {
    return res.status(400).json({ error: "email, username, password required" });
  }
  const exists = await UserModel.findOne({ email: String(email).toLowerCase().trim() }).lean<UserDoc>();
  if (exists) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    email: String(email).toLowerCase().trim(),
    username: String(username).trim(),
    passwordHash,
  });
  const token = signToken(user._id.toString());
  setAuthCookie(res, token);
  res.json({ id: user._id.toString(), email: user.email, username: user.username });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }
  const user = await UserModel.findOne({ email: String(email).toLowerCase().trim() }).lean<UserDoc>();
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken(user._id.toString());
  setAuthCookie(res, token);
  res.json({ id: user._id.toString(), email: user.email, username: user.username });
});

app.get("/auth/me", async (req: AuthedRequest, res) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requireAuth(req, res, (err?: unknown) => (err ? reject(err) : resolve()))
    );
  } catch {
    return res.json({ user: null });
  }
  const user = await UserModel.findById(req.userId).lean<UserDoc>();
  if (!user) return res.json({ user: null });
  res.json({ user: { id: user._id.toString(), email: user.email, username: user.username } });
});

app.post("/auth/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});
// -------- END AUTH ROUTES --------

/**
 * Handle the request to start the AI Agent
 */
app.post("/start-ai-agent", requireAuth, async (req, res) => {
  const { channel_id, channel_type = "messaging" } = req.body;
  console.log(`[API] /start-ai-agent called for channel: ${channel_id}`);

  // Simple validation
  if (!channel_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const user_id = `ai-bot-${channel_id.replace(/[!]/g, "")}`;

  try {
    // Prevent multiple agents from being created for the same channel simultaneously
    if (!aiAgentCache.has(user_id) && !pendingAiAgents.has(user_id)) {
      console.log(`[API] Creating new agent for ${user_id}`);
      pendingAiAgents.add(user_id);

      await serverClient.upsertUser({
        id: user_id,
        name: "AI Writing Assistant",
      });

      const channel = serverClient.channel(channel_type, channel_id);
      await channel.addMembers([user_id]);

      const agent = await createAgent(
        user_id,
        AgentPlatform.OPENAI,
        channel_type,
        channel_id
      );

      await agent.init();
      // Final check to prevent race conditions where an agent might have been added
      // while this one was initializing.
      if (aiAgentCache.has(user_id)) {
        await agent.dispose();
      } else {
        aiAgentCache.set(user_id, agent);
      }
    } else {
      console.log(`AI Agent ${user_id} already started or is pending.`);
    }

    res.json({ message: "AI Agent started", data: [] });
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Failed to start AI Agent", errorMessage);
    console.error("Full error:", error);
    res
      .status(500)
      .json({ error: "Failed to start AI Agent", reason: errorMessage });
  } finally {
    pendingAiAgents.delete(user_id);
  }
});

/**
 * Handle the request to stop the AI Agent
 */
app.post("/stop-ai-agent", requireAuth, async (req, res) => {
  const { channel_id } = req.body;
  console.log(`[API] /stop-ai-agent called for channel: ${channel_id}`);
  const user_id = `ai-bot-${channel_id.replace(/[!]/g, "")}`;
  try {
    const aiAgent = aiAgentCache.get(user_id);
    if (aiAgent) {
      console.log(`[API] Disposing agent for ${user_id}`);
      await disposeAiAgent(aiAgent);
      aiAgentCache.delete(user_id);
    } else {
      console.log(`[API] Agent for ${user_id} not found in cache.`);
    }
    res.json({ message: "AI Agent stopped", data: [] });
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Failed to stop AI Agent", errorMessage);
    res
      .status(500)
      .json({ error: "Failed to stop AI Agent", reason: errorMessage });
  }
});

app.get("/agent-status", requireAuth, (req, res) => {
  const { channel_id } = req.query;
  if (!channel_id || typeof channel_id !== "string") {
    return res.status(400).json({ error: "Missing channel_id" });
  }
  const user_id = `ai-bot-${channel_id.replace(/[!]/g, "")}`;
  console.log(
    `[API] /agent-status called for channel: ${channel_id} (user: ${user_id})`
  );

  if (aiAgentCache.has(user_id)) {
    console.log(`[API] Status for ${user_id}: connected`);
    res.json({ status: "connected" });
  } else if (pendingAiAgents.has(user_id)) {
    console.log(`[API] Status for ${user_id}: connecting`);
    res.json({ status: "connecting" });
  } else {
    console.log(`[API] Status for ${user_id}: disconnected`);
    res.json({ status: "disconnected" });
  }
});

// Token provider endpoint - generates secure tokens
app.post("/token", requireAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    // Create token with expiration (1 hour) and issued at time for security
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiration = issuedAt + 60 * 60; // 1 hour from now

    const token = serverClient.createToken(userId, expiration, issuedAt);

    res.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({
      error: "Failed to generate token",
    });
  }
});

// Image generation endpoint using OpenRouter with Gemini 2.5 Flash Image
app.post("/images/generate", requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt, size = 512 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    console.log(`[API] /images/generate called with prompt: ${prompt}`);

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      modalities: ["image", "text"],
    } as any);

    const message = completion.choices[0].message as any;
    if (!message.images || message.images.length === 0) {
      throw new Error("No image generated by API");
    }

    const imageUrl = message.images[0].image_url.url;
    
    res.json({ 
      url: imageUrl,
      model: "google/gemini-2.5-flash-image-preview"
    });
  } catch (error) {
    console.error("Image generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ 
      error: "Failed to generate image", 
      details: errorMessage 
    });
  }
});

// Image editing endpoint using OpenRouter with DALL-E models
app.post("/images/edit", requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt, imageBase64 } = req.body;

    if (!prompt || !imageBase64) {
      return res.status(400).json({ error: "prompt and imageBase64 are required" });
    }

    console.log(`[API] /images/edit called with prompt: ${prompt}`);

    // For now, we'll return a placeholder response since DALL-E 2 editing via OpenRouter
    // may have different requirements. This endpoint structure is ready for implementation.
    res.status(501).json({ 
      error: "Image editing not yet implemented", 
      details: "This feature requires additional configuration with OpenRouter for DALL-E 2 editing capabilities" 
    });
  } catch (error) {
    console.error("Image editing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ 
      error: "Failed to edit image", 
      details: errorMessage 
    });
  }
});

// Image analysis endpoint using OpenRouter with Gemini 2.5 Flash Image
app.post("/images/analyze", requireAuth, async (req: Request, res: Response) => {
  try {
    const { imageUrl, prompt = "What is in this image?" } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    console.log(`[API] /images/analyze called with imageUrl: ${imageUrl}`);

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
    });

    const analysis = completion.choices[0].message.content;
    
    res.json({ 
      analysis,
      model: "google/gemini-2.5-flash-image"
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ 
      error: "Failed to analyze image", 
      details: errorMessage 
    });
  }
});

async function disposeAiAgent(aiAgent: AIAgent) {
  await aiAgent.dispose();
  if (!aiAgent.user) {
    return;
  }
  await serverClient.deleteUser(aiAgent.user.id, {
    hard_delete: true,
  });
}

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
