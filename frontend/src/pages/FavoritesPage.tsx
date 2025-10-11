// PATH: frontend/src/pages/FavoritesPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, Search, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface FavoriteProduct {
  productId: string;
  productName: string;
  productBrand: string;
  scores: { overall: number };
  addedAt: string;
}

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem('ecolojia_favorites');
      const data = stored ? JSON.parse(stored) : [];
      setFavorites(data);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      setFavorites([]);
    }
  };

  const handleRemove = (productId: string) => {
    try {
      const updated = favorites.filter(f => f.productId !== productId);
      setFavorites(updated);
      localStorage.setItem('ecolojia_favorites', JSON.stringify(updated));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const filteredFavorites = favorites.filter(
    f => f.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         f.productBrand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 76) return 'text-green-600';
    if (score >= 56) return 'text-lime-600';
    if (score >= 36) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-[#F7F9F4] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#3B3B3B] flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-red-500" />
            Mes Favoris
          </h1>
          <p className="text-gray-600">{favorites.length} produit(s) enregistrÃ©(s)</p>
        </div>

        {/* Recherche */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans vos favoris..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
          />
        </div>

        {/* Liste */}
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">
              {searchQuery ? 'Aucun rÃ©sultat' : 'Aucun favori'}
            </p>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6BC93B]"
            >
              DÃ©couvrir des produits
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((product, index) => (
              <motion.div
                key={product.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/product/${product.productId}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#3B3B3B] text-lg mb-1">
                      {product.productName}
                    </h3>
                    <p className="text-gray-600 text-sm">{product.productBrand}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(product.productId);
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Score global</span>
                  <span className={`text-xl font-bold ${getScoreColor(product.scores?.overall || 0)}`}>
                    {product.scores?.overall || 0}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;