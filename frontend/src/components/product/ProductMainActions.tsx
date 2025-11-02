import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingCart, UtensilsCrossed, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { mealPlanService } from '../../services/mealPlanService';

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
  onShowAlternatives?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

export const ProductMainActions: React.FC<ProductMainActionsProps> = ({ 
  product, 
  onShowAlternatives 
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAlternatives = () => {
    console.log('DEBUG: Bouton Alternatives clique');
    console.log('DEBUG: onShowAlternatives existe ?', !!onShowAlternatives);
    if (onShowAlternatives) {
      console.log('DEBUG: Appel du callback');
      onShowAlternatives();
    } else {
      console.error('DEBUG: onShowAlternatives est undefined !');
    }
  };

  const handleAddToList = async () => {
    setIsLoading('list');
    try {
      const token = localStorage.getItem('ecolojia_token');
      if (!token) {
        toast.error('Connectez-vous pour gerer vos listes');
        navigate('/login');
        return;
      }
      const listsResponse = await axios.get(`${API_URL}/api/shopping-lists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let listId = listsResponse.data.lists[0]?._id;
      if (!listId) {
        const createResponse = await axios.post(
          `${API_URL}/api/shopping-lists`,
          { name: 'Ma liste de courses' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        listId = createResponse.data.list._id;
      }
      await axios.post(
        `${API_URL}/api/shopping-lists/${listId}/items`,
        { productId: product._id, name: product.name, score: product.scores?.global || product.scores?.overallScore, quantity: 1, unit: 'unite', category: 'autres' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Produit ajoute a votre liste', { duration: 2000, style: { background: '#F3FBF5', color: '#1B9E4B', border: '1px solid #D4F1C0' } });
    } catch (error: any) {
      console.error('Erreur ajout liste:', error);
      if (error.response?.status === 401) {
        toast.error('Session expiree, reconnectez-vous');
        navigate('/login');
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleAddToMeal = async () => {
    if (product.category !== 'food') {
      toast.error('Reserve aux produits alimentaires');
      return;
    }
    
    setIsLoading('meal');
    try {
      const token = localStorage.getItem('ecolojia_token');
      if (!token) {
        toast.error('Connectez-vous pour gerer vos repas');
        navigate('/login');
        return;
      }
      
      const mealPlans = await mealPlanService.getMealPlans();
      
      let activePlan = mealPlans.find(plan => {
        const now = new Date();
        return new Date(plan.startDate) <= now && new Date(plan.endDate) >= now;
      });
      
      if (!activePlan) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        
        activePlan = await mealPlanService.createMealPlan({
          name: 'Ma semaine',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }
      
      navigate(`/meal-plan/${activePlan._id}/add`, {
        state: { productId: product._id }
      });
      
    } catch (error: any) {
      console.error('Erreur ajout repas:', error);
      if (error.response?.status === 401) {
        toast.error('Session expiree, reconnectez-vous');
        navigate('/login');
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-6 mb-6 border border-[#DDE9DA]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={handleAlternatives} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#7DDE4A] hover:bg-[#5FC72F] text-[#0E1A0D] rounded-[16px] font-semibold transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(125,222,74,0.3)]">
          <Sparkles className="w-5 h-5" />
          <span>Alternatives IA</span>
        </button>
        <button onClick={handleAddToList} disabled={isLoading === 'list'} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2E7DD7] hover:bg-[#1D4ED8] text-white rounded-[16px] font-semibold transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading === 'list' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
          <span>Ajouter a ma liste</span>
        </button>
        <button onClick={handleAddToMeal} disabled={isLoading === 'meal' || product.category !== 'food'} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1B9E4B] hover:bg-[#178A3E] text-white rounded-[16px] font-semibold transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#DDE9DA] disabled:text-[#9CA3AF]">
          {isLoading === 'meal' ? <Loader2 className="w-5 h-5 animate-spin" /> : <UtensilsCrossed className="w-5 h-5" />}
          <span>Ajouter a un repas</span>
        </button>
      </div>
      {product.category !== 'food' && (
        <div className="mt-3 px-4 py-2 bg-[#FFF8E6] border border-[#FFE8A8] rounded-[14px] text-center">
          <p className="text-xs text-[#6B4D00]">L'ajout a un plan repas est reserve aux produits alimentaires</p>
        </div>
      )}
    </div>
  );
};