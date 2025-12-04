// frontend/src/components/product/ScoreBreakdown.tsx
// AFFICHE TOUJOURS LES 8 COMPOSANTES AVEC EXPLICATION DES DONNÉES MANQUANTES
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useScoreBreakdown } from '../../hooks/useScoreBreakdown';

interface ScoreBreakdownProps {
  product: any;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ product }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // ✅ CORRECTION : Prioriser ABSOLUMENT les données API enrichies
  // On vérifie si product.scores.breakdown existe et contient des données réelles
  const hasApiBreakdown = product?.scores?.breakdown && 
    Object.keys(product.scores.breakdown).length > 0;

  console.log('🔍 ScoreBreakdown Debug:', {
    hasApiBreakdown,
    apiBreakdown: product?.scores?.breakdown,
    productName: product?.product_name
  });

  // ✅ On n'utilise le hook QUE si les données API sont absentes
  const generatedBreakdown = hasApiBreakdown ? null : useScoreBreakdown(product);
  
  // ✅ Priorité 1: données API, Priorité 2: hook, Priorité 3: objet vide
  const rawBreakdown = hasApiBreakdown 
    ? product.scores.breakdown 
    : (generatedBreakdown || {});

  console.log('📊 Breakdown utilisé:', {
    source: hasApiBreakdown ? 'API (backend enrichi)' : 'Hook (frontend généré)',
    rawBreakdown
  });

  // On force la présence des 8 clés (même si null)
  const breakdown: any = {
    nova: rawBreakdown.nova || null,
    nutriScore: rawBreakdown.nutriScore || null,
    additives: rawBreakdown.additives || null,
    sugars: rawBreakdown.sugars || null,
    saturatedFat: rawBreakdown.saturatedFat || null,
    salt: rawBreakdown.salt || null,
    ecoScore: rawBreakdown.ecoScore || null,
    labels: rawBreakdown.labels || null,
  };

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

  const components = [
    {
      key: 'nova',
      title: 'Transformation (NOVA)',
      weight: '15%',
      data: breakdown.nova,
      icon: '🏭',
    },
    {
      key: 'nutriScore',
      title: 'Qualité nutritionnelle',
      weight: '20%',
      data: breakdown.nutriScore,
      icon: '🥗',
    },
    {
      key: 'additives',
      title: 'Additifs',
      weight: '15%',
      data: breakdown.additives,
      icon: '⚗️',
    },
    {
      key: 'sugars',
      title: 'Sucres',
      weight: '10%',
      data: breakdown.sugars,
      icon: '🍬',
    },
    {
      key: 'saturatedFat',
      title: 'Graisses saturées',
      weight: '10%',
      data: breakdown.saturatedFat,
      icon: '🧈',
    },
    {
      key: 'salt',
      title: 'Sel',
      weight: '10%',
      data: breakdown.salt,
      icon: '🧂',
    },
    {
      key: 'ecoScore',
      title: 'Impact environnemental',
      weight: '15%',
      data: breakdown.ecoScore,
      icon: '🌍',
    },
    {
      key: 'labels',
      title: 'Labels & Éthique',
      weight: '5%',
      data: breakdown.labels,
      icon: '🏷️',
    },
  ];

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="border-b pb-2">
        <h3 className="text-lg font-bold text-gray-900">Analyse détaillée (8 critères)</h3>
        <p className="text-sm text-gray-600">
          Chaque critère est évalué à partir des données produit et, si nécessaire, complété par l&apos;IA. Les zones grisées indiquent des données insuffisantes.
        </p>
        {/* ✅ Badge source données pour debug */}
        {hasApiBreakdown && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700">
            <span>✨</span>
            <span>Scores enrichis par le backend</span>
          </div>
        )}
      </div>

      {/* Liste des composantes */}
      <div className="space-y-3">
        {components.map((component) => {
          const rawData: any = component.data || {};
          const hasScore = typeof rawData.score === 'number';
          const score = hasScore ? rawData.score : 0;
          
          // ✅ CORRECTION : Utiliser les labels enrichis du backend en priorité
          const label = rawData.label || 
            rawData.grade || 
            (hasScore ? 'Analyse IA partielle' : 'Données insuffisantes');
          
          const description = rawData.description || 
            rawData.equivalent || 
            (hasScore
              ? "L'IA a estimé ce critère à partir d'informations partielles disponibles."
              : "L'IA manque de données fiables pour ce critère. Le score sera affiné dès que plus d'informations seront disponibles.");

          const isExpanded = expandedSections.has(component.key);

          // ✅ Log pour debug chaque composante
          console.log(`📌 ${component.key}:`, { rawData, hasScore, score, label, description });

          return (
            <div
              key={component.key}
              className={`${getScoreBgColor(hasScore ? score : null)} border rounded-lg overflow-hidden`}
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
                    {!hasScore && (
                      <div className="text-xs text-gray-500 mt-1">
                        Données incomplètes pour ce critère – affichage basé sur l'IA ou en attente de données.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Score */}
                  <div
                    className={`px-3 py-1 rounded-full text-white font-bold ${getScoreColor(hasScore ? score : null)}`}
                  >
                    {hasScore ? `${Math.round(score)}/100` : 'N/A'}
                  </div>
                  {/* Label */}
                  <div className="text-sm text-gray-700 min-w-[120px] text-right">
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
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">{description}</p>

                    {/* ✅ Afficher l'équivalent si disponible (données backend enrichies) */}
                    {rawData.equivalent && (
                      <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
                        💡 {rawData.equivalent}
                      </div>
                    )}

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreColor(hasScore ? score : null)}`}
                        style={{ width: hasScore ? `${score}%` : '0%' }}
                      />
                    </div>

                    <div className={`text-sm font-medium ${getScoreTextColor(hasScore ? score : null)}`}>
                      {hasScore ? (
                        <>
                          {score >= 70 && '✓ Excellent'}
                          {score >= 50 && score < 70 && '○ Bon'}
                          {score >= 30 && score < 50 && '⚠ Moyen'}
                          {score < 30 && '✗ À éviter'}
                        </>
                      ) : (
                        'Score non calculable de façon fiable pour ce critère.'
                      )}
                    </div>

                    {/* ✅ Afficher la confiance si disponible (données backend) */}
                    {rawData.confidence && (
                      <div className="text-xs text-gray-500">
                        Niveau de confiance: {rawData.confidence === 'high' ? '🟢 Élevé' : 
                                            rawData.confidence === 'medium' ? '🟡 Moyen' : 
                                            '🔴 Faible'}
                      </div>
                    )}
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
          <li>Sections grisées : données incomplètes, analyse IA limitée.</li>
        </ul>
      </div>
    </div>
  );
};