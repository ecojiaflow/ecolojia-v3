import React from 'react';
import { NutritionBar } from './NutritionBar';

interface NutritionData {
  energy: number;
  fat: number;
  saturatedFat: number;
  carbohydrates: number;
  sugars: number;
  protein: number;
  salt: number;
  fiber?: number;
}

interface ProductNutritionProps {
  nutrition: NutritionData;
}

export const ProductNutrition: React.FC<ProductNutritionProps> = ({ nutrition }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Valeurs nutritionnelles (pour 100g)
      </h2>
      
      {/* Barres colorées critiques */}
      <div className="space-y-4 mb-6">
        <NutritionBar 
          label="Sucres" 
          value={nutrition.sugars} 
          max={25} 
          unit="g"
          level={nutrition.sugars > 25 ? 'high' : nutrition.sugars > 12.5 ? 'moderate' : 'low'}
        />
        <NutritionBar 
          label="Sel" 
          value={nutrition.salt} 
          max={1} 
          unit="g"
          level={nutrition.salt > 1 ? 'high' : nutrition.salt > 0.5 ? 'moderate' : 'low'}
        />
        <NutritionBar 
          label="Graisses saturées" 
          value={nutrition.saturatedFat} 
          max={5} 
          unit="g"
          level={nutrition.saturatedFat > 5 ? 'high' : nutrition.saturatedFat > 2.5 ? 'moderate' : 'low'}
        />
      </div>

      {/* Tableau résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-800">{nutrition.energy}</p>
          <p className="text-sm text-gray-600">kcal</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-800">{nutrition.protein}g</p>
          <p className="text-sm text-gray-600">Protéines</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-800">{nutrition.carbohydrates}g</p>
          <p className="text-sm text-gray-600">Glucides</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-800">{nutrition.fat}g</p>
          <p className="text-sm text-gray-600">Lipides</p>
        </div>
      </div>
    </div>
  );
};
