import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Zap, Brain, FileText, TrendingUp, AlertTriangle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTypinga: boolean;
}

interface ProductData {
  name: string;
  category: string;
  scientificScorea: number;
  novaGroupa: number;
  nutriScorea: string;
  additivesa: any[];
}

interface Props {
  productdata?: ProductData;
  onAnalysisRequesta: (type: string) => void;
}

const PREDEFINED_QUESTIONS = [
  {
    category: 'aa Analyses Scientifiques',
    questions: [
      { text: 'Explique-moi le score scientifique de ce produit', type: 'scientific_analysis' },
      { text: 'Quels sont les additifs problematiques detectes a', type: 'additives_analysis' },
      { text: 'Pourquoi ce produit est-il classe NOVA groupe X a', type: 'nova_explanation' },
      { text: 'Analyse l\'impact sur le microbiote intestinal', type: 'microbiome_impact' }
    ]
  },
  {
    category: 'aaa Nutrition & Sante',
    questions: [
      { text: 'Quel est l\'impact glycemique de ce produit a', type: 'glycemic_impact' },
      { text: 'Ce produit convient-il aux diabetiques a', type: 'diabetes_suitability' },
      { text: 'Analyse nutritionnelle detaillee', type: 'nutrition_analysis' },
      { text: 'Comparaison avec les recommandations ANSES', type: 'anses_comparison' }
    ]
  },
  {
    category: 'a Alternatives & Conseils',
    questions: [
      { text: 'Suggere des alternatives plus saines', type: 'alternatives' },
      { text: 'Comment ameliorer mon alimentation a', type: 'nutrition_tips' },
      { text: 'Recettes maison pour remplacer ce produit', type: 'homemade_recipes' },
      { text: 'Marques recommandees dans cette categorie', type: 'brand_recommendations' }
    ]
  },
  {
    category: ' Cosmetique & Detergents',
    questions: [
      { text: 'Analyse INCI complete de ce cosmetique', type: 'inci_analysis' },
      { text: 'Ingredients controverses detectes', type: 'controversial_ingredients' },
      { text: 'Impact environnemental des detergents', type: 'environmental_impact' },
      { text: 'Alternatives naturelles pour le menage', type: 'natural_cleaning' }
    ]
  }
];

export const AIChat: React.FC<Props> = ({ productData, onAnalysisRequest }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: productData ? 
        `Bonjour ! Je suis votre assistant IA specialise en analyse scientifique. Je peux vous expliquer tout sur "${productdata?.name}" : composition, impact sante, alternatives, etc. Que souhaitez-vous savoir a` :
        'Bonjour ! Je suis votre assistant IA specialise en analyse scientifique des produits. Posez-moi vos questions !',
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string, typea: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setShowSuggestions(false);

    // Simulation d'appel API intelligent
    setTimeout(() => {
      const aiResponse = generateAIResponse(message, type, productData);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (message: string, typea: string, producta: ProductData): string => {
    if (!product) return "Je n'ai pas de donnees produit  analyser pour le moment.";

    switch (type) {
      case 'scientific_analysis':
        return `aa **Analyse Scientifique de "${product.name}"**

aa **Score Global : ${product.scientificScore || 'Non calcule'}/100**

Votre produit ? ete analyse selon 4 criteres scientifiques :
aa **Transformation** : Classification NOVA ${product.novaGroup || 'X'}
aa **Nutrition** : Nutri-Score ${product.nutriScore || 'Non calcule'}
aa **Impact Glycemique** : Analyse selon la base internationale
aa **Environnemental** : Certifications et emballage

Cette analyse se base sur les dernieres etudes INSERM 2024 et les bases de donnees officielles ANSES/EFS?.`;

      case 'additives_analysis':
        return ` **Analyse des Additifs**

${product.additives?.length ? 
  `J'ai detecte ${product.additives.length} additifs dans "${product.name}" :

${product.additives.slice(0, 3).map((additive: any, i: number) => 
  `aa **${additive.e_number}** - ${additive.name} (Risque: ${additive.risk_level})`
).join('\n')}

a **Additifs preoccupants** : Focus sur les perturbateurs du microbiote
aaaa **Recommandation** : Privilegier les alternatives avec moins d'additifs` :
  'Excellente nouvelle ! Ce produit ne contient pas d\'additifs detectes.'
}

Source : Base EFSA 2024`;

      case 'nova_explanation':
        const novaExplanations = {
          1: 'aaaa **Groupe 1 - Non/Minimalement Transforme**\n\nExcellent choix ! Ce produit subit peu de transformation industrielle. Associe  -23% de risques de maladies chroniques selon les etudes INSERM.',
          2: 'aaaa **Groupe 2 - Peu Transforme**\n\nBon choix ! Quelques ingredients ajoutes pour conservation. Impact sante neutre  positif.',
          3: 'a **Groupe 3 - Transforme**\n\nProduit avec plusieurs ingredients transformes. ? consommer avec moderation.',
          4: ' **Groupe 4 - ULTRA-TRANSFORMaa**\n\nATTENTION : Transformation industrielle intensive. Risque +53% diabete, +22% depression selon BMJ 2024. Privilegier les alternatives naturelles.'
        };
        return novaExplanations[product.novaGroup as keyof typeof novaExplanations] || 'Classification en cours...';

      case 'alternatives':
        return `a **Alternatives Recommandees pour "${product.name}"**

**Marques Naturelles :**
aa Marque Bio ? - Sans additifs, NOVA 1
aa Marque Bio B - Certification AB, score 85/100
aa Marque Bio C - Ingredients locaux, emballage recyclable

**Recettes Maison :**
 Je peux vous donner une recette simple pour remplacer ce produit !

**O acheter :**
aa Magasins bio locaux
aa Cooperatives
aa Vente directe producteurs

Voulez-vous que je detaille une alternative specifique a`;

      default:
        return `J'ai bien recu votre question sur "${product.name}". 

Grace  mon analyse scientifique avancee, je peux vous expliquer :
aa La composition exacte et les risques potentiels
aa L'impact sur votre sante selon les dernieres etudes
aa Des alternatives plus saines et naturelles
aa Des conseils personnalises

Posez-moi une question plus specifique pour une analyse detaillee !`;
    }
  };

  const handleQuickQuestion = (question: string, type: string) => {
    handleSendMessage(question, type);
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className="mb-1">
        {line.startsWith('aa') ? (
          <div className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">aa</span>
            <span dangerouslySetInnerHTML={{ __html: line.substring(1).replace(/\*\*(.*a)\*\*/g, '<strong>$1</strong>') }} />
          </div>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*a)\*\*/g, '<strong>$1</strong>') }} />
        )}
      </div>
    ));
  };

  return (
    <div className="bg-white border rounded-xl shadow-lg h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Assistant IA Scientifique</h3>
            <p className="text-sm text-gray-600">Analyse basee sur INSERM aa ANSES aa EFSA 2024</p>
          </div>
          <div className="ml-auto">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm">
                {message.type === 'assistant' ? formatMessage(message.content) : message.content}
              </div>
              <div className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.type === 'user' && (
              <div className="p-2 bg-blue-500 rounded-full">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">Analyse en cours...</span>
              </div>
            </div>
          </div>
        )}

        {/* Questions predefinies */}
        {showSuggestions && productData && (
          <div className="space-y-4">
            {PREDEFINED_QUESTIONS.map((category) => (
              <div key={category.category} className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm text-gray-700 mb-3">{category.category}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {category.questions.map((question) => (
                    <button
                      key={question.text}
                      onClick={() => handleQuickQuestion(question.text, question.type)}
                      className="text-left p-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-sm"
                    >
                      {question.text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
            placeholder="Posez votre question sur ce produit..."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isTyping}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <Zap className="w-3 h-3" />
          <span>Powered by IA avancee aa Analyses scientifiques en temps reel</span>
        </div>
      </div>
    </div>
  );
};



