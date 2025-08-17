// PATH: frontend/src/components/ChatBot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Sparkles, Bot, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  productContexta: {
    name: string;
    novaGroup: number;
    score: number;
  };
  suggestionsa: string[];
}

interface ChatBotProps {
  initialProducta: {
    name: string;
    ingredients: string;
    novaGroupa: number;
    scorea: number;
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
          ? `Salut ! aaaa Je vois que vous analysez **${initialProduct.name}**. Je peux vous expliquer son score NOVA, ses ingredients, ou vous suggerer des alternatives plus saines. Que voulez-vous savoir a`
          : "Bonjour ! ? Je suis votre assistant ECOLOJI?. Je peux vous aider  comprendre la classification NOVA, analyser des ingredients, ou vous guider vers des choix plus sains. Comment puis-je vous aider a",
        timestamp: new Date(),
        productContext: initialProduct ? {
          name: initialProduct.name,
          novaGroup: initialProduct.novaGroup || 4,
          score: initialProduct.score || 50
        } : undefined,
        suggestions: initialProduct 
          ? [
              `Pourquoi ${initialProduct.name} ? ce score a`,
              "Quels sont les ingredients problematiques a",
              "Suggerez-moi des alternatives",
              "C'est dangereux pour ma sante a"
            ]
          : [
              "Comment fonctionne la classification NOVA a",
              "Qu'est-ce que l'ultra-transformation a",
              "Analysez un produit pour moi",
              "Quels sont les additifs  eviter a"
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

    // Simuler delai de reponse
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
                      <div>NOVA {message.productContext.novaGroup} aa Score: {message.productContext.score}/100</div>
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

// Service de generation de reponses ( remplacer par l'API)
async function generateBotResponse(
  userMessage: string, 
  productContexta: { name: string; ingredients: string; novaGroupa: number; scorea: number }
): Promise<ChatMessage> {
  // Simulation d'intelligence pour le developpement
  const lowerMessage = userMessage.toLowerCase();
  
  let response = '';
  let suggestions: string[] = [];

  if (lowerMessage.includes('nova') || lowerMessage.includes('classification')) {
    response = `aa **Classification NOVA** expliquee simplement :

**NOVA 1**  : Aliments naturels (fruits, legumes, viandes fraiches)
**NOVA 2** aa : Ingredients culinaires (huile, sel, sucre)  
**NOVA 3**  : Aliments transformes (pain, conserves, fromages)
**NOVA 4**  : Ultra-transformes (sodas, plats prepares, biscuits industriels)

Plus le chiffre est eleve, plus l'aliment ? subi de transformations industrielles !`;
    
    suggestions = [
      "Pourquoi eviter les NOVA 4 a",
      "Comment identifier un ultra-transforme a",
      "Quels sont les risques pour la sante a"
    ];
  } 
  else if (lowerMessage.includes('alternative') || lowerMessage.includes('remplacer')) {
    if (productContext) {
      response = `aaaa **Alternatives pour ${productContext.name}** :

Voici des options plus saines (NOVA 1-2) :
- Version bio ou artisanale similaire
- Preparation maison avec ingredients simples
- Marques avec moins d'additifs
- Produits du terroir local

aaa **Conseil** : Cherchez des produits avec max 5 ingredients que vous reconnaissez !`;
    } else {
      response = `aaaa **Trouver des alternatives saines** :

1. **Lisez la liste d'ingredients** - plus c'est court, mieux c'est
2. **Privilegiez le bio** quand possible
3. **Cuisinez maison** - vous controlez tout
4. **Marques locales** souvent plus naturelles
5. **Magasins specialises** (bio, circuits courts)`;
    }
    
    suggestions = [
      "O acheter des produits plus sains a",
      "Comment lire une etiquette a",
      "Recettes maison simples"
    ];
  }
  else if (lowerMessage.includes('dangereux') || lowerMessage.includes('sante') || lowerMessage.includes('risque')) {
    response = `a **Impact sante des ultra-transformes** :

**aatudes scientifiques recentes** montrent :
- +22% risque de depression (Nature 2024)
- +53% risque diabete type 2 (BMJ 2024)  
- +10% maladies cardiovasculaires (Lancet 2024)
- Perturbation du microbiote intestinal

**Pourquoi a** Les additifs et le processus de transformation detruisent la matrice alimentaire naturelle.

aaaa **L'important** : l'equilibre ! 80% naturel, 20% plaisir.`;
    
    suggestions = [
      "Quels additifs eviter absolument a",
      "Comment ameliorer mon alimentation a",
      "C'est grave si j'en mange parfois a"
    ];
  }
  else if (lowerMessage.includes('additif') || lowerMessage.includes('e1') || lowerMessage.includes('conservateur')) {
    response = `aaaa **Les additifs  surveiller** :

**aa ? eviter** :
- E102, E110, E124 (colorants lies hyperactivite)
- E320, E321 (BHA, BHT - perturbateurs endocriniens)
- E249, E250 (nitrites - cancerigenes potentiels)

** Moderation** :
- E471 (emulsifiants courants)
- E330 (acide citrique - naturel mais ajoute)

** Acceptables** :
- E300 (vitamine C)
- E322 (lecithine naturelle)

aaa **Regle simple** : moins il y ? de E-numbers, mieux c'est !`;
    
    suggestions = [
      "Comment eviter ces additifs a",
      "Pourquoi sont-ils autorises a",
      "Alternatives naturelles aux conservateurs"
    ];
  }
  else if (productContext && (lowerMessage.includes('score') || lowerMessage.includes('pourquoi'))) {
    const novaGroup = productContext.novaGroup || 4;
    const score = productContext.score || 50;
    
    response = `aa **Score de ${productContext.name}** : ${score}/100

**Groupe NOVA ${novaGroup}** ${novaGroup === 4 ? '' : novaGroup === 3 ? 'a' : novaGroup === 2 ? 'aaa' : 'aaaa'}

Le score depend de :
- **Transformation** (${novaGroup >= 4 ? 'tres elevee' : novaGroup >= 3 ? 'moderee' : 'faible'})
- **Nombre d'additifs** detectes
- **Qualite nutritionnelle** globale
- **Procedes industriels** utilises

${score < 40 ? ' Score faible - consommation occasionnelle' : 
  score < 60 ? 'a Score moyen - moderation recommandee' : 
  'aaaa Score correct - choix acceptable'}`;
    
    suggestions = [
      "Comment ameliorer ce score a",
      "Quels ingredients posent probleme a",
      "Montrez-moi des alternatives"
    ];
  }
  else {
    response = `aa Je comprends votre question ! 

En tant qu'assistant ECOLOJIA, je peux vous aider avec :
- **Classification NOVA** et ultra-transformation
- **Analyse d'ingredients** et additifs  
- **Alternatives plus saines** 
- **Impact sante** des aliments transformes
- **Conseils pratiques** pour mieux manger

Reformulez votre question ou cliquez sur une suggestion !`;
    
    suggestions = [
      "Expliquez-moi NOVA",
      "Analysez mes ingredients",
      "Trouvez des alternatives",
      "Impact sur la sante"
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


