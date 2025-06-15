import Anthropic from '@anthropic-ai/sdk';

interface StreamCompletionOptions {
  prompt: string;
  apiKey?: string;
  onChunk: (chunk: string) => void;
}

interface StreamCompletionResult {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

class AnthropicService {
  private defaultClient: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.defaultClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  async streamCompletion({ prompt, apiKey, onChunk }: StreamCompletionOptions): Promise<StreamCompletionResult> {
    const client = apiKey 
      ? new Anthropic({ apiKey }) 
      : this.defaultClient;

    if (!client) {
      throw new Error('No Anthropic API key provided');
    }

    let fullResponse = '';
    let usage: { inputTokens: number; outputTokens: number } | undefined;

    try {
      const stream = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullResponse += text;
          onChunk(text);
        } else if (chunk.type === 'message_delta' && chunk.usage) {
          usage = {
            inputTokens: chunk.usage.input_tokens || 0,
            outputTokens: chunk.usage.output_tokens || 0,
          };
        }
      }

      return {
        content: fullResponse,
        usage,
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error('Failed to get response from Claude');
    }
  }
}

export const anthropic = new AnthropicService();