// frontend/src/components/dashboard/RecommendationsSection.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertTriangle, Sparkles, ChevronRight, Target, Heart, Leaf } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { useNavigate } from 'react-router-dom';

interface Recommendation {
  id: string;
  type: 'improvement' | 'warning' | 'opportunity' | 'achievement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionText?: string;
  actionRoute?: string;
  metrics?: {
    current: number;
    target: number;
    unit: string;
  };
  relatedProducts?: Array<{
    id: string;
    name: string;
    healthScore: number;
    improvement: number;
  }>;
}

export const RecommendationsSection: React.FC = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <TrendingUp className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'opportunity': return <Sparkles className="w-5 h-5" />;
      case 'achievement': return <Target className="w-5 h-5" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  const getColorClasses = (type: string, priority: string) => {
    const colors = {
      improvement: 'from-blue-500 to-blue-600',
      warning: 'from-yellow-500 to-orange-500',
      opportunity: 'from-purple-500 to-pink-500',
      achievement: 'from-green-500 to-emerald-500'
    };
    return colors[type as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const filteredRecommendations = recommendations.filter(rec => 
    selectedFilter === 'all' || rec.priority === selectedFilter
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Leaf className="w-5 h-5 mr-2 text-green-600" />
          Recommandations Personnalisées
        </h3>
        <div className="flex items-center space-x-2">
          {['all', 'high', 'medium', 'low'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                selectedFilter === filter
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'Toutes' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filteredRecommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative"
            >
              <div
                className={`bg-gradient-to-br ${getColorClasses(rec.type, rec.priority)} p-1 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer`}
                onClick={() => toggleCard(rec.id)}
              >
                <div className="bg-white rounded-lg p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getIcon(rec.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          Priorité {rec.priority}
                        </span>
                      </div>
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 text-gray-400 transform transition-transform ${
                        expandedCards.has(rec.id) ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3">{rec.description}</p>

                  {/* Metrics */}
                  {rec.metrics && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progrès</span>
                        <span className="font-medium">
                          {rec.metrics.current}/{rec.metrics.target} {rec.metrics.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(rec.metrics.current / rec.metrics.target) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-green-600 h-2 rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedCards.has(rec.id) && rec.relatedProducts && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t pt-3 mt-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Produits recommandés</h5>
                          <div className="space-y-2">
                            {rec.relatedProducts.map((product) => (
                              <div 
                                key={product.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                              >
                                <span className="text-sm font-medium">{product.name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Score: {product.healthScore}/100</span>
                                  <span className="text-xs font-medium text-green-600">
                                    +{product.improvement} pts
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Button */}
                  {rec.actionText && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (rec.actionRoute) navigate(rec.actionRoute);
                      }}
                      className="mt-3 w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium text-sm transition-colors flex items-center justify-center"
                    >
                      {rec.actionText}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredRecommendations.length === 0 && (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune recommandation pour cette priorité</p>
        </div>
      )}
    </div>
   );
};

export default RecommendationsSection;
// EOF