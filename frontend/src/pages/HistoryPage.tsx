// PATH: frontend/src/pages/HistoryPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Package, 
  Heart, 
  Droplets, 
  ChevronRight,
  Search,
  Filter,
  Trash2,
  Star,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { aiAnalysisService } from '../services/aiAnalysisService';

interface HistoryItem {
  id: string;
  product: {
    name: string;
    brand?: string;
    category: 'food' | 'cosmetics' | 'detergents';
    barcode?: string;
  };
  analysis: {
    healthScore: number;
    category: string;
    recommendations: string[];
  };
  analyzedAt: Date;
  isFavorite?: boolean;
}

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [historyItems, searchQuery, selectedCategory, sortBy]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const history = await aiAnalysisService.getHistory(50);
      setHistoryItems(history.map((item, index) => ({
        ...item,
        id: `history-${index}`,
        analyzedAt: new Date(item.timestamp || Date.now())
      })));
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortItems = () => {
    let filtered = [...historyItems];

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.product.category === selectedCategory);
    }

    // Trier
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return b.analyzedAt.getTime() - a.analyzedAt.getTime();
      } else {
        return b.analysis.healthScore - a.analysis.healthScore;
      }
    });

    setFilteredItems(filtered);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return <Package className="w-4 h-4" />;
      case 'cosmetics':
        return <Heart className="w-4 h-4" />;
      case 'detergents':
        return <Droplets className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreTrend = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 40) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const toggleFavorite = (id: string) => {
    setHistoryItems(prev => prev.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const deleteItem = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      setHistoryItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const viewAnalysis = (item: HistoryItem) => {
    navigate('/results', { 
      state: { 
        result: {
          product: item.product,
          analysis: item.analysis,
          timestamp: item.analyzedAt
        }
      }
    });
  };

  // Statistiques
  const stats = {
    total: historyItems.length,
    avgScore: historyItems.length > 0 
      ? Math.round(historyItems.reduce((sum, item) => sum + item.analysis.healthScore, 0) / historyItems.length)
      : 0,
    byCategory: {
      food: historyItems.filter(item => item.product.category === 'food').length,
      cosmetics: historyItems.filter(item => item.product.category === 'cosmetics').length,
      detergents: historyItems.filter(item => item.product.category === 'detergents').length
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec stats */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Historique des analyses</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total analyses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Score moyen</p>
              <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                {stats.avgScore}/100
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Alimentaire</p>
              <p className="text-2xl font-bold text-gray-900">{stats.byCategory.food}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Cosmétiques</p>
              <p className="text-2xl font-bold text-gray-900">{stats.byCategory.cosmetics}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barre de recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtre par catégorie */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Toutes catégories</option>
              <option value="food">Alimentaire</option>
              <option value="cosmetics">Cosmétiques</option>
              <option value="detergents">Détergents</option>
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="date">Plus récents</option>
              <option value="score">Meilleur score</option>
            </select>
          </div>
        </div>

        {/* Liste des analyses */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Chargement...</span>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Aucun résultat trouvé' 
                : 'Aucune analyse enregistrée'
              }
            </h2>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedCategory !== 'all'
                ? 'Essayez avec d\'autres critères de recherche'
                : 'Commencez à analyser des produits pour voir votre historique ici'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <button
                onClick={() => navigate('/scan')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Analyser un produit
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => viewAnalysis(item)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Icône catégorie */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.product.category === 'food' ? 'bg-green-100 text-green-600' :
                        item.product.category === 'cosmetics' ? 'bg-pink-100 text-pink-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {getCategoryIcon(item.product.category)}
                      </div>

                      {/* Informations produit */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                            {item.product.brand && (
                              <p className="text-sm text-gray-600">{item.product.brand}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Analysé le {item.analyzedAt.toLocaleDateString()}
                            </p>
                          </div>
                          
                          {/* Score et actions */}
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${getScoreColor(item.analysis.healthScore)}`}>
                                {item.analysis.healthScore}/100
                              </div>
                              <div className="flex items-center justify-end mt-1">
                                {getScoreTrend(item.analysis.healthScore)}
                                <span className="text-xs text-gray-600 ml-1">
                                  {item.analysis.category}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleFavorite(item.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  item.isFavorite 
                                    ? 'bg-yellow-100 text-yellow-600' 
                                    : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-2 bg-gray-100 text-gray-400 rounded-lg hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;