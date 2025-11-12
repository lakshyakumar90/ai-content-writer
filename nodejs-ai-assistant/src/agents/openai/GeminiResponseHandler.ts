import OpenAI from "openai";
import type { Channel, MessageResponse, StreamChat } from "stream-chat";

export class GeminiResponseHandler {
  private message_text = "";
  private chunk_counter = 0;
  private is_done = false;
  private last_update_time = 0;
  private tool_call_buffer = "";
  private current_tool_name = "";
  private current_tool_call_id = "";
  private is_tool_call = false;

  constructor(
    private readonly stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    private readonly chatClient: StreamChat,
    private readonly channel: Channel,
    private readonly message: MessageResponse,
    private readonly onComplete: (message: string) => void,
    private readonly webSearchFunction: (query: string) => Promise<string>,
    private readonly onDispose: () => void,
    private readonly onToolCall?: (toolName: string, toolArgs: any, toolCallId: string) => Promise<void>
  ) {
    this.chatClient.on("ai_indicator.stop", this.handleStopGenerating);
  }

  run = async () => {
    const { cid, id: message_id } = this.message;

    console.log(`🎬 GeminiResponseHandler.run() started for message: ${message_id}`);

    try {
      let chunkCount = 0;
      let lastFinishReason: string | null = null;
      
      for await (const chunk of this.stream) {
        chunkCount++;
        if (chunkCount === 1) {
          console.log(`📦 First chunk received`);
          console.log(`   Chunk structure:`, JSON.stringify(chunk, null, 2).substring(0, 500));
        }
        
        if (this.is_done) {
          console.log(`⏹️  Handler is done, breaking loop`);
          break;
        }

        const choice = chunk.choices[0];
        if (!choice) {
          console.log(`⚠️  Chunk ${chunkCount} has no choice[0], skipping`);
          continue;
        }

        // Log finish_reason if present
        if (choice.finish_reason) {
          lastFinishReason = choice.finish_reason;
          console.log(`🏁 Finish reason detected: ${choice.finish_reason}`);
        }

        // Handle tool calls
        if (choice.delta.tool_calls && choice.delta.tool_calls.length > 0) {
          if (!this.is_tool_call) {
            console.log(`🔧 Tool call detected in stream`);
          }
          this.is_tool_call = true;
          const toolCall = choice.delta.tool_calls[0];
          
          console.log(`   Full tool call delta:`, JSON.stringify(toolCall, null, 2));
          
          if (toolCall.id) {
            this.current_tool_call_id = toolCall.id;
            console.log(`   Tool ID: ${toolCall.id}`);
          }
          
          if (toolCall.function?.name) {
            this.current_tool_name = toolCall.function.name;
            console.log(`   Tool Name: ${toolCall.function.name}`);
            await this.channel.sendEvent({
              type: "ai_indicator.update",
              ai_state: "AI_STATE_EXTERNAL_SOURCES",
              cid: cid,
              message_id: message_id,
            });
          }
          
          if (toolCall.function?.arguments) {
            const argsChunk = toolCall.function.arguments;
            console.log(`   Arguments chunk: "${argsChunk}" (length: ${argsChunk.length})`);
            this.tool_call_buffer += argsChunk;
            console.log(`   Total buffer length: ${this.tool_call_buffer.length}`);
          }
          
          // DON'T continue here - check finish_reason below!
        }

        // Handle regular content
        if (choice.delta.content) {
          this.message_text += choice.delta.content;
          this.chunk_counter++;

          // Update message periodically to show streaming effect
          const now = Date.now();
          if (now - this.last_update_time > 100 || this.chunk_counter % 5 === 0) {
            await this.updateMessage();
            this.last_update_time = now;
          }
        }

        // Check finish_reason AFTER processing tool calls
        if (choice.finish_reason === "stop") {
          console.log(`🏁 Stream finished with reason: stop`);
          await this.finishMessage();
          break;
        }

        // Handle tool call completion - this is the key fix!
        if (choice.finish_reason === "tool_calls") {
          console.log(`🔧 Stream finished with reason: tool_calls`);
          console.log(`   Tool name: ${this.current_tool_name}`);
          console.log(`   Tool buffer: "${this.tool_call_buffer}"`);
          console.log(`   Tool buffer length: ${this.tool_call_buffer.length}`);
          
          if (this.current_tool_name === "web_search" && this.onToolCall) {
            try {
              // Try to parse the arguments
              let args;
              if (this.tool_call_buffer.trim()) {
                args = JSON.parse(this.tool_call_buffer);
              } else {
                // If buffer is empty, log the full chunk for debugging
                console.error(`❌ Tool buffer is empty! Full chunk:`, JSON.stringify(chunk, null, 2));
                throw new Error("Tool call arguments are empty");
              }
              
              console.log(`🔧 Parsed tool call args:`, args);
              console.log(`🔧 Delegating tool call to parent handler...`);
              
              await this.onToolCall(this.current_tool_name, args, this.current_tool_call_id);
              
              console.log(`✓ Tool call delegated successfully, disposing handler`);
              this.dispose();
              return;
            } catch (error) {
              console.error("❌ Error parsing tool call arguments:", error);
              console.error("   Tool buffer:", this.tool_call_buffer);
              console.error("   Full chunk:", JSON.stringify(chunk, null, 2));
              await this.handleError();
              return;
            }
          } else if (this.current_tool_name && !this.onToolCall) {
            console.warn("⚠️ Tool call received but no handler available");
            await this.finishMessage();
          }
          break;
        }
      }
      
      // If loop completed but we have a tool call, handle it
      if (this.is_tool_call && lastFinishReason === "tool_calls") {
        console.log(`🔧 Loop ended, processing tool call from finish_reason`);
        console.log(`   Tool name: ${this.current_tool_name}`);
        console.log(`   Tool buffer: "${this.tool_call_buffer}"`);
        
        if (this.current_tool_name === "web_search" && this.onToolCall) {
          try {
            if (!this.tool_call_buffer.trim()) {
              console.error(`❌ Tool buffer is empty after stream completed!`);
              throw new Error("Tool call arguments are empty");
            }
            
            const args = JSON.parse(this.tool_call_buffer);
            console.log(`🔧 Parsed tool call args:`, args);
            await this.onToolCall(this.current_tool_name, args, this.current_tool_call_id);
            this.dispose();
            return;
          } catch (error) {
            console.error("❌ Error processing tool call after stream:", error);
            await this.handleError();
            return;
          }
        }
      }
      
      console.log(`📊 Stream processing complete. Total chunks: ${chunkCount}, Message length: ${this.message_text.length}`);
      console.log(`   Last finish reason: ${lastFinishReason}`);
      console.log(`   Was tool call: ${this.is_tool_call}`);
      console.log(`   Tool buffer length: ${this.tool_call_buffer.length}`);
      
      // If we got here without a tool call being processed, something went wrong
      if (this.is_tool_call && !this.is_done) {
        console.error(`❌ Tool call was detected but never processed!`);
        console.error(`   This might indicate the tool call format is unexpected`);
        await this.handleError();
      }
    } catch (error) {
      console.error("❌ Error in GeminiResponseHandler.run():", error);
      if (error instanceof Error) {
        console.error("   Stack:", error.stack);
      }
      await this.handleError();
    }
  };

  private handleWebSearch = async () => {
    const { cid, id: message_id } = this.message;

    try {
      // Parse tool call arguments
      const args = JSON.parse(this.tool_call_buffer);
      const query = args.query;

      if (!query) {
        throw new Error("No search query provided");
      }

      console.log(`🔍 Performing web search for: "${query}"`);
      
      // Update status to show we're searching
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_EXTERNAL_SOURCES",
        cid: cid,
        message_id: message_id,
      });
      
      // Perform the web search
      const searchResults = await this.webSearchFunction(query);
      
      console.log(`✓ Web search completed for: "${query}"`);
      
      // Add search results to the message text as context
      this.message_text = `*[Searched the web for: "${query}"]*\n\n${searchResults}\n\n---\n\nBased on the search results:\n\n`;
      
      await this.updateMessage();
      
      // Now we need to send another completion request with the search results
      // Since we're in streaming mode, we'll finish this message and let the conversation continue
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_DONE",
        cid: cid,
        message_id: message_id,
      });

      await this.finishMessage();

    } catch (error) {
      console.error("❌ Error handling web search:", error);
      this.message_text = `I tried to search the web but encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Let me answer based on my existing knowledge instead.`;
      await this.updateMessage();
      await this.finishMessage();
    }
  };

  private updateMessage = async () => {
    if (this.is_done) return;

    try {
      await this.chatClient.partialUpdateMessage(this.message.id, {
        set: {
          text: this.message_text
        }
      });
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  private finishMessage = async () => {
    if (this.is_done) return;
    this.is_done = true;

    const { cid, id: message_id } = this.message;

    try {
      // Final message update
      await this.chatClient.partialUpdateMessage(this.message.id, {
        set: {
          text: this.message_text
        }
      });

      // Update indicator to show completion
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_DONE",
        cid: cid,
        message_id: message_id,
      });

      console.log(`Message completed. Total chunks: ${this.chunk_counter}`);
      
      // Call completion callback
      this.onComplete(this.message_text);
      
    } catch (error) {
      console.error("Error finishing message:", error);
    } finally {
      this.dispose();
    }
  };

  private handleError = async () => {
    if (this.is_done) return;
    this.is_done = true;

    const { cid, id: message_id } = this.message;

    try {
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_ERROR",
        cid: cid,
        message_id: message_id,
      });

      const errorMessage = this.message_text || "Sorry, I encountered an error processing your message. Please try again.";
      
      await this.chatClient.partialUpdateMessage(this.message.id, {
        set: {
          text: errorMessage
        }
      });

    } catch (error) {
      console.error("Error handling error state:", error);
    } finally {
      this.dispose();
    }
  };

  private handleStopGenerating = async (event: any) => {
    if (event.cid !== this.message.cid || event.message_id !== this.message.id) {
      return;
    }

    console.log("Stop generating requested");
    this.is_done = true;
    
    try {
      // Update the final message
      await this.chatClient.partialUpdateMessage(this.message.id, {
        set: {
          text: this.message_text + "\n\n*[Generation stopped by user]*"
        }
      });

      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_DONE",
        cid: this.message.cid,
        message_id: this.message.id,
      });

    } catch (error) {
      console.error("Error stopping generation:", error);
    } finally {
      this.dispose();
    }
  };

  dispose = () => {
    this.chatClient.off("ai_indicator.stop", this.handleStopGenerating);
    this.onDispose();
  };
}
