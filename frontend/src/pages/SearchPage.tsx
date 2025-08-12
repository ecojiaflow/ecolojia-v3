// PATH: frontend\src\pages\SearchPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Loader, 
  AlertCircle, 
  TrendingUp,
  Clock,
  Sparkles,
  ChevronDown,
  Grid,
  List,
  SlidersHorizontal
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useUniversalSearch } from '@/hooks/useUniversalSearch';
import { searchService } from '@/services/searchService';
import analysisService from '@/services/analysisService';
import { useAuthStore } from '@/store/authStore';
import type { Product, SearchFilters, SearchResult } from '@/types';

// ==================== COMPOSANTS SEARCH ====================

// Widget de recherche réutilisable
const SearchWidget: React.FC<{
  variant?: 'compact' | 'expanded' | 'hero';
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}> = ({ 
  variant = 'expanded', 
  placeholder = 'Rechercher un produit, une marque, un ingrédient...',
  autoFocus = false,
  onSearch,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      analysisService.track('search_submit', { query, variant });
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    }
  };

  const isCompact = variant === 'compact';
  const isHero = variant === 'hero';

  return (
    <form 
      onSubmit={handleSubmit}
      className={`relative ${className}`}
    >
      <div className={`
        relative flex items-center
        ${isCompact ? 'w-full max-w-sm' : 'w-full'}
        ${isHero ? 'max-w-3xl mx-auto' : ''}
      `}>
        <div className={`
          relative flex-1 flex items-center
          ${isFocused ? 'ring-2 ring-[#7DDE4A] ring-opacity-50' : ''}
          ${isCompact 
            ? 'bg-white rounded-full shadow-sm border border-gray-200' 
            : 'bg-white rounded-2xl shadow-lg border border-gray-100'
          }
          transition-all duration-200
        `}>
          <Search className={`
            text-gray-400 
            ${isCompact ? 'w-4 h-4 ml-3' : 'w-5 h-5 ml-4'}
          `} />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`
              flex-1 bg-transparent outline-none
              ${isCompact 
                ? 'px-3 py-2 text-sm' 
                : 'px-4 py-4 text-base'
              }
              ${isHero ? 'text-lg' : ''}
              placeholder-gray-400
            `}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          <button
            type="submit"
            className={`
              bg-[#7DDE4A] text-white font-medium
              hover:bg-[#6bc73a] transition-colors
              ${isCompact 
                ? 'px-4 py-1.5 m-1 rounded-full text-sm' 
                : 'px-6 py-2.5 m-2 rounded-xl'
              }
            `}
          >
            Rechercher
          </button>
        </div>
      </div>

      {/* Suggestions pour la version hero */}
      {isHero && !query && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <span className="text-sm text-gray-500">Suggestions :</span>
          {['Bio', 'Sans gluten', 'Vegan', 'Local', 'Éco-score A'].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="px-3 py-1 bg-[#E9F8DF] text-gray-700 rounded-full text-sm
                       hover:bg-[#7DDE4A] hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
};

// Métriques contextuelles
const ContextualMetrics: React.FC<{
  totalResults: number;
  searchTime: number;
  filters: SearchFilters;
  viewMode: 'grid' | 'list';
}> = ({ totalResults, searchTime, filters, viewMode }) => {
  const activeFiltersCount = Object.values(filters).filter(v => 
    v && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="font-medium">
          {totalResults.toLocaleString()} résultat{totalResults > 1 ? 's' : ''}
        </span>
        
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {searchTime}ms
        </span>

        {activeFiltersCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-1 bg-[#E9F8DF] rounded-full">
            <Filter className="w-3.5 h-3.5" />
            {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {/* Toggle view mode */}}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {viewMode === 'grid' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

// Filtres avancés
const AdvancedFilters: React.FC<{
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ filters, onFiltersChange, isOpen, onToggle }) => {
  const categories = ['Alimentaire', 'Cosmétique', 'Entretien', 'Hygiène'];
  const scores = ['A', 'B', 'C', 'D', 'E'];
  const labels = ['Bio', 'Équitable', 'Local', 'Sans additifs'];

  return (
    <>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200
                   rounded-xl hover:border-[#7DDE4A] transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtres
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl
                       border border-gray-100 p-6 z-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Catégories */}
              <div>
                <h3 className="font-semibold mb-3">Catégorie</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.categories?.includes(cat) || false}
                        onChange={(e) => {
                          const newCategories = e.target.checked
                            ? [...(filters.categories || []), cat]
                            : filters.categories?.filter(c => c !== cat) || [];
                          onFiltersChange({ ...filters, categories: newCategories });
                        }}
                        className="rounded border-gray-300 text-[#7DDE4A]
                                 focus:ring-[#7DDE4A]"
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scores */}
              <div>
                <h3 className="font-semibold mb-3">Nutri-Score</h3>
                <div className="space-y-2">
                  {scores.map((score) => (
                    <label key={score} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.nutriScore?.includes(score) || false}
                        onChange={(e) => {
                          const newScores = e.target.checked
                            ? [...(filters.nutriScore || []), score]
                            : filters.nutriScore?.filter(s => s !== score) || [];
                          onFiltersChange({ ...filters, nutriScore: newScores });
                        }}
                        className="rounded border-gray-300 text-[#7DDE4A]
                                 focus:ring-[#7DDE4A]"
                      />
                      <span className={`
                        px-2 py-0.5 rounded text-xs font-bold text-white
                        ${score === 'A' ? 'bg-green-500' : ''}
                        ${score === 'B' ? 'bg-lime-500' : ''}
                        ${score === 'C' ? 'bg-yellow-500' : ''}
                        ${score === 'D' ? 'bg-orange-500' : ''}
                        ${score === 'E' ? 'bg-red-500' : ''}
                      `}>
                        {score}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Labels */}
              <div>
                <h3 className="font-semibold mb-3">Labels</h3>
                <div className="space-y-2">
                  {labels.map((label) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.labels?.includes(label) || false}
                        onChange={(e) => {
                          const newLabels = e.target.checked
                            ? [...(filters.labels || []), label]
                            : filters.labels?.filter(l => l !== label) || [];
                          onFiltersChange({ ...filters, labels: newLabels });
                        }}
                        className="rounded border-gray-300 text-[#7DDE4A]
                                 focus:ring-[#7DDE4A]"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => onFiltersChange({})}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Réinitialiser
              </button>
              <button
                onClick={onToggle}
                className="px-6 py-2 bg-[#7DDE4A] text-white rounded-xl
                          hover:bg-[#6bc73a] transition-colors"
              >
                Appliquer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Carte produit
const ProductCard: React.FC<{
  product: Product;
  viewMode: 'grid' | 'list';
}> = ({ product, viewMode }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const handleClick = () => {
    analysisService.track('product_click', {
      productId: product.id,
      productName: product.name,
      from: 'search'
    });
    navigate(`/product/${product.id}`);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.01 }}
        onClick={handleClick}
        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all
                   cursor-pointer border border-gray-100"
      >
        <div className="flex gap-4">
          <img
            src={product.image || '/placeholder.png'}
            alt={product.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.brand}</p>
            
            <div className="flex items-center gap-3 mt-2">
              {product.nutriScore && (
                <span className={`
                  px-2 py-0.5 rounded text-xs font-bold text-white
                  ${product.nutriScore === 'A' ? 'bg-green-500' : ''}
                  ${product.nutriScore === 'B' ? 'bg-lime-500' : ''}
                  ${product.nutriScore === 'C' ? 'bg-yellow-500' : ''}
                  ${product.nutriScore === 'D' ? 'bg-orange-500' : ''}
                  ${product.nutriScore === 'E' ? 'bg-red-500' : ''}
                `}>
                  {product.nutriScore}
                </span>
              )}
              
              {product.ecoScore && (
                <span className="text-xs px-2 py-0.5 bg-[#E9F8DF] text-gray-700 rounded">
                  Éco: {product.ecoScore}
                </span>
              )}
              
              {product.labels?.map((label) => (
                <span key={label} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                  {label}
                </span>
              ))}
            </div>
          </div>
          
          <div className="text-right">
            {product.healthScore && (
              <div className="text-2xl font-bold text-[#7DDE4A]">
                {product.healthScore}/100
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all
                 cursor-pointer border border-gray-100 overflow-hidden"
    >
      <div className="aspect-square relative overflow-hidden bg-gray-50">
        <img
          src={product.image || '/placeholder.png'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {product.isNew && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-[#7DDE4A] text-white
                          text-xs rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Nouveau
          </span>
        )}
        
        {product.nutriScore && (
          <span className={`
            absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white
            ${product.nutriScore === 'A' ? 'bg-green-500' : ''}
            ${product.nutriScore === 'B' ? 'bg-lime-500' : ''}
            ${product.nutriScore === 'C' ? 'bg-yellow-500' : ''}
            ${product.nutriScore === 'D' ? 'bg-orange-500' : ''}
            ${product.nutriScore === 'E' ? 'bg-red-500' : ''}
          `}>
            {product.nutriScore}
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-3">{product.brand}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {product.labels?.slice(0, 2).map((label) => (
              <span key={label} className="text-xs px-2 py-0.5 bg-[#E9F8DF]
                                          text-gray-700 rounded-full">
                {label}
              </span>
            ))}
          </div>
          
          {product.healthScore && (
            <div className="text-lg font-bold text-[#7DDE4A]">
              {product.healthScore}/100
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// États de chargement et erreur
const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader className="w-8 h-8 text-[#7DDE4A] animate-spin mb-4" />
    <p className="text-gray-500">Recherche en cours...</p>
  </div>
);

const EmptyState: React.FC<{ query: string }> = ({ query }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <Search className="w-16 h-16 text-gray-300 mb-4" />
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      Aucun résultat pour "{query}"
    </h3>
    <p className="text-gray-500 text-center max-w-md">
      Essayez avec d'autres mots-clés ou vérifiez l'orthographe
    </p>
  </div>
);

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      Une erreur est survenue
    </h3>
    <p className="text-gray-500 mb-4">
      Impossible de charger les résultats
    </p>
    <button
      onClick={onRetry}
      className="px-6 py-2 bg-[#7DDE4A] text-white rounded-xl
                 hover:bg-[#6bc73a] transition-colors"
    >
      Réessayer
    </button>
  </div>
);

// ==================== PAGE PRINCIPALE ====================
const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // États
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  
  // Récupération de la query depuis l'URL
  const query = searchParams.get('q') || '';
  
  // Hook de recherche universelle
  const {
    results,
    loading,
    error,
    searchTime,
    totalResults,
    search,
    clearResults
  } = useUniversalSearch();

  // Recherche au chargement et changement de query
  useEffect(() => {
    if (query) {
      search(query, filters);
    } else {
      clearResults();
    }
  }, [query, filters]);

  // Gestion de la recherche
  const handleSearch = useCallback((newQuery: string) => {
    setSearchParams({ q: newQuery });
    analysisService.track('search_performed', {
      query: newQuery,
      filters,
      userId: user?.id
    });
  }, [filters, user]);

  // Gestion des filtres
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    analysisService.track('filters_applied', {
      filters: newFilters,
      query
    });
  }, [query]);

  // Méta-données pour SEO
  useEffect(() => {
    document.title = query 
      ? `${query} - Recherche ECOLOJIA` 
      : 'Recherche de produits - ECOLOJIA';
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec SearchWidget intégré */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Retour
            </button>
            
            <div className="flex-1 max-w-2xl">
              <SearchWidget
                variant="compact"
                placeholder={query || "Rechercher..."}
                onSearch={handleSearch}
                autoFocus={!query}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filtres et métriques */}
        {(results.length > 0 || loading) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {query ? `Résultats pour "${query}"` : 'Tous les produits'}
              </h1>
              
              <div className="relative">
                <AdvancedFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  isOpen={showFilters}
                  onToggle={() => setShowFilters(!showFilters)}
                />
              </div>
            </div>

            {!loading && results.length > 0 && (
              <ContextualMetrics
                totalResults={totalResults}
                searchTime={searchTime}
                filters={filters}
                viewMode={viewMode}
              />
            )}
          </div>
        )}

        {/* États et résultats */}
        <AnimatePresence mode="wait">
          {loading && <LoadingState />}
          
          {!loading && error && (
            <ErrorState onRetry={() => search(query, filters)} />
          )}
          
          {!loading && !error && query && results.length === 0 && (
            <EmptyState query={query} />
          )}
          
          {!loading && !error && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                />
              ))}
            </motion.div>
          )}
          
          {!loading && !error && !query && (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Commencez votre recherche
              </h2>
              <p className="text-gray-500 mb-8">
                Trouvez des produits sains et éco-responsables
              </p>
              
              {/* Catégories populaires */}
              <div className="max-w-2xl mx-auto">
                <h3 className="text-sm font-semibold text-gray-600 mb-4">
                  CATÉGORIES POPULAIRES
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { name: 'Alimentaire', icon: '🍎', count: '12.5k' },
                    { name: 'Cosmétique', icon: '💄', count: '3.2k' },
                    { name: 'Entretien', icon: '🧹', count: '1.8k' },
                    { name: 'Hygiène', icon: '🧼', count: '2.1k' }
                  ].map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setFilters({ categories: [cat.name] });
                        handleSearch(cat.name);
                      }}
                      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md
                                transition-all border border-gray-100"
                    >
                      <div className="text-3xl mb-2">{cat.icon}</div>
                      <div className="font-medium text-gray-800">{cat.name}</div>
                      <div className="text-xs text-gray-500">{cat.count} produits</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tendances */}
              <div className="mt-12 max-w-2xl mx-auto">
                <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center
                              justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  TENDANCES DU MOMENT
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Sans additifs', 'Zéro déchet', 'Made in France', 'Bio équitable',
                    'Sans huile de palme'].map((trend) => (
                    <button
                      key={trend}
                      onClick={() => handleSearch(trend)}
                      className="px-4 py-2 bg-white rounded-full text-sm hover:bg-[#E9F8DF]
                                transition-colors border border-gray-200"
                    >
                      {trend}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Pagination (si résultats) */}
        {!loading && results.length > 0 && totalResults > results.length && (
          <div className="mt-8 flex justify-center">
            <button className="px-6 py-3 bg-[#7DDE4A] text-white rounded-xl
                              hover:bg-[#6bc73a] transition-colors">
              Charger plus de résultats
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;

