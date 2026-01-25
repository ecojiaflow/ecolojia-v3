import React from "react";
import { Info } from "lucide-react";

interface NutrientData {
  fat?: number;
  saturatedFat?: number;
  sugars?: number;
  salt?: number;
  proteins?: number;
  energy?: number;
  carbohydrates?: number;
}

interface KeyNutrientsCardProps {
  nutrients: NutrientData;
  portion?: number;
  subcategory?: string;
}

const RI_EU = {
  energy: 2000,
  fat: 70,
  saturatedFat: 20,
  carbohydrates: 260,
  sugars: 90,
  proteins: 50,
  salt: 6
};

const CATEGORY_NUTRIENTS: Record<string, [keyof NutrientData, keyof NutrientData]> = {
  "chocolate-spread": ["sugars", "saturatedFat"],
  "biscuit": ["sugars", "saturatedFat"],
  "candy": ["sugars", "saturatedFat"],
  "soda": ["sugars", "energy"],
  "juice": ["sugars", "energy"],
  "chips": ["salt", "fat"],
  "cheese": ["saturatedFat", "salt"],
  "charcuterie": ["salt", "saturatedFat"],
  "cereal": ["sugars", "saturatedFat"],
  "yogurt": ["sugars", "saturatedFat"],
  "bread": ["salt", "carbohydrates"],
  "pasta": ["carbohydrates", "proteins"],
  "default": ["sugars", "saturatedFat"]
};

const NUTRIENT_LABELS: Record<string, string> = {
  sugars: "Sucres",
  saturatedFat: "Graisses saturees",
  salt: "Sel",
  fat: "Matieres grasses",
  energy: "Energie",
  proteins: "Proteines",
  carbohydrates: "Glucides"
};

const getBarColor = (percent: number): string => {
  if (percent <= 15) return "bg-emerald-500";
  if (percent <= 30) return "bg-amber-500";
  return "bg-red-500";
};

export const KeyNutrientsCard: React.FC<KeyNutrientsCardProps> = ({ 
  nutrients, 
  portion = 30,
  subcategory 
}) => {
  const nutrientKeys = CATEGORY_NUTRIENTS[subcategory || "default"] || CATEGORY_NUTRIENTS["default"];
  
  const calculatePercent = (key: keyof NutrientData): { value: number; percent: number } | null => {
    const value100g = nutrients[key];
    if (value100g === undefined || value100g === null) return null;
    
    const valuePerPortion = (value100g * portion) / 100;
    const ri = RI_EU[key as keyof typeof RI_EU];
    if (!ri) return null;
    
    const percent = Math.round((valuePerPortion / ri) * 100);
    return { value: Math.round(valuePerPortion * 10) / 10, percent };
  };

  const nutrientsToShow = nutrientKeys
    .map(key => ({ key, ...calculatePercent(key) }))
    .filter(n => n.value !== null) as { key: string; value: number; percent: number }[];

  if (nutrientsToShow.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-800">Impact reperes</span>
        <span className="text-xs text-gray-500">pour {portion}g</span>
      </div>

      <div className="space-y-3">
        {nutrientsToShow.map(({ key, value, percent }) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{NUTRIENT_LABELS[key] || key}</span>
              <span className="text-gray-600">{value}g - {percent}% RI</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${getBarColor(percent)}`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-100">
        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          Reperes indicatifs (RI UE adulte). L'ensemble de la journee compte.
        </p>
      </div>
    </div>
  );
};

export default KeyNutrientsCard;
