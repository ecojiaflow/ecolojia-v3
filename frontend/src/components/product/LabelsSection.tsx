import React from 'react';

interface LabelsSectionProps {
  labels: string[];
}

const LABEL_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  'en:organic': { label: 'Bio', icon: '🌱', color: 'bg-green-100 text-green-800' },
  'en:vegan': { label: 'Vegan', icon: '🥕', color: 'bg-green-100 text-green-800' },
  'en:vegetarian': { label: 'Végétarien', icon: '🥬', color: 'bg-green-100 text-green-800' },
  'en:no-gluten': { label: 'Sans gluten', icon: '🌾', color: 'bg-blue-100 text-blue-800' },
  'en:no-lactose': { label: 'Sans lactose', icon: '🥛', color: 'bg-blue-100 text-blue-800' },
  'en:no-preservatives': { label: 'Sans conservateurs', icon: '✅', color: 'bg-emerald-100 text-emerald-800' },
  'en:no-colorings': { label: 'Sans colorants', icon: '🎨', color: 'bg-emerald-100 text-emerald-800' },
  'en:no-hydrogenated-fats': { label: 'Sans huiles hydrogénées', icon: '💧', color: 'bg-teal-100 text-teal-800' },
  'en:palm-oil-free': { label: 'Sans huile de palme', icon: '🌴', color: 'bg-green-100 text-green-800' },
  'fr:triman': { label: 'Triman (recyclage)', icon: '♻️', color: 'bg-gray-100 text-gray-800' }
};

export const LabelsSection: React.FC<LabelsSectionProps> = ({ labels }) => {
  if (!labels || labels.length === 0) return null;

  const recognizedLabels = labels
    .map(tag => LABEL_CONFIG[tag] ? { tag, ...LABEL_CONFIG[tag] } : null)
    .filter(Boolean);

  if (recognizedLabels.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="font-semibold text-gray-900 mb-3">🏷️ Labels & Certifications</h3>
      
      <div className="flex flex-wrap gap-2">
        {recognizedLabels.map((item: any, idx: number) => (
          <span 
            key={idx}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${item.color}`}
          >
            {item.icon} {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};
