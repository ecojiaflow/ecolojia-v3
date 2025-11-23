// src/components/knowledge/AIEnrichmentBadge.tsx
import React from 'react';
import { Sparkles, Database, Brain } from 'lucide-react';

interface AIEnrichmentBadgeProps {
  confidence: number;
  aiEnriched: boolean;
  knowledgeBaseUsed: boolean;
  deepseekUsed?: boolean;
}

export const AIEnrichmentBadge: React.FC<AIEnrichmentBadgeProps> = ({
  confidence,
  aiEnriched,
  knowledgeBaseUsed,
  deepseekUsed = false
}) => {
  if (!aiEnriched || !knowledgeBaseUsed) return null;

  // Logique couleur confiance (charte Ecolojia)
  const getConfidenceStyle = (conf: number) => {
    if (conf >= 90) return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-700'
    };
    if (conf >= 75) return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-700'
    };
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-700'
    };
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 90) return 'Très haute';
    if (conf >= 75) return 'Haute';
    return 'Moyenne';
  };

  const style = getConfidenceStyle(confidence);

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4 shadow-soft transition-all duration-300`}>
      <div className="flex items-start gap-3">
        {/* Icône principale */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-eco">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${style.text} flex items-center gap-2`}>
            <span>✨ Enrichi par IA scientifique</span>
          </h4>
          
          <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
            Analyse combinant notre base de connaissances scientifiques et intelligence artificielle
          </p>

          {/* Méthodes utilisées */}
          <div className="flex flex-wrap gap-2 mt-3">
            {knowledgeBaseUsed && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full text-xs font-medium text-forest border border-nature-300">
                <Database className="w-3 h-3" />
                Base scientifique
              </span>
            )}
            {deepseekUsed && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full text-xs font-medium text-forest border border-nature-300">
                <Brain className="w-3 h-3" />
                IA contextuelle
              </span>
            )}
          </div>
        </div>

        {/* Badge confiance */}
        <div className="flex-shrink-0">
          <div className={`${style.badge} px-3 py-1.5 rounded-full text-xs font-bold`}>
            {confidence}%
          </div>
          <p className="text-xs text-neutral-500 mt-1 text-center">
            {getConfidenceLabel(confidence)}
          </p>
        </div>
      </div>
    </div>
  );
};
