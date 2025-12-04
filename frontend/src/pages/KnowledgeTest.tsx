/**
 * PAGE DE TEST - KNOWLEDGE ENGINE V3.2
 * 
 * Test avec Nutella (ID connu)
 */

import React from 'react';
import { KnowledgeInsights } from '../components/knowledge';

export const KnowledgeTest: React.FC = () => {
  // ID Nutella de la base (à ajuster si nécessaire)
  const nutellaId = '3017620422003'; // Code-barres Nutella

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            🧪 Test KnowledgeEngine V3.2
          </h1>
          <p className="text-sm text-neutral-600">
            Test avec Nutella - Affichage responsive mobile + desktop
          </p>
        </div>

        {/* Test Mobile (compact) */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            📱 Mode Mobile (compact)
          </h2>
          <div className="max-w-md mx-auto border-2 border-dashed border-neutral-300 p-4 rounded-lg">
            <KnowledgeInsights 
              productId={nutellaId}
              categoryType="food"
              compact={true}
            />
          </div>
        </div>

        {/* Test Desktop (complet) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            🖥️ Mode Desktop (complet)
          </h2>
          <KnowledgeInsights 
            productId={nutellaId}
            categoryType="food"
            compact={false}
          />
        </div>
      </div>
    </div>
  );
};
