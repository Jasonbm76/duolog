export interface StreamMessage {
  type: 'round_start' | 'content_chunk' | 'round_complete' | 'conversation_complete' | 'error' | 'token_update';
  round?: number;
  model?: 'claude' | 'gpt-4';
  content?: string;
  inputPrompt?: string;
  error?: string;
  isFinalSynthesis?: boolean;
  tokenUsage?: {
    model: 'gpt-4' | 'claude-3-sonnet' | 'claude-3-haiku';
    inputTokens: number;
    outputTokens: number;
  };
  metadata?: {
    tokensUsed?: number;
    cost?: number;
  };
}

class StreamWriter {
  private encoder = new TextEncoder();
  private writer: WritableStreamDefaultWriter;
  private closed = false;

  constructor(writer: WritableStreamDefaultWriter) {
    this.writer = writer;
  }

  async write(message: StreamMessage) {
    if (this.closed) {
      console.warn('Attempted to write to closed stream writer');
      return;
    }
    
    try {
      const data = `data: ${JSON.stringify(message)}\n\n`;
      await this.writer.write(this.encoder.encode(data));
    } catch (error) {
      if (!this.closed) {
        console.error('Stream write error:', error);
        this.closed = true;
      }
    }
  }

  async close() {
    if (this.closed) {
      return;
    }
    
    try {
      this.closed = true;
      await this.writer.close();
    } catch (error) {
      console.warn('Stream close error:', error);
    }
  }
}

export function createStreamResponse(
  handler: (writer: StreamWriter) => Promise<void>
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      let controllerClosed = false;
      
      const writer = new StreamWriter(
        new WritableStream({
          write(chunk) {
            if (!controllerClosed) {
              try {
                controller.enqueue(chunk);
              } catch (error) {
                if (!controllerClosed) {
                  console.warn('Controller enqueue error:', error);
                  controllerClosed = true;
                }
              }
            }
          },
          close() {
            if (!controllerClosed) {
              try {
                controller.close();
                controllerClosed = true;
              } catch (error) {
                console.warn('Controller close error:', error);
              }
            }
          },
        }).getWriter()
      );

      try {
        await handler(writer);
      } catch (error) {
        console.error('Stream handler error:', error);
        if (!controllerClosed) {
          try {
            controller.error(error);
            controllerClosed = true;
          } catch (controllerError) {
            console.warn('Controller error handling failed:', controllerError);
          }
        }
      } finally {
        await writer.close();
      }
    },
  });
}