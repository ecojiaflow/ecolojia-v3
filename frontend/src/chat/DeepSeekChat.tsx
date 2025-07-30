// PATH: frontend/ecolojiaFrontV3/src/components/chat/DeepSeekChat.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Send, Crown, Zap, Lock, Calculator, Clock, Brain, AlertTriangle, TrendingUp } from 'lucide-react';
import { deepSeekService, type UserTier, type ProductContext } from '../../services/ai/DeepSeekECOLOJIAService';
import { UpgradeModal } from './UpgradeModal';
import { UsageTracker } from './UsageTracker';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  cost?: number;
  tokens?: number;
  assistant?: string;
}

interface Props {
  userTier: UserTier;
  userId: string;
  productData?: ProductContext;
  onUpgrade?: () => void;
  className?: string;
}

export const DeepSeekChat: React.FC<Props> = ({
  userTier,
  userId,
  productData,
  onUpgrade,
  className = ""
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userStats, setUserStats] = useState({
    dailyUsed: 0,
    dailyLimit: 5,
    monthlyUsed: 0,
    totalCost: 0,
    categories: []
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger stats utilisateur
  useEffect(() => {
    const stats = deepSeekService.getUserStats(userId);
    setUserStats(stats);
  }, [userId, messages]);

  // Message d'accueil initial
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'ai',
      content: generateWelcomeMessage(),
      timestamp: new Date(),
      assistant: getAssistantName()
    };
    setMessages([welcomeMessage]);
  }, [userTier, productData]);

  const generateWelcomeMessage = (): string => {
    const assistantName = getAssistantName();
    const assistantEmoji = getAssistantEmoji();

    if (userTier === 'free') {
      return `${assistantEmoji} **${assistantName} - ECOLOJIA Gratuit**

Bonjour ! Je suis votre assistant nutritionnel powered by DeepSeek Chat.

📱 **Votre accès gratuit :**
• ${userStats.dailyLimit - userStats.dailyUsed}/${userStats.dailyLimit} questions restantes aujourd'hui
• Analyses alimentaires uniquement (classification NOVA, additifs)
• Réponses rapides et fiables

💎 **Passez Premium pour :**
• Questions illimitées toutes catégories
• DeepSeek Reasoner (analyses expertes)
• Cosmétiques + Détergents
• ~0,02€ par question avancée

${productData ? `Analysons "${productData.productName}" ensemble !` : 'Que voulez-vous analyser aujourd\'hui ?'}`;
    }

    return `${assistantEmoji} **${assistantName} - ECOLOJIA Premium**

Accès complet à l'expertise DeepSeek Reasoner !

🧠 **Vos capacités avancées :**
• Questions illimitées (${userStats.monthlyUsed} ce mois)
• Toutes catégories : Alimentaire + Cosmétiques + Détergents  
• IA de raisonnement DeepSeek (analyses complexes)
• Coût optimisé : ${userStats.totalCost.toFixed(4)}€ ce mois

${productData ? `Prêt pour une analyse experte de "${productData.productName}" !` : 'Comment puis-je vous aider aujourd\'hui ?'}`;
  };

  const getAssistantName = (): string => {
    if (!productData) return 'Assistant ECOLOJIA';
    
    switch (productData.category) {
      case 'alimentaire': return 'Dr. Marie Dubois (Nutritionniste)';
      case 'cosmetique': return 'Dr. Sophie Laurent (Dermatologue)';
      case 'detergent': return 'Dr. Thomas Moreau (Éco-expert)';
      default: return 'Assistant ECOLOJIA';
    }
  };

  const getAssistantEmoji = (): string => {
    if (!productData) return '🤖';
    
    switch (productData.category) {
      case 'alimentaire': return '👩‍⚕️';
      case 'cosmetique': return '👩‍🔬';
      case 'detergent': return '🌍';
      default: return '🤖';
    }
  };

  const getAssistantType = () => {
    if (!productData) return 'general';
    
    switch (productData.category) {
      case 'alimentaire': return 'nutritionist';
      case 'cosmetique': return 'dermatologist';
      case 'detergent': return 'eco_expert';
      default: return 'general';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Vérification accès catégorie pour gratuits
    if (userTier === 'free' && productData && productData.category !== 'alimentaire') {
      setShowUpgradeModal(true);
      return;
    }

    // Vérification limite quotidienne
    if (userTier === 'free' && userStats.dailyUsed >= userStats.dailyLimit) {
      setShowUpgradeModal(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await deepSeekService.sendMessage(
        inputMessage,
        userTier,
        userId,
        productData,
        getAssistantType()
      );

      // Vérifier si upgrade nécessaire
      if (response.upgradePrompt) {
        setShowUpgradeModal(true);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.reply,
        timestamp: new Date(),
        cost: response.cost,
        tokens: response.tokensUsed,
        assistant: getAssistantName()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Mettre à jour les stats
      const newStats = deepSeekService.getUserStats(userId);
      setUserStats(newStats);

    } catch (error) {
      console.error('Erreur envoi message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: '❌ Problème technique temporaire. Veuillez réessayer.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className="mb-1">
        {line.startsWith('•') ? (
          <div className="flex items-start gap-2">
            <span className="text-blue-500 mt-1 text-xs">•</span>
            <span 
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: line.substring(1).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
              }} 
            />
          </div>
        ) : (
          <span 
            className="text-sm leading-relaxed block"
            dangerouslySetInnerHTML={{ 
              __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
            }} 
          />
        )}
      </div>
    ));
  };

  const canSendMessage = () => {
    if (!inputMessage.trim() || isLoading) return false;
    if (userTier === 'free' && userStats.dailyUsed >= userStats.dailyLimit) return false;
    return true;
  };

  const getInputPlaceholder = () => {
    if (userTier === 'free') {
      if (userStats.dailyUsed >= userStats.dailyLimit) {
        return 'Limite quotidienne atteinte - Upgrade Premium';
      }
      return `Question alimentaire (${userStats.dailyLimit - userStats.dailyUsed} restantes)...`;
    }
    return 'Votre question experte...';
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col h-[600px] ${className}`}>
      {/* Header avec informations tier */}
      <div className={`p-4 border-b ${
        userTier === 'premium' 
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
          : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              userTier === 'premium' ? 'bg-white bg-opacity-20' : 'bg-gray-500'
            }`}>
              {userTier === 'premium' ? (
                <Crown className="w-5 h-5 text-yellow-300" />
              ) : (
                <Zap className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {getAssistantEmoji()} {getAssistantName()}
              </h3>
              <p className="text-sm opacity-90">
                DeepSeek {userTier === 'premium' ? 'Reasoner' : 'Chat'} • ECOLOJIA {userTier === 'premium' ? 'Premium' : 'Gratuit'}
              </p>
            </div>
          </div>

          {/* Widget usage */}
          <UsageTracker 
            userTier={userTier}
            stats={userStats}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-lg shadow-sm ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'system'
                  ? 'bg-red-100 border border-red-200 text-red-800'
                  : userTier === 'premium'
                  ? 'bg-purple-50 border border-purple-200'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="text-sm">
                {message.type === 'user' ? (
                  message.content
                ) : (
                  formatMessageContent(message.content)
                )}
              </div>

              {/* Métadonnées pour messages IA Premium */}
              {message.type === 'ai' && userTier === 'premium' && (message.cost || message.tokens) && (
                <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between text-xs text-gray-600">
                  {message.tokens && (
                    <div className="flex items-center gap-1">
                      <Calculator className="w-3 h-3" />
                      <span>{message.tokens} tokens</span>
                    </div>
                  )}
                  {message.cost && (
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      <span>{message.cost.toFixed(4)}€</span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs mt-2 opacity-70 flex items-center justify-between">
                <span>{message.timestamp.toLocaleTimeString()}</span>
                {message.assistant && message.type === 'ai' && (
                  <span className="font-medium">{message.assistant}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Indicateur de frappe */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  DeepSeek {userTier === 'premium' ? 'Reasoner' : 'Chat'} analyse...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getInputPlaceholder()}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || (userTier === 'free' && userStats.dailyUsed >= userStats.dailyLimit)}
          />
          <button
            onClick={handleSendMessage}
            disabled={!canSendMessage()}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              userTier === 'premium'
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <Clock className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Informations utilisateur gratuit */}
        {userTier === 'free' && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3" />
              <span>Alimentaire uniquement • {userStats.dailyUsed}/{userStats.dailyLimit} questions</span>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              <Crown className="w-3 h-3" />
              Upgrade Premium
            </button>
          </div>
        )}

        {/* Coût estimé pour premium */}
        {userTier === 'premium' && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            💰 Coût mensuel actuel : {userStats.totalCost.toFixed(4)}€ • DeepSeek Reasoner
          </div>
        )}
      </div>

      {/* Modal Upgrade */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            onUpgrade?.();
          }}
          currentUsage={userStats}
          blockedFeature={
            productData && productData.category !== 'alimentaire' 
              ? `Analyse ${productData.category}` 
              : 'Questions illimitées'
          }
        />
      )}
    </div>
  );
};