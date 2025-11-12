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
        console.warn("⚠️ TAVILY_API_KEY not configured");
        return "Web search is not available (missing Tavily API key). Please configure TAVILY_API_KEY in your environment variables.";
      }

      console.log(`🔍 Searching Tavily for: "${query}"`);

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Tavily API error (${response.status}):`, errorText);
        return `Web search failed: ${response.status} - ${errorText}`;
      }

      const data = await response.json();
      console.log(`✓ Tavily returned ${data.results?.length || 0} results`);
      
      if (data.results && data.results.length > 0) {
        const searchResults = data.results.map((result: any, index: number) => 
          `[${index + 1}] ${result.title}\nSource: ${result.url}\n${result.content}\n`
        ).join("\n");
        
        let fullResponse = `Found ${data.results.length} search results for "${query}":\n\n${searchResults}`;
        
        // Add the answer if available
        if (data.answer) {
          fullResponse = `Quick Answer: ${data.answer}\n\n${fullResponse}`;
        }
        
        return fullResponse;
      } else {
        return `No search results found for "${query}". The query might be too specific or the topic might not have recent information available.`;
      }
    } catch (error) {
      console.error("❌ Web search exception:", error);
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
      // Create the chat completion stream with tool calling enabled
      const stream = await this.openai.chat.completions.create({
        model: "gemini-2.5-flash",
        messages: this.conversationHistory,
        stream: true,
        tools: [
          {
            type: "function",
            function: {
              name: "web_search",
              description: "Search the web for current information, news, facts, or research on any topic. Use this when you need up-to-date information that may not be in your training data.",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query to find information about",
                  },
                },
                required: ["query"],
              },
            },
          },
        ],
        tool_choice: "auto",
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
        () => this.removeHandler(handler),
        async (toolName: string, toolArgs: any, toolCallId: string) => {
          // Handle tool call - execute the tool and continue the conversation
          await this.handleToolCall(toolName, toolArgs, toolCallId, channelMessage);
        }
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

  private handleToolCall = async (
    toolName: string,
    toolArgs: any,
    toolCallId: string,
    originalMessage: any
  ) => {
    if (!this.openai) {
      console.error("❌ OpenAI client not initialized in handleToolCall");
      return;
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔧 TOOL CALL INITIATED`);
    console.log(`Tool: ${toolName}`);
    console.log(`Args:`, JSON.stringify(toolArgs, null, 2));
    console.log(`${"=".repeat(60)}\n`);

    try {
      // Update indicator to show we're using external sources
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_EXTERNAL_SOURCES",
        cid: originalMessage.cid,
        message_id: originalMessage.id,
      });
      console.log(`✓ Updated UI status to "AI_STATE_EXTERNAL_SOURCES"`);

      // Execute the web search
      let toolResult = "";
      if (toolName === "web_search") {
        console.log(`📡 Starting web search...`);
        toolResult = await this.performWebSearch(toolArgs.query);
        console.log(`✓ Web search completed, result length: ${toolResult.length} characters`);
      }

      // Instead of using tool role, add search results as a system message
      // This is more compatible with Gemini's OpenAI compatibility layer
      const systemMessage = `[Web Search Results for "${toolArgs.query}"]\n\n${toolResult}\n\n[End of Search Results]\n\nPlease provide a comprehensive answer to the user's question based on these search results.`;
      
      this.conversationHistory.push({
        role: "system",
        content: systemMessage
      });
      console.log(`✓ Added search results to conversation history`);
      console.log(`📝 Current conversation history length: ${this.conversationHistory.length} messages`);

      // Update indicator to show we're generating the response
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_GENERATING",
        cid: originalMessage.cid,
        message_id: originalMessage.id,
      });
      console.log(`✓ Updated UI status to "AI_STATE_GENERATING"`);

      // Make a new API call with the search results to get the final response
      // Note: We don't pass tools again to avoid another tool call loop
      console.log(`🚀 Creating follow-up stream to generate final response...`);
      const followUpStream = await this.openai.chat.completions.create({
        model: "gemini-2.5-flash",
        messages: this.conversationHistory,
        stream: true,
      });
      console.log(`✓ Follow-up stream created successfully`);

      // Handle the follow-up response
      console.log(`🔄 Creating follow-up handler...`);
      const followUpHandler = new GeminiResponseHandler(
        followUpStream,
        this.chatClient,
        this.channel,
        originalMessage,
        (assistantMessage: string) => {
          console.log(`✓ Follow-up response completed, length: ${assistantMessage.length} characters`);
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
        () => {
          console.log(`🧹 Cleaning up follow-up handler`);
          this.removeHandler(followUpHandler);
        }
        // Note: No onToolCall callback here to prevent infinite loops
      );

      this.handlers.push(followUpHandler);
      console.log(`✓ Follow-up handler added to handlers list (total: ${this.handlers.length})`);
      console.log(`▶️  Starting follow-up handler...`);
      await followUpHandler.run();
      console.log(`✓ Follow-up handler.run() called\n${"=".repeat(60)}\n`);

    } catch (error) {
      console.error(`\n${"=".repeat(60)}`);
      console.error("❌ ERROR IN TOOL CALL HANDLER");
      console.error("Error:", error);
      if (error instanceof Error) {
        console.error("Stack:", error.stack);
      }
      console.error(`${"=".repeat(60)}\n`);
      
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_ERROR",
        cid: originalMessage.cid,
        message_id: originalMessage.id,
      });

      await this.chatClient.partialUpdateMessage(originalMessage.id, {
        set: {
          text: `I tried to search the web but encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try asking again.`
        }
      });
    }
  };
}