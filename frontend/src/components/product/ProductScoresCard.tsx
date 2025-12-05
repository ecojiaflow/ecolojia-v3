import { getScoreColor, getScoreBgColor } from '@/utils/scoreColors';
import React from 'react';
import { Heart, Leaf } from 'lucide-react';

interface ProductScoresCardProps {
  healthScore: number | null;
  environmentScore: number | null;
}

export const ProductScoresCard: React.FC<ProductScoresCardProps> = ({
  healthScore,
  environmentScore
}) => {
  const renderScore = (score: number | null, icon: React.ReactNode, label: string) => {
    if (score === null || score === undefined) {
      return (
        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <h3 className="font-semibold text-gray-700">{label}</h3>
          </div>
          <div className="text-center">
            <span className="text-lg font-medium text-neutral-600">
              Non évalué
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={`p-4 rounded-lg border ${getScoreBgColor(score)}`}>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h3 className="font-semibold text-gray-700">{label}</h3>
        </div>
        <div className="text-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-gray-600">/100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-none md:rounded-xl shadow-sm p-4 md:p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Scores détaillés</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {renderScore(
          healthScore,
          <Heart className="w-5 h-5 text-red-500" />,
          'Score Santé'
        )}
        {renderScore(
          environmentScore,
          <Leaf className="w-5 h-5 text-green-500" />,
          'Score Environnement'
        )}
      </div>
    </div>
  );
};