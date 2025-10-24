// PATH: frontend/src/components/search/SearchBar.tsx
import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAutocomplete } from '../../hooks/useAutocomplete';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialQuery?: string;
  showSuggestions?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Recherchez parmi 2M+ produits (Nutella, L'Oréal, Ariel...)",
  initialQuery = "",
  showSuggestions = true,
  autoFocus = false,
  className = ""
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Autocomplete dynamique Algolia
  const { suggestions, loading } = useAutocomplete(query, 300);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowDropdown(false);
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.id) {
      // Si c'est un produit réel, naviguer vers sa page
      navigate(`/product/${suggestion.id}`);
    } else {
      // Si c'est une suggestion de recherche, lancer la recherche
      setQuery(suggestion.query || suggestion.name);
      onSearch(suggestion.query || suggestion.name);
    }
    setShowDropdown(false);
    setIsFocused(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'food':
      case 'alimentaire':
        return '🍫';
      case 'cosmetic':
      case 'cosmétique':
      case 'cosmétiques':
        return '🧴';
      case 'detergent':
      case 'détergent':
      case 'détergents':
      case 'entretien':
        return '🧽';
      case 'hygiene':
      case 'hygiène':
        return '🦷';
      default:
        return '📦';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center bg-white rounded-2xl shadow-xl">
          <Search className="absolute left-6 w-5 h-5 text-gray-400" />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setShowDropdown(true);
              setIsFocused(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowDropdown(false);
                setIsFocused(false);
              }, 200);
            }}
            placeholder={placeholder}
            className="w-full pl-14 pr-4 py-5 text-lg rounded-l-2xl focus:outline-none focus:ring-4 focus:ring-green-100"
            autoFocus={autoFocus}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setShowDropdown(false);
              }}
              className="absolute right-36 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          <button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-5
                     rounded-r-2xl font-medium hover:from-green-600 hover:to-green-700
                     transition-all flex items-center gap-2 group"
          >
            Rechercher
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Dropdown de suggestions dynamiques */}
      <AnimatePresence>
        {showDropdown && showSuggestions && isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-gray-100"
          >
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {query.trim().length >= 2 ? 'Suggestions' : 'Recherches populaires'}
              </span>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-green-500" />}
            </div>

            <div className="py-2 max-h-96 overflow-y-auto">
              {suggestions.length === 0 && !loading && query.trim().length >= 2 && (
                <div className="px-4 py-6 text-center text-gray-500">
                  Aucun produit trouvé pour "{query}"
                </div>
              )}

              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id || index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                >
                  {/* Image produit ou icône catégorie */}
                  {suggestion.imageUrl && suggestion.id ? (
                    <div className="relative w-10 h-10 mr-3 flex-shrink-0">
                      <img
                        src={suggestion.imageUrl}
                        alt={suggestion.name}
                        className="w-full h-full rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-2xl">${getCategoryIcon(suggestion.category)}</span>`;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-2xl mr-3 flex-shrink-0">
                      {suggestion.icon || getCategoryIcon(suggestion.category)}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {suggestion.name || suggestion.query}
                    </div>
                    {(suggestion.brand || suggestion.category) && (
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        {suggestion.brand && <span className="truncate">{suggestion.brand}</span>}
                        {suggestion.brand && suggestion.category && <span>•</span>}
                        {suggestion.category && <span className="truncate">{suggestion.category}</span>}
                      </div>
                    )}
                  </div>

                  {/* Score si produit réel */}
                  {suggestion.id && typeof suggestion.score === 'number' && (
                    <div className={`font-bold text-lg ml-3 flex-shrink-0 ${getScoreColor(suggestion.score)}`}>
                      {suggestion.score}/100
                    </div>
                  )}

                  {/* Icône trending pour suggestions populaires */}
                  {!suggestion.id && (
                    <TrendingUp className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity ml-3 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions sous la barre (desktop uniquement) */}
      {showSuggestions && !showDropdown && !query.trim() && (
        <div className="hidden md:flex flex-wrap gap-2 justify-center mt-4">
          {suggestions.slice(0, 4).map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(item)}
              className="px-4 py-2 bg-white rounded-full text-sm hover:bg-green-50
                       transition-colors border border-gray-200 hover:border-green-300
                       flex items-center gap-2"
            >
              <span>{item.icon || getCategoryIcon(item.category)}</span>
              <span>{item.query || item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;