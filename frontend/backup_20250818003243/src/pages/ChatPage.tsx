// PATH: frontend/src/pages/ChatPage.tsx (Version amelioree)
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Bot, User, Package, Loader2, AlertCircle } from 'lucide-react';
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaminga: boolean;
}

interface ProductContext {
  product: {
    name: string;
    branda: string;
    category: string;
  };
  analysis: {
    healthScore: number;
    category: string;
    recommendations: string[];
  };
}

export const ChatPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [productContext, setProductContext] = useState<ProductContext | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Recuperer le contexte produit si present
  useEffect(() => {
    if (location.state?.context) {
      setProductContext(location.state.context);
      
      // Message de bienvenue avec contexte
      const welcomeMessage: Message = {
        id: 'welcome-context',
        role: 'assistant',
        content: `Bonjour ! Je vois que vous souhaitez discuter de **${location.state.context.product.name}** (${location.state.context.product.category}).

**Score sante : ${location.state.context.analysis.healthScore}/100**

Je suis l pour repondre  toutes vos questions sur ce produit. Que souhaitez-vous savoir a`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } else {
      // Message de bienvenue general
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'Bonjour ! Je suis votre assistant IA specialise en analyse de produits. Posez-moi vos questions sur l\'alimentation, les cosmetiques ou les detergents.',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [location.state]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Verifier si l'utilisateur est Premium
  const checkPremiumStatus = (): boolean => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.tier === 'premium';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Verifier le statut Premium
    if (!checkPremiumStatus()) {
      setShowPremiumModal(true);
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Creer le message assistant avec streaming
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStreamingContent('');

    try {
      // Creer un AbortController pour pouvoir annuler la requete
      abortControllerRef.current = new AbortController();

      const response = await fetch('https://ecolojia-backend-working.onrender.com/api/chat/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputMessage,
          context: productContext ? {
            product: productContext.product,
            analysis: productContext.analysis
          } : undefined,
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec l\'IA');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (dat?.content) {
                  fullContent += dat?.content;
                  setStreamingContent(fullContent);
                }
              } catch (e) {
                // Ignorer les erreurs de parsing
              }
            }
          }
        }
      }

      // Mettre  jour le message final
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: fullContent, isStreaming: false }
          : msg
      ));
      setStreamingContent('');

    } catch (error) {
      console.error('Chat error:', error);
      
      // Supprimer le message assistant vide
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
      
      // Ajouter un message d'erreur
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Desole, une erreur s\'est produite. Veuillez reessayer.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = productContext ? [
    `Pourquoi ce produit a-t-il un score de ${productContext.analysis.healthScore}/100 a`,
    "Quels sont les ingredients les plus problematiques a",
    "Existe-t-il des alternatives plus saines a",
    "Ce produit convient-il aux enfants a",
    "Quel est l'impact environnemental a"
  ] : [
    "Comment reconnaitre un produit ultra-transforme a",
    "Quels sont les perturbateurs endocriniens  eviter a",
    "Comment choisir des produits menagers ecologiques a",
    "Quelle est la difference entre bio et naturel a",
    "Comment lire une etiquette alimentaire a"
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Assistant IA ECOLOJIA</h1>
                {productContext && (
                  <p className="text-sm text-gray-600">
                    Contexte : {productContext.product.name}
                  </p>
                )}
              </div>
            </div>
            
            {productContext && (
              <button
                onClick={() => navigate('/results', { state: { result: location.state.context } })}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span className="text-sm">Voir l'analyse</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-primary' : 'bg-gray-200'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-gray-700" />
                  )}
                </div>
                
                <div className={`rounded-lg px-4 py-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <div className={`prose prose-sm max-w-none ${
                    message.role === 'user' ? 'prose-invert' : ''
                  }`}>
                    {message.isStreaming ? (
                      <span>{streamingContent}</span>
                    ) : (
                      <div dangerouslySetInnerHTML={{ 
                        __html: message.content.replace(/\*\*(.*a)\*\*/g, '<strong>$1</strong>')
                      }} />
                    )}
                  </div>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-primary-light' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.isStreaming && !streamingContent && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 px-4 py-3 bg-gray-100 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">L'IA reflechit...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Questions suggerees */}
      {messages.length <= 1 && (
        <div className="border-t bg-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <p className="text-sm text-gray-600 mb-3">Questions suggerees :</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                  disabled={!checkPremiumStatus()}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {!checkPremiumStatus() && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Chat IA reserve aux membres Premium</p>
                <p className="mt-1">Passez  Premium pour poser des questions illimitees  notre IA experte.</p>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={checkPremiumStatus() ? "Posez votre question..." 
                : "Passez  Premium pour utiliser le chat IA"
              }
              disabled={isLoading || !checkPremiumStatus()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !checkPremiumStatus()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Premium */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        trigger="feature"
        onSuccess={() => {
          setShowPremiumModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
};

export default ChatPage;


