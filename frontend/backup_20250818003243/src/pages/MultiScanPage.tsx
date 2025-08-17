// frontend/src/pages/MultiScanPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  Camera, 
  Package, 
  Plus, 
  X, 
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Beaker,
  Droplet,
  Apple
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import analysisService from '../services/analysisService';
import { useAuth } from '../auth/context/AuthContext';

interface Product {
  id: string;
  name: string;
  barcode?: string;
  category: 'food' | 'cosmetic' | 'detergent';
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  result?: any;
  error?: string;
}

const MultiScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'food' | 'cosmetic' | 'detergent'>('food');

  // Ajouter un produit ƒÆ’†â€™ƒâ€š‚Â  analyser
  const addProduct = (name: string, barcode?: string) => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name,
      barcode,
      category: selectedCategory,
      status: 'pending'
    };
    setProducts([...products, newProduct]);
    setShowAddModal(false);
    setSearchQuery('');
  };

  // Supprimer un produit
  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Lancer l'analyse batch
  const startBatchAnalysis = async () => {
    if (products.length === 0) return;
    
    setIsAnalyzing(true);
    
    // Analyser chaque produit
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Mettre ƒÆ’†â€™ƒâ€š‚Â  jour le statut
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, status: 'analyzing' } : p
      ));
      
      try {
        // Appel API selon la categorie
        const result = await analysisService.analyze({
          name: product.name,
          barcode: product.barcode,
          category: product.category,
          ingredients: '' // ƒÆ’†â€™aâ€šÂ¬ ameliorer avec un vrai input
        });
        
        // Mettre ƒÆ’†â€™ƒâ€š‚Â  jour avec le resultat
        setProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { ...p, status: 'completed', result } 
            : p
        ));
      } catch (error: any) {
        // En cas d'erreur
        setProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { ...p, status: 'error', error: error.message } 
            : p
        ));
      }
      
      // Petit delai entre les analyses
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsAnalyzing(false);
  };

  // Obtenir l'icone selon la categorie
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return <Apple className="w-5 h-5" />;
      case 'cosmetic': return <Beaker className="w-5 h-5" />;
      case 'detergent': return <Droplet className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  // Obtenir la couleur selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'analyzing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Analyse Multi-Produits
          </h1>
          <p className="text-gray-600">
            Analysez plusieurs produits en une seule fois avec notre IA
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{products.length}</div>
            <div className="text-sm text-gray-500">Produits</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-500">Analyses</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {user?.subscription?.tier === 'premium' ? 'aƒâ€¹aâ‚¬Â ƒâ€¦‚Â¾' : '10'}
            </div>
            <div className="text-sm text-gray-500">Limite</div>
          </div>
        </div>

        {/* Liste des produits */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Produits ƒÆ’†â€™ƒâ€š‚Â  analyser
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={products.length >= 10 && user?.subscription?.tier !== 'premium'}
              className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun produit ajoute</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                Ajouter votre premier produit
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      product.category === 'food' ? 'bg-green-100' :
                      product.category === 'cosmetic' ? 'bg-pink-100' :
                      'bg-blue-100'
                    }`}>
                      {getCategoryIcon(product.category)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.barcode || product.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status */}
                    <div className={`flex items-center gap-2 ${getStatusColor(product.status)}`}>
                      {product.status === 'analyzing' && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {product.status === 'completed' && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {product.status === 'error' && (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {product.status === 'pending' && 'En attente'}
                        {product.status === 'analyzing' && 'Analyse...'}
                        {product.status === 'completed' && 'Termine'}
                        {product.status === 'error' && 'Erreur'}
                      </span>
                    </div>

                    {/* Actions */}
                    {product.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/products/${product.id}/${product.category}`)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                    
                    {product.status !== 'analyzing' && (
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton analyser */}
        {products.length > 0 && (
          <div className="text-center">
            <button
              onClick={startBatchAnalysis}
              disabled={isAnalyzing || products.every(p => p.status === 'completed')}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyser tous les produits
                </>
              )}
            </button>
          </div>
        )}

        {/* Note Premium */}
        {user?.subscription?.tier !== 'premium' && products.length >= 5 && (
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-purple-700 mb-2">
              Limite gratuite : 10 produits par analyse
            </p>
            <button
              onClick={() => navigate('/premium')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Passer ƒÆ’†â€™ƒâ€š‚Â  Premium pour des analyses illimitees aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢
            </button>
          </div>
        )}
      </div>

      {/* Modal d'ajout */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Ajouter un produit
              </h3>

              {/* Selection categorie */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorie
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'food', label: 'Alimentaire', icon: 'ƒÆ’‚Â°ƒâ€¦‚Â¸ƒâ€š‚Âƒâ€¦‚Â½' },
                    { value: 'cosmetic', label: 'Cosmetique', icon: 'aƒâ€¦aâ‚¬Å“ƒâ€š‚Â¨' },
                    { value: 'detergent', label: 'Detergent', icon: 'ƒÆ’‚Â°ƒâ€¦‚Â¸aaâ€šÂ¬aâ€žÂ¢ƒâ€š‚Â§' }
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value as any)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedCategory === cat.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-sm font-medium">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recherche produit */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du produit
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ex: Nutella, Shampooing L'Oreal..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => searchQuery && addProduct(searchQuery)}
                  disabled={!searchQuery}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiScanPage;


