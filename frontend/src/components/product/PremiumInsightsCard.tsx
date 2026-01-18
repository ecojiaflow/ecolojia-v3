// PATH: frontend/src/components/product/PremiumInsightsCard.tsx
import React from 'react';
import { Sparkles, Info, AlertTriangle } from 'lucide-react';

interface EstimatedValue {
  value: number | string;
  confidence: number;
  reasoning: string;
  isEstimated: boolean;
}

interface EstimatedData {
  nova?: EstimatedValue | null;
  nutriScore?: EstimatedValue | null;
  description?: string | null;
  typicalIngredients?: string[];
}

interface PremiumInsightsCardProps {
  estimatedData: EstimatedData | null;
  knownData: any;
  disclaimer: string;
  processingTime?: number;
}

const getConfidenceLabel = (conf: number) => {
  if (conf >= 0.7) return { label: 'Fiable', color: 'text-emerald-600 bg-emerald-50' };
  if (conf >= 0.5) return { label: 'Probable', color: 'text-amber-600 bg-amber-50' };
  return { label: 'Incertain', color: 'text-orange-600 bg-orange-50' };
};

const PremiumInsightsCard: React.FC<PremiumInsightsCardProps> = ({
  estimatedData,
  knownData,
  disclaimer,
  processingTime,
  generatedAt
}) => {
  if (!estimatedData) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 text-slate-600">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">Fiche deja complete</span>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Ce produit dispose de toutes les informations necessaires.
        </p>
      </div>
    );
  }

  const hasEstimates = estimatedData.nova || estimatedData.nutriScore || estimatedData.description;
  if (!hasEstimates) return null;

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">Donnees estimees par IA</h3>
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Estimations
          </span>
        </div>
      </div>

      {/* Estimations */}
      <div className="p-4 space-y-3">
        {estimatedData.nova && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">NOVA estime</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceLabel(estimatedData.nova.confidence).color}`}>
                {getConfidenceLabel(estimatedData.nova.confidence).label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-violet-600">Probablement NOVA {estimatedData.nova.value}</span>
              <span className="text-sm text-gray-500">{estimatedData.nova.reasoning}</span>
            </div>
          </div>
        )}

        {estimatedData.nutriScore && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Nutri-Score estime</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceLabel(estimatedData.nutriScore.confidence).color}`}>
                {getConfidenceLabel(estimatedData.nutriScore.confidence).label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-violet-600">Probablement {estimatedData.nutriScore.value}</span>
              <span className="text-sm text-gray-500">{estimatedData.nutriScore.reasoning}</span>
            </div>
          </div>
        )}

        {estimatedData.description && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100">
            <span className="font-medium text-gray-900 block mb-2">Description</span>
            <p className="text-sm text-gray-600">{estimatedData.description}</p>
          </div>
        )}

        {estimatedData.typicalIngredients && estimatedData.typicalIngredients.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100">
            <span className="font-medium text-gray-900 block mb-1">Ingredients typiques de cette categorie</span>
            <span className="text-xs text-orange-500 block mb-2">(pas la liste exacte du produit)</span>
            <div className="flex flex-wrap gap-2">
              {estimatedData.typicalIngredients.map((ing, idx) => (
                <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Date mise a jour */}
      {generatedAt && (
        <div className="px-4 text-xs text-gray-400 mb-2">
          Mis a jour le {new Date(generatedAt).toLocaleDateString("fr-FR")}
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{disclaimer}</p>
        </div>
        {processingTime && (
          <p className="text-xs text-gray-400 mt-2 text-right">
            Genere en {(processingTime / 1000).toFixed(1)}s
          </p>
        )}
      </div>
    </div>
  );
};

export default PremiumInsightsCard;




