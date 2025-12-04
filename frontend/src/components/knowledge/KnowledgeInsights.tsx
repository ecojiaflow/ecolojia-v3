/**
 * KNOWLEDGE INSIGHTS - CONTAINER PRINCIPAL V3.2
 * 
 * Orchestration complète de tous les composants KnowledgeEngine
 * Mobile responsive + Desktop dashboard
 */

import React, { useState, useEffect } from 'react';
import { Loader2, Brain, AlertCircle } from 'lucide-react';
import { KnowledgeData } from '../../types/knowledge.types';
import { 
  AIEnrichmentBadge,
  RedFlagAlertV2, 
  IssuesBannerV2, 
  ProcessesInfoV2, 
  RecommendationsV2 
} from './index';

interface KnowledgeInsightsProps {
  productId: string;
  categoryType?: 'food' | 'cosmetic' | 'detergent';
  compact?: boolean; // Mode mobile compact
}

export const KnowledgeInsights: React.FC<KnowledgeInsightsProps> = ({
  productId,
  categoryType = 'food',
  compact = false
}) => {
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Détection desktop/mobile
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Fetch knowledge data
  useEffect(() => {
    const fetchKnowledgeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/products/${productId}/knowledge`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setKnowledgeData(data.data);
        } else {
          throw new Error(data.message || 'Données manquantes');
        }

      } catch (err) {
        console.error('❌ Erreur fetch knowledge:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchKnowledgeData();
    }
  }, [productId]);

  // État loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
        <span className="ml-2 text-sm text-neutral-600">
          Analyse scientifique en cours...
        </span>
      </div>
    );
  }

  // État erreur
  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Erreur de chargement
            </p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Pas de données
  if (!knowledgeData) {
    return null;
  }

  // Extraire les données
  const { redFlags, issues, processes, recommendations, confidence, scientificBasis } = knowledgeData;

  // Si aucune donnée pertinente
  const hasContent = 
    redFlags.length > 0 || 
    issues.length > 0 || 
    processes.length > 0 || 
    recommendations.length > 0;

  if (!hasContent) {
    return (
      <div className="bg-neutral-50 border border-neutral-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Analyse scientifique disponible
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Aucun point d'attention particulier détecté pour ce produit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // RENDU PRINCIPAL
  return (
    <div className="space-y-4">
      {/* Header avec badge confiance */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-bold text-neutral-900">
            Analyse scientifique
          </h2>
        </div>
        <AIEnrichmentBadge 
          confidence={confidence}
          scientificBasis={scientificBasis}
        />
      </div>

      {/* MOBILE : Compact mode */}
      {(compact || !isDesktop) && (
        <div className="space-y-4">
          {/* Red Flags (compact: 1 seul affiché) */}
          {redFlags.length > 0 && (
            <RedFlagAlertV2 
              redFlags={redFlags} 
              compact={true}
            />
          )}

          {/* Recommendations (compact: 1 seule affichée) */}
          {recommendations.length > 0 && (
            <RecommendationsV2 
              recommendations={recommendations}
              compact={true}
            />
          )}

          {/* Message desktop-only features */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              💡 <span className="font-semibold">Analyse complète disponible sur desktop</span> 
              {' '}(problèmes détaillés, processus industriels, et plus)
            </p>
          </div>
        </div>
      )}

      {/* DESKTOP : Mode complet */}
      {!compact && isDesktop && (
        <div className="space-y-4">
          {/* Red Flags (extended: tous affichés) */}
          {redFlags.length > 0 && (
            <RedFlagAlertV2 
              redFlags={redFlags} 
              compact={false}
            />
          )}

          {/* Issues Banner (desktop only) */}
          {issues.length > 0 && (
            <IssuesBannerV2 issues={issues} />
          )}

          {/* Processes Info (desktop only) */}
          {processes.length > 0 && (
            <ProcessesInfoV2 processes={processes} />
          )}

          {/* Recommendations (extended: 3 affichées) */}
          {recommendations.length > 0 && (
            <RecommendationsV2 
              recommendations={recommendations}
              compact={false}
            />
          )}
        </div>
      )}

      {/* Footer pédagogique */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mt-4">
        <p className="text-xs text-primary-900 leading-relaxed">
          <span className="font-semibold">🔬 Méthodologie :</span> Cette analyse est basée sur 
          {scientificBasis?.sources?.length > 0 
            ? ` ${scientificBasis.sources.length} source${scientificBasis.sources.length > 1 ? 's' : ''} scientifique${scientificBasis.sources.length > 1 ? 's' : ''} (${scientificBasis.sources.slice(0, 2).join(', ')}${scientificBasis.sources.length > 2 ? '...' : ''})` 
            : ' notre base de connaissances scientifiques'
          } et notre moteur d'analyse V3.2.
        </p>
      </div>
    </div>
  );
};
