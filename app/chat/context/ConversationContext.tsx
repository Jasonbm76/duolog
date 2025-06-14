"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Conversation, ConversationState, Message } from '@/lib/types/chat';

// Action types for the reducer
type ConversationAction =
  | { type: 'START_CONVERSATION'; payload: { conversationId: string; initialPrompt: string } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { messageId: string; content: string } }
  | { type: 'COMPLETE_MESSAGE'; payload: string } // messageId
  | { type: 'NEXT_ROUND' }
  | { type: 'COMPLETE_CONVERSATION' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_CONVERSATION' };

// Initial state
const initialState: ConversationState = {
  conversation: null,
  isLoading: false,
  error: null,
};

// Reducer function
function conversationReducer(state: ConversationState, action: ConversationAction): ConversationState {
  switch (action.type) {
    case 'START_CONVERSATION':
      const newConversation: Conversation = {
        id: action.payload.conversationId,
        messages: [{
          id: `msg-${Date.now()}`,
          role: 'user',
          content: action.payload.initialPrompt,
          timestamp: new Date(),
          round: 1,
        }],
        status: 'active',
        createdAt: new Date(),
        totalRounds: 3,
        currentRound: 1,
      };
      return {
        ...state,
        conversation: newConversation,
        isLoading: true,
        error: null,
      };

    case 'ADD_MESSAGE':
      if (!state.conversation) return state;
      return {
        ...state,
        conversation: {
          ...state.conversation,
          messages: [...state.conversation.messages, action.payload],
        },
      };

    case 'UPDATE_MESSAGE':
      if (!state.conversation) return state;
      return {
        ...state,
        conversation: {
          ...state.conversation,
          messages: state.conversation.messages.map(msg =>
            msg.id === action.payload.messageId
              ? { ...msg, content: action.payload.content }
              : msg
          ),
        },
      };

    case 'COMPLETE_MESSAGE':
      if (!state.conversation) return state;
      return {
        ...state,
        conversation: {
          ...state.conversation,
          messages: state.conversation.messages.map(msg =>
            msg.id === action.payload
              ? { ...msg, isStreaming: false }
              : msg
          ),
        },
      };

    case 'NEXT_ROUND':
      if (!state.conversation) return state;
      const nextRound = state.conversation.currentRound + 1;
      return {
        ...state,
        conversation: {
          ...state.conversation,
          currentRound: nextRound,
        },
        isLoading: true,
      };

    case 'COMPLETE_CONVERSATION':
      if (!state.conversation) return state;
      return {
        ...state,
        conversation: {
          ...state.conversation,
          status: 'completed',
        },
        isLoading: false,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'RESET_CONVERSATION':
      return initialState;

    default:
      return state;
  }
}

// Context type
interface ConversationContextType {
  state: ConversationState;
  dispatch: React.Dispatch<ConversationAction>;
  // Helper functions
  startConversation: (initialPrompt: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  resetConversation: () => void;
}

// Create context
const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// Provider component
export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, initialState);

  // Helper functions
  const startConversation = (initialPrompt: string) => {
    const conversationId = `conv-${Date.now()}`;
    dispatch({ type: 'START_CONVERSATION', payload: { conversationId, initialPrompt } });
  };

  const addMessage = (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const message: Message = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };

  const resetConversation = () => {
    dispatch({ type: 'RESET_CONVERSATION' });
  };

  const value: ConversationContextType = {
    state,
    dispatch,
    startConversation,
    addMessage,
    resetConversation,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

// Custom hook to use the context
export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}