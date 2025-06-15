import OpenAI from 'openai';

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

class OpenAIService {
  private defaultClient: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.defaultClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async streamCompletion({ prompt, apiKey, onChunk }: StreamCompletionOptions): Promise<StreamCompletionResult> {
    const client = apiKey 
      ? new OpenAI({ apiKey }) 
      : this.defaultClient;

    if (!client) {
      throw new Error('No OpenAI API key provided');
    }

    let fullResponse = '';
    let usage: { inputTokens: number; outputTokens: number } | undefined;

    try {
      const stream = await client.chat.completions.create({
        model: 'gpt-4o',  // Use GPT-4o for better responses
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
        stream_options: { include_usage: true },
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
        
        // Capture usage data
        if (chunk.usage) {
          usage = {
            inputTokens: chunk.usage.prompt_tokens,
            outputTokens: chunk.usage.completion_tokens,
          };
        }
      }

      return {
        content: fullResponse,
        usage,
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      console.error('Error details:', {
        status: error?.status,
        code: error?.error?.code,
        type: error?.error?.type,
        message: error?.error?.message,
        param: error?.error?.param
      });
      
      // Provide more specific error messages
      if (error?.error?.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your API key billing.');
      } else if (error?.error?.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your API key.');
      } else if (error?.error?.code === 'model_not_found') {
        throw new Error('GPT-3.5-turbo model not available. Please check your API access.');
      } else if (error?.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again.');
      } else if (error?.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key is correct.');
      } else {
        throw new Error(`Failed to get response from GPT-3.5-turbo: ${error?.error?.message || error.message || 'Unknown error'}`);
      }
    }
  }
}

export const openai = new OpenAIService();