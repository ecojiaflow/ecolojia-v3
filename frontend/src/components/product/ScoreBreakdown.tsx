// frontend/src/components/product/ScoreBreakdown.tsx
// AFFICHE TOUJOURS LES 8 COMPOSANTES - Version finale qui marche
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useScoreBreakdown } from '../../hooks/useScoreBreakdown';

interface ScoreBreakdownProps {
  product: any;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ product }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // CRITIQUE: Toujours générer le breakdown
  const generatedBreakdown = useScoreBreakdown(product);
  const breakdown = product?.scores?.breakdown || generatedBreakdown || {};

  // Si pas de breakdown du tout, afficher un message
  if (!breakdown || Object.keys(breakdown).length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Impossible de calculer les scores détaillés pour ce produit.</p>
      </div>
    );
  }

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'bg-gray-400';
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-700';
    if (score >= 70) return 'text-green-700';
    if (score >= 50) return 'text-yellow-700';
    if (score >= 30) return 'text-orange-700';
    return 'text-red-700';
  };

  const getScoreBgColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'bg-gray-50';
    if (score >= 70) return 'bg-green-50';
    if (score >= 50) return 'bg-yellow-50';
    if (score >= 30) return 'bg-orange-50';
    return 'bg-red-50';
  };

  // Définition des 8 composantes
  const components = [
    {
      key: 'nova',
      title: 'Transformation (NOVA)',
      weight: '15%',
      data: breakdown.nova,
      icon: '🏭'
    },
    {
      key: 'nutriScore',
      title: 'Qualité nutritionnelle',
      weight: '20%',
      data: breakdown.nutriScore,
      icon: '🥗'
    },
    {
      key: 'additives',
      title: 'Additifs',
      weight: '15%',
      data: breakdown.additives,
      icon: '⚗️'
    },
    {
      key: 'sugars',
      title: 'Sucres',
      weight: '10%',
      data: breakdown.sugars,
      icon: '🍬'
    },
    {
      key: 'saturatedFat',
      title: 'Graisses saturées',
      weight: '10%',
      data: breakdown.saturatedFat,
      icon: '🧈'
    },
    {
      key: 'salt',
      title: 'Sel',
      weight: '10%',
      data: breakdown.salt,
      icon: '🧂'
    },
    {
      key: 'ecoScore',
      title: 'Impact environnemental',
      weight: '15%',
      data: breakdown.ecoScore,
      icon: '🌍'
    },
    {
      key: 'labels',
      title: 'Labels & Éthique',
      weight: '5%',
      data: breakdown.labels,
      icon: '🏷️'
    }
  ];

  // Filtrer les composantes qui ont des données
  const validComponents = components.filter(c => c.data && c.data.score !== undefined);

  if (validComponents.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Aucune composante de score disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="border-b pb-2">
        <h3 className="text-lg font-bold text-gray-900">Analyse détaillée ({validComponents.length} critères)</h3>
        <p className="text-sm text-gray-600">Cliquez sur chaque critère pour voir le détail</p>
      </div>

      {/* Liste des composantes */}
      <div className="space-y-3">
        {validComponents.map((component) => {
          const score = component.data?.score ?? 0;
          const label = component.data?.label || 'N/A';
          const description = component.data?.description || '';
          const isExpanded = expandedSections.has(component.key);

          return (
            <div
              key={component.key}
              className={`${getScoreBgColor(score)} border rounded-lg overflow-hidden`}
            >
              {/* Header cliquable */}
              <button
                onClick={() => toggleSection(component.key)}
                className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{component.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">{component.title}</div>
                    <div className="text-sm text-gray-600">Poids: {component.weight}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Score */}
                  <div className={`px-3 py-1 rounded-full ${getScoreColor(score)} text-white font-bold`}>
                    {Math.round(score)}/100
                  </div>
                  {/* Label */}
                  <div className="text-sm text-gray-700 min-w-[100px] text-right">
                    {label}
                  </div>
                  {/* Chevron */}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Contenu détaillé (si étendu) */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t bg-white">
                  <div className="pt-3 space-y-2">
                    <p className="text-sm text-gray-700">{description}</p>
                    
                    {/* Barre de progression */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreColor(score)}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>

                    {/* Interprétation */}
                    <div className={`text-sm font-medium ${getScoreTextColor(score)}`}>
                      {score >= 70 && '✓ Excellent'}
                      {score >= 50 && score < 70 && '○ Bon'}
                      {score >= 30 && score < 50 && '⚠ Moyen'}
                      {score < 30 && '✗ À éviter'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer explicatif */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Comment lire ces scores ?</strong>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>70-100 : Excellent choix pour votre santé</li>
          <li>50-69 : Bon, acceptable au quotidien</li>
          <li>30-49 : Moyen, à consommer occasionnellement</li>
          <li>0-29 : À éviter ou limiter fortement</li>
        </ul>
      </div>
    </div>
  );
};