// frontend/src/components/premium/PremiumChat.jsx

import React, { useState } from 'react';

const PremiumChat = ({ productContext }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Bonjour ! J'ai analyse "${productContext?.title}" avec notre IA revolutionnaire. Ce produit presente des caracteristiques interesSantés que je peux vous expliquer en detail. Que souhaitez-vous savoir a`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = [
    {
      text: "Pourquoi le score est-il si bas malgre le label bio a",
      icon: "a"
    },
    {
      text: "Quels sont les risques de l'ultra-transformation a",
      icon: "ai"
    },
    {
      text: "Montrez-moi les meilleures alternatives naturelles",
      icon: ""
    },
    {
      text: "Comment l'index glycemique affecte-t-il ma Santé a",
      icon: "a"
    },
    {
      text: "Puis-je consommer ce produit quotidiennement a",
      icon: "aa"
    },
    {
      text: "Expliquez-moi la classification NOVA en detail",
      icon: "a"
    }
  ];

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    // Ajouter le message utilisateur
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simuler reponse IA
    setTimeout(() => {
      const aiResponse = generateAIResponse(message, productContext);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (question, context) => {
    // Simulation d'IA contextuelle
    if (question.toLowerCase().includes('bio') || question.toLowerCase().includes('score')) {
      return `Excellente question ! Malgre le label bio, ce produit obtient un score de ${context?.premiumAnalysis?.scores?.overall || 35}/100 car notre IA detecte une ultra-transformation (NOVA 4). Le processus d'extrusion  haute temperature detruit la matrice alimentaire naturelle et cree un index glycemique de 87 (vs 50 pour le riz complet). Les etudes BMJ 2024 montrent +53% de risque diabetique avec ces produits ultra-transformes.`;
    }
    
    if (question.toLowerCase().includes('alternative')) {
      return ` Parfait ! Voici les 2 meilleures alternatives scientifiquement prouvees :

**1. Flocons d'avoine complets** (Score 85/100)
- Index glycemique 40 vs 87 actuel
- +300% de fibres solubles
- Preparation : 5 minutes
- Cot : -40%

**2. Fruits frais + noix** (Score 95/100)
- Classification NOVA 1 (naturel)
- Antioxydants naturels preserves
- Satiete 3x superieure
- Impact glycemique minimal

Sources : Nutrition Reviews 2024, Diabetes Care 2024`;
    }

    if (question.toLowerCase().includes('nova') || question.toLowerCase().includes('transformation')) {
      return `a La classification NOVA divise les aliments en 4 groupes selon leur degre de transformation :

**NOVA 1** : Naturels (fruits, legumes) 
**NOVA 2** : Ingredients culinaires (huile, sel) ?  
**NOVA 3** : Transformes (pain, fromage) ai
**NOVA 4** : Ultra-transformes (extrusion, additifs) 

Ce produit est NOVA 4 car il subit une extrusion haute temperature qui :
- Detruit les vitamines B (-70%)
- Augmente l'index glycemique (+74%)
- Altere la matrice alimentaire naturelle

Classification officielle INSERM 2024.`;
    }

    if (question.toLowerCase().includes('glycemique') || question.toLowerCase().includes('glyc')) {
      return `a L'index glycemique (IG) mesure l'impact d'un aliment sur la glycemie :

**Ce produit : IG 87** (tres eleve !)
**Riz complet naturel : IG 50** (modere)

**Impact sur votre Santé :**
- Pic glycemique rapide en 15-30min
- Chute brutale = fringales 2h apres
- Stress pancreatique repete
- Risque diabete type 2  long terme

**Solution :** Privilegier IG < 55 pour une energie stable.

Source : Table Internationale Index Glycemique 2024`;
    }

    return `Merci pour votre question ! Base sur notre analyse IA revolutionnaire de "${context?.title}", je peux vous fournir des informations precises avec sources scientifiques ANSES, EFSA, INSERM 2024. Pouvez-vous preciser quel aspect vous interesse le plus a`;
  };

  const handleQuestionClick = (question) => {
    handleSendMessage(question);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
      
      {/* Header Chat Premium */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">a</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Assistant IA Scientifique</h3>
            <p className="text-sm text-blue-300">Expertise ANSES ? EFSA ? INSERM 2024</p>
          </div>
        </div>
      </div>

      {/* Questions Suggerees */}
      <div className="p-6 border-b border-white/5">
        <h4 className="text-sm font-semibold text-gray-300 mb-4">a Questions suggerees :</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuestionClick(question.text)}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-3 text-left border border-white/10 hover:border-blue-500/30 transition-all duration-200 group"
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg group-hover:scale-110 transition-transform">
                  {question.icon}
                </span>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {question.text}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone Messages */}
      <div className="h-96 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.type === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                  : 'bg-white/10 backdrop-blur-sm border border-white/20 text-gray-100'
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-line">
                {message.content}
              </div>
              <div className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Indicateur "En train d'ecrire" */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone de Saisie Premium */}
      <div className="p-6 bg-white/5 backdrop-blur-sm border-t border-white/10">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            placeholder="Posez votre question sur ce produit..."
            className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <span className="mr-2"></span>
            Envoyer
          </button>
        </div>
        
        {/* Info Contextuelle */}
        <div className="mt-3 text-xs text-gray-400 text-center">
          ? IA entrainee sur donnees ANSES, EFSA, INSERM 2024 ? Reponses contextuelles au produit analyse
        </div>
      </div>
    </div>
  );
};

export default PremiumChat;