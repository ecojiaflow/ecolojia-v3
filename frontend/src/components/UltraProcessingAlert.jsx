// frontend/src/components/UltraProcessingAlert.jsx

import React, { useState } from 'react';

const UltraProcessingAlert = ({ novaGroup, additives, healthImpact, alternatives }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Ne s'affiche que pour les produits problematiques
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
      icon: '',
      title: 'Ultra-transformation detectee',
      severity: 'CRITIQUE'
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-400',
      text: 'text-orange-800',
      icon: 'ai',
      title: 'Transformation industrielle detectee',
      severity: 'ATTENTION'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      icon: 'aai',
      title: 'Produit transforme',
      severity: 'INFO'
    }
  };

  const style = alertStyles[alertLevel];

  return (
    <div className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4 mt-6 shadow-sm`}>
      {/* En-tete Alert */}
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
                <strong>Malgre d'eventuels labels bio/naturel</strong>, ce produit subit une 
                transformation industrielle intensive selon la classification NOVA (INSERM 2024).
              </p>
            )}
            {novaGroup === 3 && (
              <p>
                Ce produit contient des ingredients transformes qui peuvent affecter 
                ses qualites nutritionnelles originales.
              </p>
            )}
          </div>

          {/* Donnees Scientifiques */}
          {novaGroup === 4 && (
            <div className="mt-3 bg-white bg-opacity-50 rounded-lg p-3 border border-red-200">
              <div className="text-xs font-medium text-red-900 mb-1">
                ? Impact Santé Scientifiquement Documente :
              </div>
              <div className="text-xs text-red-700 space-y-1">
                <div>a +22% risque depression (Nature Mental Health 2024)</div>
                <div>a +53% risque diabete type 2 (Diabetes Care 2024)</div>
                <div>a +10% maladies cardiovasculaires (BMJ 2024)</div>
                {additives?.microbiomeDisruptors?.length > 0 && (
                  <div>a Perturbation microbiote intestinal en 2-4 semaines</div>
                )}
              </div>
            </div>
          )}

          {/* Additifs Problematiques */}
          {additives && additives.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-medium underline cursor-pointer hover:no-underline"
              >
                {showDetails ? 'Masquer' : 'Voir'} les additifs detectes ({additives.length})
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

          {/* Actions Recommandees */}
          <div className="mt-4 bg-white bg-opacity-70 rounded-lg p-3 border">
            <h4 className={`text-sm font-semibold ${style.text} mb-2`}>
              ? Actions Recommandees :
            </h4>
            <div className="text-xs space-y-1">
              {novaGroup === 4 && (
                <>
                  <div>a <strong>Remplacer</strong> par une alternative naturelle (voir suggestions ci-dessous)</div>
                  <div>a <strong>Limiter la consommation</strong>  occasionnelle si remplacement impossible</div>
                  <div>a <strong>Verifier les etiquettes</strong> : privilegier &lt;5 ingredients reconnaissables</div>
                </>
              )}
              {novaGroup === 3 && (
                <>
                  <div>a <strong>Moderer la consommation</strong> dans le cadre d'une alimentation equilibree</div>
                  <div>a <strong>Alterner</strong> avec des versions moins transformees quand possible</div>
                </>
              )}
              <div>a <strong>S'informer</strong> sur les alternatives naturelles disponibles</div>
            </div>
          </div>

          {/* Sources Scientifiques */}
          <div className="mt-3 text-xs text-gray-600">
            <strong>Sources :</strong> Classification NOVA INSERM 2024, Base additifs EFSA 2024, 
            atudes epidemiologiques Nature/BMJ/Diabetes Care 2024
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltraProcessingAlert;