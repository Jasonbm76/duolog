"use client";

import React, { createContext, useContext, useReducer, ReactNode, useRef } from 'react';
import { Conversation, ConversationState, Message, ProcessingStatus } from '@/lib/types/chat';

// Enhanced state to include processing status
interface EnhancedConversationState extends ConversationState {
  currentProcessingStatus?: ProcessingStatus;
  currentProcessingAI?: 'claude' | 'gpt';
  processingRound?: number;
}

// Action types for the reducer
type ConversationAction =
  | { type: 'START_CONVERSATION'; payload: { conversationId: string; initialPrompt: string; messageId: string } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { messageId: string; content: string } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: ProcessingStatus } }
  | { type: 'COMPLETE_MESSAGE'; payload: string } // messageId
  | { type: 'COMPLETE_MESSAGE_BY_ROUND'; payload: { round: number; role: 'claude' | 'gpt' } }
  | { type: 'START_PROCESSING'; payload: { ai: 'claude' | 'gpt'; round: number; status: ProcessingStatus } }
  | { type: 'UPDATE_PROCESSING_STATUS'; payload: ProcessingStatus }
  | { type: 'STOP_PROCESSING' }
  | { type: 'NEXT_ROUND' }
  | { type: 'COMPLETE_CONVERSATION' }
  | { type: 'CONTINUE_CONVERSATION'; payload: { followUpPrompt: string; messageId: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_CONVERSATION' };

// Initial state
const initialState: EnhancedConversationState = {
  conversation: null,
  isLoading: false,
  error: null,
  currentProcessingStatus: undefined,
  currentProcessingAI: undefined,
  processingRound: undefined,
};

// Reducer function
function conversationReducer(state: EnhancedConversationState, action: ConversationAction): EnhancedConversationState {
  switch (action.type) {
    case 'START_CONVERSATION':
      const newConversation: Conversation = {
        id: action.payload.conversationId,
        messages: [{
          id: action.payload.messageId,
          role: 'user',
          content: action.payload.initialPrompt,
          timestamp: new Date(),
          round: 1,
        }],
        status: 'active',
        createdAt: new Date(),
        totalRounds: 6,
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

    case 'UPDATE_MESSAGE_STATUS':
      if (!state.conversation) return state;
      return {
        ...state,
        conversation: {
          ...state.conversation,
          messages: state.conversation.messages.map(msg =>
            msg.id === action.payload.messageId
              ? { ...msg, processingStatus: action.payload.status }
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
              ? { ...msg, isStreaming: false, processingStatus: 'complete' as ProcessingStatus }
              : msg
          ),
        },
      };

    case 'COMPLETE_MESSAGE_BY_ROUND':
      if (!state.conversation) return state;
      const round = action.payload.round;
      const role = action.payload.role;
      
      // Check if message is already completed to prevent duplicate processing
      const targetMessage = state.conversation.messages.find(msg => msg.round === round && msg.role === role);
      if (targetMessage && !targetMessage.isStreaming) {
        return state;
      }
      
      return {
        ...state,
        conversation: {
          ...state.conversation,
          messages: state.conversation.messages.map(msg => {
            if (msg.round === round && msg.role === role) {
              return { ...msg, isStreaming: false, processingStatus: 'complete' as ProcessingStatus };
            }
            return msg;
          }),
        },
      };

    case 'START_PROCESSING':
      return {
        ...state,
        currentProcessingStatus: action.payload.status,
        currentProcessingAI: action.payload.ai,
        processingRound: action.payload.round,
      };

    case 'UPDATE_PROCESSING_STATUS':
      return {
        ...state,
        currentProcessingStatus: action.payload,
      };

    case 'STOP_PROCESSING':
      return {
        ...state,
        currentProcessingStatus: undefined,
        currentProcessingAI: undefined,
        processingRound: undefined,
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
          messages: state.conversation.messages.map(msg => ({
            ...msg,
            isStreaming: false,
            processingStatus: 'complete'
          })),
        },
        isLoading: false,
        currentProcessingStatus: undefined,
        currentProcessingAI: undefined,
        processingRound: undefined,
      };

    case 'CONTINUE_CONVERSATION':
      if (!state.conversation) return state;
      return {
        ...state,
        conversation: {
          ...state.conversation,
          status: 'active', // Reset status to active when continuing
          messages: [...state.conversation.messages, {
            id: action.payload.messageId,
            role: 'user',
            content: action.payload.followUpPrompt,
            timestamp: new Date(),
            round: state.conversation.currentRound + 1,
          }],
          currentRound: state.conversation.currentRound + 1,
        },
        isLoading: true,
        error: null, // Clear any errors
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        currentProcessingStatus: undefined,
        currentProcessingAI: undefined,
        processingRound: undefined,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
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
  state: EnhancedConversationState;
  dispatch: React.Dispatch<ConversationAction>;
  // Helper functions
  startConversation: (initialPrompt: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  continueConversation: (followUpPrompt: string) => void;
  startProcessing: (ai: 'claude' | 'gpt', round: number, initialStatus?: ProcessingStatus) => void;
  updateProcessingStatus: (status: ProcessingStatus) => void;
  stopProcessing: () => void;
  resetConversation: () => void;
}

// Create context
const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// Provider component
export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, initialState);
  const idCounter = useRef(0); // Stable counter for IDs

  // Stable ID generation to avoid hydration issues
  const generateId = (prefix: string = 'msg') => {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}`;
  };

  // Helper functions
  const startConversation = (initialPrompt: string) => {
    const conversationId = generateId('conv');
    dispatch({ type: 'START_CONVERSATION', payload: { conversationId, initialPrompt, messageId: generateId() } });
  };

  const addMessage = (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const message: Message = {
      ...messageData,
      id: generateId(),
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: message });
    return message; // Return the created message
  };

  const continueConversation = (followUpPrompt: string) => {
    dispatch({ type: 'CONTINUE_CONVERSATION', payload: { followUpPrompt, messageId: generateId() } });
  };

  const startProcessing = (ai: 'claude' | 'gpt', round: number, initialStatus: ProcessingStatus = 'thinking') => {
    dispatch({ type: 'START_PROCESSING', payload: { ai, round, status: initialStatus } });
  };

  const updateProcessingStatus = (status: ProcessingStatus) => {
    dispatch({ type: 'UPDATE_PROCESSING_STATUS', payload: status });
  };

  const stopProcessing = () => {
    dispatch({ type: 'STOP_PROCESSING' });
  };

  const resetConversation = () => {
    dispatch({ type: 'RESET_CONVERSATION' });
  };

  const value: ConversationContextType = {
    state,
    dispatch,
    startConversation,
    addMessage,
    continueConversation,
    startProcessing,
    updateProcessingStatus,
    stopProcessing,
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