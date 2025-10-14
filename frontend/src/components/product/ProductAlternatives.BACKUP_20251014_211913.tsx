import { getScoreColor, getScoreBgColor } from '@/utils/scoreColors';
import React from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

interface Alternative {
  _id: string;
  name: string;
  brand: string;
  scores?: {
    healthScore?: number;
    environmentScore?: number;
    nutriscore?: string;
    nova?: number;
  };
}

interface ProductAlternativesProps {
  alternatives: Alternative[];
  loading: boolean;
}



const getNutriScoreColor = (score?: string) => {
  const colors: Record<string, string> = {
    'A': 'bg-green-600',
    'B': 'bg-lime-500',
    'C': 'bg-yellow-500',
    'D': 'bg-orange-500',
    'E': 'bg-red-600'
  };
  return colors[score || ''] || 'bg-gray-400';
};

export const ProductAlternatives: React.FC<ProductAlternativesProps> = ({
  alternatives,
  loading
}) => {
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Alternatives recommandées
      </h2>
      {loading ? (
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600">Recherche d'alternatives...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alternatives.slice(0, 6).map((alt, index) => {
            // Utiliser directement overallScore du backend (déjà calculé scientifiquement)
            const altOverallScore = alt.scores?.overallScore || alt.scores?.global || 50;
            
            return (
              <Link
                key={alt._id || index}
                to={`/product/${alt._id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800">{alt.name}</h3>
                  <span className={`font-bold ${getScoreColor(altOverallScore)}`}>
                    {altOverallScore}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{alt.brand}</p>
                <div className="flex gap-2 mt-2">
                  {alt.scores?.nutriscore && (
                    <span className={`px-2 py-1 text-white rounded text-xs ${getNutriScoreColor(alt.scores.nutriscore)}`}>
                      {alt.scores.nutriscore}
                    </span>
                  )}
                  {alt.scores?.nova && (
                    <span className="px-2 py-1 bg-gray-600 text-white rounded text-xs">
                      N{alt.scores.nova}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};




