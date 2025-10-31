import React from 'react';
import { X, TrendingUp, TrendingDown, Info, Sparkles, CheckCircle } from 'lucide-react';

interface EnrichmentData {
  before: {
    score: number;
    confidence: number;
    dataCompleteness: string;
  };
  after: {
    score: number;
    confidence: number;
    dataCompleteness: string;
  };
  delta: {
    overall: number;
    health: number;
    confidence: number;
  };
  enrichedFields: Array<{
    field: string;
    value: number;
    unit: string;
    label: string;
  }>;
  impactedComponents: Array<{
    component: string;
    before: number;
    after: number;
    delta: number;
    label: string;
  }>;
  message: string;
}

interface EnrichmentResultProps {
  enrichmentData: EnrichmentData;
  productName: string;
  onClose: () => void;
}

export const EnrichmentResult: React.FC<EnrichmentResultProps> = ({
  enrichmentData,
  productName,
  onClose
}) => {
  const { before, after, delta, enrichedFields, impactedComponents, message } = enrichmentData;

  // Fonction pour obtenir la couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-50';
    if (score >= 50) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-green-600';
    if (delta < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (delta < 0) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Enrichissement IA Terminé
              </h2>
            </div>
            <p className="text-sm text-gray-600">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-colors rounded-lg hover:bg-emerald-100"
            aria-label="Fermer"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message pédagogique */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-900">{message}</p>
          </div>

          {/* Comparaison scores */}
          <div className="grid grid-cols-2 gap-4">
            {/* Score AVANT */}
            <div className={`p-4 rounded-lg border-2 ${getScoreBgColor(before.score)}`}>
              <div className="text-sm font-medium text-gray-600 mb-2">Avant enrichissement</div>
              <div className={`text-4xl font-bold ${getScoreColor(before.score)} mb-2`}>
                {before.score}
                <span className="text-xl text-gray-500">/100</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Confiance : {Math.round(before.confidence * 100)}%</div>
                <div>Complétude : {before.dataCompleteness}</div>
              </div>
            </div>

            {/* Score APRÈS */}
            <div className={`p-4 rounded-lg border-2 border-emerald-300 ${getScoreBgColor(after.score)} relative`}>
              <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                Nouveau
              </div>
              <div className="text-sm font-medium text-gray-600 mb-2">Après enrichissement</div>
              <div className={`text-4xl font-bold ${getScoreColor(after.score)} mb-2`}>
                {after.score}
                <span className="text-xl text-gray-500">/100</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Confiance : {Math.round(after.confidence * 100)}%</div>
                <div>Complétude : {after.dataCompleteness}</div>
              </div>
            </div>
          </div>

          {/* Delta */}
          {delta.overall !== 0 && (
            <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
              {getDeltaIcon(delta.overall)}
              <span className={`text-lg font-bold ${getDeltaColor(delta.overall)}`}>
                {delta.overall > 0 ? '+' : ''}{delta.overall} points
              </span>
              <span className="text-sm text-gray-600">
                ({delta.overall > 0 ? 'Amélioration' : 'Révision à la baisse'})
              </span>
            </div>
          )}

          {/* Champs enrichis par IA */}
          {enrichedFields.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Données ajoutées par l'IA
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {enrichedFields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-600 truncate">
                        {field.label}
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {field.value}{field.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Composantes impactées */}
          {impactedComponents.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Impact sur les composantes du score
              </h3>
              <div className="space-y-2">
                {impactedComponents.map((comp, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getDeltaIcon(comp.delta)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {comp.label}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{comp.before}/100</span>
                        <span>→</span>
                        <span className={getScoreColor(comp.after)}>{comp.after}/100</span>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${getDeltaColor(comp.delta)}`}>
                      {comp.delta > 0 ? '+' : ''}{comp.delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-gray-500">
              Les données ont été estimées scientifiquement par notre IA
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
