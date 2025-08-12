// frontend/ecolojiaFrontV3/src/components/analysis/CosmeticAnalysisDisplay.tsx
import React from 'react';
import { AlertTriangle, Shield, Leaf, Star, ExternalLink, Droplets } from 'lucide-react';

interface CosmeticAnalysisDisplayProps {
  analysis: any;
  productName: string;
}

export const CosmeticAnalysisDisplay: React.FC<CosmeticAnalysisDisplayProps> = ({
  analysis,
  productName
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 65) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getEndocrineRiskColor = (level: string) => {
    switch (level) {
      case 'NONE': return 'text-green-600 bg-green-50';
      case 'LOW': return 'text-blue-600 bg-blue-50';
      case 'MODERATE': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'VERY_HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="cosmetic-analysis space-y-6">
      {/* Score principal */}
      <div className={`p-6 rounded-xl border-2 ${getScoreColor(analysis.healthScore)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Score Santé Cosmétique</h2>
            <p className="text-sm opacity-75">Analyse basée sur la composition INCI</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{analysis.healthScore}/100</div>
            <div className="text-sm font-medium">{analysis.category}</div>
          </div>
        </div>
      </div>

      {/* Perturbateurs endocriniens */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${getEndocrineRiskColor(analysis.endocrineRisk?.level || 'NONE')}`}>
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              Perturbateurs Endocriniens
            </h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEndocrineRiskColor(analysis.endocrineRisk?.level || 'NONE')}`}>
              Risque : {analysis.endocrineRisk?.level === 'NONE' ? 'Aucun' : 
                        analysis.endocrineRisk?.level === 'LOW' ? 'Faible' :
                        analysis.endocrineRisk?.level === 'MODERATE' ? 'Modéré' :
                        analysis.endocrineRisk?.level === 'HIGH' ? 'Ãƒâ€°levé' : 'Très élevé'}
            </div>
            
            {analysis.endocrineRisk?.disruptors?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Substances détectées :</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.endocrineRisk.disruptors.map((disruptor: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                      {disruptor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.endocrineRisk?.affected_systems?.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-gray-800 mb-1">Systèmes potentiellement affectés :</h4>
                <p className="text-sm text-gray-600">
                  {analysis.endocrineRisk.affected_systems.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Allergènes */}
      {analysis.allergens?.count > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-full bg-orange-50 text-orange-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Allergènes Déclarés ({analysis.allergens.count})
              </h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                analysis.allergens.severity === 'LOW' ? 'bg-green-50 text-green-600' :
                analysis.allergens.severity === 'MODERATE' ? 'bg-yellow-50 text-yellow-600' :
                'bg-red-50 text-red-600'
              }`}>
                Risque allergique : {analysis.allergens.severity === 'LOW' ? 'Faible' :
                                   analysis.allergens.severity === 'MODERATE' ? 'Modéré' : 'Ãƒâ€°levé'}
              </div>
              
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {analysis.allergens.list?.map((allergen: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-3">
                Ã°Å¸â€™Â¡ Testez le produit sur une petite zone avant utilisation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Naturalité */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${analysis.naturalness?.score >= 7 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
            <Leaf className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              Naturalité & Composition
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-green-600">{analysis.naturalness?.score || 0}/10</div>
                <div className="text-sm text-gray-600">Score naturalité</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{analysis.naturalness?.syntheticRatio || 0}%</div>
                <div className="text-sm text-gray-600">Ingrédients synthétiques</div>
              </div>
            </div>

            {analysis.naturalness?.bioIngredients > 0 && (
              <div className="flex items-center space-x-2 text-green-600">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {analysis.naturalness.bioIngredients} ingrédient(s) bio détecté(s)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">
          Ã°Å¸â€™Â¡ Nos Recommandations
        </h3>
        <ul className="space-y-2">
          {analysis.recommendations?.map((rec: string, index: number) => (
            <li key={index} className="flex items-start space-x-2 text-blue-700">
              <span className="text-blue-500 mt-0.5">â€Â¢</span>
              <span className="text-sm">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Alternatives */}
      {analysis.alternatives?.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Alternatives Plus Saines
          </h3>
          
          <div className="space-y-4">
            {analysis.alternatives.map((alt: any, index: number) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-800">{alt.name}</h4>
                    <p className="text-sm text-gray-600">{alt.brand}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{alt.score}/100</div>
                    <div className="text-xs text-gray-500">+{alt.score - analysis.healthScore} points</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {alt.benefits?.map((benefit: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      âÅ“â€œ {benefit}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources scientifiques */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2 flex items-center">
          <ExternalLink className="w-4 h-4 mr-2" />
          Sources Scientifiques
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>â€Â¢ Commission Européenne - Liste perturbateurs endocriniens 2024</p>
          <p>â€Â¢ ANSES - Ãƒâ€°valuation sécurité ingrédients cosmétiques</p>
          <p>â€Â¢ Règlement cosmétique européen - Allergènes obligatoires</p>
          <p>â€Â¢ Base de données INCI internationale</p>
        </div>
      </div>
    </div>
  );
};

// ========================================
// COMPOSANT AFFICHAGE DÃƒâ€°TERGENTS
// ========================================

interface DetergentAnalysisDisplayProps {
  analysis: any;
  productName: string;
}

export const DetergentAnalysisDisplay: React.FC<DetergentAnalysisDisplayProps> = ({
  analysis,
  productName
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 65) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getToxicityColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MODERATE': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'VERY_HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="detergent-analysis space-y-6">
      {/* Scores principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-6 rounded-xl border-2 ${getScoreColor(analysis.environmentalScore || 0)}`}>
          <div className="text-center">
            <div className="text-3xl font-bold">{analysis.environmentalScore || 0}/100</div>
            <div className="text-sm font-medium">Score Environnemental</div>
            <div className="text-xs opacity-75 mt-1">Impact écologique</div>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl border-2 ${getScoreColor(analysis.healthScore || 0)}`}>
          <div className="text-center">
            <div className="text-3xl font-bold">{analysis.healthScore || 0}/100</div>
            <div className="text-sm font-medium">Score Santé</div>
            <div className="text-xs opacity-75 mt-1">Sécurité d'usage</div>
          </div>
        </div>
      </div>

      {/* Toxicité aquatique */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${getToxicityColor(analysis.aquaticToxicity?.level || 'LOW')}`}>
            <Droplets className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              Impact sur la Vie Aquatique
            </h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getToxicityColor(analysis.aquaticToxicity?.level || 'LOW')}`}>
              Toxicité : {analysis.aquaticToxicity?.level === 'LOW' ? 'Faible' :
                         analysis.aquaticToxicity?.level === 'MODERATE' ? 'Modérée' :
                         analysis.aquaticToxicity?.level === 'HIGH' ? 'Ãƒâ€°levée' : 'Très élevée'}
            </div>
            
            {analysis.aquaticToxicity?.toxicIngredients?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Substances problématiques :</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.aquaticToxicity.toxicIngredients.map((ingredient: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Biodégradabilité */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${analysis.biodegradability?.score >= 7 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
            <Leaf className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              Biodégradabilité
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-600">{analysis.biodegradability?.score || 0}/10</div>
                <div className="text-sm text-gray-600">Score biodégradabilité</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{analysis.biodegradability?.biodegradableRatio || 0}%</div>
                <div className="text-sm text-gray-600">Ingrédients biodégradables</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Labels écologiques */}
      {analysis.ecoLabels?.length > 0 && (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
          <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Certifications Ãƒâ€°cologiques
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.ecoLabels.map((label: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                âÅ“â€œ {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommandations */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">
          Ã°Å¸Å’Â Nos Recommandations Ãƒâ€°cologiques
        </h3>
        <ul className="space-y-2">
          {analysis.recommendations?.map((rec: string, index: number) => (
            <li key={index} className="flex items-start space-x-2 text-blue-700">
              <span className="text-blue-500 mt-0.5">â€Â¢</span>
              <span className="text-sm">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Alternatives */}
      {analysis.alternatives?.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Leaf className="w-5 h-5 mr-2 text-green-500" />
            Alternatives Ãƒâ€°cologiques
          </h3>
          
          <div className="space-y-4">
            {analysis.alternatives.map((alt: any, index: number) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-800">{alt.name}</h4>
                    <p className="text-sm text-gray-600">{alt.brand}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{alt.score}/100</div>
                    <div className="text-xs text-gray-500">+{alt.score - (analysis.environmentalScore || 0)} points</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {alt.benefits?.map((benefit: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      âÅ“â€œ {benefit}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default { CosmeticAnalysisDisplay, DetergentAnalysisDisplay };
