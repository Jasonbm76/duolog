import { Message } from '@/lib/types/chat';
import { getMockConversationFlow, getStreamingDelay } from '@/lib/mock-data/conversations';

export class MockConversationService {
  private static conversations = new Map<string, any>();

  static async startConversation(conversationId: string, initialPrompt: string): Promise<void> {
    const flow = getMockConversationFlow(initialPrompt);
    this.conversations.set(conversationId, {
      flow,
      currentRound: 1,
      currentStep: 'claude', // Start with Claude
    });
  }

  static async getNextMessage(
    conversationId: string,
    onMessageUpdate: (message: Message) => void,
    onMessageComplete: (messageId: string) => void
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const { flow, currentRound, currentStep } = conversation;
    const roundData = flow.rounds[currentRound - 1];
    
    if (!roundData) {
      throw new Error('No more rounds available');
    }

    const messageContent = roundData[currentStep];
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create initial message with streaming indicator
    const initialMessage: Message = {
      id: messageId,
      role: currentStep as 'claude' | 'gpt',
      content: '',
      timestamp: new Date(),
      round: currentRound,
      isStreaming: true,
    };

    onMessageUpdate(initialMessage);

    // Simulate streaming by gradually adding content
    await this.simulateStreaming(messageContent, (partialContent) => {
      const updatedMessage: Message = {
        ...initialMessage,
        content: partialContent,
      };
      onMessageUpdate(updatedMessage);
    });

    // Mark message as complete
    const finalMessage: Message = {
      ...initialMessage,
      content: messageContent,
      isStreaming: false,
    };
    onMessageUpdate(finalMessage);
    onMessageComplete(messageId);

    // Update conversation state
    if (currentStep === 'claude') {
      // Next is GPT-4
      this.conversations.set(conversationId, {
        ...conversation,
        currentStep: 'gpt',
      });
    } else {
      // Next round
      this.conversations.set(conversationId, {
        ...conversation,
        currentRound: currentRound + 1,
        currentStep: 'claude',
      });
    }
  }

  private static async simulateStreaming(
    fullContent: string,
    onUpdate: (partialContent: string) => void
  ): Promise<void> {
    const words = fullContent.split(' ');
    let currentContent = '';
    
    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i];
      onUpdate(currentContent);
      
      // Random delay between words to simulate natural typing
      const delay = Math.random() * 100 + 50; // 50-150ms per word
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  static hasMoreMessages(conversationId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    const { currentRound, currentStep } = conversation;
    
    // Check if we're at the end of all rounds
    if (currentRound > 3) return false;
    
    // Check if we're at GPT in the final round
    if (currentRound === 3 && currentStep === 'gpt') {
      // After GPT's response in round 3, no more messages
      return false;
    }
    
    return true;
  }

  static getConversationStatus(conversationId: string): 'active' | 'completed' | 'error' {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return 'error';
    
    return this.hasMoreMessages(conversationId) ? 'active' : 'completed';
  }

  static cleanupConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  static getCurrentRound(conversationId: string): number {
    const conversation = this.conversations.get(conversationId);
    return conversation?.currentRound || 1;
  }

  static getNextAI(conversationId: string): 'claude' | 'gpt' | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || !this.hasMoreMessages(conversationId)) {
      return null;
    }
    
    return conversation.currentStep as 'claude' | 'gpt';
  }
}