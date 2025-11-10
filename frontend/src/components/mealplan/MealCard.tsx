import React from 'react';
import { Calendar, Clock, TrendingUp, ChefHat, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MealCardProps {
  meal: {
    day: number;
    name: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
    cookingTime: number;
    cost: number;
    ingredients: string[];
    productSuggestions?: Array<{
      ingredient: string;
      product: {
        name: string;
        score: number;
        link: string;
      };
    }>;
  };
  onViewRecipe: () => void;
}

const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const getMealImage = (mealName: string) => {
  const keywords = mealName.toLowerCase();
  if (keywords.includes('poulet')) return 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400';
  if (keywords.includes('saumon')) return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400';
  if (keywords.includes('pates') || keywords.includes('pâtes')) return 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400';
  if (keywords.includes('salade')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400';
  if (keywords.includes('soupe')) return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
};

export const MealCard: React.FC<MealCardProps> = ({ meal, onViewRecipe }) => {
  const navigate = useNavigate();
  const dayName = dayNames[meal.day - 1] || `Jour ${meal.day}`;
  const hasProductSuggestions = meal.productSuggestions && meal.productSuggestions.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={getMealImage(meal.name)}
          alt={meal.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
          <Calendar className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-semibold text-gray-800">{dayName}</span>
        </div>
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
          <span className="text-sm font-semibold text-orange-600">{meal.nutrition.calories} kcal</span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-1">
          {meal.name}
        </h3>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{meal.cookingTime} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>{meal.nutrition.protein}g protéines</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            {meal.nutrition.carbs}g glucides
          </span>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
            {meal.nutrition.fats}g lipides
          </span>
          <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            ~{meal.cost.toFixed(2)}€
          </span>
        </div>

        {hasProductSuggestions && (
          <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-primary-900">
                Produits bien notés disponibles
              </span>
            </div>
            <div className="space-y-1">
              {meal.productSuggestions?.slice(0, 2).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(suggestion.product.link);
                  }}
                  className="w-full text-left text-xs text-primary-700 hover:text-primary-900 hover:underline flex items-center justify-between"
                >
                  <span>{suggestion.product.name}</span>
                  <span className="font-semibold text-green-600">
                    {suggestion.product.score}/100
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onViewRecipe}
          className="w-full bg-primary-600 hover:bg-primary-700 text-forest font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <ChefHat className="w-5 h-5" />
          <span>Voir la recette détaillée</span>
        </button>
      </div>
    </div>
  );
};