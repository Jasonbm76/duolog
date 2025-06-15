// Token tracking service for monitoring API usage costs
// Tracks tokens from both OpenAI and Anthropic APIs

export interface TokenUsage {
  model: 'gpt-4' | 'claude-3-sonnet' | 'claude-3-haiku';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number; // in USD cents
}

export interface ConversationTokens {
  id: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number; // in USD cents
  modelUsage: TokenUsage[];
  startTime: Date;
  lastUpdate: Date;
}

// Current token pricing (as of 2024 - update as needed)
const TOKEN_PRICING = {
  'gpt-4': {
    input: 0.003, // $0.03 per 1K tokens
    output: 0.006, // $0.06 per 1K tokens
  },
  'claude-3-sonnet': {
    input: 0.003, // $0.03 per 1K tokens  
    output: 0.015, // $0.15 per 1K tokens
  },
  'claude-3-haiku': {
    input: 0.00025, // $0.25 per 1M tokens
    output: 0.00125, // $1.25 per 1M tokens
  },
} as const;

class TokenTracker {
  private conversations: Map<string, ConversationTokens> = new Map();

  // Start tracking a new conversation
  startConversation(conversationId: string): ConversationTokens {
    const conversation: ConversationTokens = {
      id: conversationId,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      modelUsage: [],
      startTime: new Date(),
      lastUpdate: new Date(),
    };
    
    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  // Add token usage for a specific model call
  addTokenUsage(
    conversationId: string,
    model: TokenUsage['model'],
    inputTokens: number,
    outputTokens: number
  ): ConversationTokens | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    const totalTokens = inputTokens + outputTokens;
    const pricing = TOKEN_PRICING[model];
    const estimatedCost = Math.round(
      (inputTokens / 1000) * pricing.input * 100 + 
      (outputTokens / 1000) * pricing.output * 100
    ); // Cost in cents

    const usage: TokenUsage = {
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
    };

    // Update conversation totals
    conversation.totalInputTokens += inputTokens;
    conversation.totalOutputTokens += outputTokens;
    conversation.totalTokens += totalTokens;
    conversation.totalCost += estimatedCost;
    conversation.modelUsage.push(usage);
    conversation.lastUpdate = new Date();

    return conversation;
  }

  // Get current conversation stats
  getConversation(conversationId: string): ConversationTokens | null {
    return this.conversations.get(conversationId) || null;
  }

  // Get all conversations
  getAllConversations(): ConversationTokens[] {
    return Array.from(this.conversations.values());
  }

  // Clear conversation data
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  // Clear all data
  clearAll(): void {
    this.conversations.clear();
  }

  // Format cost for display
  formatCost(cents: number): string {
    if (cents < 100) {
      return `${cents}¢`;
    }
    return `$${(cents / 100).toFixed(2)}`;
  }

  // Format token count for display
  formatTokens(tokens: number): string {
    if (tokens < 1000) {
      return tokens.toString();
    }
    return `${(tokens / 1000).toFixed(1)}K`;
  }

  // Get session total across all conversations
  getSessionTotal(): { tokens: number; cost: number } {
    let totalTokens = 0;
    let totalCost = 0;
    
    for (const conversation of this.conversations.values()) {
      totalTokens += conversation.totalTokens;
      totalCost += conversation.totalCost;
    }
    
    return { tokens: totalTokens, cost: totalCost };
  }
}

// Export singleton instance
export const tokenTracker = new TokenTracker();