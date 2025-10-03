import React from 'react';
import { Heart, Leaf } from 'lucide-react';

interface ProductScoresCardProps {
  healthScore: number;
  environmentScore: number;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreBgColor = (score: number) => {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-yellow-50 border-yellow-200';
  if (score >= 40) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};

export const ProductScoresCard: React.FC<ProductScoresCardProps> = ({
  healthScore,
  environmentScore
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Health Score */}
        <div className={`p-4 rounded-lg border ${getScoreBgColor(healthScore)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-medium">Santé</span>
            </div>
            <span className={`text-2xl font-bold ${getScoreColor(healthScore)}`}>
              {healthScore}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Impact sur votre santé</p>
        </div>

        {/* Environment Score */}
        <div className={`p-4 rounded-lg border ${getScoreBgColor(environmentScore)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              <span className="font-medium">Environnement</span>
            </div>
            <span className={`text-2xl font-bold ${getScoreColor(environmentScore)}`}>
              {environmentScore}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Empreinte écologique</p>
        </div>
      </div>
    </div>
  );
};
