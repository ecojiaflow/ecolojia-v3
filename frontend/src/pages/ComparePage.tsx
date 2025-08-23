// PATH: frontend/src/pages/ComparePage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Plus, Search, Info } from 'lucide-react';
import { productService } from '../services/productService';
import { useHistory } from '../hooks/useHistory';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Product } from '../types/api';

interface CompareProduct {
  id: string;
  product: Product;
  analysis?: any;
}

const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items: historyItems } = useHistory();
  const [compareProducts, setCompareProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Charger les produits depuis l'URL
  useEffect(() => {
    const productIds = searchParams.get('products')?.split(',') || [];
    if (productIds.length > 0) {
      loadProducts(productIds);
    } else {
      // Charger depuis localStorage
      const saved = localStorage.getItem('compareProducts');
      if (saved) {
        setCompareProducts(JSON.parse(saved));
      }
    }
  }, [searchParams]);

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (compareProducts.length > 0) {
      localStorage.setItem('compareProducts', JSON.stringify(compareProducts));
    }
  }, [compareProducts]);

  const loadProducts = async (productIds: string[]) => {
    setLoading(true);
    try {
      const products = await Promise.all(
        productIds.map(async (id) => {
          try {
            // Essayer de trouver dans l'historique
            const historyEntry = historyItems.find(item => 
              item.product.id === id || item.product.barcode === id
            );
            
            if (historyEntry) {
              return {
                id,
                product: historyEntry.product,
                analysis: historyEntry
              };
            }
            
            // Sinon, charger le produit
            const product = await productService.getById(id);
            return {
              id,
              product,
              analysis: null
            };
          } catch {
            return null;
          }
        })
      );
      
      setCompareProducts(products.filter(p => p !== null) as CompareProduct[]);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product: Product) => {
    if (compareProducts.length >= 4) {
      alert('Vous pouvez comparer jusqu\'à 4 produits maximum');
      return;
    }
    
    const exists = compareProducts.some(p => p.product.id === product.id);
    if (!exists) {
      setCompareProducts([...compareProducts, {
        id: product.id || product._id || '',
        product,
        analysis: null
      }]);
    }
    
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeProduct = (id: string) => {
    setCompareProducts(compareProducts.filter(p => p.id !== id));
  };

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await productService.search({
        query: searchQuery,
        limit: 10
      });
      setSearchResults(results.products);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    }
  };

  const getScoreClass = (score: number | string | undefined, type: 'nutriscore' | 'nova' | 'ecoscore' | 'health' = 'health') => {
    if (type === 'nutriscore' || type === 'ecoscore') {
      const letterScore = String(score).toUpperCase();
      if (letterScore === 'A') return 'bg-green-500 text-white';
      if (letterScore === 'B') return 'bg-lime-500 text-white';
      if (letterScore === 'C') return 'bg-yellow-500 text-white';
      if (letterScore === 'D') return 'bg-orange-500 text-white';
      if (letterScore === 'E') return 'bg-red-500 text-white';
      return 'bg-gray-300';
    }
    
    if (type === 'nova') {
      const novaScore = Number(score);
      if (novaScore === 1) return 'bg-green-500 text-white';
      if (novaScore === 2) return 'bg-lime-500 text-white';
      if (novaScore === 3) return 'bg-orange-500 text-white';
      if (novaScore === 4) return 'bg-red-500 text-white';
      return 'bg-gray-300';
    }
    
    // Score numérique
    const numScore = Number(score);
    if (numScore >= 80) return 'text-green-600';
    if (numScore >= 60) return 'text-yellow-600';
    if (numScore >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner label="Chargement des produits..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-eco-gray mb-8">Comparateur de produits</h1>
        
        {/* Zone de comparaison */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Produits à comparer */}
            {compareProducts.map((item) => (
              <div key={item.id} className="relative border border-eco-gray-100 rounded-2xl p-4">
                <button
                  onClick={() => removeProduct(item.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="mb-4">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-32 object-contain"
                    />
                  ) : (
                    <div className="w-full h-32 bg-eco-gray-50 flex items-center justify-center rounded-xl">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-eco-gray mb-1 line-clamp-2">
                  {item.product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{item.product.brand}</p>
                
                {/* Scores - utilise l'analyse si disponible */}
                <div className="space-y-2">
                  {item.analysis?.scores?.nutriscore && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Nutri-Score</span>
                      <span className={`px-3 py-1 rounded-full font-bold text-sm ${getScoreClass(item.analysis.scores.nutriscore, 'nutriscore')}`}>
                        {item.analysis.scores.nutriscore}
                      </span>
                    </div>
                  )}
                  
                  {item.analysis?.scores?.nova && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">NOVA</span>
                      <span className={`px-3 py-1 rounded-full font-bold text-sm ${getScoreClass(item.analysis.scores.nova, 'nova')}`}>
                        {item.analysis.scores.nova}
                      </span>
                    </div>
                  )}
                  
                  {item.analysis?.scores?.ecoscore && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Eco-Score</span>
                      <span className={`px-3 py-1 rounded-full font-bold text-sm ${getScoreClass(item.analysis.scores.ecoscore, 'ecoscore')}`}>
                        {item.analysis.scores.ecoscore}
                      </span>
                    </div>
                  )}
                  
                  {item.analysis?.scores?.healthScore !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Score santé</span>
                      <span className={`font-bold text-lg ${getScoreClass(item.analysis.scores.healthScore)}`}>
                        {item.analysis.scores.healthScore}/100
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Bouton ajouter */}
            {compareProducts.length < 4 && (
              <div className="border-2 border-dashed border-eco-gray-100 rounded-2xl p-4 flex items-center justify-center">
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex flex-col items-center text-gray-400 hover:text-gray-600"
                >
                  <Plus className="w-12 h-12 mb-2" />
                  <span className="text-sm">Ajouter un produit</span>
                </button>
              </div>
            )}
            
            {/* Remplissage si moins de 4 produits */}
            {Array.from({ length: Math.max(0, 3 - compareProducts.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="hidden lg:block"></div>
            ))}
          </div>
        </div>
        
        {/* Tableau de comparaison détaillé */}
        {compareProducts.length > 1 && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-eco-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-eco-gray">Critères</th>
                    {compareProducts.map((item) => (
                      <th key={item.id} className="p-4 text-center">
                        <div className="font-semibold text-eco-gray line-clamp-2">
                          {item.product.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-eco-gray-100">
                  {/* Nutri-Score */}
                  <tr>
                    <td className="p-4 font-medium text-eco-gray">Nutri-Score</td>
                    {compareProducts.map((item) => (
                      <td key={item.id} className="p-4 text-center">
                        {item.analysis?.scores?.nutriscore ? (
                          <span className={`px-3 py-1 rounded-full font-bold ${getScoreClass(item.analysis.scores.nutriscore, 'nutriscore')}`}>
                            {item.analysis.scores.nutriscore}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  
                  {/* NOVA */}
                  <tr className="bg-eco-gray-50">
                    <td className="p-4 font-medium text-eco-gray">Groupe NOVA</td>
                    {compareProducts.map((item) => (
                      <td key={item.id} className="p-4 text-center">
                        {item.analysis?.scores?.nova ? (
                          <span className={`px-3 py-1 rounded-full font-bold ${getScoreClass(item.analysis.scores.nova, 'nova')}`}>
                            {item.analysis.scores.nova}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Eco-Score */}
                  <tr>
                    <td className="p-4 font-medium text-eco-gray">Eco-Score</td>
                    {compareProducts.map((item) => (
                      <td key={item.id} className="p-4 text-center">
                        {item.analysis?.scores?.ecoscore ? (
                          <span className={`px-3 py-1 rounded-full font-bold ${getScoreClass(item.analysis.scores.ecoscore, 'ecoscore')}`}>
                            {item.analysis.scores.ecoscore}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Nombre d'ingrédients */}
                  <tr className="bg-eco-gray-50">
                    <td className="p-4 font-medium text-eco-gray">Nombre d'ingrédients</td>
                    {compareProducts.map((item) => (
                      <td key={item.id} className="p-4 text-center">
                        {item.product.ingredients?.length || '-'}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Additifs */}
                  <tr>
                    <td className="p-4 font-medium text-eco-gray">Additifs</td>
                    {compareProducts.map((item) => {
                      const additives = item.product.ingredients?.filter((ing: string) => 
                        ing.match(/E\d{3,4}/i)
                      ).length || 0;
                      
                      return (
                        <td key={item.id} className="p-4 text-center">
                          <span className={additives > 5 ? 'text-red-600 font-semibold' : additives > 2 ? 'text-orange-600' : 'text-green-600'}>
                            {additives}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Légende */}
            <div className="p-4 bg-eco-gray-50 border-t">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Info className="w-4 h-4" />
                <span>Plus le score est élevé, meilleur est le produit pour votre santé et l'environnement</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Message si aucun produit */}
        {compareProducts.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-eco-gray mb-2">
              Aucun produit à comparer
            </h2>
            <p className="text-gray-600 mb-6">
              Ajoutez des produits pour commencer la comparaison
            </p>
            <button
              onClick={() => navigate('/search')}
              className="btn"
            >
              Rechercher des produits
            </button>
          </div>
        )}
      </div>
      
      {/* Modal de recherche */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Ajouter un produit</h3>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); searchProducts(); }} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="input pl-10"
                  autoFocus
                />
              </div>
            </form>
            
            {/* Résultats de recherche */}
            <div className="max-h-96 overflow-y-auto">
              {searchResults.map((product) => (
                <button
                  key={product.id || product._id}
                  onClick={() => addProduct(product)}
                  className="w-full text-left p-3 hover:bg-eco-gray-50 rounded-xl transition-colors"
                >
                  <div className="font-medium text-eco-gray">{product.name}</div>
                  <div className="text-sm text-gray-600">{product.brand}</div>
                </button>
              ))}
            </div>
            
            {/* Suggestions depuis l'historique */}
            {searchResults.length === 0 && !searchQuery && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Suggestions depuis votre historique :</p>
                <div className="space-y-2">
                  {historyItems.slice(0, 5).map((item) => (
                    <button
                      key={item.timestamp}
                      onClick={() => addProduct(item.product)}
                      className="w-full text-left p-3 hover:bg-eco-gray-50 rounded-xl transition-colors"
                    >
                      <div className="font-medium text-eco-gray">{item.product.name}</div>
                      <div className="text-sm text-gray-600">{item.product.brand}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparePage;