// PATH: frontend/src/components/ChatBot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Sparkles, Bot, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  productContext?: {
    name: string;
    novaGroup: number;
    score: number;
  };
  suggestions?: string[];
}

interface ChatBotProps {
  initialProduct?: {
    name: string;
    ingredients: string;
    novaGroup?: number;
    score?: number;
  };
}

const ChatBot: React.FC<ChatBotProps> = ({ initialProduct }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Messages d'accueil
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'bot',
        content: initialProduct 
          ? `Salut ! Ã°Å¸â€˜â€¹ Je vois que vous analysez **${initialProduct.name}**. Je peux vous expliquer son score NOVA, ses ingrédients, ou vous suggérer des alternatives plus saines. Que voulez-vous savoir ?`
          : "Bonjour ! Ã°Å¸Å’Å¸ Je suis votre assistant ECOLOJIA. Je peux vous aider ÃƒÂ  comprendre la classification NOVA, analyser des ingrédients, ou vous guider vers des choix plus sains. Comment puis-je vous aider ?",
        timestamp: new Date(),
        productContext: initialProduct ? {
          name: initialProduct.name,
          novaGroup: initialProduct.novaGroup || 4,
          score: initialProduct.score || 50
        } : undefined,
        suggestions: initialProduct 
          ? [
              `Pourquoi ${initialProduct.name} a ce score ?`,
              "Quels sont les ingrédients problématiques ?",
              "Suggérez-moi des alternatives",
              "C'est dangereux pour ma santé ?"
            ]
          : [
              "Comment fonctionne la classification NOVA ?",
              "Qu'est-ce que l'ultra-transformation ?",
              "Analysez un produit pour moi",
              "Quels sont les additifs ÃƒÂ  éviter ?"
            ]
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, initialProduct]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Ajouter message utilisateur
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simuler délai de réponse
    setTimeout(async () => {
      const botResponse = await generateBotResponse(content, initialProduct);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Assistant ECOLOJIA</h3>
            <p className="text-xs opacity-90">IA nutritionnelle</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={`rounded-2xl p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Context produit */}
                  {message.productContext && (
                    <div className="mt-2 p-2 bg-white/10 rounded-lg text-xs">
                      <div className="font-medium">{message.productContext.name}</div>
                      <div>NOVA {message.productContext.novaGroup} â€Â¢ Score: {message.productContext.score}/100</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Suggestions */}
            {message.suggestions && (
              <div className="mt-2 flex flex-wrap gap-2 justify-start">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-3 py-1 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 rounded-2xl p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            placeholder="Posez votre question nutritionnelle..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim()}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-2 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Service de génération de réponses (ÃƒÂ  remplacer par l'API)
async function generateBotResponse(
  userMessage: string, 
  productContext?: { name: string; ingredients: string; novaGroup?: number; score?: number }
): Promise<ChatMessage> {
  // Simulation d'intelligence pour le développement
  const lowerMessage = userMessage.toLowerCase();
  
  let response = '';
  let suggestions: string[] = [];

  if (lowerMessage.includes('nova') || lowerMessage.includes('classification')) {
    response = `Ã°Å¸â€Â¬ **Classification NOVA** expliquée simplement :

**NOVA 1** Ã°Å¸Â¥Â¬ : Aliments naturels (fruits, légumes, viandes fraîches)
**NOVA 2** Ã°Å¸Â§â€š : Ingrédients culinaires (huile, sel, sucre)  
**NOVA 3** Ã°Å¸ÂÅ¾ : Aliments transformés (pain, conserves, fromages)
**NOVA 4** Ã°Å¸ÂÅ¸ : Ultra-transformés (sodas, plats préparés, biscuits industriels)

Plus le chiffre est élevé, plus l'aliment a subi de transformations industrielles !`;
    
    suggestions = [
      "Pourquoi éviter les NOVA 4 ?",
      "Comment identifier un ultra-transformé ?",
      "Quels sont les risques pour la santé ?"
    ];
  } 
  else if (lowerMessage.includes('alternative') || lowerMessage.includes('remplacer')) {
    if (productContext) {
      response = `Ã°Å¸â€â€ž **Alternatives pour ${productContext.name}** :

Voici des options plus saines (NOVA 1-2) :
- Version bio ou artisanale similaire
- Préparation maison avec ingrédients simples
- Marques avec moins d'additifs
- Produits du terroir local

Ã°Å¸â€™Â¡ **Conseil** : Cherchez des produits avec max 5 ingrédients que vous reconnaissez !`;
    } else {
      response = `Ã°Å¸â€â€ž **Trouver des alternatives saines** :

1. **Lisez la liste d'ingrédients** - plus c'est court, mieux c'est
2. **Privilégiez le bio** quand possible
3. **Cuisinez maison** - vous contrôlez tout
4. **Marques locales** souvent plus naturelles
5. **Magasins spécialisés** (bio, circuits courts)`;
    }
    
    suggestions = [
      "OÃƒÂ¹ acheter des produits plus sains ?",
      "Comment lire une étiquette ?",
      "Recettes maison simples"
    ];
  }
  else if (lowerMessage.includes('dangereux') || lowerMessage.includes('santé') || lowerMessage.includes('risque')) {
    response = `âÅ¡Â ïÂ¸Â **Impact santé des ultra-transformés** :

**Ãƒâ€°tudes scientifiques récentes** montrent :
- +22% risque de dépression (Nature 2024)
- +53% risque diabète type 2 (BMJ 2024)  
- +10% maladies cardiovasculaires (Lancet 2024)
- Perturbation du microbiote intestinal

**Pourquoi ?** Les additifs et le processus de transformation détruisent la matrice alimentaire naturelle.

âÅ¡â€“ïÂ¸Â **L'important** : l'équilibre ! 80% naturel, 20% plaisir.`;
    
    suggestions = [
      "Quels additifs éviter absolument ?",
      "Comment améliorer mon alimentation ?",
      "C'est grave si j'en mange parfois ?"
    ];
  }
  else if (lowerMessage.includes('additif') || lowerMessage.includes('e1') || lowerMessage.includes('conservateur')) {
    response = `âÅ¡â€”ïÂ¸Â **Les additifs ÃƒÂ  surveiller** :

**Ã°Å¸â€Â´ Ãƒ€ éviter** :
- E102, E110, E124 (colorants liés hyperactivité)
- E320, E321 (BHA, BHT - perturbateurs endocriniens)
- E249, E250 (nitrites - cancérigènes potentiels)

**Ã°Å¸Å¸Â¡ Modération** :
- E471 (émulsifiants courants)
- E330 (acide citrique - naturel mais ajouté)

**Ã°Å¸Å¸Â¢ Acceptables** :
- E300 (vitamine C)
- E322 (lécithine naturelle)

Ã°Å¸â€™Â¡ **Règle simple** : moins il y a de E-numbers, mieux c'est !`;
    
    suggestions = [
      "Comment éviter ces additifs ?",
      "Pourquoi sont-ils autorisés ?",
      "Alternatives naturelles aux conservateurs"
    ];
  }
  else if (productContext && (lowerMessage.includes('score') || lowerMessage.includes('pourquoi'))) {
    const novaGroup = productContext.novaGroup || 4;
    const score = productContext.score || 50;
    
    response = `Ã°Å¸â€œÅ  **Score de ${productContext.name}** : ${score}/100

**Groupe NOVA ${novaGroup}** ${novaGroup === 4 ? 'Ã°Å¸Å¡Â¨' : novaGroup === 3 ? 'âÅ¡Â ïÂ¸Â' : novaGroup === 2 ? 'Ã°Å¸â€˜Å’' : 'âÅ“â€¦'}

Le score dépend de :
- **Transformation** (${novaGroup >= 4 ? 'très élevée' : novaGroup >= 3 ? 'modérée' : 'faible'})
- **Nombre d'additifs** détectés
- **Qualité nutritionnelle** globale
- **Procédés industriels** utilisés

${score < 40 ? 'Ã°Å¸Å¡Â¨ Score faible - consommation occasionnelle' : 
  score < 60 ? 'âÅ¡Â ïÂ¸Â Score moyen - modération recommandée' : 
  'âÅ“â€¦ Score correct - choix acceptable'}`;
    
    suggestions = [
      "Comment améliorer ce score ?",
      "Quels ingrédients posent problème ?",
      "Montrez-moi des alternatives"
    ];
  }
  else {
    response = `Ã°Å¸Â¤â€ Je comprends votre question ! 

En tant qu'assistant ECOLOJIA, je peux vous aider avec :
- **Classification NOVA** et ultra-transformation
- **Analyse d'ingrédients** et additifs  
- **Alternatives plus saines** 
- **Impact santé** des aliments transformés
- **Conseils pratiques** pour mieux manger

Reformulez votre question ou cliquez sur une suggestion !`;
    
    suggestions = [
      "Expliquez-moi NOVA",
      "Analysez mes ingrédients",
      "Trouvez des alternatives",
      "Impact sur la santé"
    ];
  }

  return {
    id: Date.now().toString(),
    type: 'bot',
    content: response,
    timestamp: new Date(),
    suggestions
  };
}

export default ChatBot;
