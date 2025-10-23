import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Sparkles } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  brand?: string;
  scores: {
    overallScore: number;
    breakdown: any;
  };
}

interface AIEngagementWidgetProps {
  product: Product;
}

export function AIEngagementWidget({ product }: AIEngagementWidgetProps) {
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setMessage(generateEngagementMessage(product));
  }, [product]);

  const handleStartChat = () => {
    // Naviguer vers ChatPage avec contexte produit
    navigate('/chat', {
      state: {
        productContext: product,
        initialMessage: message
      }
    });
  };

  return (
    <div className="ai-engagement-widget">
      <div className="ai-card">
        {/* Avatar IA */}
        <div className="ai-avatar">
          <Sparkles className="w-6 h-6" />
        </div>

        {/* Message IA */}
        <div className="ai-content">
          <div className="ai-badge">
            <MessageCircle className="w-4 h-4" />
            <span>Assistant IA</span>
          </div>
          
          <p className="ai-message">{message}</p>

          <button 
            onClick={handleStartChat}
            className="btn-ai-chat"
          >
            ?? Discuter avec l'IA
          </button>
        </div>
      </div>

      {/* Suggestions rapides */}
      <div className="quick-questions">
        <button 
          onClick={() => navigate('/chat', { 
            state: { 
              productContext: product,
              initialMessage: "Pourquoi ce produit a ce score ?"
            }
          })}
          className="quick-btn"
        >
          Pourquoi ce score ?
        </button>
        
        <button 
          onClick={() => navigate('/chat', { 
            state: { 
              productContext: product,
              initialMessage: "Montre-moi des alternatives mieux notées"
            }
          })}
          className="quick-btn"
        >
          Voir alternatives
        </button>
        
        <button 
          onClick={() => navigate('/chat', { 
            state: { 
              productContext: product,
              initialMessage: "Ce produit est-il adapté pour moi ?"
            }
          })}
          className="quick-btn"
        >
          Est-ce pour moi ?
        </button>
      </div>
    </div>
  );
}

function generateEngagementMessage(product: Product): string {
  const score = product.scores.overallScore;
  const name = product.name;

  if (score >= 80) {
    return `Excellent choix ! ?? ${name} obtient un score de ${score}/100. Voulez-vous savoir ce qui rend ce produit si bon ?`;
  } else if (score >= 60) {
    return `${name} obtient ${score}/100, un score correct. Je peux vous expliquer en détail les points forts et points faibles ?`;
  } else if (score >= 40) {
    return `${name} a un score moyen de ${score}/100. Souhaitez-vous que je vous suggère des alternatives mieux notées disponibles en magasin ?`;
  } else {
    return `?? ${name} obtient un score faible (${score}/100). Je peux vous expliquer pourquoi et vous recommander de meilleures options si vous le souhaitez.`;
  }
}