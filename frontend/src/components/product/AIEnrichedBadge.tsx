import React from 'react';
import { Sparkles, Brain, CheckCircle } from 'lucide-react';

interface AIEnrichedBadgeProps {
  aiEnriched?: boolean;
  confidence?: number; // 0-1
  dataCompleteness?: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

/**
 * Badge indiquant qu'un produit a été enrichi par IA
 * Affiche niveau de confiance et complétude des données
 */
export const AIEnrichedBadge: React.FC<AIEnrichedBadgeProps> = ({ 
  aiEnriched = false,
  confidence,
  dataCompleteness,
  size = 'medium',
  showDetails = false
}) => {
  if (!aiEnriched) return null;

  // Tailles
  const sizeClasses = {
    small: 'px-2 py-1 text-xs gap-1',
    medium: 'px-3 py-1.5 text-sm gap-1.5',
    large: 'px-4 py-2 text-base gap-2'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  // Calculer le niveau de confiance global
  const getConfidenceLevel = () => {
    const avgConfidence = confidence || 0.85; // Défaut 85%
    if (avgConfidence >= 0.9) return {
      label: 'Haute confiance',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
    if (avgConfidence >= 0.7) return {
      label: 'Confiance moyenne',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    };
    return {
      label: 'Confiance limitée',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    };
  };

  const confidenceLevel = getConfidenceLevel();

  return (
    <div className="space-y-2">
      {/* Badge principal */}
      <div 
        className={`inline-flex items-center ${confidenceLevel.bgColor} ${confidenceLevel.borderColor} border rounded-full ${sizeClasses[size]} font-medium ${confidenceLevel.color}`}
        title="Produit enrichi par Intelligence Artificielle DeepSeek"
      >
        <Sparkles className={`${iconSizes[size]}`} />
        <span>Enrichi par IA</span>
        {confidence && (
          <span className="ml-1 font-bold">
            ({Math.round(confidence * 100)}%)
          </span>
        )}
      </div>

      {/* Détails optionnels */}
      {showDetails && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <Brain className="w-4 h-4 text-blue-600" />
              <span>Confiance IA</span>
            </div>
            <span className="font-semibold text-gray-900">
              {Math.round((confidence || 0.85) * 100)}%
            </span>
          </div>

          {dataCompleteness !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Complétude données</span>
              </div>
              <span className="font-semibold text-gray-900">
                {dataCompleteness}%
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-600">
              Les données manquantes ont été complétées par notre IA DeepSeek R1,
              formée sur des sources scientifiques fiables (OMS, ANSES, EFSA).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
