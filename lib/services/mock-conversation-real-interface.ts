"use client";

import { getMockConversationFlow } from '@/lib/mock-data/conversations';

interface APIKeys {
  openai?: string;
  anthropic?: string;
}

interface StartConversationOptions {
  prompt: string;
  userKeys?: APIKeys;
  sessionId: string;
  email?: string;
  onRoundStart?: (round: number, model: 'claude' | 'gpt-4', inputPrompt?: string) => void;
  onContentChunk?: (round: number, model: 'claude' | 'gpt-4', content: string) => void;
  onRoundComplete?: (round: number, model: 'claude' | 'gpt-4') => void;
  onConversationComplete?: () => void;
  onError?: (error: string) => void;
}

interface ContinueConversationOptions {
  prompt: string;
  userKeys?: APIKeys;
  sessionId: string;
  email?: string;
  onRoundStart?: (round: number, model: 'claude' | 'gpt-4', inputPrompt?: string) => void;
  onContentChunk?: (round: number, model: 'claude' | 'gpt-4', content: string) => void;
  onRoundComplete?: (round: number, model: 'claude' | 'gpt-4') => void;
  onConversationComplete?: () => void;
  onError?: (error: string) => void;
}

class MockConversationServiceWithRealInterface {
  private abortController: AbortController | null = null;

  generateSessionId(): string {
    return `mock-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async startConversation(options: StartConversationOptions): Promise<void> {
    const {
      prompt,
      onRoundStart,
      onContentChunk,
      onRoundComplete,
      onConversationComplete,
      onError
    } = options;

    // Create new abort controller for this conversation
    this.abortController = new AbortController();

    try {
      // Try to get dynamic flow first, fallback to legacy
      const dynamicFlow = this.getDynamicConversationFlow(prompt);
      
      if (dynamicFlow) {
        await this.processDynamicFlow(dynamicFlow, {
          onRoundStart,
          onContentChunk,
          onRoundComplete,
          onConversationComplete
        });
      } else {
        // Fallback to legacy flow
        const flow = getMockConversationFlow(prompt);
        await this.processLegacyFlow(flow, {
          onRoundStart,
          onContentChunk,
          onRoundComplete,
          onConversationComplete
        });
      }
    } catch (error) {
      // Don't show error if conversation was intentionally stopped
      if (error instanceof Error && error.message === 'Conversation stopped') {
        return;
      }
      console.error('Mock conversation error:', error);
      onError?.('Failed to process mock conversation');
    }
  }

  async continueConversation(options: ContinueConversationOptions): Promise<void> {
    const {
      prompt,
      onRoundStart,
      onContentChunk,
      onRoundComplete,
      onConversationComplete,
      onError
    } = options;

    // Create new abort controller for this conversation
    this.abortController = new AbortController();

    try {
      // For follow-ups, we use the same logic as starting a conversation
      // but the context is maintained by the calling component
      const dynamicFlow = this.getDynamicConversationFlow(prompt);
      
      if (dynamicFlow) {
        await this.processDynamicFlow(dynamicFlow, {
          onRoundStart,
          onContentChunk,
          onRoundComplete,
          onConversationComplete
        });
      } else {
        // Fallback to legacy flow
        const flow = getMockConversationFlow(prompt);
        await this.processLegacyFlow(flow, {
          onRoundStart,
          onContentChunk,
          onRoundComplete,
          onConversationComplete
        });
      }
    } catch (error) {
      // Don't show error if conversation was intentionally stopped
      if (error instanceof Error && error.message === 'Conversation stopped') {
        return;
      }
      console.error('Mock conversation continue error:', error);
      onError?.('Failed to continue mock conversation');
    }
  }

  private getDynamicConversationFlow(prompt: string) {
    // Import dynamic flows
    const { dynamicConversationFlows } = require('@/lib/mock-data/conversations');
    
    // Simple keyword matching for now
    if (prompt.toLowerCase().includes('vibe coder') || prompt.toLowerCase().includes('website')) {
      return dynamicConversationFlows.vibeCoding;
    }
    if (prompt.toLowerCase().includes('email') || prompt.toLowerCase().includes('product launch')) {
      return dynamicConversationFlows.writingAssistance;
    }
    
    return null; // Use legacy flow
  }

  private async processDynamicFlow(flow: any, callbacks: any): Promise<void> {
    const { onRoundStart, onContentChunk, onRoundComplete, onConversationComplete } = callbacks;
    
    let messageCounter = 1;
    
    for (const exchange of flow.exchanges) {
      // 1. GPT-4 responds first
      await this.simulateAIResponse({
        round: messageCounter++,
        model: 'gpt-4',
        content: exchange.gptResponse,
        inputPrompt: exchange.gptResponse.inputPrompt,
        onRoundStart,
        onContentChunk,
        onRoundComplete
      });
      
      // Handoff delay
      await this.delay(1500);
      
      // 2. Claude reviews
      await this.simulateAIResponse({
        round: messageCounter++,
        model: 'claude',
        content: exchange.claudeReview,
        inputPrompt: exchange.claudeReview.inputPrompt,
        onRoundStart,
        onContentChunk,
        onRoundComplete
      });
      
      // 3. If Claude disagrees and GPT has a counter-response
      if (exchange.claudeReview.agreementStatus !== 'agree' && exchange.gptCounter) {
        await this.delay(1500);
        
        await this.simulateAIResponse({
          round: messageCounter++,
          model: 'gpt-4',
          content: exchange.gptCounter,
          inputPrompt: exchange.gptCounter.inputPrompt,
          onRoundStart,
          onContentChunk,
          onRoundComplete
        });
      }
      
      // 4. Claude's final review if needed
      if (exchange.claudeFinal) {
        await this.delay(1500);
        
        await this.simulateAIResponse({
          round: messageCounter++,
          model: 'claude',
          content: exchange.claudeFinal,
          inputPrompt: exchange.claudeFinal.inputPrompt,
          onRoundStart,
          onContentChunk,
          onRoundComplete
        });
      }
      
      // Longer delay between exchanges
      if (exchange.exchangeId < flow.exchanges.length) {
        await this.delay(2000);
      }
    }
    
    onConversationComplete?.();
  }

  private async processLegacyFlow(flow: any, callbacks: any): Promise<void> {
    const { onRoundStart, onContentChunk, onRoundComplete, onConversationComplete } = callbacks;
    
    // Process each round (legacy behavior)
    for (let roundIndex = 0; roundIndex < flow.rounds.length; roundIndex++) {
      const round = flow.rounds[roundIndex];
      const roundNumber = roundIndex + 1;
      
      // Round 1: GPT-4 (start with GPT-4 like real API)
      await this.simulateAIResponse({
        round: roundNumber,
        model: 'gpt-4',
        content: round.gpt,
        inputPrompt: roundNumber === 1 ? flow.userPrompt : `Round ${roundNumber} analysis`,
        onRoundStart,
        onContentChunk,
        onRoundComplete
      });
      
      // Handoff delay - time for next AI to "read" the response
      await this.delay(1500);
      
      // Round 2: Claude (reviews GPT-4's response)
      await this.simulateAIResponse({
        round: roundNumber,
        model: 'claude',
        content: round.claude,
        inputPrompt: `Round ${roundNumber} refinement`,
        onRoundStart,
        onContentChunk,
        onRoundComplete
      });
      
      // Longer delay before next round (time to process the full exchange)
      if (roundIndex < flow.rounds.length - 1) {
        await this.delay(2000);
      }
    }
    
    onConversationComplete?.();
  }

  private async simulateAIResponse(options: {
    round: number;
    model: 'claude' | 'gpt-4';
    content: any; // Can be string or MockAIResponse object
    inputPrompt?: string;
    onRoundStart?: (round: number, model: 'claude' | 'gpt-4', inputPrompt?: string) => void;
    onContentChunk?: (round: number, model: 'claude' | 'gpt-4', content: string) => void;
    onRoundComplete?: (round: number, model: 'claude' | 'gpt-4') => void;
  }): Promise<void> {
    const { round, model, content, inputPrompt, onRoundStart, onContentChunk, onRoundComplete } = options;
    
    // Extract content string from object if needed
    const contentString = typeof content === 'string' ? content : content?.content;
    const actualInputPrompt = inputPrompt || (typeof content === 'object' ? content.inputPrompt : undefined);
    
    // Start the round (shows thinking indicator)
    onRoundStart?.(round, model, actualInputPrompt);
    
    // Realistic thinking delay (2-4 seconds)
    const thinkingDelay = Math.random() * 2000 + 2000; // 2-4 seconds
    await this.delay(thinkingDelay);
    
    // Check if we have valid content to stream
    if (!contentString || contentString.trim() === '') {
      console.error('No content to stream for', model, 'round', round);
      onRoundComplete?.(round, model);
      return;
    }
    
    // Simulate typing with realistic delays
    const words = contentString.split(' ');
    let currentContent = '';
    
    //console.log('Starting to stream content:', words.length, 'words');
    
    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i];
      onContentChunk?.(round, model, currentContent);
      
      // More realistic typing speed (40-120ms per word, with occasional pauses)
      let delay = Math.random() * 80 + 40; // 40-120ms base
      
      // Add longer pauses at sentence endings
      if (words[i].includes('.') || words[i].includes('!') || words[i].includes('?')) {
        delay += Math.random() * 200 + 100; // Extra 100-300ms pause
      }
      
      // Add occasional thinking pauses (5% chance)
      if (Math.random() < 0.05) {
        delay += Math.random() * 500 + 200; // Extra 200-700ms pause
      }
      
      await this.delay(delay);
    }
    
    // Brief pause before completing (AI "finishing up")
    await this.delay(500);
    
    // Complete the round
    onRoundComplete?.(round, model);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.abortController?.signal.aborted) {
        reject(new Error('Conversation stopped'));
        return;
      }

      const timeout = setTimeout(resolve, ms);
      
      this.abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Conversation stopped'));
      });
    });
  }
}

export const mockConversationService = new MockConversationServiceWithRealInterface();