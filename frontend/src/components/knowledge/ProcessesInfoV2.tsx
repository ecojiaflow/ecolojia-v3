/**
 * PROCESSES INFO V2
 * 
 * Affichage des processus industriels détectés
 * Basé sur KnowledgeEngine V3.2
 * Desktop uniquement (contexte éducatif approfondi)
 */

import React, { useState } from 'react';
import { Factory, Zap, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Process, SeverityLevel } from '../../types/knowledge.types';

interface ProcessesInfoV2Props {
  processes: Process[];
}

export const ProcessesInfoV2: React.FC<ProcessesInfoV2Props> = ({ processes }) => {
  const [expanded, setExpanded] = useState(false);

  if (processes.length === 0) return null;

  // Configuration couleurs par severity
  const getSeverityConfig = (severity: SeverityLevel) => {
    const configs = {
      critical: {
        icon: AlertTriangle,
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-900',
        iconColor: 'text-red-600',
        badge: 'bg-red-100 text-red-700'
      },
      high: {
        icon: Zap,
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        text: 'text-orange-900',
        iconColor: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-700'
      },
      medium: {
        icon: Factory,
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        text: 'text-yellow-900',
        iconColor: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-700'
      },
      low: {
        icon: Info,
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-900',
        iconColor: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700'
      }
    };
    return configs[severity];
  };

  // Emoji selon severity
  const getSeverityEmoji = (severity: SeverityLevel) => {
    const emojis = {
      critical: '🔥',
      high: '⚡',
      medium: '⚙️',
      low: 'ℹ️'
    };
    return emojis[severity];
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-neutral-50 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
      >
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Factory className="w-5 h-5 text-neutral-700" />
          🏭 Processus industriels détectés ({processes.length})
        </h3>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-700" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-700" />
        )}
      </button>

      {/* Processes list */}
      {expanded && (
        <div className="space-y-3 pl-2">
          {processes.map((process, idx) => {
            const config = getSeverityConfig(process.severity);
            const Icon = config.icon;
            const emoji = getSeverityEmoji(process.severity);

            return (
              <div
                key={idx}
                className={`${config.bg} border ${config.border} rounded-lg p-4 shadow-sm`}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <h4 className={`font-bold ${config.text} text-sm`}>
                          {emoji} {process.name}
                        </h4>
                      </div>
                    </div>
                    <span className={`inline-block px-2 py-1 ${config.badge} rounded-full text-xs font-medium uppercase shrink-0`}>
                      {process.severity}
                    </span>
                  </div>

                  {/* Description */}
                  {process.description && (
                    <p className="text-sm text-neutral-700 leading-relaxed bg-white p-2 rounded border">
                      {process.description}
                    </p>
                  )}

                  {/* Ingrédients concernés */}
                  <div className="flex items-start gap-2 bg-white p-2 rounded border">
                    <span className="text-xs font-semibold text-neutral-500 shrink-0">
                      🧪 Détecté sur :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {process.detectedOn.map((ingredient, iidx) => (
                        <span
                          key={iidx}
                          className={`inline-block px-2 py-0.5 ${config.badge} rounded text-xs font-medium`}
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Impact */}
                  {process.impact && (
                    <div className="flex items-start gap-2 bg-white p-2 rounded border">
                      <span className="text-xs font-semibold text-neutral-500 shrink-0">
                        💥 Impact :
                      </span>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {process.impact}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Info pédagogique */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-xs text-blue-900 leading-relaxed">
              <span className="font-semibold">ℹ️ À savoir :</span> Les processus industriels peuvent 
              modifier la structure des aliments et réduire leurs qualités nutritionnelles naturelles. 
              Privilégier les produits peu transformés limite l'exposition à ces processus.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
