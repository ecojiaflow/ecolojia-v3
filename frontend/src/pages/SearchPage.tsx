// PATH: frontend/src/pages/SearchPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Camera, X, Package, Loader2 } from 'lucide-react';
import { productService } from '../services/api';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';

// Import des nouveaux composants M6
import ScoreChip from '../components/ScoreChip';
import DomainBadges, { mapCategoryToDomain } from '../components/DomainBadges';

type Category = 'food' | 'cosmetics' | 'detergents';

interface Product {
  _id: string;
  barcode?: string;
  name: string;
  brand?: string;
  category: Category;
  images?: {
    front?: string;
  };
  image_url?: string;
  imageUrl?: string;
  scores?: {
    healthScore?: number;
    environmentScore?: number;
    nutriscore?: string;
    ecoscore?: string;
    nova?: number;
    // Ajout scores M6
    global?: number;
  };
  // Compatibilité scores existants
  ethicalScore?: number;
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<Category | ''>((searchParams.get('category') as Category) || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string, searchCategory: Category | '', searchPage: number) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Créer les filtres en excluant les valeurs vides
      const filters: Record<string, any> = {
        page: searchPage,
        limit: 20
      };
      
      // Ajouter category seulement si elle a une valeur
      if (searchCategory) {
        filters.category = searchCategory;
      }
      
      console.log('🔍 Recherche:', searchQuery, 'Filtres:', filters);
      
      const response = await productService.search(searchQuery, filters);
      
      console.log('📦 Réponse complète:', response);
      
      if (response && response.success && response.products) {
        setProducts(response.products);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        setProducts([]);
        setError('Aucun produit trouvé');
      }
      
      // Mettre à jour l'URL
      const newParams = new URLSearchParams();
      newParams.set('q', searchQuery);
      if (searchCategory) newParams.set('category', searchCategory);
      if (searchPage > 1) newParams.set('page', searchPage.toString());
      setSearchParams(newParams);
      
    } catch (error: any) {
      console.error('❌ Erreur recherche:', error);
      setError(error.message || 'Erreur lors de la recherche');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // Recherche au chargement de la page
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlCategory = (searchParams.get('category') as Category) || '';
    const urlPage = Number(searchParams.get('page')) || 1;
    
    if (urlQuery) {
      performSearch(urlQuery, urlCategory, urlPage);
    }
  }, []); // Une seule fois au montage

  const debouncedSearch = useCallback(
    debounce((q: string, cat: Category | '', p: number) => {
      performSearch(q, cat, p);
    }, 500),
    [performSearch]
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setPage(1);
    if (newQuery.trim()) {
      debouncedSearch(newQuery, category, 1);
    } else {
      setProducts([]);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as Category | '';
    setCategory(newCategory);
    setPage(1);
    if (query) {
      performSearch(query, newCategory, 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    performSearch(query, category, newPage);
    window.scrollTo(0, 0);
  };

  const handleProductClick = (product: Product) => {
    navigate(`/result?id=${product._id}`);
  };

  // Fonction pour obtenir l'URL de l'image
  const getProductImage = (product: Product) => {
    return product.images?.front || product.image_url || product.imageUrl;
  };

  // Calcul du score global pour M6
  const getGlobalScore = (product: Product): number | null => {
    // Priorité au score global s'il existe
    if (product.scores?.global) return product.scores.global;
    
    // Conversion du score éthique si disponible
    if (product.ethicalScore) return product.ethicalScore * 100;
    
    // Calcul basé sur les scores existants
    if (product.scores?.healthScore || product.scores?.environmentScore) {
      const health = product.scores.healthScore || 0;
      const env = product.scores.environmentScore || 0;
      return Math.round((health + env) / 2);
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header de recherche */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Recherche de produits</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Rechercher un produit, une marque..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <select
              value={category}
              onChange={handleCategoryChange}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Toutes catégories</option>
              <option value="food">🍎 Alimentaire</option>
              <option value="cosmetics">💄 Cosmétiques</option>
              <option value="detergents">🧽 Détergents</option>
            </select>

            <button
              onClick={() => navigate('/scan')}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Scanner
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
            <span className="ml-3 text-gray-600">Recherche en cours...</span>
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Compteur de résultats */}
            <div className="mb-4 text-gray-600">
              {products.length} produit(s) trouvé(s) pour "{query}"
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const imageUrl = getProductImage(product);
                const globalScore = getGlobalScore(product);
                const activeDomains = product.category ? [mapCategoryToDomain(product.category)] : ['food'];
                
                return (
                  <div
                    key={product._id}
                    onClick={() => handleProductClick(product)}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
                  >
                    {/* Image produit */}
                    <div className="h-48 overflow-hidden bg-gray-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-24 h-24 text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Infos produit */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 flex-1">
                          {product.name}
                        </h3>
                        <ScoreChip 
                          score={globalScore} 
                          type={product.ethicalScore ? 'ethical' : 'percentage'}
                          ariaLabel="Score global"
                          className="flex-shrink-0" 
                        />
                      </div>
                      
                      {product.brand && (
                        <p className="text-gray-600 text-sm mb-3">{product.brand}</p>
                      )}
                      
                      {/* Badges domaines M6 + scores existants */}
                      <div className="mb-3">
                        <DomainBadges active={activeDomains} size="sm" className="mb-2" />
                        
                        {/* Badges scores existants */}
                        <div className="flex flex-wrap gap-1">
                          {product.scores?.nutriscore && (
                            <span className={`px-2 py-1 text-white rounded text-xs font-bold ${
                              product.scores.nutriscore === 'A' ? 'bg-green-600' :
                              product.scores.nutriscore === 'B' ? 'bg-lime-500' :
                              product.scores.nutriscore === 'C' ? 'bg-yellow-500' :
                              product.scores.nutriscore === 'D' ? 'bg-orange-500' : 'bg-red-600'
                            }`}>
                              Nutri-Score {product.scores.nutriscore}
                            </span>
                          )}
                          
                          {product.scores?.nova && (
                            <span className={`px-2 py-1 text-white rounded text-xs font-bold ${
                              product.scores.nova === 1 ? 'bg-green-600' :
                              product.scores.nova === 2 ? 'bg-yellow-500' :
                              product.scores.nova === 3 ? 'bg-orange-500' : 'bg-red-600'
                            }`}>
                              NOVA {product.scores.nova}
                            </span>
                          )}
                          
                          {product.scores?.ecoscore && (
                            <span className={`px-2 py-1 text-white rounded text-xs font-bold ${
                              product.scores.ecoscore === 'A' ? 'bg-green-600' :
                              product.scores.ecoscore === 'B' ? 'bg-lime-500' :
                              product.scores.ecoscore === 'C' ? 'bg-yellow-500' :
                              product.scores.ecoscore === 'D' ? 'bg-orange-500' : 'bg-red-600'
                            }`}>
                              Eco-Score {product.scores.ecoscore}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Scores détaillés */}
                      {product.scores && (product.scores.healthScore !== undefined || product.scores.environmentScore !== undefined) && (
                        <div className="flex gap-4 text-sm text-gray-600">
                          {product.scores.healthScore !== undefined && (
                            <div>
                              <span>Santé:</span>
                              <span className={`font-medium ml-1 ${
                                product.scores.healthScore >= 80 ? 'text-green-600' :
                                product.scores.healthScore >= 60 ? 'text-yellow-600' :
                                product.scores.healthScore >= 40 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {product.scores.healthScore}/100
                              </span>
                            </div>
                          )}
                          {product.scores.environmentScore !== undefined && (
                            <div>
                              <span>Environnement:</span>
                              <span className={`font-medium ml-1 ${
                                product.scores.environmentScore >= 80 ? 'text-green-600' :
                                product.scores.environmentScore >= 60 ? 'text-yellow-600' :
                                product.scores.environmentScore >= 40 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {product.scores.environmentScore}/100
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>
                
                <span className="px-4 py-2 text-gray-700">
                  Page {page} sur {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                  disabled={page === totalPages}
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : query && !loading ? (
          <div className="text-center py-12">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucun produit trouvé pour "{query}"</p>
            <p className="text-gray-500 mt-2">Essayez avec d'autres mots-clés ou changez de catégorie</p>
            <button
              onClick={() => navigate('/scan')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Scanner un produit
            </button>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm p-8">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Commencez à taper pour rechercher des produits</p>
            <button
              onClick={() => navigate('/scan')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Ou scanner un code-barre
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;


