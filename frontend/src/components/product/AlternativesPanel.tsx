// ═══════════════════════════════════════════════════════════════════
// ECOLOJIA V3.2 - COMPOSANT AlternativesPanel
// ═══════════════════════════════════════════════════════════════════
// 
// OBJECTIF : Afficher alternatives intelligentes (cascade DB→IA)
// USAGE : <AlternativesPanel productId={productId} />
//
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { Link } from 'react-router-dom';
import { useAlternatives } from '../../hooks/useAlternatives';
import type { Alternative } from '../../hooks/useAlternatives';
import LoadingSpinner from '../common/LoadingSpinner';
import { getScoreColor } from '@/utils/scoreColors';

// ═══════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════

interface AlternativesPanelProps {
  productId: string | null | undefined;
  productName?: string;
  currentScore?: number;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION COULEURS PAR SOURCE
// ═══════════════════════════════════════════════════════════════════

const SOURCE_CONFIG = {
  db_strict: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-700',
    icon: '✅',
    label: 'Base de données (strict)',
    description: 'Alternatives trouvées avec critères stricts'
  },
  db_relaxed: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-700',
    icon: '🔍',
    label: 'Base de données (élargi)',
    description: 'Alternatives trouvées avec critères élargis'
  },
  ai: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    icon: '✨',
    label: 'Intelligence Artificielle',
    description: 'Suggestions générées par IA'
  },
  none: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-600',
    icon: '⚠️',
    label: 'Aucune alternative',
    description: 'Pas d\'alternative disponible actuellement'
  }
} as const;

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export function AlternativesPanel({
  productId,
  productName,
  currentScore,
  className = ''
}: AlternativesPanelProps) {
  
  // ───────────────────────────────────────────────────────────────
  // HOOK : Fetch alternatives
  // ───────────────────────────────────────────────────────────────
  
  const {
    alternatives,
    loading,
    error,
    source,
    metrics,
    originalProduct,
    hasAlternatives,
    refetch
  } = useAlternatives({
    productId,
    enabled: !!productId
  });

  // ───────────────────────────────────────────────────────────────
  // ÉTAT : Loading
  // ───────────────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            🔍 Recherche d'alternatives...
          </h2>
        </div>
        
        {/* Skeleton Loading */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-24 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // ÉTAT : Error
  // ───────────────────────────────────────────────────────────────
  
  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Erreur lors du chargement des alternatives
              </h3>
              <p className="mt-2 text-sm text-red-700">
                {error.message || 'Une erreur est survenue'}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // ÉTAT : Pas de productId
  // ───────────────────────────────────────────────────────────────
  
  if (!productId) {
    return null;
  }

  // ───────────────────────────────────────────────────────────────
  // CONFIG SOURCE
  // ───────────────────────────────────────────────────────────────
  
  const sourceConfig = source ? SOURCE_CONFIG[source] : SOURCE_CONFIG.none;

  // ───────────────────────────────────────────────────────────────
  // RENDER : Panel complet
  // ───────────────────────────────────────────────────────────────
  
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      
      {/* ─────────────────────────────────────────────────────── */}
      {/* HEADER : Titre + Source Badge */}
      {/* ─────────────────────────────────────────────────────── */}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-800">
            🎯 Alternatives Plus Saines
          </h2>
          
          {hasAlternatives && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {alternatives.length}
            </span>
          )}
        </div>

        {/* Source Badge */}
        {source && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${sourceConfig.bg} ${sourceConfig.border}`}>
            <span className="text-lg">{sourceConfig.icon}</span>
            <div className="flex flex-col">
              <span className={`text-xs font-medium ${sourceConfig.text}`}>
                {sourceConfig.label}
              </span>
              {metrics && (
                <span className="text-xs text-gray-500">
                  {metrics.duration}ms
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* LISTE ALTERNATIVES (ou Empty State) */}
      {/* ─────────────────────────────────────────────────────── */}
      
      {hasAlternatives ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alternatives.map((alternative, index) => (
            <AlternativeCard
              key={alternative._id || index}
              alternative={alternative}
              currentScore={currentScore}
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          sourceConfig={sourceConfig}
          productName={productName}
        />
      )}

      {/* ─────────────────────────────────────────────────────── */}
      {/* FOOTER : Métriques (si disponibles) */}
      {/* ─────────────────────────────────────────────────────── */}
      
      {metrics && hasAlternatives && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-medium">Recherche DB:</span>
              <span>{metrics.dbHits} requêtes</span>
            </div>
            
            {metrics.aiHits > 0 && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Suggestions IA:</span>
                <span>{metrics.aiHits}</span>
              </div>
            )}
            
            {metrics.cached && (
              <div className="flex items-center gap-1">
                <span className="text-green-600">✓ Résultat en cache</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SOUS-COMPOSANT : AlternativeCard
// ═══════════════════════════════════════════════════════════════════

interface AlternativeCardProps {
  alternative: Alternative;
  currentScore?: number;
}

function AlternativeCard({ 
  alternative, 
  currentScore
}: AlternativeCardProps) {
  
  const altScore = alternative.scores?.overallScore || 0;
  const scoreDiff = currentScore ? altScore - currentScore : 0;

  return (
    <Link
      to={`/product/${alternative._id}`}
      className="block p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
    >
      
      {/* ─────────────────────────────────────────────────────── */}
      {/* HEADER : Nom + Score */}
      {/* ─────────────────────────────────────────────────────── */}
      
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {alternative.name}
          </h3>
          
          {alternative.brand && (
            <p className="text-sm text-gray-500 mt-1">
              {alternative.brand}
            </p>
          )}
        </div>

        {/* Score Badge */}
        <div className="flex flex-col items-end gap-1">
          <span className={`text-lg font-bold ${getScoreColor(altScore)}`}>
            {altScore}
          </span>
          
          {scoreDiff > 0 && (
            <span className="text-xs font-medium text-green-600">
              +{scoreDiff}
            </span>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* IMPROVEMENTS (si présentes) */}
      {/* ─────────────────────────────────────────────────────── */}
      
      {alternative.improvements && alternative.improvements.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {alternative.improvements.slice(0, 2).map((improvement, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md"
            >
              <span>✨</span>
              <span className="line-clamp-1">{improvement}</span>
            </span>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────── */}
      {/* LABELS (si présents) */}
      {/* ─────────────────────────────────────────────────────── */}
      
      {alternative.labels && alternative.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {alternative.labels.slice(0, 3).map((label, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────── */}
      {/* MATCH SCORE (si présent) */}
      {/* ─────────────────────────────────────────────────────── */}
      
      {alternative.matchScore !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Pertinence :</span>
            <span className="font-medium text-gray-700">
              {alternative.matchScore}/100
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SOUS-COMPOSANT : EmptyState
// ═══════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  sourceConfig: typeof SOURCE_CONFIG[keyof typeof SOURCE_CONFIG];
  productName?: string;
}

function EmptyState({ sourceConfig, productName }: EmptyStateProps) {
  return (
    <div className={`${sourceConfig.bg} border ${sourceConfig.border} rounded-lg p-6 text-center`}>
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl">{sourceConfig.icon}</span>
        
        <div>
          <h3 className={`font-medium ${sourceConfig.text} mb-1`}>
            {sourceConfig.label}
          </h3>
          <p className="text-sm text-gray-600">
            {sourceConfig.description}
          </p>
        </div>

        {productName && (
          <p className="text-xs text-gray-500 mt-2">
            Aucune alternative trouvée pour <span className="font-medium">{productName}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export default AlternativesPanel;