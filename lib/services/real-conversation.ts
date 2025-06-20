"use client";

import { StreamMessage } from './streaming';
import { tokenTracker } from './token-tracker';

interface APIKeys {
  openai?: string;
  anthropic?: string;
}

interface FileData {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface StartConversationOptions {
  prompt: string;
  userKeys?: APIKeys;
  sessionId: string;
  email?: string;
  fingerprint?: string;
  tone?: string;
  file?: FileData;
  onRoundStart?: (round: number, model: 'claude' | 'gpt-4', inputPrompt?: string) => void;
  onContentChunk?: (round: number, model: 'claude' | 'gpt-4', content: string) => void;
  onRoundComplete?: (round: number, model: 'claude' | 'gpt-4') => void;
  onConversationComplete?: () => void;
  onError?: (error: string) => void;
  onTokenUpdate?: (conversationId: string, tokens: { inputTokens: number; outputTokens: number; model: 'gpt-4' | 'claude-3-sonnet' | 'claude-3-haiku' }) => void;
}

interface ContinueConversationOptions {
  prompt: string;
  userKeys?: APIKeys;
  sessionId: string;
  email?: string;
  fingerprint?: string;
  tone?: string;
  file?: FileData;
  onRoundStart?: (round: number, model: 'claude' | 'gpt-4', inputPrompt?: string) => void;
  onContentChunk?: (round: number, model: 'claude' | 'gpt-4', content: string) => void;
  onRoundComplete?: (round: number, model: 'claude' | 'gpt-4') => void;
  onConversationComplete?: () => void;
  onError?: (error: string) => void;
  onTokenUpdate?: (conversationId: string, tokens: { inputTokens: number; outputTokens: number; model: 'gpt-4' | 'claude-3-sonnet' | 'claude-3-haiku' }) => void;
}

class RealConversationService {
  private abortController: AbortController | null = null;

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async startConversation(options: StartConversationOptions): Promise<void> {
    const {
      prompt,
      userKeys,
      sessionId,
      email,
      fingerprint,
      tone,
      file,
      onRoundStart,
      onContentChunk,
      onRoundComplete,
      onConversationComplete,
      onError,
      onTokenUpdate,
    } = options;

    // Initialize token tracking for this conversation
    const conversationId = `conv-${sessionId}-${Date.now()}`;
    tokenTracker.startConversation(conversationId);

    // Create new abort controller for this conversation
    this.abortController = new AbortController();

    try {
      const response = await fetch('/api/chat/collaborate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          userKeys,
          sessionId,
          email,
          fingerprint,
          tone,
          file,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      if (!response.body) {
        throw new Error('No response stream available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamMessage = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'round_start':
                  if (data.round && data.model) {
                    onRoundStart?.(data.round, data.model, data.inputPrompt);
                  }
                  break;
                  
                case 'content_chunk':
                  if (data.round && data.model && data.content) {
                    onContentChunk?.(data.round, data.model, data.content);
                  }
                  break;
                  
                case 'round_complete':
                  if (data.round && data.model) {
                    onRoundComplete?.(data.round, data.model);
                  }
                  break;
                
                case 'token_update':
                  if (data.tokenUsage) {
                    // Add token usage to tracker
                    const conversation = tokenTracker.addTokenUsage(
                      conversationId,
                      data.tokenUsage.model,
                      data.tokenUsage.inputTokens,
                      data.tokenUsage.outputTokens
                    );
                    
                    if (conversation && onTokenUpdate) {
                      onTokenUpdate(conversationId, data.tokenUsage);
                    }
                  }
                  break;
                  
                case 'conversation_complete':
                  onConversationComplete?.();
                  break;
                  
                case 'error':
                  onError?.(data.error || 'Unknown error occurred');
                  break;
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      // Handle abort gracefully - this is expected when user clicks stop
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Conversation stopped by user');
        return; // Don't call onError for user-initiated stops
      }
      
      console.error('Conversation error:', error);
      onError?.(error instanceof Error ? error.message : 'An error occurred');
    }
  }

  async continueConversation(options: ContinueConversationOptions): Promise<void> {
    // For now, continue conversation uses the same logic as start conversation
    // The API endpoint will handle maintaining context based on sessionId
    await this.startConversation(options);
  }

  // Generate a session ID for usage tracking
  generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const realConversationService = new RealConversationService();