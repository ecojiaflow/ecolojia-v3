// PATH: frontend/src/components/ResultCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, Package, Droplets, Sparkles } from 'lucide-react';
import NovaBadge from './NovaBadge';
import HealthScoreCircle from './HealthScoreCircle';
import EnvironmentScore from './EnvironmentScore';
import EcoScoreBadge from './EcoScoreBadge';

interface ResultCardProps {
  result: {
    category: 'food' | 'cosmetics' | 'detergents';
    scores: {
      novaa: number;
      healthScorea: number;
      environmentScorea: number;
      nutriscorea: string;
    };
    details: {
      novaLabela: string;
      novaReasona: string;
      ecoscorea: string;
      riskFlagsa: string[];
      notableIngredientsa: string[];
      riskLevela: 'low' | 'medium' | 'high';
      surfactantsa: string[];
      allergensa: string[];
      clpPictogramsa: string[];
    };
    globalScore: number;
    confidence: number;
    recommendationsa: string[];
  };
  productNamea: string;
  brand?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, productName, brand }) => {
  const { category, scores, details, globalScore, confidence, recommendations } = result;

  // Couleur du score global
  const getGlobalScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-700 dark:text-green-400';
    if (score >= 50) return 'text-green-500 dark:text-yellow-400';
    if (score >= 30) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Icone selon la categorie
  const getCategoryIcon = () => {
    switch (category) {
      case 'food': return Package;
      case 'cosmetics': return Sparkles;
      case 'detergents': return Droplets;
      default: return Package;
    }
  };

  const CategoryIcon = getCategoryIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6"
    >
      {/* En-tete */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start justify-between">
          <div>
            {productName && (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {productName}
              </h2>
            )}
            {brand && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {brand}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <CategoryIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-500 capitalize">
              {category === 'cosmetics' ? 'Cosmetique' : category === 'detergents' ? 'Detergent' : 'Alimentaire'}
            </span>
          </div>
        </div>

        {/* Score global */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Score global</p>
            <p className={`text-3xl font-bold ${getGlobalScoreColor(globalScore)}`}>
              {globalScore}/100
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Confiance: {Math.round(confidence * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Scores principaux */}
      <div className="grid grid-cols-2 gap-6">
        {/* Score sante */}
        {scores.healthScore !== undefined && (
          <div className="flex justify-center">
            <HealthScoreCircle score={scores.healthScore} size="medium" />
          </div>
        )}

        {/* Score environnement */}
        {scores.environmentScore !== undefined && (
          <div className="flex justify-center">
            <EnvironmentScore score={scores.environmentScore} variant="circular" size="medium" />
          </div>
        )}
      </div>

      {/* Badges specifiques selon la categorie */}
      {category === 'food' && (
        <div className="flex flex-wrap gap-4 justify-center">
          {scores.nova && <NovaBadge nova={scores.nova} size="large" />}
          {scores.nutriscore && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">Nutri-Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{scores.nutriscore}</p>
            </div>
          )}
          {details.ecoscore && <EcoScoreBadge score={details.ecoscore} />}
        </div>
      )}

      {/* Details specifiques */}
      <div className="space-y-4">
        {/* Food: Raison NOVA */}
        {category === 'food' && details.novaReason && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Classification NOVA
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {details.novaReason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cosmetics: Flags de risque */}
        {category === 'cosmetics' && details.riskFlags && details.riskFlags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Points d'attention :
            </p>
            <div className="flex flex-wrap gap-2">
              {details.riskFlags.includes('allergen') && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  Allergenes
                </span>
              )}
              {details.riskFlags.includes('endocrine') && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  Perturbateurs endocriniens
                </span>
              )}
              {details.riskFlags.includes('microplastic') && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  Microplastiques
                </span>
              )}
            </div>
          </div>
        )}

        {/* Cosmetics: Ingredients notables */}
        {category === 'cosmetics' && details.notableIngredients && details.notableIngredients.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ingredients  surveiller :
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {details.notableIngredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Detergents: Composition */}
        {category === 'detergents' && (
          <>
            {details.surfactants && details.surfactants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tensioactifs :
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(details.surfactants)].map((surfactant, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {surfactant}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {details.allergens && details.allergens.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allergenes parfumes :
                </p>
                <div className="flex flex-wrap gap-2">
                  {details.allergens.map((allergen, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Recommandations */}
        {recommendations && recommendations.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Recommandations
            </h3>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                  <span className="mr-2">{rec.substring(0, 2)}</span>
                  <span>{rec.substring(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ResultCard;


