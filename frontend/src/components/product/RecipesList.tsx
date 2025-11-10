import React, { useMemo, useState } from 'react';
import { ChefHat, Clock, Users, TrendingUp } from 'lucide-react';
import { RecipeDetailModal } from '../mealplan/RecipeDetailModal';

// ✅ INTERFACE CORRIGÉE avec ingredients structurés
interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  role?: string;
  score?: number;
}

interface Recipe {
  _id: string;
  name: string;
  description: string;
  image?: string;
  prepTime: number;
  servings: number;
  scores: {
    overallScore: number;
    healthScore: number;
    environmentScore: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients?: Ingredient[];  // ✅ AJOUTÉ !
  nutrition?: {
    perServing?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  };
}

interface RecipesListProps {
  recipes: Recipe[];
}

export const RecipesList: React.FC<RecipesListProps> = ({ recipes }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const uniqueRecipes = useMemo(() => {
    if (!recipes || recipes.length === 0) return [];
    return recipes.filter((recipe, index, self) =>
      index === self.findIndex((r) =>
        (r._id && r._id === recipe._id) || r.name === recipe.name
      )
    );
  }, [recipes]);

  // ✅ FONCTION CORRIGÉE
  const adaptRecipeToMeal = (recipe: Recipe) => {
    return {
      name: recipe.name,
      // ✅ UTILISE LES VRAIS INGRÉDIENTS STRUCTURÉS
      ingredients: recipe.ingredients && recipe.ingredients.length > 0
        ? recipe.ingredients
        : [{ name: recipe.description || 'Ingrédients à définir', quantity: 0, unit: '' }],
      nutrition: {
        calories: recipe.nutrition?.perServing?.calories || 0,
        protein: recipe.nutrition?.perServing?.protein || 0,
        carbs: recipe.nutrition?.perServing?.carbs || 0,
        fats: recipe.nutrition?.perServing?.fat || 0
      },
      cookingTime: recipe.prepTime,
      day: 1
    };
  };

  if (uniqueRecipes.length === 0) {
    return null;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return difficulty;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Recettes suggérées ({uniqueRecipes.length})
          </h3>
        </div>
        <div className="space-y-4">
          {uniqueRecipes.map((recipe) => (
            <div
              key={recipe._id}
              onClick={() => setSelectedRecipe(recipe)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary transition-all cursor-pointer"
            >
              <div className="flex gap-4">
                {recipe.image && (
                  <div className="flex-shrink-0">
                    <img src={recipe.image} alt={recipe.name} className="w-24 h-24 rounded-lg object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-gray-900 text-lg">{recipe.name}</h4>
                    <div className={'px-2 py-1 rounded-full text-xs font-medium ' + getDifficultyColor(recipe.difficulty)}>
                      {getDifficultyLabel(recipe.difficulty)}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.prepTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{recipe.servings} pers.</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={'w-4 h-4 ' + getScoreColor(recipe.scores.overallScore)} />
                      <span className={'font-medium ' + getScoreColor(recipe.scores.overallScore)}>
                        {recipe.scores.overallScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-gray-500">Santé :</span>
                      <span className={'font-medium ' + getScoreColor(recipe.scores.healthScore)}>
                        {recipe.scores.healthScore}/100
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-gray-500">Environnement :</span>
                      <span className={'font-medium ' + getScoreColor(recipe.scores.environmentScore)}>
                        {recipe.scores.environmentScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">💡 Cliquez sur une recette pour voir les détails</p>
      </div>
      {selectedRecipe && (
        <RecipeDetailModal
          meal={adaptRecipeToMeal(selectedRecipe)}
          isOpen={!!selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
};