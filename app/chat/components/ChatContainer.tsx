"use client";

import { useEffect, useRef, useState } from 'react';
import { useConversation } from '../context/ConversationContext';
import { MockConversationService } from '@/lib/services/mock-conversation';
import { Message } from '@/lib/types/chat';
import { Bot, CheckCircle, AlertCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ConversationHeader from './ConversationHeader';
import PromptInput from './PromptInput';

interface RateLimitStatus {
  remaining: number;
  resetTime: Date;
  attempts: number;
  maxAttempts: number;
}

export default function ChatContainer() {
  const { state, startConversation, addMessage, resetConversation, dispatch } = useConversation();
  const [typingAI, setTypingAI] = useState<'claude' | 'gpt' | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.conversation?.messages]);

  // Load rate limit status on component mount
  useEffect(() => {
    const loadRateLimitStatus = async () => {
      try {
        const response = await fetch('/api/chat/start');
        if (response.ok) {
          const data = await response.json();
          setRateLimitStatus({
            ...data.rateLimit,
            resetTime: new Date(data.rateLimit.resetTime)
          });
        }
      } catch (error) {
        console.error('Failed to load rate limit status:', error);
      }
    };

    loadRateLimitStatus();
  }, []);

  // Process next AI response when conversation updates
  useEffect(() => {
    if (!state.conversation || processingRef.current) return;
    
    const { id } = state.conversation;
    const nextAI = MockConversationService.getNextAI(id);
    
    if (nextAI && MockConversationService.hasMoreMessages(id)) {
      processNextAIResponse(id, nextAI);
    } else if (!MockConversationService.hasMoreMessages(id)) {
      // Conversation is complete
      dispatch({ type: 'COMPLETE_CONVERSATION' });
    }
  }, [state.conversation?.messages.length]);

  const processNextAIResponse = async (conversationId: string, aiModel: 'claude' | 'gpt') => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      setTypingAI(aiModel);
      dispatch({ type: 'SET_LOADING', payload: true });

      // Small delay before AI starts "thinking"
      await new Promise(resolve => setTimeout(resolve, 1000));

      await MockConversationService.getNextMessage(
        conversationId,
        (message: Message) => {
          // Update or add message
          const existingMessageIndex = state.conversation?.messages.findIndex(m => m.id === message.id);
          if (existingMessageIndex !== undefined && existingMessageIndex >= 0) {
            dispatch({ 
              type: 'UPDATE_MESSAGE', 
              payload: { messageId: message.id, content: message.content } 
            });
          } else {
            addMessage({
              role: message.role,
              content: message.content,
              round: message.round,
              isStreaming: message.isStreaming,
            });
          }
        },
        (messageId: string) => {
          dispatch({ type: 'COMPLETE_MESSAGE', payload: messageId });
          setTypingAI(null);
          dispatch({ type: 'SET_LOADING', payload: false });
          
          // Check if we need to advance to next round
          const currentRound = MockConversationService.getCurrentRound(conversationId);
          const nextAI = MockConversationService.getNextAI(conversationId);
          
          if (nextAI === 'claude' && currentRound > state.conversation!.currentRound) {
            dispatch({ type: 'NEXT_ROUND' });
          }
          
          processingRef.current = false;
        }
      );
    } catch (error) {
      console.error('Error processing AI response:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to get AI response' });
      setTypingAI(null);
      processingRef.current = false;
    }
  };

  const handleStartConversation = async (initialPrompt: string) => {
    try {
      // Check rate limit first
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: initialPrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: data.message || 'Rate limit exceeded. Please try again later.' 
          });
          return;
        }
        throw new Error(data.error || 'Failed to start conversation');
      }

      // Update rate limit status
      if (data.rateLimit) {
        setRateLimitStatus({
          ...data.rateLimit,
          resetTime: new Date(data.rateLimit.resetTime),
          attempts: rateLimitStatus?.attempts ? rateLimitStatus.attempts + 1 : 1,
          maxAttempts: 3
        });
      }

      // Start the conversation
      startConversation(initialPrompt);
      
      // Initialize mock service
      await MockConversationService.startConversation(data.conversationId, initialPrompt);
      
      // The useEffect will handle starting the first AI response
    } catch (error) {
      console.error('Error starting conversation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start conversation' });
    }
  };

  const handleReset = () => {
    if (state.conversation) {
      MockConversationService.cleanupConversation(state.conversation.id);
    }
    resetConversation();
    setTypingAI(null);
    processingRef.current = false;
  };

  const isConversationComplete = state.conversation?.status === 'completed';
  const canStartNew = !state.conversation || isConversationComplete;

  return (
    <div className="pt-64 pb-20 px-6">
      <div className="container mx-auto max-w-4xl min-h-[80vh] flex flex-col pb-32">
        {/* Header */}
        <ConversationHeader 
          conversation={state.conversation}
          onReset={handleReset}
        />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {!state.conversation && (
              /* Welcome State */
              <div className="text-center py-16">
                <div className="glass-card p-8 max-w-2xl mx-auto">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-on-dark mb-3">
                    Welcome to DuoLog
                  </h2>
                  <p className="text-on-dark max-w-md mx-auto mb-4">
                    Start a conversation and watch Claude and GPT-4 collaborate to refine your prompt across 3 rounds of analysis.
                  </p>
                  
                  {/* Rate Limit Status */}
                  {rateLimitStatus && (
                    <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm text-on-dark">
                        <span className="font-medium">Free Trial:</span> {rateLimitStatus.remaining} of {rateLimitStatus.maxAttempts} conversations remaining
                        {rateLimitStatus.remaining === 0 && (
                          <span className="block mt-1 text-xs">
                            Resets in {Math.ceil((rateLimitStatus.resetTime.getTime() - Date.now()) / (1000 * 60 * 60))} hours
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {/* Example Prompts */}
                  <div className="grid gap-3">
                    <h3 className="text-sm font-medium text-on-dark mb-2">Try these examples:</h3>
                    <div className="grid gap-2 text-sm">
                      <button 
                        onClick={() => handleStartConversation("Help me write a compelling email to potential customers about our new product launch.")}
                        className="p-3 text-left border border-on-dark/20 rounded-lg hover:border-primary hover:bg-primary/10 transition-colors text-on-dark"
                      >
                        Help me write a compelling product launch email
                      </button>
                      <button 
                        onClick={() => handleStartConversation("I'm building a React app and getting memory leaks. How can I identify and fix them?")}
                        className="p-3 text-left border border-on-dark/20 rounded-lg hover:border-primary hover:bg-primary/10 transition-colors text-on-dark"
                      >
                        Help me fix memory leaks in my React app
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {state.conversation?.messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isStreaming={message.isStreaming}
              />
            ))}

            {/* Typing Indicator */}
            {typingAI && state.conversation && (
              <TypingIndicator 
                aiModel={typingAI} 
                round={state.conversation.currentRound}
              />
            )}

            {/* Completion Message */}
            {isConversationComplete && (
              <div className="text-center py-8">
                <div className="glass-card p-8 max-w-md mx-auto">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-success/20 rounded-full mb-4">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-on-dark mb-2">
                    Collaboration Complete!
                  </h3>
                  <p className="text-on-dark mb-4">
                    Claude and GPT-4 have worked together to refine your prompt through 3 rounds of analysis.
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Start New Conversation
                  </button>
                </div>
              </div>
            )}

            {/* Error State */}
            {state.error && (
              <div className="text-center py-8">
                <div className="glass-card p-8 max-w-md mx-auto">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-error/20 rounded-full mb-4">
                    <AlertCircle className="w-6 h-6 text-error" />
                  </div>
                  <h3 className="text-lg font-semibold text-on-dark mb-2">
                    Something went wrong
                  </h3>
                  <p className="text-on-dark mb-4">{state.error}</p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Sticky Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-on-dark/10 p-6">
        <div className="container mx-auto max-w-4xl">
          <PromptInput
            onSubmit={handleStartConversation}
            isLoading={state.isLoading}
            disabled={!canStartNew}
            placeholder={canStartNew 
              ? "Enter your prompt to start AI collaboration..." 
              : "Conversation in progress..."
            }
            className="m-0"
          />
        </div>
      </div>
    </div>
  );
}