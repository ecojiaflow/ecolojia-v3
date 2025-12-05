import { getScoreColor, getScoreBgColor } from '@/utils/scoreColors';
import React from 'react';
import { Package } from 'lucide-react';

interface ProductHeaderProps {
  name: string;
  brand: string;
  barcode?: string;
  category: 'food' | 'cosmetics' | 'detergents';
  imageFront?: string;
  overallScore: number | null;
  onRequestScore?: () => void;
  isAnalyzing?: boolean;
  nutriscore?: string;
  nova?: number;
  ecoscore?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'food': return '??';
    case 'cosmetics': return '??';
    case 'detergents': return '??';
    default: return '??';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'food': return 'Alimentaire';
    case 'cosmetics': return 'Cosmétique';
    case 'detergents': return 'Détergent';
    default: return 'Produit';
  }
};



const getNutriScoreColor = (score?: string) => {
  const colors: Record<string, string> = {
    'A': 'bg-green-600',
    'B': 'bg-lime-500',
    'C': 'bg-yellow-500',
    'D': 'bg-orange-500',
    'E': 'bg-red-600'
  };
  return colors[score || ''] || 'bg-gray-400';
};

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  name,
  brand,
  barcode,
  category,
  imageFront,
  overallScore,
  nutriscore,
  nova,
  ecoscore
}) => {
  return (
    <div className="bg-white rounded-none md:rounded-xl shadow-sm p-4 md:p-6 mb-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Product Image */}
        <div className="md:col-span-1">
          {imageFront ? (
            <img
              src={imageFront}
              alt={name}
              className="w-full h-64 object-contain rounded-lg bg-gray-50"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-24 h-24 text-gray-300" />
            </div>
          )}
          
          {barcode && (
            <div className="mt-4 text-center">
              <p className="text-sm text-neutral-700">Code-barres</p>
              <p className="font-mono text-lg">{barcode}</p>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="md:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{name}</h1>
              <p className="text-xl text-gray-600 mt-1">{brand}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {getCategoryIcon(category)} {getCategoryLabel(category)}
                </span>
              </div>
            </div>

            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <p className="text-sm text-neutral-700 mt-1">Score global</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            {nutriscore && (
              <span className={`px-4 py-2 text-white rounded-lg font-bold ${getNutriScoreColor(nutriscore)}`}>
                Nutri-Score {nutriscore}
              </span>
            )}
            {nova && (
              <span className="px-4 py-2 bg-gray-600 text-white rounded-lg font-bold">
                NOVA {nova}
              </span>
            )}
            {ecoscore && (
              <span className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold">
                Eco-Score {ecoscore}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



