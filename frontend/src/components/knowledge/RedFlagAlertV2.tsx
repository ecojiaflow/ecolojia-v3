/**
 * RED FLAG ALERT V2
 * 
 * Affichage prioritaire des alertes critiques (red flags)
 * Basé sur KnowledgeEngine V3.2
 */

import React, { useState } from 'react';
import { AlertTriangle, XCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { RedFlag } from '../../types/knowledge.types';

interface RedFlagAlertV2Props {
  redFlags: RedFlag[];
  compact?: boolean;
}

export const RedFlagAlertV2: React.FC<RedFlagAlertV2Props> = ({
  redFlags,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(true);

  if (redFlags.length === 0) return null;

  // Mode compact : afficher uniquement le premier red flag
  const displayedFlags = compact ? redFlags.slice(0, 1) : redFlags;
  const hiddenCount = compact ? redFlags.length - 1 : 0;

  // Couleur selon severity
  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return {
      bg: 'bg-red-50',
      border: 'border-red-600',
      text: 'text-red-900',
      icon: 'text-red-600',
      badge: 'bg-red-100 text-red-700'
    };
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-500',
      text: 'text-orange-900',
      icon: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-700'
    };
  };

  // Parser sources (format: "Source1 | Source2 | Source3")
  const parseSources = (sourceString: string) => {
    return sourceString.split('|').map(s => s.trim()).filter(Boolean);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-red-50 border-2 border-red-600 rounded-lg hover:bg-red-100 transition-colors shadow-md"
      >
        <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          🚨 Alerte Critique ({redFlags.length})
        </h3>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-red-700" />
        ) : (
          <ChevronDown className="w-5 h-5 text-red-700" />
        )}
      </button>

      {/* Red flags */}
      {expanded && (
        <div className="space-y-3">
          {displayedFlags.map((flag, idx) => {
            const colors = getSeverityColor(flag.severity);
            const sources = parseSources(flag.source);

            return (
              <div
                key={idx}
                className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 shadow-md`}
              >
                <div className="flex items-start gap-3">
                  {/* Icône */}
                  <AlertTriangle className={`w-6 h-6 ${colors.icon} flex-shrink-0 mt-0.5`} />

                  {/* Contenu */}
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <h4 className={`font-bold ${colors.text} text-sm`}>
                        {flag.name}
                      </h4>
                      <span className={`text-xs font-mono px-2 py-1 rounded ${colors.badge}`}>
                        {flag.score}/100
                      </span>
                    </div>

                    {/* Catégorie */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 bg-white rounded text-xs font-semibold ${colors.text} border`}>
                        {flag.category}
                      </span>
                      <span className={`inline-block px-2 py-1 ${colors.badge} rounded-full text-xs font-medium uppercase`}>
                        {flag.severity}
                      </span>
                    </div>

                    {/* Impact */}
                    {flag.impact && (
                      <p className="text-sm text-neutral-700 leading-relaxed bg-white p-2 rounded border">
                        {flag.impact}
                      </p>
                    )}

                    {/* Sources scientifiques */}
                    {sources.length > 0 && (
                      <div className="pt-2 border-t border-red-200">
                        <p className="text-xs font-semibold text-neutral-600 mb-2">
                          📚 Sources scientifiques :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {sources.map((source, sidx) => (
                            <span
                              key={sidx}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-neutral-700 border hover:border-red-400 transition-colors"
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bouton "Voir plus" en mode compact */}
          {compact && hiddenCount > 0 && (
            <button className="w-full p-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium text-red-900 transition-colors">
              Voir {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} red flag{hiddenCount > 1 ? 's' : ''} →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
