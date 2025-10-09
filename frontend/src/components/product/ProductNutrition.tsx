import React from 'react';
import { NutritionBar } from './NutritionBar';

interface NutritionData {
  energy?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  protein?: number;
  salt?: number;
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
        {nutrition.sugars !== undefined && (
          <NutritionBar
            label="Sucres"
            value={nutrition.sugars}
            max={25}
            unit="g"
            level={nutrition.sugars > 25 ? 'high' : nutrition.sugars > 12.5 ? 'moderate' : 'low'}
          />
        )}
        {nutrition.salt !== undefined && (
          <NutritionBar
            label="Sel"
            value={nutrition.salt}
            max={1}
            unit="g"
            level={nutrition.salt > 1 ? 'high' : nutrition.salt > 0.5 ? 'moderate' : 'low'}
          />
        )}
        {nutrition.saturatedFat !== undefined && (
          <NutritionBar
            label="Graisses saturées"
            value={nutrition.saturatedFat}
            max={5}
            unit="g"
            level={nutrition.saturatedFat > 5 ? 'high' : nutrition.saturatedFat > 2.5 ? 'moderate' : 'low'}
          />
        )}
      </div>

      {/* Tableau complet */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-semibold">Nutriment</th>
              <th className="text-right p-3 font-semibold">Quantité</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {nutrition.energy !== undefined && (
              <tr>
                <td className="p-3">Énergie</td>
                <td className="p-3 text-right font-semibold">{Math.round(nutrition.energy)} kcal</td>
              </tr>
            )}
            {nutrition.fat !== undefined && (
              <>
                <tr className="bg-gray-50">
                  <td className="p-3 font-semibold">Matières grasses</td>
                  <td className="p-3 text-right font-semibold">{nutrition.fat} g</td>
                </tr>
                {nutrition.saturatedFat !== undefined && (
                  <tr>
                    <td className="p-3 pl-6 text-gray-600">dont saturées</td>
                    <td className="p-3 text-right">{nutrition.saturatedFat} g</td>
                  </tr>
                )}
              </>
            )}
            {nutrition.carbohydrates !== undefined && (
              <>
                <tr className="bg-gray-50">
                  <td className="p-3 font-semibold">Glucides</td>
                  <td className="p-3 text-right font-semibold">{nutrition.carbohydrates} g</td>
                </tr>
                {nutrition.sugars !== undefined && (
                  <tr>
                    <td className="p-3 pl-6 text-gray-600">dont sucres</td>
                    <td className="p-3 text-right">{nutrition.sugars} g</td>
                  </tr>
                )}
              </>
            )}
            {nutrition.fiber !== undefined && nutrition.fiber > 0 && (
              <tr className="bg-gray-50">
                <td className="p-3">Fibres alimentaires</td>
                <td className="p-3 text-right">{nutrition.fiber} g</td>
              </tr>
            )}
            {nutrition.protein !== undefined && (
              <tr className="bg-gray-50">
                <td className="p-3">Protéines</td>
                <td className="p-3 text-right">{nutrition.protein} g</td>
              </tr>
            )}
            {nutrition.salt !== undefined && (
              <tr className="bg-gray-50">
                <td className="p-3">Sel</td>
                <td className="p-3 text-right">{nutrition.salt} g</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Source : OpenFoodFacts • Les données peuvent être incomplètes
      </p>
    </div>
  );
};
