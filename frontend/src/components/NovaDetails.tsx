// PATH: frontend/src/components/NovaDetails.tsx
import React, { useState } from 'react';

interface NovaAnalysis {
  level: 1 | 2 | 3 | 4;
  confidence: number;
  reasons: string[];
  penalties: number;
  health_impact: string;
  scientific_sources: string[];
}

const NovaDetails: React.FC<{ novaAnalysis: NovaAnalysis }> = ({ novaAnalysis }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🔬</span>
          <h3 className="text-lg font-bold text-blue-700">Classification NOVA Scientifique</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {isExpanded ? '▲ Masquer détails' : '▼ Voir détails'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3">
          <div className="text-sm text-gray-600">Niveau NOVA</div>
          <div className="font-bold text-xl text-blue-600">Groupe {novaAnalysis.level}</div>
        </div>
        <div className="bg-white rounded-lg p-3">
          <div className="text-sm text-gray-600">Confiance IA</div>
          <div className="font-bold text-xl text-blue-600">{Math.round(novaAnalysis.confidence * 100)}%</div>
        </div>
        <div className="bg-white rounded-lg p-3">
          <div className="text-sm text-gray-600">Impact Score</div>
          <div className="font-bold text-xl text-red-600">{novaAnalysis.penalties} points</div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-blue-700 mb-2">🧬 Raisons de Classification</h4>
            <ul className="space-y-1">
              {novaAnalysis.reasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-blue-600 flex items-start space-x-2">
                  <span>•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-blue-700 mb-2">🏥 Impact sur la Santé</h4>
            <p className="text-sm text-blue-600 bg-white rounded-lg p-3">
              {novaAnalysis.health_impact}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-blue-700 mb-2">📚 Sources Scientifiques</h4>
            <ul className="space-y-1">
              {novaAnalysis.scientific_sources.map((source, idx) => (
                <li key={idx} className="text-xs text-blue-500 bg-white rounded-lg p-2">
                  📖 {source}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovaDetails;
// EOF
