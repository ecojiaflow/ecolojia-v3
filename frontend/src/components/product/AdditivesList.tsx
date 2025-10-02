import React from 'react';

interface AdditivesListProps {
  additives?: string[];
}

export function AdditivesList({ additives }: AdditivesListProps) {
  if (!additives || additives.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        Aucun additif détecté
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-xl">📦</div>
        <div className="text-sm text-gray-600">
          Présence de <span className="font-bold">{additives.length}</span> additif(s)
        </div>
      </div>
      <ul className="space-y-2">
        {additives.map((additive, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <span className="inline-block w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center mt-0.5">
              {idx + 1}
            </span>
            <span className="flex-1 text-gray-700">{additive}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}