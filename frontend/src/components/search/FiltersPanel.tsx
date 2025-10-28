import React from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface FiltersPanelProps {
  // État des filtres
  selectedBrands: string[];
  selectedCategories: string[];
  healthScoreRange: [number, number];
  
  // Facettes disponibles (depuis Algolia)
  availableBrands: Array<{ name: string; count: number }>;
  availableCategories: Array<{ name: string; count: number }>;
  
  // Callbacks
  onBrandsChange: (brands: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  onHealthScoreChange: (range: [number, number]) => void;
  onClear: () => void;
  
  className?: string;
}

export default function FiltersPanel({
  selectedBrands,
  selectedCategories,
  healthScoreRange,
  availableBrands,
  availableCategories,
  onBrandsChange,
  onCategoriesChange,
  onHealthScoreChange,
  onClear,
  className = ""
}: FiltersPanelProps) {
  const [expandedSections, setExpandedSections] = React.useState({
    brands: true,
    categories: true,
    healthScore: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter(b => b !== brand));
    } else {
      onBrandsChange([...selectedBrands, brand]);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const hasActiveFilters = selectedBrands.length > 0 || 
                          selectedCategories.length > 0 || 
                          healthScoreRange[0] > 0 || 
                          healthScoreRange[1] < 100;

  return (
    <div className={`bg-white rounded-lg shadow border p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-lg">Filtres</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Effacer
          </button>
        )}
      </div>

      {/* Marques */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('brands')}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <span className="font-medium text-gray-900">
            Marques {selectedBrands.length > 0 && `(${selectedBrands.length})`}
          </span>
          {expandedSections.brands ? (
            <ChevronUp className="w-4 h-4 text-neutral-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-700" />
          )}
        </button>
        
        {expandedSections.brands && (
          <div className="mt-2 max-h-48 overflow-y-auto">
            {availableBrands.slice(0, 10).map(brand => (
              <label key={brand.name} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.name)}
                  onChange={() => toggleBrand(brand.name)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{brand.name}</span>
                <span className="text-xs text-neutral-700">({brand.count})</span>
              </label>
            ))}
            {availableBrands.length === 0 && (
              <p className="text-sm text-neutral-700 py-2">Aucune marque disponible</p>
            )}
          </div>
        )}
      </div>

      {/* Catégories */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <span className="font-medium text-gray-900">
            Catégories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
          </span>
          {expandedSections.categories ? (
            <ChevronUp className="w-4 h-4 text-neutral-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-700" />
          )}
        </button>
        
        {expandedSections.categories && (
          <div className="mt-2 max-h-48 overflow-y-auto">
            {availableCategories.slice(0, 10).map(category => (
              <label key={category.name} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.name)}
                  onChange={() => toggleCategory(category.name)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{category.name}</span>
                <span className="text-xs text-neutral-700">({category.count})</span>
              </label>
            ))}
            {availableCategories.length === 0 && (
              <p className="text-sm text-neutral-700 py-2">Aucune catégorie disponible</p>
            )}
          </div>
        )}
      </div>

      {/* Score Santé */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('healthScore')}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <span className="font-medium text-gray-900">Score Santé</span>
          {expandedSections.healthScore ? (
            <ChevronUp className="w-4 h-4 text-neutral-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-700" />
          )}
        </button>
        
        {expandedSections.healthScore && (
          <div className="mt-2 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{healthScoreRange[0]}</span>
              <span>-</span>
              <span>{healthScoreRange[1]}</span>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs text-neutral-700">Minimum</label>
              <input
                type="range"
                min="0"
                max="100"
                value={healthScoreRange[0]}
                onChange={(e) => onHealthScoreChange([Number(e.target.value), healthScoreRange[1]])}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs text-neutral-700">Maximum</label>
              <input
                type="range"
                min="0"
                max="100"
                value={healthScoreRange[1]}
                onChange={(e) => onHealthScoreChange([healthScoreRange[0], Number(e.target.value)])}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
