import React from 'react';

interface PositionGraphProps {
  level: 'base' | 'occasional' | 'limit';
  label: string;
}

export const PositionGraph: React.FC<PositionGraphProps> = ({ level, label }) => {
  const levels = [
    { id: 'base', label: 'Base quotidienne', emoji: '🥗' },
    { id: 'occasional', label: 'Plaisir occasionnel', emoji: '🍫' },
    { id: 'limit', label: 'À limiter', emoji: '⚠️' }
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm font-medium text-gray-700 mb-3">Où se situe ce produit</div>
      <div className="space-y-2">
        {levels.map((l) => (
          <div key={l.id} className="flex items-center gap-3">
            <span className="text-lg">{l.emoji}</span>
            <span className="text-sm text-gray-600 w-36">{l.label}</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  l.id === level
                    ? l.id === 'base'
                      ? 'bg-green-500 w-full'
                      : l.id === 'occasional'
                      ? 'bg-yellow-500 w-3/4'
                      : 'bg-orange-500 w-1/2'
                    : 'w-0'
                }`}
              />
            </div>
            {l.id === level && <span className="text-xs text-gray-500">●</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

interface NutrientLevel {
  nutrient: string;
  label: string;
  emoji: string;
  level: string;
  levelLabel: string;
}

interface AssociationGraphProps {
  apporte: NutrientLevel[];
  ajouter: { nutrient: string; label: string; emoji: string; reason: string }[];
}

export const AssociationGraph: React.FC<AssociationGraphProps> = ({ apporte, ajouter }) => {
  if (apporte.length === 0 && ajouter.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {apporte.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Ce produit apporte</div>
          <div className="space-y-2">
            {apporte.map((item) => (
              <div key={item.nutrient} className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm text-gray-600 w-28">{item.label}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.level === 'high' ? 'bg-orange-500 w-4/5' : 'bg-yellow-500 w-1/2'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-500">↑ {item.levelLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ajouter.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Pour équilibrer, ajouter</div>
          <div className="space-y-2">
            {ajouter.map((item) => (
              <div key={item.nutrient} className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm text-gray-600 w-28">{item.label}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full w-3/4" />
                </div>
                <span className="text-xs text-green-600">+</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface FrequencyGraphProps {
  level: 'daily' | 'weekly' | 'occasional' | 'rare';
  label: string;
}

export const FrequencyGraph: React.FC<FrequencyGraphProps> = ({ level, label }) => {
  const frequencies = [
    { id: 'daily', label: 'Quotidien' },
    { id: 'weekly', label: 'Plusieurs fois/semaine' },
    { id: 'occasional', label: 'Occasionnel' },
    { id: 'rare', label: 'Rare' }
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm font-medium text-gray-700 mb-3">Fréquence adaptée</div>
      <div className="space-y-2">
        {frequencies.map((f) => (
          <div key={f.id} className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                f.id === level ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}
            >
              {f.id === level && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
            <span className={`text-sm ${f.id === level ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {f.label}
            </span>
            {f.id === level && <span className="text-xs text-green-600 ml-auto">← adapté</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
