// PATH: frontend/src/pages/FavoritesPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Search, Filter, Grid, List, Package,
  Heart, ShoppingCart, Share2, Trash2, Plus,
  TrendingUp, AlertCircle, Download, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/apiClient';
import { API_CONFIG } from '../config/api.config';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface FavoriteProduct {
  _id: string;
  productId: string;
  name: string;
  brand: string;
  image?: string;
  category: 'food' | 'cosmetic' | 'household';
  barcode?: string;
  scores: {
    health: number;
    environment: number;
    social: number;
    overall: number;
  };
  nutriScore?: string;
  novaGroup?: number;
  price?: number;
  addedAt: string;
  notes?: string;
  tags: string[];
}

interface FavoriteList {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  productsCount: number;
  isDefault: boolean;
  createdAt: string;
}

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [selectedList, setSelectedList] = useState<string>('all');
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [showCreateList, setShowCreateList] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Nouveau liste form
  const [newListForm, setNewListForm] = useState({
    name: '',
    description: '',
    color: '#7DDE4A',
    icon: 'Ã¢Ãƒâ€šÃ‚Â­Ãƒâ€šÃ‚Â'
  });

  const listIcons = ['Ã¢Ãƒâ€šÃ‚Â­Ãƒâ€šÃ‚Â', 'Ã¢Ãƒâ€šÃ‚ÂÃƒâ€šÃ‚Â¤ÃƒÂ¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â', 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‚ÂºÃ¢Ã¢â€šÂ¬Ã¢â€žÂ¢', 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¥Ã¢Ã¢â€šÂ¬Ã¢â‚¬Â', 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã¢Ã¢â€šÂ¬Ã…Â¾', 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Â¹', 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã‹Å“Ãƒâ€šÃ‚Â¶', 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€šÃ‚Â '];
  const listColors = ['#7DDE4A', '#4A90E2', '#F5A623', '#D0021B', '#9013FE', '#50E3C2'];

  useEffect(() => {
    fetchFavorites();
  }, [selectedList]);

  useEffect(() => {
    filterAndSortFavorites();
  }, [favorites, searchQuery, sortBy]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      
      // RÃ©cupÃ©rer les listes et les favoris
      const [favoritesData, listsData] = await Promise.all([
        api.get<FavoriteProduct[]>(
          selectedList === 'all' 
            ? API_CONFIG.ENDPOINTS.FAVORITES.LIST 
            : `${API_CONFIG.ENDPOINTS.FAVORITES.LIST}?listId=${selectedList}`
        ),
        api.get<FavoriteList[]>(`${API_CONFIG.ENDPOINTS.FAVORITES.LIST}/lists`)
      ]);
      
      setFavorites(favoritesData);
      setLists(listsData);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      setError('Impossible de charger vos favoris');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortFavorites = () => {
    let filtered = [...favorites];
    
    // Recherche
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'score':
          return b.scores.overall - a.scores.overall;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    setFilteredFavorites(filtered);
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await api.delete(API_CONFIG.ENDPOINTS.FAVORITES.REMOVE.replace(':productId', productId));
      setFavorites(prev => prev.filter(item => item.productId !== productId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  const handleBulkRemove = async () => {
    if (!selectedItems.size) return;
    if (!window.confirm(`Retirer ${selectedItems.size} produits des favoris ?`)) return;
    
    try {
      await Promise.all(
        Array.from(selectedItems).map(productId =>
          api.delete(API_CONFIG.ENDPOINTS.FAVORITES.REMOVE.replace(':productId', productId))
        )
      );
      setFavorites(prev => prev.filter(item => !selectedItems.has(item.productId)));
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Error bulk removing:', err);
    }
  };

  const handleCreateList = async () => {
    if (!newListForm.name.trim()) return;
    
    try {
      const newList = await api.post(`${API_CONFIG.ENDPOINTS.FAVORITES.LIST}/lists`, newListForm);
      setLists(prev => [...prev, newList]);
      setShowCreateList(false);
      setNewListForm({ name: '', description: '', color: '#7DDE4A', icon: 'Ã¢Ãƒâ€šÃ‚Â­Ãƒâ€šÃ‚Â' });
    } catch (err) {
      console.error('Error creating list:', err);
    }
  };

  const handleExportList = async () => {
    if (!isPremium()) {
      navigate('/pricing');
      return;
    }
    
    try {
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.FAVORITES.LIST}/export?format=csv`,
        { responseType: 'blob' }
      );
      
      // TÃ©lÃ©charger le fichier
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `favoris-ecolojia.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting:', err);
    }
  };

  const handleShareList = () => {
    // CrÃ©er un lien de partage
    const shareUrl = `${window.location.origin}/shared-list/${selectedList}`;
    navigator.clipboard.writeText(shareUrl);
    
    // Afficher une notification
    alert('Lien copiÃ© dans le presse-papier !');
  };

  const toggleItemSelection = (productId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€¦Ã‚Â½';
      case 'cosmetic': return 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã¢Ã¢â€šÂ¬Ã…Â¾';
      case 'household': return 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Â¹';
      default: return 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ã¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â¦';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F4] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F9F4] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#3B3B3B] mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchFavorites}
            className="mt-4 px-6 py-3 bg-[#7DDE4A] text-white rounded-full hover:bg-[#6bc93a] transition-all"
          >
            RÃ©essayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#DDE9DA]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#3B3B3B] flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500 fill-current" />
                Mes Favoris
              </h1>
              <p className="text-gray-600 mt-1">
                {favorites.length} produit{favorites.length !== 1 ? 's' : ''} sauvegardÃ©{favorites.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex gap-3">
              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkRemove}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Retirer ({selectedItems.size})
                </button>
              )}
              
              <button
                onClick={handleShareList}
                className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#3A7BC8] transition-all flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
              
              <button
                onClick={handleExportList}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  isPremium()
                    ? 'bg-[#7DDE4A] text-white hover:bg-[#6bc93a]'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>

          {/* Listes de favoris */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedList('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedList === 'all'
                  ? 'bg-[#7DDE4A] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous les favoris
            </button>
            
            {lists.map(list => (
              <button
                key={list._id}
                onClick={() => setSelectedList(list._id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedList === list._id
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedList === list._id ? list.color : undefined
                }}
              >
                <span>{list.icon}</span>
                <span>{list.name}</span>
                <span className="text-sm opacity-75">({list.productsCount})</span>
              </button>
            ))}
            
            <button
              onClick={() => setShowCreateList(true)}
              className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle liste
            </button>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#DDE9DA] mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher dans vos favoris..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
              >
                <option value="date">Plus rÃ©cents</option>
                <option value="score">Meilleur score</option>
                <option value="name">Nom A-Z</option>
              </select>
              
              <div className="flex border border-[#DDE9DA] rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-3 ${viewMode === 'grid' ? 'bg-[#E9F8DF] text-[#7DDE4A]' : 'hover:bg-gray-50'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-3 ${viewMode === 'list' ? 'bg-[#E9F8DF] text-[#7DDE4A]' : 'hover:bg-gray-50'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des favoris */}
        {filteredFavorites.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-[#DDE9DA]">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#3B3B3B] mb-2">
              {searchQuery ? 'Aucun favori trouvÃ©' : 'Aucun favori pour le moment'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Essayez avec d\'autres termes de recherche' 
                : 'Ajoutez vos produits prÃ©fÃ©rÃ©s pour les retrouver facilement'}
            </p>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 bg-[#7DDE4A] text-white rounded-full hover:bg-[#6bc93a] transition-all"
            >
              DÃ©couvrir des produits
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }>
            <AnimatePresence>
              {filteredFavorites.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl shadow-sm border border-[#DDE9DA] overflow-hidden hover:shadow-md transition-all group ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Checkbox de sÃ©lection */}
                  <div className={`absolute top-4 left-4 z-10 ${viewMode === 'list' ? 'relative top-0 left-0 p-4' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.productId)}
                      onChange={() => toggleItemSelection(item.productId)}
                      className="w-5 h-5 text-[#7DDE4A] rounded focus:ring-[#7DDE4A]"
                    />
                  </div>
                  
                  {/* Image */}
                  <div className={`relative overflow-hidden bg-gray-100 ${
                    viewMode === 'grid' ? 'h-48' : 'w-32 h-32'
                  }`}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">{getCategoryIcon(item.category)}</span>
                      </div>
                    )}
                    
                    {/* Badge favori */}
                    <Heart className="absolute bottom-2 right-2 w-6 h-6 text-red-500 fill-current" />
                  </div>
                  
                  {/* Contenu */}
                  <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <h3 
                      className="font-semibold text-[#3B3B3B] mb-1 line-clamp-1 cursor-pointer hover:text-[#7DDE4A]"
                      onClick={() => navigate(`/product/${item.productId}`)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{item.brand}</p>
                    
                    {/* Scores */}
                    <div className={`flex items-center gap-4 mb-3 ${viewMode === 'list' ? 'flex-wrap' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className={`text-2xl font-bold ${getScoreColor(item.scores.overall)}`}>
                          {item.scores.overall}
                        </div>
                        <span className="text-sm text-gray-500">/100</span>
                      </div>
                      
                      {item.nutriScore && (
                        <div className={`px-3 py-1 rounded-full text-sm font-bold text-white ${
                          item.nutriScore === 'A' ? 'bg-green-500' :
                          item.nutriScore === 'B' ? 'bg-lime-500' :
                          item.nutriScore === 'C' ? 'bg-yellow-500' :
                          item.nutriScore === 'D' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}>
                          {item.nutriScore}
                        </div>
                      )}
                      
                      {item.price && (
                        <div className="text-lg font-semibold text-[#3B3B3B]">
                          {item.price}Ã¢Ã¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
                        </div>
                      )}
                    </div>
                    
                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-[#E9F8DF] text-[#7DDE4A] rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{item.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Notes */}
                    {item.notes && (
                      <p className="text-sm text-gray-600 italic mb-3 line-clamp-2">
                        "{item.notes}"
                      </p>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => navigate(`/product/${item.productId}`)}
                        className="text-[#7DDE4A] hover:text-[#6bc93a] font-medium text-sm"
                      >
                        Voir dÃ©tails Ã¢Ã¢Ã¢â€šÂ¬Ã‚Â Ã¢Ã¢â€šÂ¬Ã¢â€žÂ¢
                      </button>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {/* TODO: Ajouter au panier */}}
                          className="p-2 text-gray-400 hover:text-[#7DDE4A] transition-colors"
                          title="Ajouter au panier"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleRemoveFavorite(item.productId)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Retirer des favoris"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal crÃ©ation de liste */}
      {showCreateList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-[#3B3B3B] mb-6">
              CrÃ©er une nouvelle liste
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la liste
                </label>
                <input
                  type="text"
                  value={newListForm.name}
                  onChange={(e) => setNewListForm({ ...newListForm, name: e.target.value })}
                  placeholder="Ex: Produits bio"
                  className="w-full px-4 py-2 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={newListForm.description}
                  onChange={(e) => setNewListForm({ ...newListForm, description: e.target.value })}
                  placeholder="Description de votre liste..."
                  rows={3}
                  className="w-full px-4 py-2 border border-[#DDE9DA] rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IcÃ´ne
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {listIcons.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewListForm({ ...newListForm, icon })}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        newListForm.icon === icon
                          ? 'border-[#7DDE4A] bg-[#E9F8DF]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <div className="flex gap-2">
                  {listColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewListForm({ ...newListForm, color })}
                      className={`w-10 h-10 rounded-full border-4 transition-all ${
                        newListForm.color === color
                          ? 'border-gray-800 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateList(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateList}
                disabled={!newListForm.name.trim()}
                className="flex-1 px-4 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6bc93a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CrÃ©er la liste
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Statistiques */}
      {favorites.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="bg-gradient-to-r from-[#7DDE4A] to-[#6bc93a] rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6">Vos statistiques favorites</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">{favorites.length}</div>
                <div className="text-white/80">Produits favoris</div>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">
                  {Math.round(favorites.reduce((acc, item) => acc + item.scores.overall, 0) / favorites.length)}
                </div>
                <div className="text-white/80">Score moyen</div>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">
                  {favorites.filter(item => item.scores.overall >= 80).length}
                </div>
                <div className="text-white/80">Produits excellents</div>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">{lists.length}</div>
                <div className="text-white/80">Listes crÃ©Ã©es</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;


