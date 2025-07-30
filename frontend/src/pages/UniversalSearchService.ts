// PATH: frontend/ecolojiaFrontV3/src/pages/UniversalSearchPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Sparkles, TrendingUp, Package, Clock, Zap } from 'lucide-react';
import { universalSearchEngine, SearchResult } from '../services/search/UniversalSearchService';
import BarcodeScanner from '../components/scanner/BarcodeScanner'; // ✅ Votre scanner existant
import { EnhancedSearchInterface } from '../components/search/EnhancedSearchInterface';

// ============================================================================
// COMPOSANT PRINCIPAL - RECHERCHE UNIVERSELLE
// ============================================================================

const UniversalSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ========== STATE ==========
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStats, setSearchStats] = useState<{
    totalResults: number;
    searchTime: number;
    sources: string[];
    query: string;
  } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    categories: ['food', 'cosmetics', 'detergents'] as const,
    scoreRange: [0, 100] as [number, number],
    excludeUltraProcessed: false,
    bioOnly: false
  });

  // Récupérer query depuis URL
  const initialQuery = searchParams.get('q') || '';

  // ========== EFFECTS ==========
  
  useEffect(() => {
    // Recherche automatique si query dans URL
    if (initialQuery.trim()) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  // ========== SEARCH HANDLERS ==========

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setSearchStats(null);
      return;
    }

    setIsSearching(true);
    const startTime = Date.now();

    try {
      console.log('🔍 Recherche universelle lancée:', query);
      
      const searchResults = await universalSearchEngine.search(query, {
        categories: selectedFilters.categories,
        enrichProducts: true,
        maxResults: 100
      });

      // Appliquer filtres
      let filteredResults = searchResults;
      
      if (selectedFilters.excludeUltraProcessed) {
        filteredResults = filteredResults.filter(r => !r.enrichment?.ultra_processed);
      }
      
      if (selectedFilters.bioOnly) {
        filteredResults = filteredResults.filter(r => 
          r.name.toLowerCase().includes('bio') || 
          (r.enrichment?.ecolojia_score || 0) >= 80
        );
      }
      
      if (selectedFilters.scoreRange[0] > 0 || selectedFilters.scoreRange[1] < 100) {
        filteredResults = filteredResults.filter(r => {
          const score = r.enrichment?.ecolojia_score || 50;
          return score >= selectedFilters.scoreRange[0] && score <= selectedFilters.scoreRange[1];
        });
      }

      const searchTime = Date.now() - startTime;
      const sources = [...new Set(searchResults.map(r => r.source))];
      
      setResults(filteredResults);
      setSearchStats({
        totalResults: filteredResults.length,
        searchTime,
        sources,
        query
      });

      // Mettre à jour URL sans reload
      setSearchParams({ q: query });

      console.log(`✅ Recherche terminée: ${filteredResults.length}/${searchResults.length} résultats en ${searchTime}ms`);

    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      setResults([]);
      setSearchStats(null);
    } finally {
      setIsSearching(false);
    }
  }, [selectedFilters, setSearchParams]);

  const handleResultSelect = useCallback((result: SearchResult) => {
    // Navigation vers analyse du produit
    const params = new URLSearchParams({
      productName: result.name,
      brand: result.brand || '',
      barcode: result.barcode || '',
      source: result.source,
      category: result.category
    });
    
    if (result.enrichment) {
      params.set('ecolojiaScore', result.enrichment.ecolojia_score.toString());
      if (result.enrichment.nova_group) {
        params.set('novaGroup', result.enrichment.nova_group.toString());
      }
    }
    
    navigate(`/analyze?${params.toString()}`);
  }, [navigate]);

  const handleScanSuccess = useCallback(async (barcode: string) => {
    setShowScanner(false);
    
    try {
      console.log('📊 Code-barres scanné:', barcode);
      
      const result = await universalSearchEngine.searchByBarcode(barcode);
      
      if (result) {
        setResults([result]);
        setSearchStats({
          totalResults: 1,
          searchTime: 0,
          sources: [result.source],
          query: `Code-barres: ${barcode}`
        });
        setSearchParams({ q: result.name, barcode });
      } else {
        // Produit non trouvé
        setResults([]);
        setSearchStats({
          totalResults: 0,
          searchTime: 0,
          sources: [],
          query: `Code-barres: ${barcode}`
        });
        setSearchParams({ barcode });
      }
    } catch (error) {
      console.error('❌ Erreur scan:', error);
    }
  }, [setSearchParams]);

  // ========== RENDER HELPERS ==========

  const renderResult = (result: SearchResult, index: number) => (
    <div
      key={`${result.id}-${index}`}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => handleResultSelect(result)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-4">
          {/* Nom produit et badges */}
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-bold text-gray-800 mr-3">{result.name}</h3>
            
            {/* Score ECOLOJIA */}
            {result.enrichment?.ecolojia_score && (
              <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
                result.enrichment.ecolojia_score >= 80 ? 'text-green-600 bg-green-100 border-green-200' :
                result.enrichment.ecolojia_score >= 60 ? 'text-yellow-600 bg-yellow-100 border-yellow-200' :
                result.enrichment.ecolojia_score >= 40 ? 'text-orange-600 bg-orange-100 border-orange-200' :
                'text-red-600 bg-red-100 border-red-200'
              }`}>
                {result.enrichment.ecolojia_score}/100
              </div>
            )}
          </div>
          
          {/* Marque */}
          {result.brand && (
            <p className="text-gray-600 mb-3">
              <span className="font-medium">Marque:</span> {result.brand}
            </p>
          )}
          
          {/* Badges détaillés */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Catégorie */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              result.category === 'food' ? 'text-green-600 bg-green-50 border-green-200' :
              result.category === 'cosmetics' ? 'text-pink-600 bg-pink-50 border-pink-200' :
              result.category === 'detergents' ? 'text-blue-600 bg-blue-50 border-blue-200' :
              'text-gray-600 bg-gray-50 border-gray-200'
            }`}>
              {result.category === 'food' ? '🍎 Alimentaire' :
               result.category === 'cosmetics' ? '✨ Cosmétique' :
               result.category === 'detergents' ? '🧽 Détergent' : '📦 Produit'}
            </span>

            {/* Source */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              result.source === 'local' ? 'text-blue-600 bg-blue-50 border-blue-200' :
              result.source === 'openfoodfacts' ? 'text-orange-600 bg-orange-50 border-orange-200' :
              'text-purple-600 bg-purple-50 border-purple-200'
            }`}>
              {result.source === 'local' ? '🏠 Base ECOLOJIA' :
               result.source === 'openfoodfacts' ? '🌍 OpenFoodFacts' :
               '⚡ Algolia'}
            </span>

            {/* NOVA Group */}
            {result.enrichment?.nova_group && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                result.enrichment.nova_group <= 2 ? 'text-green-600 bg-green-50 border-green-200' :
                result.enrichment.nova_group === 3 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                'text-red-600 bg-red-50 border-red-200'
              }`}>
                🔬 NOVA {result.enrichment.nova_group}
                {result.enrichment.nova_group === 1 && ' ✨'}
                {result.enrichment.nova_group === 4 && ' ⚠️'}
              </span>
            )}

            {/* Ultra-transformé */}
            {result.enrichment?.ultra_processed && (
              <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-medium">
                ⚠️ Ultra-transformé
              </span>
            )}

            {/* Alternatives */}
            {result.enrichment?.alternatives_available > 0 && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">
                🔄 {result.enrichment.alternatives_available} alternative{result.enrichment.alternatives_available > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Tips éducatifs */}
          {result.enrichment?.educational_tips && result.enrichment.educational_tips.length > 0 && (
            <div className="mb-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="text-sm font-medium text-orange-800 mb-2">💡 Insights ECOLOJIA :</div>
                <ul className="space-y-1">
                  {result.enrichment.educational_tips.slice(0, 2).map((tip, idx) => (
                    <li key={idx} className="text-sm text-orange-700">{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Barre de progression santé */}
          {result.enrichment?.health_score && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Impact Santé</span>
                <span>{result.enrichment.health_score}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    result.enrichment.health_score >= 70 ? 'bg-green-500' :
                    result.enrichment.health_score >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${result.enrichment.health_score}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Image produit */}
        {result.image && (
          <div className="flex-shrink-0">
            <img 
              src={result.image} 
              alt={result.name}
              className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          ID: {result.id}
          {result.barcode && ` • Code: ${result.barcode}`}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
            Analyser ECOLOJIA →
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => {
    if (searchStats?.query.includes('Code-barres')) {
      return (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-800 mb-3">Produit non trouvé</h3>
          <p className="text-gray-600 mb-6">
            Le code-barres scanné n'est pas encore dans notre base de données.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/multi-scan')}
              className="block mx-auto px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              📷 Analyser avec photo des ingrédients
            </button>
            <button
              onClick={() => {
                const barcode = searchParams.get('barcode');
                if (barcode) {
                  navigate(`/analyze?barcode=${barcode}&manual=true`);
                }
              }}
              className="block mx-auto px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              ✏️ Ajouter manuellement ce produit
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-16">
        <Search className="w-16 h-16 text-gray-300 mx-auto mb-6" />
        <h3 className="text-xl font-bold text-gray-800 mb-3">Aucun résultat trouvé</h3>
        <p className="text-gray-600 mb-6">
          Essayez des mots-clés différents ou scannez un code-barres.
        </p>
        <button
          onClick={() => setShowScanner(true)}
          className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
        >
          📷 Scanner un produit
        </button>
      </div>
    );
  };

  const renderInsights = () => {
    if (!results.length || !searchStats) return null;

    const avgScore = Math.round(
      results.reduce((sum, r) => sum + (r.enrichment?.ecolojia_score || 50), 0) / results.length
    );
    
    const ultraProcessedCount = results.filter(r => r.enrichment?.ultra_processed).length;
    const ultraProcessedPercent = Math.round((ultraProcessedCount / results.length) * 100);
    
    const sourcesCount = searchStats.sources.length;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div className="flex items-center mb-4">
          <Sparkles className="w-6 h-6 text-blue-500 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">Insights de Recherche</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{searchStats.totalResults}</div>
            <div className="text-gray-600">Produits trouvés</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{avgScore}/100</div>
            <div className="text-gray-600">Score moyen</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{ultraProcessedPercent}%</div>
            <div className="text-gray-600">Ultra-transformés</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{sourcesCount}</div>
            <div className="text-gray-600">Sources interrogées</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>💡 Conseil personnalisé :</strong>{' '}
            {avgScore >= 80 ? 
              "Excellente sélection ! Vous privilégiez des produits sains." :
              avgScore >= 60 ? 
              "Sélection correcte. Essayez de privilégier les produits bio ou moins transformés." :
              "Beaucoup de produits transformés. Filtrez par 'Bio uniquement' pour de meilleures alternatives."
            }
          </div>
        </div>
      </div>
    );
  };

  // ========== MAIN RENDER ==========

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour à l'accueil
            </button>
            
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <Search className="w-8 h-8 mr-3 text-green-500" />
              Recherche Universelle
              <span className="ml-3 text-sm font-normal text-green-600 bg-green-100 px-3 py-1 rounded-full">
                Multi-Sources IA
              </span>
            </h1>
            
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              📷 Scanner
            </button>
          </div>

          {/* Interface de recherche */}
          <EnhancedSearchInterface
            placeholder="🔍 Recherche universelle : nutella bio, shampoing sans sulfate, lessive écologique..."
            onResultSelect={handleResultSelect}
            showFilters={true}
            categories={selectedFilters.categories}
            className="mb-6"
          />

          {/* Stats recherche */}
          {searchStats && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <span className="font-medium">{searchStats.totalResults}</span> résultats pour "
                <span className="font-medium">{searchStats.query}</span>" 
                • <span className="font-medium">{searchStats.searchTime}ms</span>
                • Sources: <span className="font-medium">{searchStats.sources.join(', ')}</span>
              </div>
              
              {isSearching && (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                  <span>Recherche en cours...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Insights */}
        {renderInsights()}

        {/* Résultats */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {results.map((result, index) => renderResult(result, index))}
          </div>
        ) : searchStats ? (
          renderEmptyState()
        ) : (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-800 mb-3">Recherche Multi-Sources</h3>
            <p className="text-gray-600 mb-6">
              Recherchez parmi des milliers de produits depuis Algolia, OpenFoodFacts et notre base ECOLOJIA.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">🍎</div>
                <div className="font-medium">Alimentaire</div>
                <div className="text-sm text-gray-600">NOVA, additifs, bio</div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">✨</div>
                <div className="font-medium">Cosmétiques</div>
                <div className="text-sm text-gray-600">INCI, perturbateurs</div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">🧽</div>
                <div className="font-medium">Détergents</div>
                <div className="text-sm text-gray-600">Écologie, toxicité</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scanner modal - ✅ Votre composant existant */}
      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
};

export default UniversalSearchPage;