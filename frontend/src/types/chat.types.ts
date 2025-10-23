// PATH: frontend/src/types/chat.types.ts

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  productId?: string;
  metadata?: {
    productName?: string;
    category?: string;
    scores?: any;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  productId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  title?: string;
}

export interface ChatRequest {
  message: string;
  productId?: string;
  context?: {
    productData?: any;
    userPreferences?: any;
    sessionHistory?: ChatMessage[];
  };
}

export interface ChatResponse {
  message: ChatMessage;
  suggestions?: string[];
  sources?: string[];
}

export interface StreamingChatResponse {
  chunk: string;
  isComplete: boolean;
  messageId: string;
}
