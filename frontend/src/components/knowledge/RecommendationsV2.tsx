/**
 * RECOMMENDATIONS V2
 * 
 * Affichage des alternatives suggérées (remplacements)
 * Basé sur KnowledgeEngine V3.2
 * Mobile (1 reco) + Desktop (3 recos max)
 */

import React from 'react';
import { ArrowRight, TrendingUp, CheckCircle, Info } from 'lucide-react';
import { Recommendation, PriorityLevel } from '../../types/knowledge.types';

interface RecommendationsV2Props {
  recommendations: Recommendation[];
  compact?: boolean;
}

export const RecommendationsV2: React.FC<RecommendationsV2Props> = ({
  recommendations,
  compact = false
}) => {
  if (recommendations.length === 0) return null;

  // Mode compact : afficher uniquement la première recommandation
  const displayedRecos = compact ? recommendations.slice(0, 1) : recommendations.slice(0, 3);
  const hiddenCount = compact ? recommendations.length - 1 : Math.max(0, recommendations.length - 3);

  // Configuration couleurs par priorité
  const getPriorityConfig = (priority: PriorityLevel) => {
    const configs = {
      high: {
        bg: 'bg-green-50',
        border: 'border-green-400',
        text: 'text-green-900',
        badge: 'bg-green-100 text-green-700',
        icon: 'text-green-600',
        emoji: '🚀'
      },
      medium: {
        bg: 'bg-blue-50',
        border: 'border-blue-400',
        text: 'text-blue-900',
        badge: 'bg-blue-100 text-blue-700',
        icon: 'text-blue-600',
        emoji: '💡'
      },
      low: {
        bg: 'bg-neutral-50',
        border: 'border-neutral-400',
        text: 'text-neutral-900',
        badge: 'bg-neutral-100 text-neutral-700',
        icon: 'text-neutral-600',
        emoji: 'ℹ️'
      }
    };
    return configs[priority];
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h3 className="text-base font-bold text-neutral-900">
          ✨ Alternatives suggérées ({recommendations.length})
        </h3>
      </div>

      {/* Recommendations list */}
      <div className="space-y-3">
        {displayedRecos.map((reco, idx) => {
          const config = getPriorityConfig(reco.priority);
          const gainPercent = Math.round((reco.gain / reco.currentScore) * 100);

          return (
            <div
              key={idx}
              className={`${config.bg} border-2 ${config.border} rounded-lg p-4 shadow-md hover:shadow-lg transition-all`}
            >
              <div className="space-y-3">
                {/* Header avec priorité */}
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-block px-2 py-1 ${config.badge} rounded-full text-xs font-bold uppercase`}>
                    {config.emoji} {reco.priority}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border text-neutral-600">
                      {reco.currentScore}/100
                    </span>
                    <ArrowRight className={`w-4 h-4 ${config.icon}`} />
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border font-bold text-green-700">
                      {reco.suggestedScore}/100
                    </span>
                  </div>
                </div>

                {/* Remplacement */}
                <div className="bg-white border rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-neutral-500">Remplacer :</span>
                        <span className={`text-sm font-bold ${config.text}`}>{reco.replace}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-500">Par :</span>
                        <span className="text-sm font-bold text-green-700">{reco.with}</span>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </div>
                </div>

                {/* Gain */}
                <div className={`${config.badge} rounded-lg p-2 flex items-center justify-between`}>
                  <span className={`text-xs font-semibold ${config.text}`}>
                    💪 Gain de score :
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${config.text}`}>
                      +{reco.gain} points
                    </span>
                    <span className="text-xs text-neutral-600">
                      ({gainPercent > 0 ? `+${gainPercent}%` : '0%'})
                    </span>
                  </div>
                </div>

                {/* Justification */}
                <div className="bg-white border rounded-lg p-2">
                  <div className="flex items-start gap-2">
                    <Info className={`w-4 h-4 ${config.icon} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-neutral-600 mb-1">
                        Pourquoi ce changement ?
                      </p>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {reco.why}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA (uniquement si priorité high) */}
                {reco.priority === 'high' && !compact && (
                  <button className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Voir les alternatives
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Bouton "Voir plus" si caché */}
        {hiddenCount > 0 && (
          <button className="w-full p-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-medium text-green-900 transition-colors">
            Voir {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} recommandation{hiddenCount > 1 ? 's' : ''} →
          </button>
        )}
      </div>

      {/* Info pédagogique */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
        <p className="text-xs text-blue-900 leading-relaxed">
          <span className="font-semibold">💡 Astuce :</span> Ces alternatives sont basées sur 
          notre base de connaissances scientifiques. Les gains de score sont calculés selon 
          la méthodologie Ecolojia V3.2 (8 composantes pondérées).
        </p>
      </div>
    </div>
  );
};
