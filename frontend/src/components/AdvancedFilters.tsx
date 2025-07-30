import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { CategoryType, CATEGORIES } from '../types/categories';

interface FilterState {
  priceRange: [number, number];
  minScore: number;
  verified: boolean | null;
  tags: string[];
  zones: string[];
}

interface AdvancedFiltersProps {
  category: CategoryType;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  category,
  filters,
  onFiltersChange,
  isOpen,
  onToggle
}) => {
  const categoryConfig = CATEGORIES[category];
  
  // Tags populaires par catégorie
  const popularTags = {
    [CategoryType.ALIMENTAIRE]: ['bio', 'local', 'équitable', 'vegan', 'sans-gluten', 'artisanal'],
    [CategoryType.COSMETIQUE]: ['naturel', 'bio', 'vegan', 'cruelty-free', 'sans-parfum', 'hypoallergénique'],
    [CategoryType.MODE]: ['éthique', 'bio', 'recyclé', 'local', 'équitable', 'durable'],
    [CategoryType.MAISON]: ['écologique', 'naturel', 'biodégradable', 'sans-toxique', 'recyclable'],
    [CategoryType.ELECTRONIQUE]: ['reconditionné', 'réparable', 'durable', 'économe', 'recyclable'],
    [CategoryType.SPORT]: ['éco-conçu', 'recyclé', 'durable', 'éthique', 'local'],
    [CategoryType.MOBILITE]: ['électrique', 'hybride', 'partagé', 'doux', 'efficace']
  };

  const zones = ['FR', 'EU', 'Monde'];

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const resetFilters = () => {
    onFiltersChange({
      priceRange: [0, 100],
      minScore: 0,
      verified: null,
      tags: [],
      zones: []
    });
  };

  const activeFiltersCount = 
    (filters.minScore > 0 ? 1 : 0) +
    (filters.verified !== null ? 1 : 0) +
    filters.tags.length +
    filters.zones.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 100 ? 1 : 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <div className="flex items-center space-x-3">
          <span className="font-medium text-gray-900">Filtres avancés</span>
          {activeFiltersCount > 0 && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {/* Filtres */}
      {isOpen && (
        <div className="border-t border-gray-200 p-4 space-y-6">
          {/* Score éco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score éco minimum
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => updateFilters({ minScore: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900 w-12">
                {filters.minScore}%
              </span>
            </div>
          </div>

          {/* Prix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gamme de prix (€)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceRange[0]}
                onChange={(e) => updateFilters({ 
                  priceRange: [parseInt(e.target.value) || 0, filters.priceRange[1]] 
                })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceRange[1]}
                onChange={(e) => updateFilters({ 
                  priceRange: [filters.priceRange[0], parseInt(e.target.value) || 100] 
                })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Vérification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut de vérification
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="verified"
                  checked={filters.verified === null}
                  onChange={() => updateFilters({ verified: null })}
                  className="mr-2"
                />
                <span className="text-sm">Tous</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="verified"
                  checked={filters.verified === true}
                  onChange={() => updateFilters({ verified: true })}
                  className="mr-2"
                />
                <span className="text-sm">Vérifiés</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="verified"
                  checked={filters.verified === false}
                  onChange={() => updateFilters({ verified: false })}
                  className="mr-2"
                />
                <span className="text-sm">Non vérifiés</span>
              </label>
            </div>
          </div>

          {/* Tags spécialisés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Critères {categoryConfig.name.toLowerCase()}
            </label>
            <div className="flex flex-wrap gap-2">
              {popularTags[category]?.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = filters.tags.includes(tag)
                      ? filters.tags.filter(t => t !== tag)
                      : [...filters.tags, tag];
                    updateFilters({ tags: newTags });
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Zones de disponibilité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zones de disponibilité
            </label>
            <div className="flex space-x-4">
              {zones.map(zone => (
                <label key={zone} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.zones.includes(zone)}
                    onChange={(e) => {
                      const newZones = e.target.checked
                        ? [...filters.zones, zone]
                        : filters.zones.filter(z => z !== zone);
                      updateFilters({ zones: newZones });
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{zone}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
              <span>Réinitialiser</span>
            </button>
            <span className="text-sm text-gray-500">
              {activeFiltersCount} filtre{activeFiltersCount !== 1 ? 's' : ''} actif{activeFiltersCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;