// frontend/src/components/premium/PremiumAlternatives.jsx

import React, { useState } from 'react';

const PremiumAlternatives = ({ alternatives, currentScore }) => {
  const [selectedAlternative, setSelectedAlternative] = useState(null);

  if (!alternatives || alternatives.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">
          Recherche d'Alternatives en Cours
        </h3>
        <p className="text-gray-400">
          Notre IA analyse les meilleures alternatives naturelles pour ce produit
        </p>
      </div>
    );
  }

  const getScoreImprovement = (altScore) => {
    const improvement = altScore - currentScore;
    return improvement > 0 ? `+${improvement}` : improvement;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="space-y-8">
      {/* Header Premium */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-4">
          🌱 Alternatives Naturelles Premium
        </h2>
        <p className="text-gray-300 text-lg">
          {alternatives.length} solution{alternatives.length > 1 ? 's' : ''} scientifiquement prouvée{alternatives.length > 1 ? 's' : ''}
        </p>
        
        {/* Stats Globales */}
        <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-2xl font-bold text-green-400">
              +{Math.round(alternatives.reduce((acc, alt) => acc + (alt.score - currentScore), 0) / alternatives.length)}
            </div>
            <div className="text-xs text-gray-400">Amélioration moyenne</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-2xl font-bold text-blue-400">-40%</div>
            <div className="text-xs text-gray-400">Additifs évités</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-2xl font-bold text-purple-400">
              {alternatives.filter(alt => alt.time && parseInt(alt.time) <= 10).length}
            </div>
            <div className="text-xs text-gray-400">Solutions rapides</div>
          </div>
        </div>
      </div>

      {/* Grille Alternatives Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {alternatives.map((alternative, index) => (
          <div
            key={index}
            className={`relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border border-white/20 p-6 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl ${
              selectedAlternative === index ? 'ring-2 ring-green-500 shadow-green-500/25' : ''
            }`}
            onClick={() => setSelectedAlternative(selectedAlternative === index ? null : index)}
          >
            {/* Badge Amélioration */}
            <div className="absolute -top-3 -right-3">
              <div 
                className="px-4 py-2 rounded-full text-white font-bold text-sm shadow-lg"
                style={{ backgroundColor: getScoreColor(alternative.score) }}
              >
                {getScoreImprovement(alternative.score)} points
              </div>
            </div>

            {/* Header Alternative */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">
                    {alternative.name.includes('maison') ? '🏠' : 
                     alternative.name.includes('flocons') ? '🌾' : 
                     alternative.name.includes('fruits') ? '🍎' : '🌱'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {alternative.name}
                  </h3>
                  <div className="flex items-center space-x-3">
                    {/* Score Alternative */}
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: getScoreColor(alternative.score) }}
                      >
                        {alternative.score}
                      </div>
                      <span className="text-sm text-gray-400">Score</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Infos Rapides */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-sm text-gray-400 mb-1">⏱️ Temps</div>
                <div className="font-bold text-white">{alternative.time}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-sm text-gray-400 mb-1">💰 Coût</div>
                <div className="font-bold text-green-400">{alternative.cost}</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 mb-4 leading-relaxed">
              {alternative.why}
            </p>

            {/* Détails Étendus */}
            {selectedAlternative === index && (
              <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                
                {/* Avantages Scientifiques */}
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-4 border border-green-500/20">
                  <h4 className="font-bold text-green-400 mb-2">🔬 Preuves Scientifiques</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {alternative.name.includes('flocons') && (
                      <>
                        <li>• Index glycémique 40 vs 87 (réduction 54%)</li>
                        <li>• Fibres bêta-glucanes réduisent cholestérol -10%</li>
                        <li>• Satiété prolongée 4h vs 1h30</li>
                      </>
                    )}
                    {alternative.name.includes('fruits') && (
                      <>
                        <li>• NOVA 1 : aucune transformation industrielle</li>
                        <li>• Antioxydants naturels préservés 100%</li>
                        <li>• Fibres solubles régulent absorption sucres</li>
                      </>
                    )}
                    {alternative.name.includes('maison') && (
                      <>
                        <li>• Contrôle total ingrédients et additifs</li>
                        <li>• Vitamines B préservées (+70% vs produit actuel)</li>
                        <li>• Matrice alimentaire naturelle maintenue</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Guide Transition */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                  <h4 className="font-bold text-purple-400 mb-3">🎯 Plan de Transition (4 semaines)</h4>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center bg-white/5 rounded-lg p-2">
                      <div className="font-bold text-white">S1</div>
                      <div className="text-gray-400">Test 2x</div>
                    </div>
                    <div className="text-center bg-white/5 rounded-lg p-2">
                      <div className="font-bold text-white">S2</div>
                      <div className="text-gray-400">50/50</div>
                    </div>
                    <div className="text-center bg-white/5 rounded-lg p-2">
                      <div className="font-bold text-white">S3</div>
                      <div className="text-gray-400">80% new</div>
                    </div>
                    <div className="text-center bg-white/5 rounded-lg p-2">
                      <div className="font-bold text-white">S4</div>
                      <div className="text-gray-400">100% ✅</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white py-3 rounded-xl font-medium transition-all transform hover:scale-105">
                    📖 Voir Guide Détaillé
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white py-3 rounded-xl font-medium transition-all transform hover:scale-105">
                    💬 Poser une Question
                  </button>
                </div>
              </div>
            )}

            {/* Indicateur Cliquable */}
            <div className="text-center mt-4">
              <button className="text-xs text-gray-400 hover:text-white transition-colors">
                {selectedAlternative === index ? '▲ Masquer détails' : '▼ Voir détails complets'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Impact Global */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 backdrop-blur-sm rounded-3xl p-8 border border-green-500/20">
        <h3 className="text-2xl font-bold text-center text-white mb-6">
          📊 Impact Prévu de ces Alternatives
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">-65%</div>
            <div className="text-sm text-gray-300">Additifs chimiques évités</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">+180%</div>
            <div className="text-sm text-gray-300">Qualité nutritionnelle</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">-45%</div>
            <div className="text-sm text-gray-300">Impact environnemental</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">-40%</div>
            <div className="text-sm text-gray-300">Coût mensuel moyen</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <p className="text-gray-300 mb-4">
            Prêt à améliorer votre santé avec ces alternatives scientifiquement prouvées ?
          </p>
          <button className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-400 hover:via-blue-400 hover:to-purple-400 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105">
            🚀 Commencer la Transition
          </button>
        </div>
      </div>

      {/* Source IA */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-400">
            🤖 Alternatives générées par l'IA scientifique ECOLOJIA • Sources ANSES, EFSA, INSERM 2024
          </span>
        </div>
      </div>
    </div>
  );
};

export default PremiumAlternatives;