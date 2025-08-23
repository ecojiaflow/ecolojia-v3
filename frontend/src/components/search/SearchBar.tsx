// PATH: frontend/src/components/search/SearchBar.tsx
import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [query, setQuery] = useState(initialQuery);
  const [showDropdown, setShowDropdown] = useState(false);

  const popularSearches = [
    { query: 'Nutella bio', icon: '🍫', category: 'Alimentaire' },
    { query: 'Shampoing sans sulfate', icon: '🧴', category: 'Cosmétiques' },
    { query: 'Lessive écologique', icon: '🧽', category: 'Détergents' },
    { query: 'Dentifrice naturel', icon: '🦷', category: 'Hygiène' }
  ];

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowDropdown(false);
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
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
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
              className="absolute right-36 p-2 hover:bg-gray-100 rounded-full"
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

      {/* Dropdown de suggestions */}
      <AnimatePresence>
        {showDropdown && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Recherches populaires</span>
            </div>
            
            <div className="py-2">
              {popularSearches.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(item.query)}
                  className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                >
                  <span className="text-2xl mr-3">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.query}</div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions sous la barre */}
      {showSuggestions && !showDropdown && (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {popularSearches.map((item) => (
            <button
              key={item.query}
              type="button"
              onClick={() => handleSuggestionClick(item.query)}
              className="px-4 py-2 bg-white rounded-full text-sm hover:bg-green-50 
                       transition-colors border border-gray-200 hover:border-green-300"
            >
              {item.icon} {item.query}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
