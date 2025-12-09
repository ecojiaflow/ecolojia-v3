// frontend/src/components/product/ScoreBreakdown.tsx
// VERSION AMÉLIORÉE V3.1 : Affiche les contributions en points au score global
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useScoreBreakdown } from '../../hooks/useScoreBreakdown';

interface ScoreBreakdownProps {
  product: any;
  generatedBreakdown?: any;
}

// 🎯 POIDS OFFICIELS ECOLOJIA V3.1 (8 composantes = 100%)
const COMPONENT_WEIGHTS = {
  nutriScore: 20,      // Qualité nutritionnelle
  additives: 15,       // Additifs
  nova: 15,            // Transformation (NOVA)
  labels: 10,          // Labels bio/équitable
  allergens: 10,       // Allergènes
  ecoScore: 10,        // Impact environnemental
  origin: 10,          // Origine
  packaging: 10        // Emballage
};

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ product, generatedBreakdown }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // ✅ Prioriser les données API enrichies
  const hasApiBreakdown = product?.scores?.breakdown &&
    Object.keys(product.scores.breakdown).length > 0;

  console.log('🔍 ScoreBreakdown Debug:', {
    hasApiBreakdown,
    apiBreakdown: product?.scores?.breakdown,
    productName: product?.name || product?.product_name
  });

  // Utiliser le hook QUE si les données API sont absentes
  const hookBreakdown = hasApiBreakdown ? null : (generatedBreakdown || useScoreBreakdown(product));

  // Priorité 1: données API, Priorité 2: hook, Priorité 3: objet vide
  const rawBreakdown = hasApiBreakdown
    ? product.scores.breakdown
    : (hookBreakdown || {});

  console.log('📊 Breakdown utilisé:', {
    source: hasApiBreakdown ? 'API (backend enrichi)' : 'Hook (frontend généré)',
    rawBreakdown
  });

  // Forcer la présence des 8 clés (même si null)
  const breakdown: any = {
    nova: rawBreakdown.nova || null,
    nutriScore: rawBreakdown.nutriScore || null,
    additives: rawBreakdown.additives || null,
    allergens: rawBreakdown.allergens || null,
    ecoScore: rawBreakdown.ecoScore || null,
    labels: rawBreakdown.labels || null,
    origin: rawBreakdown.origin || null,
    packaging: rawBreakdown.packaging || null,
  };

  // 🧮 Calculer le score global à partir des contributions
  const calculateTotalScore = () => {
    let total = 0;
    let totalWeight = 0;

    Object.entries(breakdown).forEach(([key, data]: [string, any]) => {
      const weight = COMPONENT_WEIGHTS[key as keyof typeof COMPONENT_WEIGHTS] || 0;
      const score = data?.score;
      
      if (typeof score === 'number' && !isNaN(score)) {
        total += (score * weight) / 100;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(total) : null;
  };

  const calculatedScore = calculateTotalScore();
  const displayScore = product?.scores?.overallScore ?? calculatedScore ?? 'N/A';

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

  // 🎯 Calculer la contribution en points d'une composante
  const calculateContribution = (score: number | null | undefined, weight: number) => {
    if (score === null || score === undefined || isNaN(score)) return null;
    return Math.round((score * weight) / 100 * 10) / 10; // 1 décimale
  };

  const components = [
    {
      key: 'nutriScore',
      title: 'Qualité nutritionnelle',
      weight: COMPONENT_WEIGHTS.nutriScore,
      data: breakdown.nutriScore,
      icon: '🥗',
      description: 'Évaluation basée sur Nutri-Score, sucres, graisses saturées, sel, fibres, protéines'
    },
    {
      key: 'additives',
      title: 'Additifs',
      weight: COMPONENT_WEIGHTS.additives,
      data: breakdown.additives,
      icon: '⚗️',
      description: 'Présence d\'additifs à risque (colorants, conservateurs, exhausteurs de goût)'
    },
    {
      key: 'nova',
      title: 'Transformation (NOVA)',
      weight: COMPONENT_WEIGHTS.nova,
      data: breakdown.nova,
      icon: '🏭',
      description: 'Niveau de transformation industrielle (1=Brut, 2=Transformé, 3=Très transformé, 4=Ultra-transformé)'
    },
    {
      key: 'labels',
      title: 'Labels & Éthique',
      weight: COMPONENT_WEIGHTS.labels,
      data: breakdown.labels,
      icon: '🏷️',
      description: 'Labels bio, commerce équitable, AOC, Label Rouge, etc.'
    },
    {
      key: 'allergens',
      title: 'Allergènes',
      weight: COMPONENT_WEIGHTS.allergens,
      data: breakdown.allergens,
      icon: '⚠️',
      description: 'Présence d\'allergènes majeurs (gluten, lait, œufs, fruits à coque, etc.)'
    },
    {
      key: 'ecoScore',
      title: 'Impact environnemental',
      weight: COMPONENT_WEIGHTS.ecoScore,
      data: breakdown.ecoScore,
      icon: '🌍',
      description: 'Empreinte carbone, biodiversité, emballage, origine'
    },
    {
      key: 'origin',
      title: 'Origine',
      weight: COMPONENT_WEIGHTS.origin,
      data: breakdown.origin,
      icon: '🌐',
      description: 'Provenance du produit et de ses ingrédients principaux'
    },
    {
      key: 'packaging',
      title: 'Emballage',
      weight: COMPONENT_WEIGHTS.packaging,
      data: breakdown.packaging,
      icon: '📦',
      description: 'Recyclabilité, plastique, suremballage'
    },
  ];

  return (
    <div className="space-y-4">
      {/* En-tête avec score global recalculé */}
      <div className="border-b pb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">Analyse détaillée (8 critères scientifiques)</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Score global :</span>
            <div className={`px-4 py-2 rounded-full text-white font-bold text-xl ${getScoreColor(typeof displayScore === 'number' ? displayScore : null)}`}>
              {displayScore}/100
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Chaque critère contribue au score global selon son poids scientifique. Les zones grisées indiquent des données insuffisantes.
        </p>
        
        {/* Badge source données */}
        <div className="mt-2 flex items-center gap-2">
          {hasApiBreakdown && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700">
              <span>✨</span>
              <span>Scores enrichis par le backend</span>
            </div>
          )}
          {calculatedScore !== null && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700">
              <span>🧮</span>
              <span>Score calculé : {calculatedScore}/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Liste des composantes avec contributions */}
      <div className="space-y-3">
        {components.map((component) => {
          const rawData: any = component.data || {};
          const hasScore = typeof rawData.score === 'number';
          const score = hasScore ? rawData.score : 0;
          
          // 🎯 NOUVEAU : Calculer la contribution en points
          const contribution = calculateContribution(hasScore ? score : null, component.weight);
          const maxContribution = component.weight;

          const label = rawData.label ||
            rawData.grade ||
            (hasScore ? 'Analyse IA partielle' : 'Données insuffisantes');

          const description = rawData.description ||
            rawData.equivalent ||
            component.description ||
            (hasScore
              ? "L'IA a estimé ce critère à partir d'informations partielles disponibles."
              : "L'IA manque de données fiables pour ce critère. Le score sera affiné dès que plus d'informations seront disponibles.");

          const isExpanded = expandedSections.has(component.key);

          return (
            <div
              key={component.key}
              className={`${getScoreBgColor(hasScore ? score : null)} border-2 rounded-lg overflow-hidden transition-all hover:shadow-md`}
            >
              {/* Header cliquable */}
              <button
                onClick={() => toggleSection(component.key)}
                className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{component.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900 text-base">{component.title}</div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      Poids: <span className="font-bold">{component.weight}%</span>
                      {contribution !== null && (
                        <span className="ml-2 text-primary font-bold">
                          • Contribution: {contribution}/{maxContribution} pts
                        </span>
                      )}
                    </div>
                    {!hasScore && (
                      <div className="text-xs text-gray-500 mt-1 italic">
                        Données incomplètes – score en attente
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Score avec barre de contribution */}
                  <div className="text-right">
                    <div
                      className={`px-3 py-1.5 rounded-full text-white font-bold text-lg ${getScoreColor(hasScore ? score : null)}`}
                    >
                      {hasScore ? `${Math.round(score)}/100` : 'N/A'}
                    </div>
                    {/* Barre de contribution visuelle */}
                    {contribution !== null && (
                      <div className="mt-1 w-16">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${getScoreColor(score)}`}
                            style={{ width: `${(contribution / maxContribution) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <div className="text-sm text-gray-700 min-w-[100px] text-right font-medium">
                    {label}
                  </div>
                  
                  {/* Chevron */}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Contenu détaillé (si étendu) */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t bg-white">
                  <div className="space-y-3 pt-3">
                    {/* Description */}
                    <p className="text-sm text-gray-700 leading-relaxed">{description}</p>

                    {/* Équivalent si disponible */}
                    {rawData.equivalent && (
                      <div className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                        💡 <strong>Équivalent :</strong> {rawData.equivalent}
                      </div>
                    )}

                    {/* Contribution détaillée */}
                    {contribution !== null && (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-800">
                            📊 Contribution au score global
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {contribution}/{maxContribution} pts
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          Calcul : {score}/100 × {component.weight}% = {contribution} points
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${getScoreColor(score)} transition-all duration-500`}
                            style={{ width: `${(contribution / maxContribution) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Barre de score */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Score de cette composante</span>
                        <span>{hasScore ? `${Math.round(score)}/100` : 'N/A'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getScoreColor(hasScore ? score : null)} transition-all duration-500`}
                          style={{ width: hasScore ? `${score}%` : '0%' }}
                        />
                      </div>
                    </div>

                    {/* Label de qualité */}
                    <div className={`text-sm font-medium ${getScoreTextColor(hasScore ? score : null)}`}>
                      {hasScore ? (
                        <>
                          {score >= 70 && '✓ Excellent - Aucun problème identifié'}
                          {score >= 50 && score < 70 && '○ Bon - Acceptable au quotidien'}
                          {score >= 30 && score < 50 && '⚠ Moyen - À consommer occasionnellement'}
                          {score < 30 && '✗ À éviter - Limiter fortement'}
                        </>
                      ) : (
                        'Score non calculable de façon fiable pour ce critère.'
                      )}
                    </div>

                    {/* Confiance si disponible */}
                    {rawData.confidence && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span>
                          Niveau de confiance: {rawData.confidence === 'high' ? '🟢 Élevé' :
                                              rawData.confidence === 'medium' ? '🟡 Moyen' :
                                              '🔴 Faible'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer explicatif avec méthodologie */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
          <div>
            <strong className="block mb-2">🔬 Méthodologie scientifique Ecolojia V3.1</strong>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>70-100 :</strong> Excellent choix pour votre santé et l'environnement</li>
              <li><strong>50-69 :</strong> Bon, acceptable au quotidien</li>
              <li><strong>30-49 :</strong> Moyen, à consommer occasionnellement</li>
              <li><strong>0-29 :</strong> À éviter ou limiter fortement</li>
            </ul>
            <p className="mt-2 text-xs text-blue-700">
              Le score global est calculé en pondérant chaque composante selon son importance scientifique.
              Sources : OMS, ANSES, EFSA, études peer-reviewed.
            </p>
          </div>
        </div>
      </div>

      {/* Récapitulatif des contributions */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>📊</span>
          <span>Récapitulatif des contributions au score global</span>
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {components.map((component) => {
            const rawData: any = component.data || {};
            const hasScore = typeof rawData.score === 'number';
            const score = hasScore ? rawData.score : null;
            const contribution = calculateContribution(score, component.weight);

            return (
              <div key={component.key} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded">
                <span className="text-gray-700 flex items-center gap-1">
                  <span>{component.icon}</span>
                  <span className="truncate">{component.title}</span>
                </span>
                <span className={`font-bold ${contribution !== null ? 'text-primary' : 'text-gray-400'}`}>
                  {contribution !== null ? `${contribution}/${component.weight}` : 'N/A'}
                </span>
              </div>
            );
          })}
        </div>
        {calculatedScore !== null && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between font-bold text-base">
            <span className="text-gray-900">Total calculé :</span>
            <span className={`text-xl ${getScoreTextColor(calculatedScore)}`}>
              {calculatedScore}/100
            </span>
          </div>
        )}
      </div>
    </div>
  );
};