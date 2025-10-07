import OpenAI from "openai";
import type { Channel, DefaultGenerics, Event, StreamChat } from "stream-chat";
import type { AIAgent } from "../types";
import { GeminiResponseHandler } from "./GeminiResponseHandler";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class OpenAIAgent implements AIAgent {
  private openai?: OpenAI;
  private lastInteractionTs = Date.now();
  private conversationHistory: ChatMessage[] = [];
  private handlers: GeminiResponseHandler[] = [];

  constructor(
    readonly chatClient: StreamChat,
    readonly channel: Channel
  ) {}

  dispose = async () => {
    this.chatClient.off("message.new", this.handleMessage);
    await this.chatClient.disconnectUser();

    this.handlers.forEach((handler) => handler.dispose());
    this.handlers = [];
  };

  get user() {
    return this.chatClient.user;
  }

  getLastInteraction = (): number => this.lastInteractionTs;

  init = async () => {
    const apiKey = process.env.GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY environment variable");
      throw new Error("Gemini API key is required. Please set GEMINI_API_KEY environment variable.");
    }

    this.openai = new OpenAI({ 
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    // Initialize conversation with system prompt
    this.conversationHistory = [
      {
        role: "system",
        content: this.getWritingAssistantPrompt()
      }
    ];

    this.chatClient.on("message.new", this.handleMessage);
  };

  private getWritingAssistantPrompt = (context?: string): string => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return `You are an expert AI Writing Assistant. Your primary purpose is to be a collaborative writing partner.

**Your Core Capabilities:**
- Content Creation, Improvement, Style Adaptation, Brainstorming, and Writing Coaching.
- **Current Date**: Today's date is ${currentDate}. Please use this for any time-sensitive queries.

**Response Format:**
- Be direct and production-ready.
- Use clear formatting.
- Never begin responses with phrases like "Here's the edit:", "Here are the changes:", or similar introductory statements.
- Provide responses directly and professionally without unnecessary preambles.

**Writing Context**: ${context || "General writing assistance."}

Your goal is to provide accurate, current, and helpful written content.`;
  };

  private async performWebSearch(query: string): Promise<string> {
    try {
      const tavilyApiKey = process.env.TAVILY_API_KEY;
      if (!tavilyApiKey) {
        return "Web search is not available (missing Tavily API key)";
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: query,
          search_depth: "basic",
          include_answer: true,
          include_domains: [],
          exclude_domains: [],
          max_results: 5,
        }),
      });

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const searchResults = data.results.map((result: any) => 
          `Title: ${result.title}\nURL: ${result.url}\nContent: ${result.content}\n`
        ).join("\n\n");
        
        return `Search Results for "${query}":\n\n${searchResults}`;
      } else {
        return `No search results found for "${query}"`;
      }
    } catch (error) {
      console.error("Web search error:", error);
      return `Error performing web search for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private handleMessage = async (e: Event<DefaultGenerics>) => {
    if (!this.openai) {
      console.log("OpenAI not initialized");
      return;
    }

    if (!e.message || e.message.ai_generated) {
      return;
    }

    const message = e.message.text;
    if (!message) return;

    this.lastInteractionTs = Date.now();

    // Add user message to conversation history
    this.conversationHistory.push({
      role: "user",
      content: message
    });

    // Update system prompt with context if available
    const writingTask = (e.message.custom as { writingTask?: string })?.writingTask;
    if (writingTask) {
      this.conversationHistory[0].content = this.getWritingAssistantPrompt(`Writing Task: ${writingTask}`);
    }

    const { message: channelMessage } = await this.channel.sendMessage({
      text: "",
      ai_generated: true,
    });

    await this.channel.sendEvent({
      type: "ai_indicator.update",
      ai_state: "AI_STATE_THINKING",
      cid: channelMessage.cid,
      message_id: channelMessage.id,
    });

    try {
      // Create the chat completion stream
      const stream = await this.openai.chat.completions.create({
        model: "gemini-2.5-flash",
        messages: this.conversationHistory,
        stream: true,
        // Note: Function calling disabled temporarily for Gemini compatibility
        // functions: [
        //   {
        //     name: "web_search",
        //     description: "Search the web for current information, news, facts, or research on any topic",
        //     parameters: {
        //       type: "object",
        //       properties: {
        //         query: {
        //           type: "string",
        //           description: "The search query to find information about",
        //         },
        //       },
        //       required: ["query"],
        //     },
        //   },
        // ],
        // function_call: "auto",
      });

      const handler = new GeminiResponseHandler(
        stream,
        this.chatClient,
        this.channel,
        channelMessage,
        (assistantMessage: string) => {
          // Add assistant response to conversation history
          this.conversationHistory.push({
            role: "assistant",
            content: assistantMessage
          });
          
          // Keep conversation history manageable (last 20 messages)
          if (this.conversationHistory.length > 21) {
            this.conversationHistory = [
              this.conversationHistory[0], // Keep system message
              ...this.conversationHistory.slice(-20) // Keep last 20 messages
            ];
          }
        },
        async (query: string) => await this.performWebSearch(query),
        () => this.removeHandler(handler)
      );
      
      this.handlers.push(handler);
      void handler.run();

    } catch (error) {
      console.error("Error creating chat completion:", error);
      
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_ERROR",
        cid: channelMessage.cid,
        message_id: channelMessage.id,
      });

      await this.chatClient.partialUpdateMessage(channelMessage.id, {
        set: {
          text: "Sorry, I encountered an error processing your message. Please try again."
        }
      });
    }
  };

  private removeHandler = (handlerToRemove: GeminiResponseHandler) => {
    this.handlers = this.handlers.filter(
      (handler) => handler !== handlerToRemove
    );
  };
}