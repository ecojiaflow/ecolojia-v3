// frontend/src/components/AlternativeCard.jsx

import React from 'react';

const AlternativeCard = ({ alternative, index, isSelected, onSelect, currentScore }) => {
  const improvement = alternative.score - currentScore;
  
  const getHealthBenefits = (name) => {
    if (name.includes('flocons')) {
      return [
        "Index glycémique réduit de 54% (40 vs 87)",
        "Fibres bêta-glucanes -10% cholestérol", 
        "Satiété prolongée 4h (vs 1h30)"
      ];
    }
    if (name.includes('fruits')) {
      return [
        "Classification NOVA 1 (aliment naturel)",
        "Antioxydants naturels préservés",
        "Fibres solubles régulent glycémie"
      ];
    }
    if (name.includes('maison')) {
      return [
        "Contrôle total ingrédients et additifs",
        "Vitamines B préservées (+70% vs produit actuel)",
        "Matrice alimentaire naturelle maintenue"
      ];
    }
    return [
      "Meilleure qualité nutritionnelle",
      "Moins de transformation industrielle",
      "Impact santé positif prouvé"
    ];
  };
  
  return (
    <div 
      className={`bg-white rounded-3xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
        isSelected ? 'border-green-400 shadow-xl' : 'border-gray-100 hover:border-green-200 shadow-md'
      }`}
      onClick={() => onSelect(isSelected ? null : index)}
    >
      <div className="p-6">
        {/* Badge amélioration */}
        <div className="flex justify-between items-start mb-4">
          <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            +{improvement} points
          </div>
          <div className="text-2xl">
            {alternative.name.includes('maison') ? '🏠' : 
             alternative.name.includes('flocons') ? '🌾' : 
             alternative.name.includes('fruits') ? '🍎' : '🌱'}
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-3">{alternative.name}</h3>
        
        {/* Métriques */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-sm text-gray-600 mb-1">⏱️ Temps</div>
            <div className="font-bold text-gray-800">{alternative.time}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-sm text-gray-600 mb-1">💰 Économie</div>
            <div className="font-bold text-green-600">{alternative.cost}</div>
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed mb-4">{alternative.why}</p>

        {isSelected && (
          <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="font-bold text-green-700 mb-2">🔬 Bénéfices Santé Prouvés</h4>
              <ul className="text-sm text-green-600 space-y-1">
                {getHealthBenefits(alternative.name).map((benefit, idx) => (
                  <li key={idx}>• {benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="text-center mt-4">
          <span className="text-xs text-gray-400">
            {isSelected ? '▲ Masquer détails' : '▼ Voir bénéfices santé'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AlternativeCard;