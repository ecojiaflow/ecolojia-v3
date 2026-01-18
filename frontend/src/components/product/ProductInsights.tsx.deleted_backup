import React from 'react';
import { PositionGraph, AssociationGraph, FrequencyGraph } from './MicroGraphs';

interface MicroInsights {
  enBref: {
    message: string;
    position: {
      level: 'base' | 'occasional' | 'limit';
      label: string;
      emoji: string;
    };
    reasons: string[];
  };
  equilibrer: {
    apporte: Array<{
      nutrient: string;
      label: string;
      emoji: string;
      level: string;
      levelLabel: string;
    }>;
    ajouter: Array<{
      nutrient: string;
      label: string;
      emoji: string;
      reason: string;
    }>;
    associations: string[];
    eviter: string[];
    frequency: {
      level: 'daily' | 'weekly' | 'occasional' | 'rare';
      label: string;
    };
    disclaimer: string;
  } | null;
}

interface ProductInsightsProps {
  microInsights: MicroInsights | null;
}

const ProductInsights: React.FC<ProductInsightsProps> = ({ microInsights }) => {
  if (!microInsights || !microInsights.enBref) return null;

  const { enBref, equilibrer } = microInsights;

  return (
    <div className="space-y-6">
      {/* En bref */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💡</span>
          <h3 className="text-lg font-semibold text-gray-900">En bref</h3>
        </div>
        
        <p className="text-gray-700 mb-4 leading-relaxed">{enBref.message}</p>
        
        <PositionGraph level={enBref.position.level} label={enBref.position.label} />
      </div>

      {/* Équilibrer (si applicable) */}
      {equilibrer && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🍽️</span>
            <h3 className="text-lg font-semibold text-gray-900">Dans un repas équilibré</h3>
          </div>

          <AssociationGraph apporte={equilibrer.apporte} ajouter={equilibrer.ajouter} />

          {equilibrer.associations.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">▸ À associer (au choix)</div>
              <ul className="space-y-1">
                {equilibrer.associations.map((assoc, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    {assoc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {equilibrer.eviter.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">▸ Attention au cumul</div>
              <ul className="space-y-1">
                {equilibrer.eviter.map((ev, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    {ev}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <FrequencyGraph level={equilibrer.frequency.level} label={equilibrer.frequency.label} />
          </div>

          <p className="mt-4 text-xs text-gray-500 italic">
            💬 {equilibrer.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductInsights;

