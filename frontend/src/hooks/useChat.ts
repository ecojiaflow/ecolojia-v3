// PATH: frontend/src/hooks/useChat.ts

import { useState, useCallback, useEffect } from 'react';
import { chatService, ChatMessage, ProductContext } from '../services/chat/ChatService';
import { toast } from 'react-hot-toast';

interface UseChatOptions {
  productContexta: ProductContext;
  onMessageReceiveda: (message: ChatMessage) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { productContext, onMessageReceived } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Initialiser avec l'historique existant
  useEffect(() => {
    const history = chatService.getConversationHistory();
    setMessages(history);
  }, []);

  // Mettre  jour le contexte produit
  useEffect(() => {
    if (productContext) {
      chatService.setProductContext(productContext);
      // Mettre  jour les suggestions selon le contexte
      setSuggestions(["Pourquoi ce score ?", "Quels sont les risques ?", "Des alternatives ?"]);
    } else {
      // Suggestions generales
      setSuggestions(["Comment lire les scores ?", "Que signifie NOVA ?", "Conseils nutrition"]);
    }
  }, [productContext]);

  // Envoyer un message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);

    // Ajouter le message utilisateur  l'affichage immediatement
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Envoyer le message au service
      const response = await chatService.sendMessage(content, productContext);
      
      // Ajouter la reponse de l'IA
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.reply,
        timestamp: new Date(),
        suggestions: response.suggestions
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Mettre  jour les suggestions
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
      
      // Callback optionnel
      onMessageReceived?.(aiMessage);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
  }, [productContext, onMessageReceived]);

  // Effacer l'historique
  const clearHistory = useCallback(() => {
    chatService.clearHistory();
    setMessages([]);
    // Reinitialiser les suggestions
    setSuggestions(["Pourquoi ce score ?", "Quels sont les risques ?", "Des alternatives ?"]);
  }, [productContext]);

  // Obtenir l'historique complet depuis le service
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

