// PATH: frontend/src/hooks/useChat.ts
import { useState, useCallback, useEffect } from 'react';
import { chatService, ChatMessage, ProductContext } from '../services/chatService';
import { toast } from 'react-hot-toast';

interface UseChatOptions {
  productContext?: ProductContext;
  onMessageReceived?: (message: ChatMessage) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { productContext, onMessageReceived } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const history = chatService.getConversationHistory();
    setMessages(history);
  }, []);

  useEffect(() => {
    if (productContext) {
      chatService.setProductContext(productContext);
      setSuggestions(["Pourquoi ce score ?", "C'est quoi NOVA ?", "Quels additifs à risque ?", "À quelle fréquence consommer ?"]);
    } else {
      setSuggestions(["Comment lire les scores ?", "Classification NOVA", "Nutri-Score vs Eco-Score", "Sources scientifiques"]);
    }
  }, [productContext]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    setIsLoading(true);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    try {
      const response = await chatService.sendMessage(content, productContext);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.reply,
        timestamp: new Date(),
        suggestions: response.suggestions
      };
      setMessages(prev => [...prev, aiMessage]);
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
      onMessageReceived?.(aiMessage);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
  }, [productContext, onMessageReceived]);

  const clearHistory = useCallback(() => {
    chatService.clearHistory();
    setMessages([]);
    setSuggestions(["Pourquoi ce score ?", "C'est quoi NOVA ?", "Quels additifs à risque ?", "À quelle fréquence consommer ?"]);
  }, [productContext]);

  const refreshHistory = useCallback(() => {
    const history = chatService.getConversationHistory();
    setMessages(history);
  }, []);

  return {
    messages,
    suggestions,
    isLoading,
    sendMessage,
    clearHistory,
    refreshHistory,
    currentContext: chatService.getCurrentContext()
  };
}