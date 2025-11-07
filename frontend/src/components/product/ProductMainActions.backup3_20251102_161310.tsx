import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingCart, UtensilsCrossed, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface ProductMainActionsProps {
  product: {
    _id: string;
    name: string;
    barcode?: string;
    category: 'food' | 'cosmetics' | 'detergents';
    scores?: {
      global?: number;
      overallScore?: number;
    };
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

export const ProductMainActions: React.FC<ProductMainActionsProps> = ({ product }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  /**
   * Action 1 : Scroll vers alternatives
   * VERSION ULTRA-ROBUSTE : délais plus longs + plus de tentatives
   */
  const handleAlternatives = () => {
    console.log('🔍 Début recherche section alternatives...');
    
    const scrollToAlternatives = (attempt = 0) => {
      const alternativesSection = document.getElementById('alternatives-section');
      
      if (alternativesSection) {
        // Élément trouvé !
        alternativesSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        console.log('✅ Scroll vers alternatives effectué avec succès');
        toast.success('Section alternatives affichée', {
          duration: 2000,
          style: {
            background: '#F3FBF5',
            color: '#1B9E4B',
            border: '1px solid #D4F1C0'
          }
        });
      } else if (attempt < 10) {
        // Retry après 200ms (max 10 tentatives = 2 secondes total)
        console.log(`⏳ Tentative ${attempt + 1}/10 - Section pas encore montée`);
        setTimeout(() => scrollToAlternatives(attempt + 1), 200);
      } else {
        // Échec après 10 tentatives (2 secondes)
        console.error('❌ Section alternatives introuvable après 2 secondes');
        toast.error('Section alternatives non disponible', {
          duration: 3000
        });
      }
    };

    // Démarrer la recherche
    scrollToAlternatives();
  };

  /**
   * Action 2 : Ajouter à la liste de courses
   */
  const handleAddToList = async () => {
    setIsLoading('list');
    try {
      const token = localStorage.getItem('ecolojia_token');

      if (!token) {
        toast.error('Connectez-vous pour gérer vos listes');
        navigate('/login');
        return;
      }

      // Récupérer ou créer la liste par défaut
      const listsResponse = await axios.get(`${API_URL}/api/shopping-lists`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let listId = listsResponse.data.lists[0]?._id;

      // Si aucune liste, en créer une
      if (!listId) {
        const createResponse = await axios.post(
          `${API_URL}/api/shopping-lists`,
          { name: 'Ma liste de courses' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        listId = createResponse.data.list._id;
      }

      // Ajouter le produit
      await axios.post(
        `${API_URL}/api/shopping-lists/${listId}/items`,
        {
          productId: product._id,
          name: product.name,
          score: product.scores?.global || product.scores?.overallScore,
          quantity: 1,
          unit: 'unite',
          category: 'autres'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('✅ Produit ajouté à votre liste', {
        duration: 2000,
        style: {
          background: '#F3FBF5',
          color: '#1B9E4B',
          border: '1px solid #D4F1C0'
        }
      });
    } catch (error: any) {
      console.error('❌ Erreur ajout liste:', error);
      if (error.response?.status === 401) {
        toast.error('Session expirée, reconnectez-vous');
        navigate('/login');
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
    } finally {
      setIsLoading(null);
    }
  };

  /**
   * Action 3 : Ajouter à un plan repas (alimentaire uniquement)
   */
  const handleAddToMeal = () => {
    if (product.category !== 'food') {
      toast.error('Réservé aux produits alimentaires');
      return;
    }

    toast('Fonctionnalité en développement', { 
      icon: '🚧',
      style: {
        background: '#FFF8E6',
        color: '#6B4D00',
        border: '1px solid #FFE8A8'
      }
    });
  };

  return (
    <div className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-6 mb-6 border border-[#DDE9DA]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Action 1 : Alternatives IA - CTA PRINCIPAL */}
        <button
          onClick={handleAlternatives}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#7DDE4A] hover:bg-[#5FC72F] text-[#0E1A0D] rounded-[16px] font-semibold transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(125,222,74,0.3)]"
        >
          <Sparkles className="w-5 h-5" />
          <span>Alternatives IA</span>
        </button>

        {/* Action 2 : Ajouter à ma liste */}
        <button
          onClick={handleAddToList}
          disabled={isLoading === 'list'}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2E7DD7] hover:bg-[#1D4ED8] text-white rounded-[16px] font-semibold transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading === 'list' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ShoppingCart className="w-5 h-5" />
          )}
          <span>Ajouter à ma liste</span>
        </button>

        {/* Action 3 : Ajouter à un repas */}
        <button
          onClick={handleAddToMeal}
          disabled={product.category !== 'food'}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1B9E4B] hover:bg-[#178A3E] text-white rounded-[16px] font-semibold transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#DDE9DA] disabled:text-[#9CA3AF]"
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span>Ajouter à un repas</span>
        </button>
      </div>

      {/* Message info pour produits non-alimentaires */}
      {product.category !== 'food' && (
        <div className="mt-3 px-4 py-2 bg-[#FFF8E6] border border-[#FFE8A8] rounded-[14px] text-center">
          <p className="text-xs text-[#6B4D00]">
            💡 L'ajout à un plan repas est réservé aux produits alimentaires
          </p>
        </div>
      )}
    </div>
  );
};