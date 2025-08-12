// frontend/src/components/UltraProcessingAlert.jsx

import React, { useState } from 'react';

const UltraProcessingAlert = ({ novaGroup, additives, healthImpact, alternatives }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Ne s'affiche que pour les produits problématiques
  if (novaGroup < 3 && (!additives || additives.length === 0)) {
    return null;
  }

  const getAlertLevel = () => {
    if (novaGroup === 4) return 'critical';
    if (novaGroup === 3 || additives?.length > 3) return 'warning';
    return 'info';
  };

  const alertLevel = getAlertLevel();

  const alertStyles = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      icon: 'Ã°Å¸Å¡Â¨',
      title: 'Ultra-transformation détectée',
      severity: 'CRITIQUE'
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-400',
      text: 'text-orange-800',
      icon: 'âÅ¡Â ïÂ¸Â',
      title: 'Transformation industrielle détectée',
      severity: 'ATTENTION'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      icon: 'ââ€žÂ¹ïÂ¸Â',
      title: 'Produit transformé',
      severity: 'INFO'
    }
  };

  const style = alertStyles[alertLevel];

  return (
    <div className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4 mt-6 shadow-sm`}>
      {/* En-tête Alert */}
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">{style.icon}</span>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-bold ${style.text}`}>
              {style.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${style.bg} ${style.text} border`}>
              {style.severity}
            </span>
          </div>

          {/* Message Principal */}
          <div className={`mt-2 text-sm ${style.text}`}>
            {novaGroup === 4 && (
              <p>
                <strong>Malgré d'éventuels labels bio/naturel</strong>, ce produit subit une 
                transformation industrielle intensive selon la classification NOVA (INSERM 2024).
              </p>
            )}
            {novaGroup === 3 && (
              <p>
                Ce produit contient des ingrédients transformés qui peuvent affecter 
                ses qualités nutritionnelles originales.
              </p>
            )}
          </div>

          {/* Données Scientifiques */}
          {novaGroup === 4 && (
            <div className="mt-3 bg-white bg-opacity-50 rounded-lg p-3 border border-red-200">
              <div className="text-xs font-medium text-red-900 mb-1">
                Ã°Å¸â€œÅ  Impact Santé Scientifiquement Documenté :
              </div>
              <div className="text-xs text-red-700 space-y-1">
                <div>â€Â¢ +22% risque dépression (Nature Mental Health 2024)</div>
                <div>â€Â¢ +53% risque diabète type 2 (Diabetes Care 2024)</div>
                <div>â€Â¢ +10% maladies cardiovasculaires (BMJ 2024)</div>
                {additives?.microbiomeDisruptors?.length > 0 && (
                  <div>â€Â¢ Perturbation microbiote intestinal en 2-4 semaines</div>
                )}
              </div>
            </div>
          )}

          {/* Additifs Problématiques */}
          {additives && additives.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-medium underline cursor-pointer hover:no-underline"
              >
                {showDetails ? 'Masquer' : 'Voir'} les additifs détectés ({additives.length})
              </button>
              
              {showDetails && (
                <div className="mt-2 bg-white bg-opacity-50 rounded p-2 border">
                  <div className="text-xs space-y-1">
                    {additives.slice(0, 5).map((additive, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="font-mono">{additive.code || additive}</span>
                        <span className="text-gray-600">{additive.name || 'Additif alimentaire'}</span>
                      </div>
                    ))}
                    {additives.length > 5 && (
                      <div className="text-gray-500">... et {additives.length - 5} autres</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions Recommandées */}
          <div className="mt-4 bg-white bg-opacity-70 rounded-lg p-3 border">
            <h4 className={`text-sm font-semibold ${style.text} mb-2`}>
              Ã°Å¸â€™Â¡ Actions Recommandées :
            </h4>
            <div className="text-xs space-y-1">
              {novaGroup === 4 && (
                <>
                  <div>â€Â¢ <strong>Remplacer</strong> par une alternative naturelle (voir suggestions ci-dessous)</div>
                  <div>â€Â¢ <strong>Limiter la consommation</strong> ÃƒÂ  occasionnelle si remplacement impossible</div>
                  <div>â€Â¢ <strong>Vérifier les étiquettes</strong> : privilégier &lt;5 ingrédients reconnaissables</div>
                </>
              )}
              {novaGroup === 3 && (
                <>
                  <div>â€Â¢ <strong>Modérer la consommation</strong> dans le cadre d'une alimentation équilibrée</div>
                  <div>â€Â¢ <strong>Alterner</strong> avec des versions moins transformées quand possible</div>
                </>
              )}
              <div>â€Â¢ <strong>S'informer</strong> sur les alternatives naturelles disponibles</div>
            </div>
          </div>

          {/* Sources Scientifiques */}
          <div className="mt-3 text-xs text-gray-600">
            <strong>Sources :</strong> Classification NOVA INSERM 2024, Base additifs EFSA 2024, 
            Ãƒâ€°tudes épidémiologiques Nature/BMJ/Diabetes Care 2024
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltraProcessingAlert;