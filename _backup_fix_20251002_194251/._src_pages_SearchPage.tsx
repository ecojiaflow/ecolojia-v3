// PATH: frontend/src/pages/SearchPage.tsx
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
  
  // �tats
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<Category | ''>((searchParams.get('category') as Category) || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Recherche avec debounce
  const performSearch = useCallback(async (searchQuery: string, searchCategory: Category | '', searchPage: number) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: any = {
        q: searchQuery,
        page: searchPage,
        limit: 20,
      };

      if (searchCategory) {
        params.category = searchCategory;
      }

      const { q, ...filters } = params;
      const response = await productService.search(q, filters);
      setProducts(response.products || response.data?.products || []);
      setTotalPages(response.totalPages || response.data?.totalPages || Math.ceil((response.data.total || 0) / 20) || 1);
      
      // Mettre � jour l'URL
      const newParams = new URLSearchParams();
      newParams.set('q', searchQuery);
      if (searchCategory) newParams.set('category', searchCategory);
      if (searchPage > 1) newParams.set('page', searchPage.toString());
      setSearchParams(newParams);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la recherche');
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // Debounce de la recherche
  const debouncedSearch = useCallback(
    debounce((q: string, cat: Category | '', p: number) => {
      performSearch(q, cat, p);
    }, 500),
    [performSearch]
  );

  // Effet pour la recherche initiale
  useEffect(() => {
    if (query) {
      performSearch(query, category, page);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Gestion de la recherche par texte
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setPage(1);
    debouncedSearch(newQuery, category, 1);
  };

  // Gestion du changement de cat�gorie
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as Category | '';
    setCategory(newCategory);
    setPage(1);
    if (query) {
      performSearch(query, newCategory, 1);
    }
  };

  // Gestion de la pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    performSearch(query, category, newPage);
    window.scrollTo(0, 0);
  };

  // Gestion de l'upload d'image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await visionService.analyzeImage(file);
      
      if (result.barcode) {
        // Si un code-barres est d�tect�, aller directement � la page r�sultat
        navigate(`/result?barcode=${result.barcode}`);
      } else if (result.text) {
        // Si du texte est d�tect�, lancer une recherche
        setQuery(result.text);
        performSearch(result.text, category, 1);
      } else {
        toast.error('Aucun texte ou code-barres d�tect� dans l\'image');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'analyse de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Navigation vers la page de r�sultat
  const handleProductClick = (product: Product) => {
    navigate(`/product/${product._id}`);
  };

  // Fonction pour obtenir le badge de cat�gorie
  const getCategoryBadge = (cat: Category) => {
    const badges = {
      food: { label: 'Alimentaire', color: 'bg-green-100 text-green-800' },
      cosmetics: { label: 'Cosm�tique', color: 'bg-pink-100 text-pink-800' },
      detergents: { label: 'D�tergent', color: 'bg-blue-100 text-blue-800' },
    };
    return badges[cat] || { label: cat, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Recherche de produits</h1>
          
          {/* Barre de recherche */}
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
            
            {/* Filtre cat�gorie */}
            <select
              value={category}
              onChange={handleCategoryChange}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Toutes cat�gories</option>
              <option value="food">Alimentaire</option>
              <option value="cosmetics">Cosm�tiques</option>
              <option value="detergents">D�tergents</option>
            </select>
            
            {/* Bouton photo */}
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

        {/* R�sultats */}
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
                  {/* Image produit */}
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
                    {/* Nom et marque */}
                    <h3 className="font-semibold text-lg text-gray-800 mb-1">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p className="text-gray-600 text-sm mb-3">{product.brand}</p>
                    )}
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {/* Badge cat�gorie */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(product.category).color}`}>
                        {getCategoryBadge(product.category).label}
                      </span>
                      
                      {/* Scores alimentaires */}
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
                      
                      {/* Eco-score */}
                      {product.ecoScore && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          �co-Score {product.ecoScore}
                        </span>
                      )}
                    </div>
                    
                    {/* Scores num�riques */}
                    {product.scores && (
                      <div className="flex gap-4 text-sm">
                        {product.scores.health !== undefined && (
                          <div>
                            <span className="text-gray-600">Sant�:</span>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pr�c�dent
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
            <p className="text-gray-600 text-lg">Aucun produit trouv� pour "{query}"</p>
            <p className="text-gray-500 mt-2">Essayez avec d'autres mots-cl�s ou changez de cat�gorie</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Commencez � taper pour rechercher des produits</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { SearchPage };




