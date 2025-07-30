// PATH: frontend/ecolojiaFrontV3/src/components/search/EnhancedSearchInterface.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Camera, Mic, X, Clock, TrendingUp, Sparkles, 
  Filter, ArrowRight, MapPin, Star, Zap, ChevronDown, 
  Package, Apple, Heart, Leaf
} from 'lucide-react';
import { universalSearchEngine, SearchResult, SearchSuggestion } from '../../services/search/UniversalSearchService';
import BarcodeScanner from '../scanner/BarcodeScanner';

// ============================================================================
// INTERFACES
// ============================================================================

interface EnhancedSearchInterfaceProps {
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
  showFilters?: boolean;
  categories?: ('food' | 'cosmetics' | 'detergents')[];
  className?: string;
}

interface SearchFilters {
  categories: ('food' | 'cosmetics' | 'detergents')[];
  scoreRange: [number, number];
  excludeUltraProcessed: boolean;
  bioOnly: boolean;
  localOnly: boolean;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const EnhancedSearchInterface: React.FC<EnhancedSearchInterfaceProps> = ({
  placeholder = "🔍 Découvrez des alternatives plus saines... (nutella bio, shampoing sans sulfate)",
  onResultSelect,
  showFilters = true,
  categories = ['food', 'cosmetics', 'detergents'],
  className = ''
}) => {
  const navigate = useNavigate();
  
  // ========== STATE ==========
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    categories: categories,
    scoreRange: [0, 100],
    excludeUltraProcessed: false,
    bioOnly: false,
    localOnly: false
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [searchStats, setSearchStats] = useState<{
    totalResults: number;
    searchTime: number;
    sources: string[];
  } | null>(null);

  // ========== REFS ==========
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const resultsRef = useRef<HTMLDivElement>(null);

  // ========== EFFECTS ==========
  
  useEffect(() => {
    // Auto-focus sur l'input au montage
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Gestion clavier global
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClearSearch();
      }
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ========== SEARCH HANDLERS ==========

  const handleQueryChange = useCallback(async (newQuery: string) => {
    setQuery(newQuery);

    // Clear timeouts précédents
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (newQuery.trim().length === 0) {
      setSuggestions([]);
      setResults([]);
      setShowSuggestions(false);
      setShowResults(false);
      return;
    }

    // Suggestions après 200ms
    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const newSuggestions = await universalSearchEngine.getSuggestions(newQuery);
        setSuggestions(newSuggestions);
        setShowSuggestions(true);
        setShowResults(false);
      } catch (error) {
        console.error('Erreur suggestions:', error);
      }
    }, 200);

    // Recherche complète après 800ms (si l'utilisateur arrête de taper)
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(newQuery);
    }, 800);

  }, []);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    
    if (!queryToSearch.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    
    const startTime = Date.now();

    try {
      console.log('🔍 Recherche lancée:', queryToSearch);
      
      const searchResults = await universalSearchEngine.search(queryToSearch, {
        categories: filters.categories,
        enrichProducts: true,
        maxResults: 50
      });

      // Appliquer filtres additionnels
      let filteredResults = searchResults;
      
      if (filters.excludeUltraProcessed) {
        filteredResults = filteredResults.filter(r => !r.enrichment?.ultra_processed);
      }
      
      if (filters.bioOnly) {
        filteredResults = filteredResults.filter(r => 
          r.name.toLowerCase().includes('bio') || 
          (r.enrichment?.ecolojia_score || 0) >= 80
        );
      }
      
      if (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100) {
        filteredResults = filteredResults.filter(r => {
          const score = r.enrichment?.ecolojia_score || 50;
          return score >= filters.scoreRange[0] && score <= filters.scoreRange[1];
        });
      }

      const searchTime = Date.now() - startTime;
      const sources = [...new Set(searchResults.map(r => r.source))];
      
      setResults(filteredResults);
      setShowResults(true);
      setSearchStats({
        totalResults: filteredResults.length,
        searchTime,
        sources
      });

      console.log(`✅ Recherche terminée: ${filteredResults.length} résultats en ${searchTime}ms`);

    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      setResults([]);
      setSearchStats(null);
    } finally {
      setIsSearching(false);
    }
  }, [query, filters]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    setShowSuggestions(false);
    handleSearch(suggestion.query);
  }, [handleSearch]);

  const handleResultClick = useCallback((result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Navigation par défaut vers page d'analyse
      const params = new URLSearchParams({
        productName: result.name,
        brand: result.brand || '',
        barcode: result.barcode || '',
        source: result.source
      });
      
      navigate(`/analyze?${params.toString()}`);
    }
  }, [onResultSelect, navigate]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowResults(false);
    setSearchStats(null);
    searchInputRef.current?.focus();
  }, []);

  // ========== SCANNER HANDLERS ==========

  const handleScanSuccess = useCallback(async (barcode: string) => {
    setShowScanner(false);
    
    try {
      console.log('📊 Code-barres scanné:', barcode);
      
      const result = await universalSearchEngine.searchByBarcode(barcode);
      
      if (result) {
        setQuery(result.name);
        setResults([result]);
        setShowResults(true);
        setSearchStats({
          totalResults: 1,
          searchTime: 0,
          sources: [result.source]
        });
      } else {
        // Produit non trouvé - proposer ajout manuel
        setQuery(`Code-barres: ${barcode}`);
        setResults([]);
        setShowResults(true);
        setSearchStats({
          totalResults: 0,
          searchTime: 0,
          sources: []
        });
      }
    } catch (error) {
      console.error('❌ Erreur analyse code-barres:', error);
    }
  }, []);

  // ========== VOICE SEARCH ==========

  const handleVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Recherche vocale non supportée par votre navigateur');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('🎤 Écoute vocale démarrée');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('🎤 Résultat vocal:', transcript);
      setQuery(transcript);
      handleSearch(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Erreur reconnaissance vocale:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('🎤 Écoute vocale terminée');
    };

    recognition.start();
  }, [handleSearch]);

  // ========== RENDER HELPERS ==========

  const renderSuggestion = (suggestion: SearchSuggestion, index: number) => (
    <div
      key={`${suggestion.query}-${index}`}
      className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
      onClick={() => handleSuggestionClick(suggestion)}
    >
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors">
        {suggestion.icon ? (
          <span className="text-lg">{suggestion.icon}</span>
        ) : suggestion.type === 'product' ? (
          <Package className="w-4 h-4 text-gray-500" />
        ) : suggestion.type === 'brand' ? (
          <Star className="w-4 h-4 text-gray-500" />
        ) : (
          <Search className="w-4 h-4 text-gray-500" />
        )}
      </div>
      
      <div className="flex-1">
        <span className="text-gray-800 font-medium">{suggestion.query}</span>
        {suggestion.type && (
          <span className="ml-2 text-xs text-gray-500 capitalize">
            {suggestion.type === 'product' ? 'Produit' : 
             suggestion.type === 'brand' ? 'Marque' : 
             suggestion.type === 'category' ? 'Catégorie' : 'Ingrédient'}
          </span>
        )}
      </div>
      
      <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  const renderResult = (result: SearchResult, index: number) => (
    <div
      key={`${result.id}-${index}`}
      className="flex items-start p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
      onClick={() => handleResultClick(result)}
    >
      {/* Image produit */}
      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg mr-4 overflow-hidden">
        {result.image ? (
          <img 
            src={result.image} 
            alt={result.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {result.category === 'food' ? (
              <Apple className="w-6 h-6 text-gray-400" />
            ) : result.category === 'cosmetics' ? (
              <Sparkles className="w-6 h-6 text-gray-400" />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 truncate">{result.name}</h3>
            {result.brand && (
              <p className="text-sm text-gray-600 mt-1">{result.brand}</p>
            )}
          </div>
          
          {/* Score ECOLOJIA */}
          {result.enrichment?.ecolojia_score && (
            <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
              result.enrichment.ecolojia_score >= 80 ? 'bg-green-100 text-green-800' :
              result.enrichment.ecolojia_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {result.enrichment.ecolojia_score}/100
            </div>
          )}
        </div>

        {/* Badges informatifs */}
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Catégorie */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            result.category === 'food' ? 'bg-green-100 text-green-700' :
            result.category === 'cosmetics' ? 'bg-pink-100 text-pink-700' :
            result.category === 'detergents' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {result.category === 'food' ? '🍎 Alimentaire' :
             result.category === 'cosmetics' ? '✨ Cosmétique' :
             result.category === 'detergents' ? '🧽 Détergent' : '📦 Produit'}
          </span>

          {/* Source */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            result.source === 'local' ? 'bg-blue-100 text-blue-700' :
            result.source === 'openfoodfacts' ? 'bg-orange-100 text-orange-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {result.source === 'local' ? '🏠 Local' :
             result.source === 'openfoodfacts' ? '🌍 OpenFoodFacts' :
             '⚡ Algolia'}
          </span>

          {/* Badges enrichissement */}
          {result.enrichment?.ultra_processed && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              ⚠️ Ultra-transformé
            </span>
          )}

          {result.enrichment?.nova_group && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              result.enrichment.nova_group <= 2 ? 'bg-green-100 text-green-700' :
              result.enrichment.nova_group === 3 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              NOVA {result.enrichment.nova_group}
            </span>
          )}

          {result.enrichment?.alternatives_available > 0 && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              🔄 {result.enrichment.alternatives_available} alternative{result.enrichment.alternatives_available > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Tips éducatifs */}
        {result.enrichment?.educational_tips && result.enrichment.educational_tips.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
              💡 {result.enrichment.educational_tips[0]}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ========== MAIN RENDER ==========

  return (
    <div className={`enhanced-search-interface relative ${className}`}>
      {/* Barre de recherche principale */}
      <div className="relative">
        <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-xl shadow-sm focus-within:border-green-500 focus-within:shadow-md transition-all">
          <Search className="absolute left-4 h-5 w-5 text-gray-400" />
          
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => query.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="flex-1 px-12 py-4 bg-transparent border-0 focus:outline-none text-gray-800 placeholder-gray-500"
            disabled={isSearching}
          />

          {/* Actions à droite */}
          <div className="flex items-center space-x-2 px-4">
            {/* Recherche vocale */}
            <button
              onClick={handleVoiceSearch}
              disabled={isListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-100 text-red-600' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="Recherche vocale"
            >
              <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
            </button>

            {/* Scanner code-barres */}
            <button
              onClick={() => setShowScanner(true)}
              className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
              title="Scanner code-barres"
            >
              <Camera className="h-4 w-4" />
            </button>

            {/* Filtres */}
            {showFilters && (
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`p-2 rounded-lg transition-colors ${
                  showFiltersPanel ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Filtres"
              >
                <Filter className="h-4 w-4" />
              </button>
            )}

            {/* Clear */}
            {query && (
              <button
                onClick={handleClearSearch}
                className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
                title="Effacer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Indicateur de recherche */}
        {isSearching && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
              <span className="text-sm text-blue-700">Recherche en cours sur toutes les sources...</span>
            </div>
          </div>
        )}

        {/* Raccourcis clavier */}
        <div className="absolute top-full right-0 mt-1">
          <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded shadow-sm">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl</kbd> + 
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs mx-1">K</kbd> 
            pour chercher
          </div>
        </div>
      </div>

      {/* Panel filtres */}
      {showFiltersPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Filtres de recherche</h3>
          
          {/* Catégories */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégories</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'food', label: '🍎 Alimentaire' },
                { key: 'cosmetics', label: '✨ Cosmétiques' },
                { key: 'detergents', label: '🧽 Détergents' }
              ].map(cat => (
                <label key={cat.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(cat.key as any)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...filters.categories, cat.key as any]
                        : filters.categories.filter(c => c !== cat.key);
                      setFilters(prev => ({ ...prev, categories: newCategories }));
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Options binaires */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.excludeUltraProcessed}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  excludeUltraProcessed: e.target.checked 
                }))}
                className="mr-2"
              />
              <span className="text-sm">Exclure ultra-transformés</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.bioOnly}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  bioOnly: e.target.checked 
                }))}
                className="mr-2"
              />
              <span className="text-sm">Bio uniquement</span>
            </label>
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 px-2 py-1">Suggestions</div>
            {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
          </div>
        </div>
      )}

      {/* Résultats */}
      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-96 overflow-y-auto"
        >
          {/* Header résultats */}
          {searchStats && (
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {searchStats.totalResults} résultat{searchStats.totalResults !== 1 ? 's' : ''} 
                  • {searchStats.searchTime}ms
                  • {searchStats.sources.join(', ')}
                </div>
                {searchStats.totalResults > 0 && (
                  <button
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(query)}`);
                      setShowResults(false);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Voir tous les résultats →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Liste résultats */}
          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {results.slice(0, 10).map((result, index) => renderResult(result, index))}
              
              {results.length > 10 && (
                <div className="p-4 text-center border-t border-gray-100">
                  <button
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(query)}`);
                      setShowResults(false);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Voir les {results.length - 10} autres résultats
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun résultat</h3>
              <p className="text-gray-600 mb-4">
                Aucun produit trouvé pour "<span className="font-medium">{query}</span>"
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setShowScanner(true)}
                  className="block w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  📷 Essayer le scanner code-barres
                </button>
                <button
                  onClick={() => {
                    navigate('/multi-scan');
                    setShowResults(false);
                  }}
                  className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ✨ Analyser un nouveau produit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scanner modal */}
      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}

      {/* Click overlay pour fermer */}
      {(showSuggestions || showResults || showFiltersPanel) && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowSuggestions(false);
            setShowResults(false);
            setShowFiltersPanel(false);
          }}
        />
      )}
    </div>
  );
};

export default EnhancedSearchInterface;