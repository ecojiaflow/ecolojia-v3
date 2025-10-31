import React from 'react';
import { MessageCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductActionsProps {
  product: any;
}

export const ProductActions: React.FC<ProductActionsProps> = ({ product }) => {
  const navigate = useNavigate();
  
  const handleChatQuestion = (question: string) => {
    navigate(`/chat?product=${product.barcode}&q=${encodeURIComponent(question)}`);
  };
  
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        💬 Posez vos questions à l'IA
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => handleChatQuestion("Pourquoi ce score ?")}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Explique le score</span>
        </button>
        
        <button
          onClick={() => handleChatQuestion("Détails composition")}
          className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Composition</span>
        </button>
        
        <button
          onClick={() => handleChatQuestion("Alternatives plus saines")}
          className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Alternatives</span>
        </button>
      </div>
    </div>
  );
};
