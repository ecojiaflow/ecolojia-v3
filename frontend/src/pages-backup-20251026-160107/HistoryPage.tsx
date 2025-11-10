import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Clock } from 'lucide-react';
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
    if (score >= 76) return 'text-success bg-success/10 border-success/20';
    if (score >= 56) return 'text-primary-600 bg-primary-100 border-primary-200';
    if (score >= 36) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-danger bg-danger/10 border-danger/20';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'food': 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20',
      'cosmetic': 'M12 11v6m0-12v6m0 6h.01',
      'detergent': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    };
    return icons[category] || icons['food'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Historique des analyses
          </h1>
          <p className="text-neutral-600">
            {history.length} produit(s) scanne(s)
          </p>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-0 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#236D3E] focus:border-transparent outline-none shadow-1"
          />
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 bg-neutral-0 rounded-xl shadow-2 border border-neutral-300">
            <Package className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 text-lg mb-4">
              {searchQuery ? 'Aucun resultat' : 'Aucun produit dans votre historique'}
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="h-11 px-6 bg-primary-500 text-forest rounded-lg font-medium hover:bg-primary-600 transition-all shadow-2"
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
                className="bg-neutral-0 rounded-lg shadow-2 hover:shadow-3 transition-all cursor-pointer border border-neutral-300"
                onClick={() => navigate(`/product/${item.productId}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                        {item.productName}
                      </h3>
                      <p className="text-neutral-600 text-sm">{item.productBrand}</p>
                    </div>
                    <svg className="w-6 h-6 text-neutral-600 ml-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={getCategoryIcon(item.category)} />
                    </svg>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Score global</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(item.scores?.overall || 0)}`}>
                        {item.scores?.overall || 0}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(item.analysisDate), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>

                    {(item.nutriScore || item.novaGroup) && (
                      <div className="flex items-center gap-2">
                        {item.nutriScore && (
                          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                            Nutri-Score {item.nutriScore}
                          </span>
                        )}
                        {item.novaGroup && (
                          <span className="px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-medium">
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