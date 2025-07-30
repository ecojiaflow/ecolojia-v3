// 📁 src/hooks/useChat.ts

import { useState, useCallback } from 'react';
import { chatWithAI, ChatRequest, ChatResponse } from '../api/realApi';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
  messagesRemaining: number;
  sendMessage: (content: string, productContext?: any) => Promise<void>;
  clearMessages: () => void;
}

export const useChat = (maxMessages: number = 5): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userMessagesCount = messages.filter((m) => m.role === 'user').length;
  const messagesRemaining = Math.max(0, maxMessages - userMessagesCount);

  const sendMessage = useCallback(
    async (content: string, productContext?: any) => {
      if (userMessagesCount >= maxMessages) {
        throw new Error('Limite de messages atteinte');
      }

      const userMessage: ChatMessage = {
        role: 'user',
        content,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        setIsTyping(true);
        setError(null);

        const request: ChatRequest = {
          message: content,
          product_context: productContext,
          conversation_history: messages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        };

        const response: ChatResponse = await chatWithAI(request);

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: '',
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Simuler effet "streaming"
        const fullText = response.response;
        for (let i = 0; i <= fullText.length; i++) {
          await new Promise((res) => setTimeout(res, 15));
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...assistantMessage,
              content: fullText.slice(0, i)
            };
            return updated;
          });
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Erreur chat IA:', err);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, userMessagesCount, maxMessages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isTyping,
    error,
    messagesRemaining,
    sendMessage,
    clearMessages
  };
};
