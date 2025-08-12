// Ã°Å¸â€œÂ src/components/analysis/AlternativesSuggestions.tsx

import React from 'react';
import { Lightbulb, ArrowUpRight } from 'lucide-react';

interface Alternative {
  name: string;
  score: number;
  benefits: string;
  source: string;
  type: 'diy' | 'product' | 'natural';
  price?: number;
  where_to_buy?: string;
}

interface Props {
  alternatives: Alternative[];
}

export const AlternativesSuggestions: React.FC<Props> = ({ alternatives }) => {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="bg-white border rounded-xl shadow p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-semibold text-gray-800">
          Alternatives plus naturelles proposées par l'IA
        </h2>
      </div>

      <ul className="space-y-3">
        {alternatives.map((alt, idx) => (
          <li key={idx} className="border-l-4 border-emerald-400 pl-3">
            <p className="font-medium text-gray-800">
              Ã°Å¸Å’Â¿ {alt.name} {alt.price && `- ${alt.price.toFixed(2)}ââ€šÂ¬`}
            </p>
            <p className="text-sm text-gray-600 italic">{alt.benefits}</p>
            <p className="text-xs text-gray-400 mt-1">
              Ã°Å¸â€œÅ¡ Source : {alt.source}
            </p>
            {alt.where_to_buy && (
              <a
                href={alt.where_to_buy}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 hover:underline text-sm mt-1"
              >
                Acheter / Voir
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

