import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

interface ProductChatActionsProps {
  product: {
    barcode?: string;
    name: string;
    category: 'food' | 'cosmetics' | 'detergents';
    scores?: {
      overallScore?: number;
      healthScore?: number;
      environmentScore?: number;
    };
  };
}

const CONTEXTUAL_QUESTIONS = {
  food: [
    "Pourquoi ce produit a ce score ?",
    "Quels sont les points forts nutritionnels ?",
    "Quelles sont les alternatives plus saines ?"
  ],
  cosmetics: [
    "Contient-il des perturbateurs endocriniens ?",
    "Est-ce bon pour peau sensible ?",
    "Quelles alternatives sans parabens ?"
  ],
  detergents: [
    "Quel est l'impact sur les rivières ?",
    "Est-ce vraiment biodégradable ?",
    "Existe-t-il une version écologique ?"
  ]
};

export const ProductChatActions: React.FC<ProductChatActionsProps> = ({ product }) => {
  const navigate = useNavigate();
  
  const questions = CONTEXTUAL_QUESTIONS[product.category];

  const handleQuestionClick = (question: string) => {
    const params = new URLSearchParams({
      product: product.barcode || product.name,
      q: question
    });
    navigate(`/chat?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-green-700" />
        <h3 className="text-lg font-semibold text-gray-800">Posez vos questions à l'IA</h3>
      </div>
      
      <div className="space-y-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => handleQuestionClick(question)}
            className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-sm font-medium"
          >
            {question}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Questions personnalisées selon la catégorie {product.category}
      </p>
    </div>
  );
};


