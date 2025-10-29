import React, { useState } from 'react';
import { Calendar, ShoppingCart, TrendingUp, Download, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MealCard } from '../components/mealplan/MealCard';
import { RecipeDetailModal } from '../components/mealplan/RecipeDetailModal';
import { api } from '../services/api';

export const MealPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'meals' | 'shopping' | 'nutrition'>('meals');
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planData, setPlanData] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    budget: 80,
    calories: 2000,
    people: 1,
    dietType: 'balanced',
    cookingTime: 'medium',
    allergens: [] as string[]
  });

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('ecolojia_token');
      const response = await api.post('/meal-plan/generate', formData, {
        timeout: 60000, // 60 secondes pour gngnration IA
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPlanData(response.data);
    } catch (error: any) {
      console.error('Erreur gngnration plan:', error);
      const message = error.response?.data?.error || 'Erreur lors de la gngnration du plan';
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const openRecipeModal = (meal: any) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };

  if (!planData) {
    return (
      <div className="min-h-screen bg-primary-50 pb-24">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate('/assistant')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour</span>
          </button>

          <div className="bg-primary-50 rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-100">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Gnrer un plan repas IA
              </h1>
              <p className="text-lg text-gray-600">
                Votre nutritionniste personnel bas sur l'intelligence artificielle
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Budget hebdomadaire
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-medium"
                      min="20"
                      max="500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 font-medium"></span>
                  </div>
                  <p className="text-xs text-neutral-700 mt-1">Entre 20 et 500</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Calories par jour
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-medium"
                      min="1200"
                      max="4000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 font-medium">kcal</span>
                  </div>
                  <p className="text-xs text-neutral-700 mt-1">Entre 1200 et 4000 kcal</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Nombre de personnes
                  </label>
                  <select
                    value={formData.people}
                    onChange={(e) => setFormData({ ...formData, people: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-medium appearance-none bg-primary-50"
                  >
                    <option value={1}>1 personne</option>
                    <option value={2}>2 personnes</option>
                    <option value={3}>3 personnes</option>
                    <option value={4}>4 personnes</option>
                    <option value={5}>5+ personnes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Type de rgime
                  </label>
                  <select
                    value={formData.dietType}
                    onChange={(e) => setFormData({ ...formData, dietType: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-medium appearance-none bg-primary-50"
                  >
                    <option value="balanced">quilibr</option>
                    <option value="vegetarian">vgtarien</option>
                    <option value="vegan">Vegan</option>
                    <option value="low-carb">Faible en glucides</option>
                  </select>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>?</span>
                  Ce qui vous attend
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">?</span>
                    <span><strong>7 repas</strong> quilibrs avec recettes dtailles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">?</span>
                    <span><strong>Liste courses</strong> automatique avec quantits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">?</span>
                    <span><strong>Suggestions produits</strong> bien nots ECOLOJIA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">?</span>
                    <span><strong>Assistant IA</strong> pour vos questions cuisine</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={generatePlan}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-primary-600 via-primary-600 to-purple-600 hover:from-primary-700 hover:via-primary-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] text-lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    <span>gngnration en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Gnrer mon plan repas</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-neutral-700 mt-4">
                ? gngnration en ~15 secondes   Feature Premium
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Protection contre planData null
  if (!planData || !planData.data) {
    console.error('planData invalide:', planData);
    return null;
  }
  const plan = planData.data;
  const tabs = [
    { id: 'meals', label: 'Mes repas', icon: Calendar, count: plan.meals?.length || 0 },
    { id: 'shopping', label: 'Liste courses', icon: ShoppingCart, count: plan.shoppingList?.length || 0 },
    { id: 'nutrition', label: 'Statistiques', icon: TrendingUp, count: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/20 pb-24">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setPlanData(null)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Nouveau plan</span>
          </button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Plan gnr par IA</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Votre plan repas hebdomadaire
              </h1>
              <p className="text-primary-100 text-sm sm:text-base">
                {plan.meals?.length || 0} repas  {plan.estimatedBudget?.toFixed(2) || 0} budget  
                {plan.nutrition?.avgPerDay?.calories || 2000} kcal/jour
              </p>
            </div>
          </div>

          {planData.validation && (
            <div className="bg-primary-50/10 backdrop-blur-sm rounded-xl p-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qualit du plan</span>
                <span className="text-2xl font-bold">{planData.validation.score}/100</span>
              </div>
              <div className="mt-2 h-2 bg-primary-50/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-50 transition-all dugnration-500"
                  style={{ width: `${planData.validation.score}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-primary-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'meals' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Vos {plan.meals?.length || 0} repas de la semaine</h2>
              <p className="text-gray-600 text-sm">
                Cliquez sur une carte pour voir la recette dtaille et l'assistant IA
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plan.meals?.map((meal: any, idx: number) => (
                <MealCard
                  key={idx}
                  meal={meal}
                  onViewRecipe={() => openRecipeModal(meal)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shopping' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Liste de courses</h2>
              <p className="text-gray-600 text-sm">
                {plan.shoppingList?.length || 0} articles  Budget: {plan.estimatedBudget?.toFixed(2) || 0}
              </p>
            </div>

            <div className="bg-primary-50 rounded-2xl shadow-md overflow-hidden">
              {plan.shoppingList && plan.shoppingList.length > 0 ? (
                plan.shoppingList.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 border-b hover:bg-neutral-50 flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-neutral-700">{item.quantity} {item.unit}</p>
                    </div>
                    <span className="font-semibold">{item.estimatedPrice?.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-neutral-700">Aucun article</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Statistiques nutritionnelles</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Calories', value: plan.nutrition?.avgPerDay?.calories || 0, unit: 'kcal' },
                { label: 'protines', value: plan.nutrition?.avgPerDay?.protein || 0, unit: 'g' },
                { label: 'Glucides', value: plan.nutrition?.avgPerDay?.carbs || 0, unit: 'g' },
                { label: 'Lipides', value: plan.nutrition?.avgPerDay?.fats || 0, unit: 'g' },
              ].map((stat) => (
                <div key={stat.label} className="bg-primary-50 rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {stat.value}<span className="text-lg ml-1">{stat.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedMeal && (
        <RecipeDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMeal(null);
          }}
          meal={selectedMeal}
        />
      )}
    </div>
  );
};
