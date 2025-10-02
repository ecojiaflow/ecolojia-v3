import React from 'react';

interface ScoreBadgeProps {
  score?: number;
  category?: 'food' | 'cosmetic' | 'detergent';
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  if (score == null) {
    return (
      <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
        <div className="w-8 h-8 rounded-full bg-gray-300" />
        <div>
          <div className="text-2xl font-bold text-gray-600">N/A</div>
          <div className="text-xs text-gray-500">Non évalué</div>
        </div>
      </div>
    );
  }

  // Couleur selon le score (comme Yuka)
  let bgColor = 'bg-red-500';
  let textColor = 'text-red-700';
  let label = 'Mauvais';

  if (score >= 75) {
    bgColor = 'bg-green-500';
    textColor = 'text-green-700';
    label = 'Excellent';
  } else if (score >= 50) {
    bgColor = 'bg-yellow-500';
    textColor = 'text-yellow-700';
    label = 'Moyen';
  } else if (score >= 25) {
    bgColor = 'bg-orange-500';
    textColor = 'text-orange-700';
    label = 'Médiocre';
  }

  return (
    <div className="inline-flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-md">
      <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-lg`}>
        {score}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{score}/100</div>
        <div className={`text-xs font-semibold ${textColor}`}>{label}</div>
      </div>
    </div>
  );
}