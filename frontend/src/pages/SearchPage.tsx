import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Camera, X } from 'lucide-react';
import { productService, visionService } from '../services/api';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';

type Category = 'food' | 'cosmetics' | 'detergents';

interface Product {
  _id: string;
  barcode?: string;
  name: string;
  brand?: string;
  category: Category;
  imageUrl?: string;
  scores?: {
    health?: number;
    environment?: number;
    social?: number;
  };
  nutriScore?: string;
  ecoScore?: string;
  novaGroup?: number;
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
      const response = await fetch(`https://ecolojia-backendvf.onrender.com/api/products/search?q=${searchQuery}&page=${searchPage}&limit=20${searchCategory ? `&category=${searchCategory}` : ''}`);
      const data = await response.json();
      
      if (data.success && data.products) {
        setProducts(data.products);
        setTotalPages(data.pagination?.pages || 1);
      }
      
      const newParams = new URLSearchParams();
      newParams.set('q', searchQuery);
      if (searchCategory) newParams.set('category', searchCategory);
      if (searchPage > 1) newParams.set('page', searchPage.toString());
      setSearchParams(newParams);
    } catch (error: any) {
      setError('Erreur lors de la recherche');
      toast.error('Erreur lors de la recherche');
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
  }, []);

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
      
      if (result.barcode) {
        navigate(`/result?barcode=${result.barcode}`);
      } else if (result.text) {
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
    if (product.barcode) {
      navigate(`/result?barcode=${product.barcode}&category=${product.category}`);
    } else {
      navigate(`/result?id=${product._id}&category=${product.category}`);
    }
  };

  const getCategoryBadge = (cat: Category) => {
    const badges = {
      food: { label: 'Alimentaire', color: 'bg-green-100 text-green-800' },
      cosmetics: { label: 'Cosmétique', color: 'bg-pink-100 text-pink-800' },
      detergents: { label: 'Détergent', color: 'bg-blue-100 text-blue-800' },
    };
    return badges[cat] || { label: cat, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              />
            </div>
            
            <select
              value={category}
              onChange={handleCategoryChange}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Toutes catégories</option>
              <option value="food">Alimentaire</option>
              <option value="cosmetics">Cosmétiques</option>
              <option value="detergents">Détergents</option>
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                >
                  {product.imageUrl && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-800 mb-1">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p className="text-gray-600 text-sm mb-3">{product.brand}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(product.category).color}`}>
                        {getCategoryBadge(product.category).label}
                      </span>
                      
                      {product.category === 'food' && (
                        <>
                          {product.nutriScore && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              Nutri-Score {product.nutriScore}
                            </span>
                          )}
                          {product.novaGroup && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              NOVA {product.novaGroup}
                            </span>
                          )}
                        </>
                      )}
                      
                      {product.ecoScore && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Éco-Score {product.ecoScore}
                        </span>
                      )}
                    </div>
                    
                    {product.scores && (
                      <div className="flex gap-4 text-sm">
                        {product.scores.health !== undefined && (
                          <div>
                            <span className="text-gray-600">Santé:</span>
                            <span className="font-medium ml-1">{product.scores.health}/100</span>
                          </div>
                        )}
                        {product.scores.environment !== undefined && (
                          <div>
                            <span className="text-gray-600">Environnement:</span>
                            <span className="font-medium ml-1">{product.scores.environment}/100</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                
                <span className="px-4 py-2 text-gray-700">
                  Page {page} sur {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : query && !loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Aucun produit trouvé pour "{query}"</p>
            <p className="text-gray-500 mt-2">Essayez avec d'autres mots-clés ou changez de catégorie</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Commencez à taper pour rechercher des produits</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
