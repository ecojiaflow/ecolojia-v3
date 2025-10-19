// PATH: frontend/src/pages/HistoryPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HistoryItem {
  productId: string;
  productName: string;
  productBrand: string;
  category: string;
  analysisDate: string;
  scores: { overall: number };
  nutriScore?: string;
  novaGroup?: number;
}

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('ecolojia_history');
      const data = stored ? JSON.parse(stored) : [];
      setHistory(data);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      setHistory([]);
    }
  };

  const filteredHistory = history.filter(
    item => item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.productBrand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 76) return 'text-primary';
    if (score >= 56) return 'text-lime-600';
    if (score >= 36) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return 'ðŸŽ';
      case 'cosmetic': return 'ðŸ’„';
      case 'detergent': return 'ðŸ§´';
      default: return 'ðŸ“¦';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F4] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#3B3B3B] mb-2">
            Historique des analyses
          </h1>
          <p className="text-gray-600">
            {history.length} produit(s) scanné(s)
          </p>
        </div>

        {/* Recherche */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
          />
        </div>

        {/* Liste */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">
              {searchQuery ? 'Aucun résultat' : 'Aucun produit dans votre historique'}
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="px-6 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6BC93B]"
            >
              Scanner un produit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((item, index) => (
              <motion.div
                key={`${item.productId}-${item.analysisDate}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/product/${item.productId}`)}
              >
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

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Score global</span>
                      <span className={`text-lg font-bold ${getScoreColor(item.scores?.overall || 0)}`}>
                        {item.scores?.overall || 0}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(item.analysisDate), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>

                    {(item.nutriScore || item.novaGroup) && (
                      <div className="flex items-center gap-2">
                        {item.nutriScore && (
                          <span className="px-3 py-1 bg-green-100 text-primary rounded-full text-xs font-medium">
                            Nutri-Score {item.nutriScore}
                          </span>
                        )}
                        {item.novaGroup && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            NOVA {item.novaGroup}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
