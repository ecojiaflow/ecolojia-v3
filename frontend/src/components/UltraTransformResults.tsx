// PATH: src\components\UltraTransformResults.tsx
import React from 'react';

/**
 * Résumé du produit côté transformation :
 *  - novaClass : 1 (nature) → 4 (ultra-transformé)
 *  - transformationScore : 0 – 100 (≤ 40 conseillé)
 *  - additivesCount : nombre d’additifs identifiés
 */
interface UltraTransformResultsProps {
  novaClass?: 1 | 2 | 3 | 4;
  transformationScore?: number;
  additivesCount?: number;
}

const getNovaLabel = (nova?: number) => {
  switch (nova) {
    case 1:
      return 'Aliment brut (NOVA 1)';
    case 2:
      return 'Ingrédients culinaires (NOVA 2)';
    case 3:
      return 'Transformé (NOVA 3)';
    case 4:
      return 'Ultra-transformé (NOVA 4)';
    default:
      return 'Classe NOVA inconnue';
  }
};

const getScoreColour = (score: number) => {
  if (score <= 40) return 'text-green-600';
  if (score <= 70) return 'text-orange-500';
  return 'text-red-600';
};

const UltraTransformResults: React.FC<UltraTransformResultsProps> = ({
  novaClass = 4,
  transformationScore = 80,
  additivesCount = 0,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full">
      <h3 className="text-lg font-bold text-gray-800 mb-4">🔬 Ultra-Transformation</h3>

      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600">Classe NOVA</span>
        <span className="font-semibold">{getNovaLabel(novaClass)}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600">Score transformation</span>
        <span className={`font-bold ${getScoreColour(transformationScore)}`}>
          {transformationScore} / 100
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-600">Additifs détectés</span>
        <span className="font-semibold">{additivesCount}</span>
      </div>
    </div>
  );
};

export default UltraTransformResults;
// EOF
