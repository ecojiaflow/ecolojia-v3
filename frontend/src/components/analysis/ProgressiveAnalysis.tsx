// PATH: frontend/src/components/analysis/ProgressiveAnalysis.tsx
// Composant d'analyse progressive avec gestion des valeurs manquantes

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Leaf,
  Heart,
  Globe,
  ShieldAlert,
  TrendingUp,
  Award,
  Download,
  Share2,
  Lock
} from 'lucide-react';

interface ProgressiveAnalysisProps {
  analysis: any;
  level?: 'basic' | 'detailed' | 'expert';
  userTier?: 'free' | 'premium';
}

export const ProgressiveAnalysis: React.FC<ProgressiveAnalysisProps> = ({
  analysis,
  level = 'basic',
  userTier = 'free'
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'health' | 'environment' | 'social'>('health');

  // Vérifications de sécurité pour éviter les erreurs
  if (!analysis) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-500 text-center">Aucune analyse disponible</p>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Fonction pour obtenir la couleur selon le score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getNutriScoreColor = (score: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-green-600',
      'B': 'bg-lime-500',
      'C': 'bg-yellow-500',
      'D': 'bg-orange-500',
      'E': 'bg-red-600'
    };
    return colors[score] || 'bg-gray-400';
  };

  // Niveau 1 : Analyse basique (Free)
  const renderBasicLevel = () => {
    const healthScore = analysis.healthScore || 0;
    const novaScore = analysis.novaScore || 0;
    const nutriScore = analysis.nutriScore || 'NC';
    const mainWarning = analysis.warnings?.[0];

    return (
      <div className="space-y-6">
        {/* Score principal */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className={`w-32 h-32 rounded-full ${getScoreBgColor(healthScore)} flex items-center justify-center`}>
              <span className={`text-5xl font-bold ${getScoreColor(healthScore)}`}>
                {healthScore}
              </span>
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md">
              <span className="text-sm font-medium text-gray-700">Score Santé</span>
            </div>
          </div>
        </div>

        {/* Scores secondaires */}
        <div className="grid grid-cols-2 gap-4">
          {/* NOVA Score */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Classification NOVA</h4>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{novaScore}/4</span>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {novaScore <= 1 && 'Non transformé'}
                  {novaScore === 2 && 'Peu transformé'}
                  {novaScore === 3 && 'Transformé'}
                  {novaScore === 4 && 'Ultra-transformé'}
                </p>
              </div>
            </div>
          </div>

          {/* Nutri-Score */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Nutri-Score</h4>
            <div className="flex items-center justify-center">
              <div className={`w-16 h-16 rounded-lg ${getNutriScoreColor(nutriScore)} text-white flex items-center justify-center`}>
                <span className="text-3xl font-bold">{nutriScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerte principale */}
        {mainWarning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
          >
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800">Attention</h4>
                <p className="text-red-700 text-sm mt-1">{mainWarning}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Teaser pour le niveau supérieur */}
        {userTier === 'free' && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">
                  Débloquez l'analyse complète
                </span>
              </div>
              <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition-colors">
                Passer Premium
              </button>
            </div>
            <ul className="mt-3 text-xs text-purple-700 space-y-1">
              <li>â€Â¢ Liste complète des additifs</li>
              <li>â€Â¢ Alternatives personnalisées</li>
              <li>â€Â¢ Impact environnemental détaillé</li>
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Niveau 2 : Analyse détaillée (Free avec limitations)
  const renderDetailedLevel = () => {
    const additives = analysis.additives || [];
    const allergens = analysis.allergens || [];
    const alternatives = analysis.alternatives?.slice(0, userTier === 'free' ? 3 : undefined) || [];
    const nutritionalValues = analysis.nutritionalValues || {};

    return (
      <div className="space-y-6">
        {/* Inclure le niveau basique */}
        {renderBasicLevel()}

        {/* Additifs */}
        <div className="bg-white border rounded-lg">
          <button
            onClick={() => toggleSection('additives')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <ShieldAlert className="w-5 h-5 text-orange-600 mr-2" />
              <span className="font-medium">Additifs ({additives.length})</span>
            </div>
            {expandedSections.has('additives') ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('additives') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4"
              >
                {additives.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {additives.map((additive: string, index: number) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mr-2" />
                        <span>{additive}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">Aucun additif détecté</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Allergènes */}
        {allergens.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Allergènes
            </h4>
            <div className="flex flex-wrap gap-2">
              {allergens.map((allergen: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm">
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Valeurs nutritionnelles */}
        <div className="bg-white border rounded-lg">
          <button
            onClick={() => toggleSection('nutrition')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Heart className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-medium">Valeurs nutritionnelles</span>
            </div>
            {expandedSections.has('nutrition') ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          <AnimatePresence>
            {expandedSections.has('nutrition') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4"
              >
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ãƒâ€°nergie</span>
                      <span className="font-medium">{nutritionalValues.energy?.toFixed(0) || 0} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Protéines</span>
                      <span className="font-medium">{nutritionalValues.proteins?.toFixed(1) || 0} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Glucides</span>
                      <span className="font-medium">{nutritionalValues.carbohydrates?.toFixed(1) || 0} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lipides</span>
                      <span className="font-medium">{nutritionalValues.fat?.toFixed(1) || 0} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sucres</span>
                      <span className="font-medium">{nutritionalValues.sugars?.toFixed(1) || 0} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sel</span>
                      <span className="font-medium">{nutritionalValues.salt?.toFixed(2) || 0} g</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              Alternatives plus saines
            </h4>
            {alternatives.map((alt: any, index: number) => (
              <div key={alt._id || index} className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">{alt.name}</p>
                  <p className="text-sm text-green-600">{alt.brand}</p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${getScoreColor(alt.healthScore || 0)}`}>
                    {alt.healthScore || 0}
                  </span>
                  <p className="text-xs text-gray-500">Score santé</p>
                </div>
              </div>
            ))}
            
            {userTier === 'free' && alternatives.length >= 3 && (
              <div className="text-center">
                <button className="text-sm text-purple-600 hover:text-purple-700">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Voir plus d'alternatives (Premium)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Niveau 3 : Analyse expert (Premium uniquement)
  const renderExpertLevel = () => {
    if (userTier !== 'premium') {
      return (
        <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-8 text-center">
          <Lock className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-purple-800 mb-2">
            Analyse Expert Premium
          </h3>
          <p className="text-purple-600 mb-4">
            Débloquez l'analyse complète avec impact environnemental, social et recommandations personnalisées
          </p>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
            Passer au Premium
          </button>
        </div>
      );
    }

    const impactEnv = analysis.impactEnvironmental || {};
    const impactSocial = analysis.impactSocial || {};

    return (
      <div className="space-y-6">
        {/* Inclure les niveaux précédents */}
        {renderDetailedLevel()}

        {/* Onglets pour les différents impacts */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setSelectedTab('health')}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                selectedTab === 'health'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Heart className="w-5 h-5 inline mr-2" />
              Santé
            </button>
            <button
              onClick={() => setSelectedTab('environment')}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                selectedTab === 'environment'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Globe className="w-5 h-5 inline mr-2" />
              Environnement
            </button>
            <button
              onClick={() => setSelectedTab('social')}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                selectedTab === 'social'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Award className="w-5 h-5 inline mr-2" />
              Social
            </button>
          </div>

          <div className="p-6">
            {selectedTab === 'environment' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Leaf className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{impactEnv.co2?.toFixed(1) || 0}</p>
                    <p className="text-sm text-gray-600">kg COââ€šâ€š</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 text-blue-600 mx-auto mb-2">Ã°Å¸â€™Â§</div>
                    <p className="text-2xl font-bold">{impactEnv.water?.toFixed(0) || 0}</p>
                    <p className="text-sm text-gray-600">L d'eau</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 text-brown-600 mx-auto mb-2">Ã°Å¸Å’Â¾</div>
                    <p className="text-2xl font-bold">{impactEnv.landUse?.toFixed(1) || 0}</p>
                    <p className="text-sm text-gray-600">mÃ‚Â² de terre</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'social' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Commerce équitable</span>
                  {impactSocial.fairTrade ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Production locale</span>
                  {impactSocial.localProduction ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Bien-être animal</span>
                  <span className="text-sm text-gray-600">{impactSocial.animalWelfare || 'N/A'}</span>
                </div>
              </div>
            )}

            {selectedTab === 'health' && (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600">
                  Analyse détaillée de l'impact sur votre santé avec recommandations personnalisées...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
            <Download className="w-5 h-5 mr-2" />
            Exporter l'analyse
          </button>
          <button className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
            <Share2 className="w-5 h-5 mr-2" />
            Partager
          </button>
        </div>
      </div>
    );
  };

  // Rendu selon le niveau
  const renderContent = () => {
    switch (level) {
      case 'expert':
        return renderExpertLevel();
      case 'detailed':
        return renderDetailedLevel();
      case 'basic':
      default:
        return renderBasicLevel();
    }
  };

  return (
    <div className="progressive-analysis">
      {renderContent()}
    </div>
  );
};

export default ProgressiveAnalysis;
