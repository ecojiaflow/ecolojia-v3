
// ========================================
// 1. ChatPage.tsx CORRIGÉ
// ========================================
// PATH: frontend/src/pages/ChatPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { chatService } from '../services/chatService';
import { useAuthContext } from '../Contexts/AuthContext';
import { useQuota } from '../hooks/useQuota';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MOCK_MODE } from '../config/mock.config'; // AJOUT IMPORT

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  const { canUseAI, incrementUsage, quotas } = useQuota();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Contexte optionnel (produit analysé, etc.)
  const context = location.state?.context || {};
  const initialQuestion = location.state?.initialMessage;

  useEffect(() => {
    // Message de bienvenue
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Bonjour ! Je suis votre assistant nutritionnel ECOLOJIA. 
      
Je peux vous aider à :
• Comprendre les analyses de produits
• Décoder les additifs et ingrédients
• Suggérer des alternatives plus saines
• Répondre à vos questions sur la nutrition

Comment puis-je vous aider aujourd'hui ?`, 
      timestamp: new Date()
    }]);

    // Si une question initiale est fournie
    if (initialQuestion) {
      setTimeout(() => {
        handleSendMessage(initialQuestion);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    // MODIFICATION : Vérifier l'authentification SEULEMENT si pas en mode mock
    if (!MOCK_MODE && !isAuthenticated) {
      toast.error('Veuillez vous connecter pour utiliser le chat');
      navigate('/login');
      return;
    }

    // MODIFICATION : Vérifier les quotas SEULEMENT si pas en mode mock
    if (!MOCK_MODE && !canUseAI()) {
      toast.error('Quota de questions épuisé. Passez à Premium pour continuer !');
      navigate('/premium');
      return;
    }

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Envoyer le message avec le contexte
      const response = await chatService.sendMessage(text, context);
      
      // Consommer le quota SEULEMENT si pas en mode mock
      if (!MOCK_MODE) {
        await incrementUsage('aiQuestion');
      }

      // Ajouter la réponse
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content || response.message || response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi du message');
      
      // Ajouter un message d'erreur
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Suggestions de questions
  const suggestions = [
    'Qu\'est-ce que le groupe NOVA ?',
    'Comment lire un Nutri-Score ?',
    'Quels additifs éviter ?',
    'Comment améliorer mon alimentation ?'
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bot className="h-6 w-6 text-green-500" />
              Assistant Nutritionnel IA
              {MOCK_MODE && <span className="text-sm text-orange-500 ml-2">(Mode Demo)</span>}
            </h1>
            {quotas && (
              <div className="text-sm text-gray-600">
                Questions restantes : {' '}
                <span className="font-medium">
                  {MOCK_MODE 
                    ? 'Illimité (Demo)' 
                    : quotas?.aiQuestions?.monthlyRemaining === -1 
                      ? '8' 
                      : `${quotas?.aiQuestions?.dailyRemaining || 0} aujourd'hui / ${quotas?.aiQuestions?.monthlyRemaining} ce mois`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-xl shadow-md h-full flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Zone des messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <div className={`rounded-lg px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className={`text-xs text-gray-500 mt-1 ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <Loader className="h-5 w-5 animate-spin text-gray-600" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (si pas de messages) */}
          {messages.length === 1 && (
            <div className="px-6 pb-4">
              <p className="text-sm text-gray-600 mb-3">Suggestions de questions :</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire d'envoi */}
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">Envoyer</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
