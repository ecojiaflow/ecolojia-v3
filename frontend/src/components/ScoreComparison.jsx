// frontend/src/components/ScoreComparison.jsx

import React from 'react';

const ScoreComparison = ({ ecoloJiaScore, yukaEstimatedScore, difference, analysisDetails }) => {
  const getDifferenceStyle = (diff) => {
    if (diff > 5) return { color: 'text-green-600', bg: 'bg-green-50', message: 'Plus indulgent', icon: '📈' };
    if (diff < -5) return { color: 'text-purple-600', bg: 'bg-purple-50', message: 'Plus strict (IA)', icon: '🔬' };
    return { color: 'text-gray-600', bg: 'bg-gray-50', message: 'Similaire', icon: '⚖️' };
  };

  const diffStyle = getDifferenceStyle(difference);

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mt-6 border border-purple-100">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-purple-800 mb-1">
          🆚 ECOLOJIA vs Autres Apps
        </h3>
        <p className="text-sm text-purple-600">
          Analyse scientifique révolutionnaire vs scoring classique
        </p>
      </div>

      {/* Comparaison Scores */}
      <div className="grid grid-cols-2 gap-6">
        {/* Score Autres Apps */}
        <div className="text-center">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-gray-500 text-sm mb-1">Yuka / OpenFoodFacts</div>
            <div className="text-3xl font-bold text-gray-700 mb-1">{yukaEstimatedScore || 75}/100</div>
            <div className="text-xs text-gray-500">Score traditionnel</div>
          </div>
        </div>

        {/* Score ECOLOJIA */}
        <div className="text-center">
          <div className="bg-purple-100 rounded-lg p-4 border-2 border-purple-200">
            <div className="text-purple-600 text-sm mb-1 font-medium">ECOLOJIA IA</div>
            <div className="text-3xl font-bold text-purple-700 mb-1">{ecoloJiaScore}/100</div>
            <div className="text-xs text-purple-600">Analyse révolutionnaire</div>
          </div>
        </div>
      </div>

      {/* Différence et Explication */}
      <div className={`${diffStyle.bg} rounded-lg p-4 mt-4 border border-opacity-30`}>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg">{diffStyle.icon}</span>
          <div className="text-center">
            <div className={`font-bold ${diffStyle.color}`}>
              {difference > 0 ? '+' : ''}{difference} points vs apps classiques
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {diffStyle.message}
            </div>
          </div>
        </div>

        {/* Explication Technique */}
        <div className="mt-3 text-xs text-gray-600 text-center">
          {difference < -5 && (
            <div>
              <strong>Pourquoi plus strict :</strong> Détection ultra-transformation + analyse additifs EFSA + impact microbiote
            </div>
          )}
          {difference > 5 && (
            <div>
              <strong>Pourquoi plus indulgent :</strong> Bonus produits naturels + prise en compte alternatives disponibles
            </div>
          )}
          {Math.abs(difference) <= 5 && (
            <div>
              <strong>Score similaire</strong> mais analyse plus complète avec sources scientifiques
            </div>
          )}
        </div>
      </div>

      {/* Avantages ECOLOJIA */}
      <div className="mt-4 bg-white rounded-lg p-4 border border-purple-100">
        <h4 className="font-semibold text-purple-800 text-sm mb-2">
          🔬 Ce que ECOLOJIA ajoute en plus :
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span>Classification NOVA automatique</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span>Base additifs EFSA 2024</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span>Alternatives naturelles prouvées</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span>Assistant IA conversationnel</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span>Sources scientifiques citées</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span>Impact microbiote analysé</span>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-4">
        <div className="text-xs text-purple-600">
          🚀 <strong>ECOLOJIA</strong> - Premier assistant IA scientifique pour consommation responsable
        </div>
      </div>
    </div>
  );
};

export default ScoreComparison;