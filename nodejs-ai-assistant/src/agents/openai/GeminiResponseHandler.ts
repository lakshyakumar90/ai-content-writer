import OpenAI from "openai";
import type { Channel, MessageResponse, StreamChat } from "stream-chat";

export class GeminiResponseHandler {
  private message_text = "";
  private chunk_counter = 0;
  private is_done = false;
  private last_update_time = 0;
  private function_call_buffer = "";
  private current_function_name = "";
  private is_function_call = false;

  constructor(
    private readonly stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    private readonly chatClient: StreamChat,
    private readonly channel: Channel,
    private readonly message: MessageResponse,
    private readonly onComplete: (message: string) => void,
    private readonly webSearchFunction: (query: string) => Promise<string>,
    private readonly onDispose: () => void
  ) {
    this.chatClient.on("ai_indicator.stop", this.handleStopGenerating);
  }

  run = async () => {
    const { cid, id: message_id } = this.message;

    try {
      for await (const chunk of this.stream) {
        if (this.is_done) break;

        const choice = chunk.choices[0];
        if (!choice) continue;

        // Handle function calls (disabled for Gemini compatibility)
        // if (choice.delta.function_call) {
        //   this.is_function_call = true;
        //   
        //   if (choice.delta.function_call.name) {
        //     this.current_function_name = choice.delta.function_call.name;
        //     await this.channel.sendEvent({
        //       type: "ai_indicator.update",
        //       ai_state: "AI_STATE_EXTERNAL_SOURCES",
        //       cid: cid,
        //       message_id: message_id,
        //     });
        //   }
        //   
        //   if (choice.delta.function_call.arguments) {
        //     this.function_call_buffer += choice.delta.function_call.arguments;
        //   }
        //   
        //   continue;
        // }

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

        // Handle completion
        if (choice.finish_reason === "stop") {
          await this.finishMessage();
          break;
        }
      }
    } catch (error) {
      console.error("Error in GeminiResponseHandler:", error);
      await this.handleError();
    }
  };

  private handleWebSearch = async () => {
    const { cid, id: message_id } = this.message;

    try {
      // Parse function arguments
      const args = JSON.parse(this.function_call_buffer);
      const query = args.query;

      if (!query) {
        throw new Error("No search query provided");
      }

      console.log(`Performing web search for: ${query}`);
      
      // Perform the web search
      const searchResults = await this.webSearchFunction(query);
      
      // Add search results to the message
      this.message_text += `\n\n**Search Results:**\n${searchResults}\n\n`;
      
      await this.channel.sendEvent({
        type: "ai_indicator.update",
        ai_state: "AI_STATE_THINKING",
        cid: cid,
        message_id: message_id,
      });

      // Continue with the response after web search
      await this.updateMessage();
      await this.finishMessage();

    } catch (error) {
      console.error("Error handling web search:", error);
      this.message_text += `\n\n*Error performing web search: ${error instanceof Error ? error.message : 'Unknown error'}*`;
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
