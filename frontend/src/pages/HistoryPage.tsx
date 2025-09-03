// PATH: frontend/src/pages/HistoryPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ChevronDown,
  Star,
  AlertCircle,
  TrendingUp,
  Package,
  ArrowUpRight,
  Clock,
  CheckSquare,
  X
} from 'lucide-react';
import historyService from '../services/historyService';
import dashboardService from '../services/dashboardService';
import authService from '../services/authService';
import ConfigService from '../services/configService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface HistoryItem {
  _id: string;
  productId: string;
  productName: string;
  productBrand: string;
  category: string;
  analysisDate: string;
  scores: {
    health: number;
    environment: number;
    social: number;
    overall: number;
  };
  nutriScore?: string;
  novaGroup?: number;
  isFavorite: boolean;
  productImage?: string;
}

interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  pages: number;
}

interface FilterState {
  category: string;
  dateRange: string;
  minScore: number;
  sortBy: 'date' | 'score' | 'name';
  sortOrder: 'asc' | 'desc';
}

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    dateRange: 'all',
    minScore: 0,
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const itemsPerPage = 12;
  const isPremium = authService.isPremium();

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [currentPage, filters]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier si l'utilisateur est connecté
      const token = localStorage.getItem('ecolojia_token');
      
      if (!token && !ConfigService.isDemo()) {
        // Basculer en mode demo
        ConfigService.setMode('demo');
        setIsDemo(true);
        setShowLoginPrompt(true);
      }
      
      // Appeler le service
      const response = await historyService.getHistory({
        page: currentPage,
        limit: itemsPerPage,
        category: filters.category !== 'all' ? filters.category : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      // Gérer la réponse selon sa structure
      let historyData: HistoryItem[] = [];
      let total = 0;
      
      if (Array.isArray(response)) {
        // Ancien format : tableau direct
        historyData = response;
        total = response.length;
      } else if (response && typeof response === 'object') {
        // Nouveau format : objet avec items et métadonnées
        historyData = response.items || response.data || [];
        total = response.total || response.totalCount || historyData.length;
        
        // Mise à jour des pages si disponible
        if (response.pages) {
          setTotalPages(response.pages);
        } else if (response.totalPages) {
          setTotalPages(response.totalPages);
        }
      }

      // Filtrer selon la recherche
      let filteredHistory = historyData;
      if (searchQuery) {
        filteredHistory = historyData.filter(item =>
          item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.productBrand?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Filtrer selon le score minimum
      if (filters.minScore > 0) {
        filteredHistory = filteredHistory.filter(item =>
          (item.scores?.overall || 0) >= filters.minScore
        );
      }

      setHistory(filteredHistory);
      setTotalItems(total);
      
      // Calculer les pages si pas déjà fait
      if (!response.pages && !response.totalPages) {
        setTotalPages(Math.ceil(total / itemsPerPage));
      }
      
      setIsDemo(ConfigService.isDemo());
      
    } catch (error: any) {
      console.error('Error fetching history:', error);
      
      // Si on a une erreur isDemoMode, passer en mode demo
      if (error.isDemoMode || error.statusCode === 401) {
        ConfigService.setMode('demo');
        setIsDemo(true);
        setShowLoginPrompt(true);
        
        // Réessayer en mode demo
        setTimeout(() => fetchHistory(), 100);
      } else {
        setError('Impossible de charger votre historique');
        setHistory([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const dashboardStats = await dashboardService.getStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (isDemo) {
      alert('La suppression n\'est pas disponible en mode démonstration');
      return;
    }
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${ids.length} analyse(s) ?`)) {
      return;
    }

    try {
      await Promise.all(ids.map(id => historyService.deleteHistoryItem(id)));
      setSelectedItems([]);
      fetchHistory();
    } catch (error) {
      console.error('Error deleting items:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleExport = async () => {
    if (!isPremium) {
      navigate('/pricing');
      return;
    }

    try {
      const data = await historyService.exportHistory('csv');
      // Créer un blob et télécharger
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ecolojia-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting history:', error);
      alert('Erreur lors de l\'export');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍎';
      case 'cosmetic': return '💄';
      case 'detergent': return '🧼';
      default: return '📦';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Bannière mode démo */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#7DDE4A] text-white p-4"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">
                  Mode démonstration actif - Connectez-vous pour accéder à votre historique personnel
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white text-[#7DDE4A] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="text-white hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#DDE9DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#3B3B3B]">
                Historique des analyses
              </h1>
              <p className="text-gray-600 mt-2">
                {isDemo 
                  ? 'Découvrez des exemples d\'analyses de produits'
                  : 'Retrouvez tous vos produits scannés'
                }
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Filtrer</span>
              </button>
              
              <button
                onClick={handleExport}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isPremium 
                    ? 'bg-[#7DDE4A] text-white hover:bg-[#6BC93B]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!isPremium}
              >
                <Download className="w-5 h-5" />
                <span>Exporter</span>
                {!isPremium && (
                  <span className="bg-[#FFD700] text-[#3B3B3B] text-xs px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
              </button>
              
              {selectedItems.length > 0 && !isDemo && (
                <button
                  onClick={() => handleDelete(selectedItems)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Supprimer ({selectedItems.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total scans</p>
                  <p className="text-2xl font-bold text-[#3B3B3B] mt-1">
                    {stats.totalScans || 0}
                  </p>
                </div>
                <Package className="w-10 h-10 text-[#7DDE4A]" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Score moyen</p>
                  <p className="text-2xl font-bold text-[#3B3B3B] mt-1">
                    {stats.healthScoreAverage || 0}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-[#7DDE4A]" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Ce mois-ci</p>
                  <p className="text-2xl font-bold text-[#3B3B3B] mt-1">
                    +{stats.monthlyProgress || 0}%
                  </p>
                </div>
                <ArrowUpRight className="w-10 h-10 text-[#7DDE4A]" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Catégorie top</p>
                  <p className="text-2xl font-bold text-[#3B3B3B] mt-1">
                    {stats.topCategory || 'Alimentation'}
                  </p>
                </div>
                <Star className="w-10 h-10 text-[#7DDE4A]" />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b border-[#DDE9DA]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
                  >
                    <option value="all">Toutes</option>
                    <option value="food">Alimentation</option>
                    <option value="cosmetic">Cosmétiques</option>
                    <option value="detergent">Produits ménagers</option>
                  </select>
                </div>

                {/* Période */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Période
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
                  >
                    <option value="all">Toutes</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="year">Cette année</option>
                  </select>
                </div>

                {/* Score minimum */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score minimum: {filters.minScore}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={filters.minScore}
                    onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                    className="w-full accent-[#7DDE4A]"
                  />
                </div>

                {/* Tri */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trier par
                  </label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      setFilters({ ...filters, sortBy: sortBy as any, sortOrder: sortOrder as any });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
                  >
                    <option value="date-desc">Plus récent</option>
                    <option value="date-asc">Plus ancien</option>
                    <option value="score-desc">Meilleur score</option>
                    <option value="score-asc">Moins bon score</option>
                    <option value="name-asc">Nom A-Z</option>
                    <option value="name-desc">Nom Z-A</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre de recherche */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des produits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-24 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchHistory}
              className="mt-4 px-6 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6BC93B] transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucun produit dans votre historique</p>
            <button
              onClick={() => navigate('/scan')}
              className="mt-4 px-6 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6BC93B] transition-colors"
            >
              Scanner un produit
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(history) ? history : []).map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/product/${item.productId}`)}
                >
                  {/* Header avec checkbox */}
                  {!isDemo && (
                    <div className="px-6 pt-4 pb-2 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item._id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item._id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-[#7DDE4A] rounded focus:ring-[#7DDE4A]"
                        />
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(item.analysisDate), 'dd MMM yyyy', { locale: fr })}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contenu */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#3B3B3B] text-lg mb-1">
                          {item.productName}
                        </h3>
                        <p className="text-gray-600 text-sm">{item.productBrand}</p>
                      </div>
                      <span className="text-2xl ml-4">{getCategoryIcon(item.category)}</span>
                    </div>

                    {/* Scores */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Score global</span>
                        <span className={`text-lg font-bold ${getScoreColor(item.scores?.overall || 0)}`}>
                          {item.scores?.overall || 0}%
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2">
                        {item.nutriScore && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.nutriScore === 'A' ? 'bg-green-100 text-green-700' :
                            item.nutriScore === 'B' ? 'bg-lime-100 text-lime-700' :
                            item.nutriScore === 'C' ? 'bg-yellow-100 text-yellow-700' :
                            item.nutriScore === 'D' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Nutri-Score {item.nutriScore}
                          </span>
                        )}
                        {item.novaGroup && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            NOVA {item.novaGroup}
                          </span>
                        )}
                        {item.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Précédent
                </button>
                
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-[#7DDE4A] text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          currentPage === totalPages
                            ? 'bg-[#7DDE4A] text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
