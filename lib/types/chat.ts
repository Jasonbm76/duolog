export interface Message {
  id: string;
  role: 'user' | 'gpt' | 'claude';
  content: string;
  timestamp: Date;
  round: number;
  isStreaming?: boolean;
  inputPrompt?: string;
  processingStatus?: ProcessingStatus;
  isFinalSynthesis?: boolean;
}

export interface Conversation {
  id: string;
  userId?: string;
  messages: Message[];
  status: 'active' | 'completed' | 'error';
  createdAt: Date;
  totalRounds: number;
  currentRound: number;
}

export interface ConversationState {
  conversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
}

export type MessageRole = Message['role'];
export type ConversationStatus = Conversation['status'];

// API Response types
export interface APIMessage {
  role: MessageRole;
  content: string;
  round: number;
  inputPrompt?: string;
  processingStatus?: ProcessingStatus;
}

export interface StartConversationRequest {
  initialPrompt: string;
}

export interface StartConversationResponse {
  conversationId: string;
  messages: APIMessage[];
}

export interface ContinueConversationRequest {
  conversationId: string;
  userFeedback?: string;
}

export interface ContinueConversationResponse {
  messages: APIMessage[];
  isComplete: boolean;
}

// Processing status for dynamic thinking indicators
export type ProcessingStatus = 
  | 'thinking'
  | 'analyzing'
  | 'generating'
  | 'reviewing'
  | 'finalizing'
  | 'complete'
  | 'error';