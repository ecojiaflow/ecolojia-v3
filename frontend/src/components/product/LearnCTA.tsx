import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';

/**
 * LearnCTA.tsx - Lien contextuel vers Reperes Ecolojia
 * Affiche la categorie du produit et lien vers la section correspondante
 */

interface LearnCTAProps {
  category: string;
  categoryLabel: string;
  emoji?: string;
}

const CATEGORY_TO_ANCHOR: Record<string, string> = {
  vegetables: 'reperes-vegetables',
  proteins: 'reperes-proteins',
  starchy: 'reperes-starchy',
  fats: 'reperes-fats',
  dairy: 'reperes-dairy',
  pleasure: 'reperes-pleasure',
};

const CATEGORY_COLORS: Record<string, string> = {
  vegetables: 'bg-green-50 border-green-200 text-green-800',
  proteins: 'bg-orange-50 border-orange-200 text-orange-800',
  starchy: 'bg-amber-50 border-amber-200 text-amber-800',
  fats: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  dairy: 'bg-sky-50 border-sky-200 text-sky-800',
  pleasure: 'bg-pink-50 border-pink-200 text-pink-800',
};

const LearnCTA: React.FC<LearnCTAProps> = ({ category, categoryLabel, emoji }) => {
  const anchor = CATEGORY_TO_ANCHOR[category] || 'reperes-intro';
  const colorClass = CATEGORY_COLORS[category] || 'bg-gray-50 border-gray-200 text-gray-800';

  return (
    <Link
      to={`/learn/reperes#${anchor}`}
      className={`block rounded-xl border p-4 transition-all hover:shadow-md ${colorClass}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/60 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {emoji && <span className="text-lg">{emoji}</span>}
              <span className="font-medium text-sm">{categoryLabel}</span>
            </div>
            <p className="text-xs opacity-75 mt-0.5">Comprendre sa place dans l equilibre</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-50" />
      </div>
    </Link>
  );
};

export default LearnCTA;
