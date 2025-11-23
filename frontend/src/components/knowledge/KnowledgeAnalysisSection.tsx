// src/components/knowledge/KnowledgeAnalysisSection.tsx
import React from 'react';
import { AIEnrichmentBadge } from './AIEnrichmentBadge';
import { CriticalIssuesAlert } from './CriticalIssuesAlert';
import { Award, TrendingUp } from 'lucide-react';

interface KnowledgeAnalysisSectionProps {
  knowledgeAnalysis?: {
    criticalIssues?: any[];
    highIssues?: any[];
    moderateIssues?: any[];
    positivePoints?: Array<{ aspect: string; score: number; description: string }>;
    scoreImpact?: number;
  };
  aiEnriched?: boolean;
  knowledgeBaseUsed?: boolean;
  confidence?: number;
  deepseekUsed?: boolean;
}

export const KnowledgeAnalysisSection: React.FC<KnowledgeAnalysisSectionProps> = ({
  knowledgeAnalysis,
  aiEnriched = false,
  knowledgeBaseUsed = false,
  confidence = 0,
  deepseekUsed = false
}) => {
  // Si pas de données, ne rien afficher
  if (!knowledgeAnalysis && !aiEnriched) return null;

  const positivePoints = knowledgeAnalysis?.positivePoints || [];

  return (
    <section className="space-y-6">
      {/* Badge IA Enrichissement */}
      <AIEnrichmentBadge
        confidence={confidence}
        aiEnriched={aiEnriched}
        knowledgeBaseUsed={knowledgeBaseUsed}
        deepseekUsed={deepseekUsed}
      />

      {/* Alertes Critiques */}
      {knowledgeAnalysis && (
        <CriticalIssuesAlert
          criticalIssues={knowledgeAnalysis.criticalIssues}
          highIssues={knowledgeAnalysis.highIssues}
          moderateIssues={knowledgeAnalysis.moderateIssues}
          scoreImpact={knowledgeAnalysis.scoreImpact}
        />
      )}

      {/* Points Positifs */}
      {positivePoints.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-soft">
          <h3 className="text-sm font-bold text-green-900 flex items-center gap-2 mb-3">
            <Award className="w-4 h-4" />
            Points positifs détectés ({positivePoints.length})
          </h3>
          <div className="space-y-3">
            {positivePoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-green-200">
                <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 text-sm">{point.aspect}</h4>
                  <p className="text-sm text-neutral-700 mt-1 leading-relaxed">{point.description}</p>
                </div>
                <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded">
                  +{point.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
