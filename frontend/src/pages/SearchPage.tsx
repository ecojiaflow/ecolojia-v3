// PATH: frontend/src/pages/SearchPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Camera, X, Package } from 'lucide-react';
import { productService, visionService } from '../services/api';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
  scores?: {
    healthScore?: number;
    environmentScore?: number;
    nutriscore?: string;
    ecoscore?: string;
    nova?: number;
  };
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
  const [uploadingImage, setUploadingImage] = useState(false);

  const performSearch = useCallback(async (searchQuery: string, searchCategory: Category | '', searchPage: number) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filters = {
        category: searchCategory || undefined,
        page: searchPage,
        limit: 20
      };
      
      // Log pour debug
      console.log('🔍 Recherche:', searchQuery, 'Filtres:', filters);
      
      const response = await productService.search(searchQuery, filters);
      
      // Log pour debug
      console.log('📦 Réponse API:', response);
      
      // La réponse est déjà la data, pas besoin de response.data
      if (response && response.products) {
        console.log('✅ Produits trouvés:', response.products.length);
        setProducts(response.products);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        console.log('❌ Aucun produit dans la réponse');
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
      toast.error('Erreur lors de la recherche');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  const debouncedSearch = useCallback(
    debounce((q: string, cat: Category | '', p: number) => {
      performSearch(q, cat, p);
    }, 500),
    [performSearch]
  );

  useEffect(() => {
    if (query) {
      performSearch(query, category, page);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setPage(1);
    debouncedSearch(newQuery, category, 1);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await visionService.analyzeImage(file);
      
      if (result?.barcode) {
        navigate(`/results?barcode=${result.barcode}`);
      } else if (result?.text) {
        setQuery(result.text);
        performSearch(result.text, category, 1);
      } else {
        toast.error('Aucun texte ou code-barres détecté dans l\'image');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'analyse de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product._id}`);
  };

  const getCategoryBadge = (cat: Category) => {
    const badges = {
      food: { label: 'Alimentaire', color: 'bg-green-100 text-green-800', icon: '🍎' },
      cosmetics: { label: 'Cosmétique', color: 'bg-pink-100 text-pink-800', icon: '💄' },
      detergents: { label: 'Détergent', color: 'bg-blue-100 text-blue-800', icon: '🧽' },
    };
    return badges[cat] || { label: cat, color: 'bg-gray-100 text-gray-800', icon: '📦' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
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

  const getNovaColor = (nova?: number) => {
    if (!nova) return 'bg-gray-400';
    if (nova === 1) return 'bg-green-600';
    if (nova === 2) return 'bg-yellow-500';
    if (nova === 3) return 'bg-orange-500';
    return 'bg-red-600';
  };

  // Debug - afficher l'état actuel
  useEffect(() => {
    console.log('📊 État actuel - Produits:', products.length, 'Loading:', loading, 'Error:', error);
  }, [products, loading, error]);

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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            <select
              value={category}
              onChange={handleCategoryChange}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Toutes catégories</option>
              <option value="food">🍎 Alimentaire</option>
              <option value="cosmetics">💄 Cosmétiques</option>
              <option value="detergents">🧽 Détergents</option>
            </select>
            
            <label className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer flex items-center gap-2 transition-colors">
              <Camera className="h-5 w-5" />
              <span>{uploadingImage ? 'Analyse...' : 'Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
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
            <LoadingSpinner size="large" />
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Compteur de résultats */}
            <div className="mb-4 text-gray-600">
              {products.length} produit(s) trouvé(s) pour "{query}"
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
                >
                  {/* Image produit */}
                  <div className="h-48 overflow-hidden bg-gray-100">
                    {product.images?.front ? (
                      <img
                        src={product.images.front}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle" dy=".3em"%3ENo image%3C/text%3E%3C/svg%3E';
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
                    <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p className="text-gray-600 text-sm mb-3">{product.brand}</p>
                    )}
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(product.category).color}`}>
                        {getCategoryBadge(product.category).icon} {getCategoryBadge(product.category).label}
                      </span>
                      
                      {product.scores?.nutriscore && (
                        <span className={`px-2 py-1 text-white rounded text-xs font-bold ${getNutriScoreColor(product.scores.nutriscore)}`}>
                          {product.scores.nutriscore}
                        </span>
                      )}
                      
                      {product.scores?.nova && (
                        <span className={`px-2 py-1 text-white rounded text-xs font-bold ${getNovaColor(product.scores.nova)}`}>
                          NOVA {product.scores.nova}
                        </span>
                      )}
                      
                      {product.scores?.ecoscore && (
                        <span className={`px-2 py-1 text-white rounded text-xs font-bold ${getNutriScoreColor(product.scores.ecoscore)}`}>
                          ECO {product.scores.ecoscore}
                        </span>
                      )}
                    </div>
                    
                    {/* Scores */}
                    {product.scores && (
                      <div className="flex gap-4 text-sm">
                        {product.scores.healthScore !== undefined && (
                          <div>
                            <span className="text-gray-600">Santé:</span>
                            <span className={`font-medium ml-1 ${getScoreColor(product.scores.healthScore)}`}>
                              {product.scores.healthScore}/100
                            </span>
                          </div>
                        )}
                        {product.scores.environmentScore !== undefined && (
                          <div>
                            <span className="text-gray-600">Environnement:</span>
                            <span className={`font-medium ml-1 ${getScoreColor(product.scores.environmentScore)}`}>
                              {product.scores.environmentScore}/100
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm p-8">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Commencez à taper pour rechercher des produits</p>
            <p className="text-gray-500 mt-2">Ou utilisez l'appareil photo pour scanner un produit</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;