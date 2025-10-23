// frontend/src/components/product/ScoreBreakdown.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface ScoreBreakdownProps {
  product: any;
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ product }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const scores = product.scores;
  
  if (!scores || !scores.breakdown) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Scores en cours de calcul...</p>
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

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-400';
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 70) return 'text-green-700';
    if (score >= 50) return 'text-yellow-700';
    if (score >= 30) return 'text-orange-700';
    return 'text-red-700';
  };

  const getScoreBgColor = (score: number | null) => {
    if (score === null) return 'bg-gray-50';
    if (score >= 70) return 'bg-green-50';
    if (score >= 50) return 'bg-yellow-50';
    if (score >= 30) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getScoreBorderColor = (score: number | null) => {
    if (score === null) return 'border-gray-200';
    if (score >= 70) return 'border-green-200';
    if (score >= 50) return 'border-yellow-200';
    if (score >= 30) return 'border-orange-200';
    return 'border-red-200';
  };

  const breakdown = scores.breakdown;

  // Filtrer composantes selon catÃ©gorie produit
  const getRelevantComponents = (category: string, allComponents: any[]) => {
    if (category === 'cosmetics') {
      return allComponents.filter(c => 
        ['ecoScore', 'additives', 'labels'].includes(c.key)
      );
    }
    
    if (category === 'detergents') {
      return allComponents.filter(c => 
        ['ecoScore', 'labels'].includes(c.key)
      );
    }
    
    return allComponents;
  };

  const components = [
    {
      key: 'nova',
      title: 'Transformation (NOVA)',
      weight: '15%',
      data: breakdown.nova,
      icon: 'ðŸ­'
    },
    {
      key: 'nutriScore',
      title: 'QualitÃ© nutritionnelle',
      weight: '20%',
      data: breakdown.nutriScore,
      icon: 'ðŸ¥—'
    },
    {
      key: 'additives',
      title: 'Additifs',
      weight: '15%',
      data: breakdown.additives,
      icon: 'âš—ï¸'
    },
    {
      key: 'sugars',
      title: 'Sucres',
      weight: '10%',
      data: breakdown.sugars,
      icon: 'ðŸ¬'
    },
    {
      key: 'saturatedFat',
      title: 'Graisses saturÃ©es',
      weight: '10%',
      data: breakdown.saturatedFat,
      icon: 'ðŸ§ˆ'
    },
    {
      key: 'salt',
      title: 'Sel',
      weight: '10%',
      data: breakdown.salt,
      icon: 'ðŸ§‚'
    },
    {
      key: 'ecoScore',
      title: 'Impact environnemental',
      weight: '15%',
      data: breakdown.ecoScore,
      icon: 'ðŸŒ'
    },
    {
      key: 'labels',
      title: 'Labels & Ã©thique',
      weight: '5%',
      data: breakdown.labels,
      icon: 'ðŸ·ï¸'
    }
  ];

  const filteredComponents = getRelevantComponents(product.category || 'food', components);

  return (
    <div className="space-y-6">
      {/* En-tÃªte avec score global */}
      <div className={`${getScoreBgColor(scores.overallScore)} ${getScoreBorderColor(scores.overallScore)} border rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Analyse dÃ©taillÃ©e du score</h3>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              Confiance : {Math.round(scores.confidence * 100)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreTextColor(scores.overallScore)}`}>
              {scores.overallScore}
            </div>
            <div className="text-sm text-gray-600 mt-1">Score global</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreTextColor(scores.healthScore || 50)}`}>
              {scores.healthScore || 50}
            </div>
            <div className="text-sm text-gray-600 mt-1">SantÃ©</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreTextColor(scores.environmentScore || 50)}`}>
              {scores.environmentScore || 50}
            </div>
            <div className="text-sm text-gray-600 mt-1">Environnement</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-700">
          <strong>ComplÃ©tude des donnÃ©es :</strong> {scores.dataCompleteness || 'Partielle'}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Information importante :</strong> Ces scores sont informatifs et basÃ©s sur des 
            mÃ©thodologies scientifiques (OMS, ANSES, EFSA). Ils ne remplacent pas l'avis d'un 
            professionnel de SantÃ©.
          </div>
        </div>
      </div>

      {/* Liste des 8 composantes */}
      <div className="space-y-3">
        <h4 className="font-semibold text-lg text-gray-900">
          DÃ©tail des 8 composantes (mÃ©thodologie ECOLOJIA V3)
        </h4>

        {filteredComponents.map((component) => {
          const isExpanded = expandedSections.has(component.key);
          const score = component.data?.score ?? null;
          const hasScore = score !== null && score !== undefined;

          return (
            <div
              key={component.key}
              className={`${getScoreBgColor(score)} ${getScoreBorderColor(score)} border rounded-lg overflow-hidden transition-all`}
            >
              {/* Header clickable */}
              <button
                onClick={() => toggleSection(component.key)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{component.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {component.title}
                      {!hasScore && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          âš ï¸ DonnÃ©es manquantes
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {component.data?.label || 'Non spÃ©cifiÃ©'} â€¢ Poids : {component.weight}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${getScoreTextColor(score)}`}>
                    {hasScore ? score : "N/A"}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Barre de progression */}
              <div className="px-4 pb-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getScoreColor(score)} h-2 rounded-full transition-all duration-500`}
                    style={{ width: hasScore ? `${score}%` : "0%" }}
                  />
                </div>
              </div>

              {/* Contenu expandable */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-200 bg-white/30 pt-3">
                  {/* Explication */}
                  {component.data?.explanation && (
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        ðŸ’¬ Explication
                      </div>
                      <div className="text-sm text-gray-600">
                        {component.data.explanation}
                      </div>
                    </div>
                  )}

                  {/* Recommandation */}
                  {component.data?.recommendation && (
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        ðŸ’¡ Recommandation
                      </div>
                      <div className="text-sm text-gray-600">
                        {component.data.recommendation}
                      </div>
                    </div>
                  )}

                  {/* Valeur (pour sucres, graisses, sel) */}
                  {component.data?.value !== undefined && component.data?.value !== null && (
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        ðŸ“Š Valeur mesurÃ©e
                      </div>
                      <div className="text-sm text-gray-600">
                        {component.data.value} {component.data.unit}
                        {component.data.equivalent && (
                          <span className="ml-2 text-gray-500">
                            (â‰ˆ {component.data.equivalent})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contribution au score global */}
                  {component.data?.weight && hasScore && (
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        ðŸ§® Contribution au score global
                      </div>
                      <div className="text-sm text-gray-600">
                        {score} points Ã— {(component.data.weight * 100).toFixed(0)}% = {' '}
                        <strong className={getScoreTextColor(score)}>
                          {(score * component.data.weight).toFixed(2)} points
                        </strong>
                      </div>
                    </div>
                  )}                  {/* Liste complÃ¨te des additifs */}
                  {component.key === 'additives' && product.foodData?.additives && product.foodData.additives.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        ðŸ“‹ DÃ©tail des additifs dÃ©tectÃ©s
                      </div>
                      <div className="space-y-2">
                        {product.foodData.additives.map((additive: any, idx: number) => {
                          const getRiskColor = (risk: string) => {
                            if (risk === 'HIGH') return 'bg-red-50 border-red-200 text-red-800';
                            if (risk === 'MEDIUM') return 'bg-orange-50 border-orange-200 text-orange-800';
                            return 'bg-green-50 border-green-200 text-green-800';
                          };
                          const getRiskLabel = (risk: string) => {
                            if (risk === 'HIGH') return 'ðŸ”´ Risque Ã©levÃ©';
                            if (risk === 'MEDIUM') return 'ðŸŸ  Risque modÃ©rÃ©';
                            return 'ðŸŸ¢ Risque faible';
                          };
                          return (
                            <div key={idx} className={`border rounded px-3 py-2 ${getRiskColor(additive.riskLevel || 'LOW')}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{additive.code || additive.tag}</span>
                                <span className="text-xs">{getRiskLabel(additive.riskLevel || 'LOW')}</span>
                              </div>
                              {additive.name && additive.name !== additive.code?.toLowerCase() && (
                                <div className="text-xs mt-1 opacity-75">{additive.name}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                  {/* Additifs dangereux */}
                  {component.key === 'additives' && component.data?.dangerous?.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-red-700 mb-1">
                        âš ï¸ Additifs Ã  risque dÃ©tectÃ©s
                      </div>
                      <div className="space-y-1">
                        {component.data.dangerous.map((additive: any, idx: number) => (
                          <div key={idx} className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                            {additive.code} - Risque Ã©levÃ©
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source scientifique */}
                  {component.data?.source && (
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                      <strong>Source :</strong> {component.data.source}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* mÃ©thodologie */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          mÃ©thodologie scientifique
        </h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>â€¢ <strong>8 composantes</strong> pondÃ©rÃ©es selon leur impact SantÃ©/environnement</p>
          <p>â€¢ <strong>Sources officielles</strong> : OMS, ANSES, EFSA, ADEME, SantÃ© Publique France</p>
          <p>â€¢ <strong>Version 3.0.0</strong> - CalculÃ© le {new Date(scores.calculatedAt || Date.now()).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* Disclaimer final */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-sm text-yellow-800">
          <strong>âš ï¸ Rappel lÃ©gal :</strong> ECOLOJIA n'est pas un dispositif mÃ©dical. Pour un suivi 
          nutritionnel personnalisÃ© ou en cas de pathologie (diabÃ¨te, allergies, etc.), consultez un 
          professionnel de SantÃ© diplÃ´mÃ© (mÃ©decin, nutritionniste, diÃ©tÃ©ticien).
        </div>
      </div>
    </div>
  );
};

export { ScoreBreakdown };