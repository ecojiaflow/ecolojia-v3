import React from 'react';

interface AllergensPanelProps {
  allergens?: string[];
  riskLevel?: 'low' | 'moderate' | 'high';
}

export function AllergensPanel({ allergens, riskLevel = 'low' }: AllergensPanelProps) {
  const riskColors = {
    low: 'bg-green-100 text-green-700',
    moderate: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700',
  };

  const riskLabels = {
    low: 'Risque faible',
    moderate: 'Risque modéré',
    high: 'Risque élevé',
  };

  if (!allergens || allergens.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span className="text-2xl">✅</span>
        <span>Aucun allergène détecté</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">💧</span>
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${riskColors[riskLevel]}`}>
          {riskLabels[riskLevel]}
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-semibold text-gray-800 text-sm">
          Composants allergisants ({allergens.length})
        </div>
        <ul className="space-y-1">
          {allergens.map((allergen, idx) => (
            <li key={idx} className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0">
              {allergen}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}