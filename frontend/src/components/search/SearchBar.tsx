/** PATH: frontend/src/components/search/SearchBar.tsx */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SearchAutocomplete from "./SearchAutocomplete";
import { Search, X } from "lucide-react";

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
  className = "",
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = (query || "").trim();
    if (!term) return;

    if (location.pathname === "/") {
      // Depuis la Home: on redirige vers /search?q=...
      navigate("/search?q=" + encodeURIComponent(term));
    } else {
      // Depuis /search: on déclenche la recherche fournie par la page
      onSearch(term);
    }
    setShowDropdown(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const term = (suggestion || "").trim();
    if (!term) return;
    setQuery(term);

    if (location.pathname === "/") {
      navigate("/search?q=" + encodeURIComponent(term));
    } else {
      onSearch(term);
    }
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
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full pl-14 pr-28 py-3 rounded-2xl outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setShowDropdown(false); }}
              className="absolute right-28 px-2 py-2"
              aria-label="Effacer"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-green-600 text-white px-4 py-2 text-sm"
          >
            Rechercher
          </button>
        </div>
      </form>

      {showSuggestions && (
        <div className="absolute left-0 right-0">
          <SearchAutocomplete query={query} onPick={handleSuggestionClick} />
        </div>
      )}
    </div>
  );
};

export default SearchBar;
