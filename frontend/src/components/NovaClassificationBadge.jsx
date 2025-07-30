// frontend/src/components/NovaClassificationBadge.jsx - Version Simplifiée

import React from 'react';

const NovaClassificationBadge = ({ novaGroup, groupInfo, healthImpact }) => {
  const getNovaStyle = (group) => {
    switch(group) {
      case 4:
        return {
          bg: 'bg-gradient-to-r from-red-100 to-red-50',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: '🚨',
          message: 'Ultra-transformé',
          color: '#dc2626'
        };
      case 3:
        return {
          bg: 'bg-gradient-to-r from-orange-100 to-orange-50',
          text: 'text-orange-800',
          border: 'border-orange-200',
          icon: '⚠️',
          message: 'Transformé',
          color: '#ea580c'
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-yellow-100 to-yellow-50',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: '🥄',
          message: 'Ingrédient culinaire',
          color: '#d97706'
        };
      case 1:
      default:
        return {
          bg: 'bg-gradient-to-r from-green-100 to-green-50',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: '🌱',
          message: 'Naturel',
          color: '#16a34a'
        };
    }
  };

  const style = getNovaStyle(novaGroup);

  return (
    <div className="mt-6">
      {/* Badge Principal Simplifié */}
      <div className={`${style.bg} ${style.border} border-2 rounded-2xl p-6 shadow-sm`}>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <span className="text-4xl">{style.icon}</span>
            <div>
              <h3 className={`text-2xl font-bold ${style.text}`}>
                Classification NOVA
              </h3>
              <p className={`text-lg ${style.text}`}>
                Groupe {novaGroup} - {style.message}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4">
            {groupInfo?.description || "Classification selon INSERM 2024"}
          </p>

          {/* Alerte Ultra-transformation Simplifiée */}
          {novaGroup === 4 && (
            <div className="bg-white bg-opacity-70 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-800 font-semibold mb-2">
                ⚡ Impact Santé Documenté
              </div>
              <div className="text-xs text-red-700 space-y-1">
                <div>• Augmentation risques cardiovasculaires et diabète</div>
                <div>• Perturbation potentielle du microbiote intestinal</div>
              </div>
              <div className="text-xs text-red-600 mt-2">
                Sources : BMJ, Nature, Diabetes Care 2024
              </div>
            </div>
          )}

          {/* Message Positif pour Produits Naturels */}
          {novaGroup === 1 && (
            <div className="bg-white bg-opacity-70 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-800 font-semibold mb-2">
                ✨ Excellent pour la Santé
              </div>
              <div className="text-xs text-green-700">
                Préserve la matrice alimentaire et les qualités nutritionnelles originales
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Source en bas */}
      <div className="text-center mt-3">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Classification NOVA officielle - INSERM 2024
        </span>
      </div>
    </div>
  );
};

export default NovaClassificationBadge;