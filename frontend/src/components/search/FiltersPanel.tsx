// frontend/src/components/search/FiltersPanel.tsx
// M8 Enhanced - Panneau de filtres avec facettes Algolia

import React from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface FiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    categories: string[];
    brands: string[];
    scoreBuckets: string[];
    priceRanges: string[];
  };
  selectedFilters: {
    category?: string;
    brand?: string;
    scoreBucket?: string;
    priceRange?: string;
  };
  facetCounts: {
    category?: Record<string, number>;
    brand?: Record<string, number>;
    scoreBucket?: Record<string, number>;
    priceRange?: Record<string, number>;
  };
  onFilterChange: (filterType: string, value: string | null) => void;
  onClearAll: () => void;
  isLoading?: boolean;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  isOpen,
  onClose,
  filters,
  selectedFilters,
  facetCounts,
  onFilterChange,
  onClearAll,
  isLoading = false
}) => {
  const [expandedSections, setExpandedSections] = React.useState({
    category: true,
    brand: true,
    scoreBucket: true,
    priceRange: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.values(selectedFilters).filter(Boolean).length;
  };

  const scoreBucketLabels = {
    '81-100': 'Excellent (81-100)',
    '61-80': 'Bon (61-80)',
    '41-60': 'Moyen (41-60)',
    '21-40': 'Faible (21-40)',
    '0-20': 'Très faible (0-20)'
  };

  const categoryLabels = {
    'food': 'Alimentaire',
    'cosmetics': 'Cosmétiques',
    'detergents': 'Détergents'
  };

  const priceRangeLabels = {
    '0-5': 'Moins de 5€',
    '5-15': '5€ - 15€',
    '15-30': '15€ - 30€',
    '30+': 'Plus de 30€'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-80 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">
              Filtres {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {isLoading ? (
            <div className="p-4">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              
              {/* Categories */}
              <FilterSection
                title="Catégories"
                isExpanded={expandedSections.category}
                onToggle={() => toggleSection('category')}
              >
                {filters.categories.map(category => (
                  <FilterItem
                    key={category}
                    label={categoryLabels[category] || category}
                    count={facetCounts.category?.[category] || 0}
                    isSelected={selectedFilters.category === category}
                    onClick={() => onFilterChange(
                      'category', 
                      selectedFilters.category === category ? null : category
                    )}
                  />
                ))}
              </FilterSection>

              {/* Score de santé */}
              <FilterSection
                title="Score de santé"
                isExpanded={expandedSections.scoreBucket}
                onToggle={() => toggleSection('scoreBucket')}
              >
                {filters.scoreBuckets.map(bucket => (
                  <FilterItem
                    key={bucket}
                    label={scoreBucketLabels[bucket] || bucket}
                    count={facetCounts.scoreBucket?.[bucket] || 0}
                    isSelected={selectedFilters.scoreBucket === bucket}
                    onClick={() => onFilterChange(
                      'scoreBucket',
                      selectedFilters.scoreBucket === bucket ? null : bucket
                    )}
                    colorIndicator={getScoreColor(bucket)}
                  />
                ))}
              </FilterSection>

              {/* Marques */}
              <FilterSection
                title="Marques"
                isExpanded={expandedSections.brand}
                onToggle={() => toggleSection('brand')}
              >
                {filters.brands.slice(0, 10).map(brand => (
                  <FilterItem
                    key={brand}
                    label={brand}
                    count={facetCounts.brand?.[brand] || 0}
                    isSelected={selectedFilters.brand === brand}
                    onClick={() => onFilterChange(
                      'brand',
                      selectedFilters.brand === brand ? null : brand
                    )}
                  />
                ))}
                {filters.brands.length > 10 && (
                  <div className="text-sm text-gray-500 mt-2">
                    +{filters.brands.length - 10} autres marques
                  </div>
                )}
              </FilterSection>

              {/* Prix */}
              <FilterSection
                title="Prix"
                isExpanded={expandedSections.priceRange}
                onToggle={() => toggleSection('priceRange')}
              >
                {filters.priceRanges.map(range => (
                  <FilterItem
                    key={range}
                    label={priceRangeLabels[range] || range}
                    count={facetCounts.priceRange?.[range] || 0}
                    isSelected={selectedFilters.priceRange === range}
                    onClick={() => onFilterChange(
                      'priceRange',
                      selectedFilters.priceRange === range ? null : range
                    )}
                  />
                ))}
              </FilterSection>

            </div>
          )}
        </div>

        {/* Footer */}
        {getActiveFiltersCount() > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onClearAll}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Effacer tous les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children
}) => (
  <div>
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-2 text-left"
    >
      <h3 className="font-medium text-gray-900">{title}</h3>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </button>
    {isExpanded && (
      <div className="mt-2 space-y-2">
        {children}
      </div>
    )}
  </div>
);

interface FilterItemProps {
  label: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  colorIndicator?: string;
}

const FilterItem: React.FC<FilterItemProps> = ({
  label,
  count,
  isSelected,
  onClick,
  colorIndicator
}) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors ${
      isSelected
        ? 'bg-blue-50 text-blue-700 border border-blue-200'
        : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-center gap-2">
      {colorIndicator && (
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: colorIndicator }}
        />
      )}
      <span className="truncate">{label}</span>
    </div>
    <span className={`text-xs px-2 py-1 rounded-full ${
      isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
    }`}>
      {count}
    </span>
  </button>
);

const getScoreColor = (bucket: string) => {
  switch (bucket) {
    case '81-100': return '#10B981'; // green
    case '61-80': return '#84CC16';  // lime
    case '41-60': return '#F59E0B';  // amber
    case '21-40': return '#EF4444';  // red
    case '0-20': return '#991B1B';   // dark red
    default: return '#6B7280';       // gray
  }
};

export default FiltersPanel;
