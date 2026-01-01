import React from 'react';
import { getScoreColor, getScoreBgColor } from '@/utils/scoreColors';
import { ScoreBadge } from './ScoreBadge';
import { AIEnrichedBadge } from './AIEnrichedBadge';

interface ProductScoreSidebarProps {
  overallScore: number | null;
  healthScore: number | null;
  environmentScore: number | null;
  confidence?: number;
  dataCompleteness?: number;
  aiEnriched?: boolean;
}

export const ProductScoreSidebar: React.FC<ProductScoreSidebarProps> = ({
  overallScore,
  healthScore,
  environmentScore,
  confidence,
  dataCompleteness,
  aiEnriched
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
      {/* Score principal */}
      <div className="text-center mb-4">
        <div className="text-sm text-gray-500 mb-2">Score global</div>
        <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
          {overallScore || 'N/A'}
        </div>
        <div className="text-sm text-gray-500 mt-1">/ 100</div>
        
        <div className="mt-3">
          <ScoreBadge score={overallScore} size="medium" showLabel={true} />
        </div>
      </div>

      {/* Scores détaillés */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Santé</span>
          <span className={`font-semibold ${getScoreColor(healthScore)}`}>
            {healthScore || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Environnement</span>
          <span className={`font-semibold ${getScoreColor(environmentScore)}`}>
            {environmentScore || 'N/A'}
          </span>
        </div>
      </div>

      {/* Badge IA */}
      {aiEnriched && (
        <div className="mt-4 pt-4 border-t">
          <AIEnrichedBadge
            aiEnriched={aiEnriched}
            confidence={confidence}
            dataCompleteness={dataCompleteness}
            size="small"
            showDetails={false}
          />
        </div>
      )}
    </div>
  );
};
