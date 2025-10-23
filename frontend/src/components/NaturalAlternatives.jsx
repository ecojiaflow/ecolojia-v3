// frontend/src/components/NaturalAlternatives.jsx - Version Simplifiee

import React, { useState } from 'react';

const NaturalAlternatives = ({ alternatives, productType, novaGroup }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Ne s'affiche que s'il y ? des alternatives
  if (!alternatives || alternatives.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="text-center">
          <span className="text-4xl mb-3 block"></span>
          <h3 className="text-xl font-bold text-green-800 mb-2">
            Recherche d'Alternatives en Cours
          </h3>
          <p className="text-green-700 text-sm">
            Notre IA analyse les meilleures alternatives naturelles pour ce produit
          </p>
        </div>
      </div>
    );
  }

  const toggleExpanded = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getDifficultyIcon = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'facile': return '';
      case 'moyen': return 'a';
      case 'avance': return 'a';
      default: return 'a';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'diy': return '';
      case 'substitute': return 'aa';
      case 'natural': return '';
      default: return 'a';
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
      {/* En-tete Simplifie */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-green-800 mb-2">
           Alternatives Naturelles
        </h3>
        <p className="text-green-700 text-sm">
          {alternatives.length} solution{alternatives.length > 1 ? 's' : ''} plus naturelle{alternatives.length > 1 ? 's' : ''} trouvee{alternatives.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Liste des Alternatives Simplifiee */}
      <div className="space-y-4">
        {alternatives.map((alternative, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* En-tete Alternative */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-2xl mt-1">{getTypeIcon(alternative.type)}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-lg mb-1">
                      {alternative.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {alternative.why_better}
                    </p>
                    
                    {/* Infos Rapides */}
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <span>{getDifficultyIcon(alternative.difficulty)}</span>
                        <span className="text-gray-600">{alternative.difficulty || 'moyen'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>ai</span>
                        <span className="text-gray-600">{alternative.time || '15-30min'}</span>
                      </div>
                      {alternative.cost_comparison && (
                        <div className="flex items-center space-x-1">
                          <span>a</span>
                          <span className="text-gray-600">{alternative.cost_comparison}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Bouton Details */}
                <button
                  onClick={() => toggleExpanded(index)}
                  className="ml-4 text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  {expandedIndex === index ? 'aa Moins' : 'aa Plus'}
                </button>
              </div>

              {/* Details atendus */}
              {expandedIndex === index && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    
                    {/* Avantages Nutritionnels */}
                    {alternative.nutritional_advantage && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <h5 className="font-semibold text-green-800 text-sm mb-1">
                           Avantages Nutritionnels
                        </h5>
                        <p className="text-xs text-green-700">
                          {alternative.nutritional_advantage}
                        </p>
                      </div>
                    )}

                    {/* Impact Environnemental */}
                    {alternative.environmental_benefit && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h5 className="font-semibold text-blue-800 text-sm mb-1">
                           Impact Environnemental
                        </h5>
                        <p className="text-xs text-blue-700">
                          {alternative.environmental_benefit}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Preuves Scientifiques */}
                  {alternative.sources && alternative.sources.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3 mb-4">
                      <h5 className="font-semibold text-purple-800 text-sm mb-2">
                        ? Preuves Scientifiques
                      </h5>
                      <div className="text-xs text-purple-700 space-y-1">
                        {alternative.sources.slice(0, 2).map((source, idx) => (
                          <div key={idx}>a {source}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {alternative.recipe_link && (
                      <button className="bg-green-100 hover:bg-green-200 text-green-800 text-xs px-3 py-2 rounded-lg transition-colors">
                        aa Voir la recette
                      </button>
                    )}
                    <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs px-3 py-2 rounded-lg transition-colors">
                      ? Poser une question
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Impact Simplifie */}
      <div className="mt-6 bg-white bg-opacity-70 rounded-lg p-4 text-center">
        <h4 className="font-semibold text-green-800 text-sm mb-3">
          ? Impact Prevu de ces Alternatives
        </h4>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="font-bold text-green-700">-40%</div>
            <div className="text-green-600">Additifs evites</div>
          </div>
          <div>
            <div className="font-bold text-blue-700">+200%</div>
            <div className="text-blue-600">Qualite nutritionnelle</div>
          </div>
          <div>
            <div className="font-bold text-purple-700">-30%</div>
            <div className="text-purple-600">Impact environnemental</div>
          </div>
        </div>
      </div>

      {/* Source IA */}
      <div className="mt-4 text-center">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          ? Alternatives generees par l'IA scientifique ECOLOJIA
        </span>
      </div>
    </div>
  );
};

export default NaturalAlternatives;