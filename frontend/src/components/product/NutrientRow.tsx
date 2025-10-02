import React from 'react';

interface NutrientRowProps {
  icon: string;
  label: string;
  value: number;
  unit: string;
  recommendation: string;
  level: 'low' | 'moderate' | 'high';
}

export function NutrientRow({ icon, label, value, unit, recommendation, level }: NutrientRowProps) {
  const colors = {
    low: 'bg-green-500',
    moderate: 'bg-orange-500',
    high: 'bg-red-500',
  };

  const textColors = {
    low: 'text-green-700',
    moderate: 'text-orange-700',
    high: 'text-red-700',
  };

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <span className="font-semibold text-gray-800">{label}</span>
        </div>
        <span className="text-lg font-bold text-gray-800">
          {value} {unit}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-3 h-3 rounded-full ${colors[level]}`} />
        <span className={`font-medium ${textColors[level]}`}>
          {level === 'low' && 'Faible'}
          {level === 'moderate' && 'Modéré'}
          {level === 'high' && 'Élevé'}
        </span>
        <span className="text-gray-500">: {recommendation}</span>
      </div>
    </div>
  );
}