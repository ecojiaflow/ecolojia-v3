import React from 'react';
import { Info } from 'lucide-react';

interface Ingredient {
  name: string;
  percentage?: number;
  isAllergen: boolean;
  concerns: string[];
}

interface ProductIngredientsProps {
  ingredients: Ingredient[];
}

export const ProductIngredients: React.FC<ProductIngredientsProps> = ({ ingredients }) => {
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-none md:rounded-xl shadow-sm p-4 md:p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <Info className="w-5 h-5 mr-2" />
        Ingrédients
      </h2>
      <div className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg ${
              ingredient.isAllergen ? 'bg-red-50 border border-red-200' :
              ingredient.concerns.length > 0 ? 'bg-yellow-50 border border-yellow-200' :
              'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{ingredient.name}</span>
              {ingredient.percentage && (
                <span className="text-sm text-neutral-700">({ingredient.percentage}%)</span>
              )}
              {ingredient.isAllergen && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                  Allergène
                </span>
              )}
            </div>
            {ingredient.concerns.length > 0 && (
              <span className="text-sm text-orange-600">
                ⚠️ {ingredient.concerns.join(', ')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
