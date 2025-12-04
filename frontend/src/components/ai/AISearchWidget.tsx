// ═══════════════════════════════════════════════════════════════════
// ECOLOJIA V3.1 - COMPOSANT AISearchWidget
// ═══════════════════════════════════════════════════════════════════
//
// OBJECTIF : Widget de recherche IA intelligente sur produits réels
// USAGE : <AISearchWidget onProductSelect={(product) => {...}} />
//
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Search, Sparkles, Clock, Database, Zap, TrendingUp, ArrowRight, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAIQuery } from '../../hooks/useAIQuery';
import type { AIQueryProduct } from '../../hooks/useAIQuery';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface AISearchWidgetProps {
  placeholder?: string;
  onProductSelect?: (product: AIQueryProduct) => void;
  className?: string;
  showMetadata?: boolean;
  autoFocus?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export const AISearchWidget: React.FC<AISearchWidgetProps> = ({
  placeholder = "Recherche intelligente : 'chocolat vegan', 'huile pour cuire', 'gel douche sans sulfate'...",
  onProductSelect,
  className = "",
  showMetadata = true,
  autoFocus = false
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Hook de recherche IA
  const {
    results,
    loading,
    error,
    intent,
    confidence,
    explanation,
    metadata,
    suggestions,
    query,
    clear,
    hasResults,
    isFromCache
  } = useAIQuery();

  // ───────────────────────────────────────────────────────────────
  // HANDLERS
  // ───────────────────────────────────────────────────────────────

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    console.log('[AISearchWidget] Lancement recherche IA:', searchQuery);
    setShowResults(true);
    await query(searchQuery);
  };

  const handleProductClick = (product: AIQueryProduct) => {
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      navigate(`/product/${product._id}`);
    }
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    clear();
    setShowResults(false);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowResults(true);
    await query(suggestion);
  };

  // ───────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ───────────────────────────────────────────────────────────────

  const getIntentIcon = () => {
    switch (intent) {
      case 'product_search':
        return <Search className="w-4 h-4" />;
      case 'comparison':
        return <TrendingUp className="w-4 h-4" />;
      case 'alternative_request':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getIntentLabel = () => {
    switch (intent) {
      case 'product_search':
        return 'Recherche produits';
      case 'comparison':
        return 'Comparaison';
      case 'alternative_request':
        return 'Recherche alternatives';
      case 'education':
        return 'Question éducative';
      default:
        return 'Recherche générale';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food':
        return '🥫';
      case 'cosmetics':
        return '💄';
      case 'detergents':
        return '🧼';
      default:
        return '📦';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // ───────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────

  return (
    <div className={`relative ${className}`}>
      {/* BARRE DE RECHERCHE IA */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Sparkles className="w-5 h-5 text-green-600" />
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full pl-12 pr-12 py-4 text-base border-2 border-gray-200 rounded-xl 
                     focus:border-green-500 focus:ring-4 focus:ring-green-100 
                     transition-all duration-200 outline-none
                     group-hover:border-gray-300"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-12 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="absolute inset-y-0 right-2 flex items-center px-3
                     text-green-600 hover:text-green-700 disabled:text-gray-400
                     transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* BADGE "RECHERCHE IA" */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <Sparkles className="w-3.5 h-3.5 text-green-600" />
          <span>Recherche intelligente sur 37k+ produits réels</span>
        </div>
      </form>

      {/* RÉSULTATS & MÉTADONNÉES */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* HEADER : Intent + Métadonnées */}
            {showMetadata && (intent || metadata) && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  {/* Intent */}
                  {intent && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        {getIntentIcon()}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-900">{getIntentLabel()}</div>
                        {confidence && (
                          <div className="text-xs text-gray-500">
                            Confiance: {(confidence * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Métadonnées */}
                  {metadata && (
                    <div className="flex items-center gap-3 text-xs">
                      {/* Source */}
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600 capitalize">{metadata.source}</span>
                      </div>

                      {/* Cache */}
                      {isFromCache && (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Cache</span>
                        </div>
                      )}

                      {/* Temps */}
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600">{metadata.executionTime}ms</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explication IA */}
                {explanation && (
                  <div className="text-sm text-gray-700 mt-2">
                    {explanation}
                  </div>
                )}
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Recherche IA en cours...</p>
                </div>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="px-4 py-6 text-center">
                <div className="text-red-600 mb-2">⚠️ Erreur de recherche</div>
                <p className="text-sm text-gray-600">{error.message}</p>
              </div>
            )}

            {/* RÉSULTATS */}
            {!loading && hasResults && (
              <div className="max-h-[500px] overflow-y-auto">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-700">
                    {results.length} produit{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="divide-y divide-gray-100">
                  {results.map((product) => (
                    <motion.button
                      key={product._id}
                      onClick={() => handleProductClick(product)}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors"
                    >
                      {/* Image */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {getCategoryIcon(product.categoryType)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        {product.brand && (
                          <div className="text-xs text-gray-500 truncate">
                            {product.brand}
                          </div>
                        )}
                        {product.subcategory && (
                          <div className="text-xs text-green-600 mt-0.5">
                            {product.subcategory}
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div className="flex-shrink-0">
                        <div
                          className={`px-3 py-1.5 rounded-lg font-bold text-sm
                            ${getScoreBgColor(product.scores.overallScore)}
                            ${getScoreColor(product.scores.overallScore)}`}
                        >
                          {product.scores.overallScore}/100
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* NO RESULTS */}
            {!loading && !error && !hasResults && showResults && (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-400 mb-2">🔍</div>
                <p className="text-sm text-gray-600">Aucun produit trouvé</p>
              </div>
            )}

            {/* SUGGESTIONS */}
            {suggestions.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">Suggestions :</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg
                               hover:border-green-500 hover:text-green-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════

export default AISearchWidget;
