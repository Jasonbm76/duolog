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

  constructor(writer: WritableStreamDefaultWriter) {
    this.writer = writer;
  }

  async write(message: StreamMessage) {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    await this.writer.write(this.encoder.encode(data));
  }

  async close() {
    await this.writer.close();
  }
}

export function createStreamResponse(
  handler: (writer: StreamWriter) => Promise<void>
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const writer = new StreamWriter(
        new WritableStream({
          write(chunk) {
            controller.enqueue(chunk);
          },
          close() {
            controller.close();
          },
        }).getWriter()
      );

      await handler(writer);
    },
  });
}