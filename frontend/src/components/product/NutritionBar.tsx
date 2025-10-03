import React from 'react';

interface NutritionBarProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  level: 'low' | 'moderate' | 'high';
}

export const NutritionBar: React.FC<NutritionBarProps> = ({ 
  label, 
  value, 
  max, 
  unit, 
  level 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    low: 'bg-green-500',
    moderate: 'bg-orange-500',
    high: 'bg-red-500'
  };
  
  const levelText = {
    low: 'Faible',
    moderate: 'Modéré',
    high: 'Élevé'
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">{value}{unit}</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${colors[level]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-500">
        {levelText[level]} • Recommandé: &lt;{max}{unit}
      </p>
    </div>
  );
};
