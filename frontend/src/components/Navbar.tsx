// PATH: frontend/ecolojiaFrontV3/src/components/Navbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Leaf, Search, ShoppingBag, BookOpen, Home, Info, 
  BarChart3, ChevronDown, Apple, Sparkles, Camera, Package,
  TrendingUp, Clock, ArrowRight, Zap
} from 'lucide-react';

// ✅ INTERFACE POUR SUGGESTIONS NAVBAR
interface SearchSuggestion {
  query: string;
  type?: 'product' | 'brand' | 'category' | 'ingredient';
  icon?: string;
  category?: string;
}

// ✅ SERVICE DE RECHERCHE SIMPLIFIÉ INTÉGRÉ
class NavbarSearchService {
  private cache = new Map<string, SearchSuggestion[]>();

  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    // 🆕 SUGGESTIONS ÉTENDUES MULTI-CATÉGORIES
    const popularSuggestions = [
      // 🍎 Alimentaire
      { query: 'nutella bio', icon: '🍫', category: 'Alimentaire' },
      { query: 'yaourt sans additifs', icon: '🥛', category: 'Alimentaire' },
      { query: 'pain complet bio', icon: '🍞', category: 'Alimentaire' },
      
      // 💄 🆕 Cosmétiques
      { query: 'shampoing sans sulfate', icon: '🧴', category: 'Cosmétiques' },
      { query: 'crème sans parabènes', icon: '✨', category: 'Cosmétiques' },
      { query: 'dentifrice bio', icon: '🦷', category: 'Cosmétiques' },
      
      // 🧽 🆕 Détergents
      { query: 'lessive écologique', icon: '🧽', category: 'Détergents' },
      { query: 'liquide vaisselle bio', icon: '💧', category: 'Détergents' },
      { query: 'nettoyant multi-surface', icon: '🏠', category: 'Détergents' },
      
      // Général
      { query: 'produits zéro déchet', icon: '🌿', category: 'Écologique' },
      { query: 'marques responsables', icon: '🌍', category: 'Éthique' }
    ];

    if (!query.trim()) {
      return popularSuggestions.slice(0, 6);
    }

    // Cache simple
    const cacheKey = query.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Filtrage intelligent
    const filteredSuggestions = popularSuggestions.filter(p => 
      p.query.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
    );

    // 🆕 SUGGESTIONS CONTEXTUELLES INTELLIGENTES
    const contextualSuggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Suggestions alimentaires spécialisées
    if (queryLower.includes('bio') || queryLower.includes('sans')) {
      contextualSuggestions.push(
        { query: `${query} NOVA 1`, icon: '✅', category: 'Alimentaire' },
        { query: `${query} sans additifs`, icon: '🌿', category: 'Alimentaire' }
      );
    }

    // Suggestions cosmétiques spécialisées
    if (queryLower.includes('shampoing') || queryLower.includes('crème') || queryLower.includes('soin')) {
      contextualSuggestions.push(
        { query: `${query} sans parabènes`, icon: '🚫', category: 'Cosmétiques' },
        { query: `${query} hypoallergénique`, icon: '💚', category: 'Cosmétiques' },
        { query: `${query} naturel`, icon: '🌱', category: 'Cosmétiques' }
      );
    }

    // Suggestions détergents spécialisées
    if (queryLower.includes('lessive') || queryLower.includes('vaisselle') || queryLower.includes('nettoyant')) {
      contextualSuggestions.push(
        { query: `${query} écologique`, icon: '🌍', category: 'Détergents' },
        { query: `${query} biodégradable`, icon: '♻️', category: 'Détergents' },
        { query: `${query} concentré`, icon: '💧', category: 'Détergents' }
      );
    }

    const allSuggestions = [...filteredSuggestions, ...contextualSuggestions];
    const uniqueSuggestions = this.deduplicateSuggestions(allSuggestions).slice(0, 8);

    this.cache.set(cacheKey, uniqueSuggestions);
    return uniqueSuggestions;
  }

  private deduplicateSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.query.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Instance du service
const navbarSearchService = new NavbarSearchService();

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  
  // ========== STATE ==========
  const [isOpen, setIsOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchStats, setSearchStats] = useState({
    totalProducts: '2M+',
    categories: 3,
    sources: 5
  });
  
  // ========== REFS ==========
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  // ========== EFFECTS ==========
  
  useEffect(() => {
    // Fermer dropdown si click extérieur
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Raccourci clavier Ctrl+K pour focus recherche
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      }
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ========== SEARCH HANDLERS ==========

  const handleSearchChange = async (query: string) => {
    setQuickSearchQuery(query);

    // Clear timeout précédent
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    if (query.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    // Délai pour éviter trop de requêtes
    suggestionTimeoutRef.current = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      
      try {
        const newSuggestions = await navbarSearchService.getSuggestions(query);
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Erreur suggestions navbar:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/search?q=${encodeURIComponent(quickSearchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuickSearchQuery(suggestion.query);
    setShowSearchDropdown(false);
    navigate(`/search?q=${encodeURIComponent(suggestion.query)}`);
  };

  const handleSearchFocus = async () => {
    setShowSearchDropdown(true);
    // Charger suggestions populaires si pas de query
    if (!quickSearchQuery.trim()) {
      try {
        const popularSuggestions = await navbarSearchService.getSuggestions('');
        setSuggestions(popularSuggestions);
      } catch (error) {
        console.error('Erreur chargement suggestions populaires:', error);
      }
    }
  };

  // ========== RENDER ==========

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ===== LOGO ===== */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center group">
              <Leaf className="h-8 w-8 text-green-600 mr-2 group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold text-gray-800">ECOLOJIA</span>
            </Link>
          </div>

          {/* ===== 🔬 IA SCIENTIFIQUE CENTRALE ===== */}
          <div className="flex-1 max-w-2xl mx-8 relative" ref={dropdownRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                
                <input
                  ref={searchInputRef}
                  type="text"
                  value={quickSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  placeholder="🔬 Rechercher parmi 2M+ produits analysés par IA... (nutella, shampoing L'Oréal, lessive Ariel)"
                  className="w-full pl-11 pr-32 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all placeholder-gray-500 text-sm"
                />
                
                {/* 🔬 BADGES IA SCIENTIFIQUE */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      IA
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                      {searchStats.categories} catégories
                    </span>
                  </div>
                  
                  {/* Raccourci clavier */}
                  <div className="hidden lg:flex items-center space-x-1 text-xs text-gray-400">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs">K</kbd>
                  </div>
                </div>
              </div>
            </form>

            {/* ===== 🔬 DROPDOWN SUGGESTIONS IA ENRICHI ===== */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
                
                {/* 🔬 HEADER DROPDOWN AVEC STATS IA */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {quickSearchQuery ? 'Suggestions intelligentes' : 'Recherches populaires'}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Zap className="w-3 h-3" />
                      <span>IA Scientifique • Temps réel</span>
                    </div>
                  </div>
                  
                  {/* 🔬 MÉTRIQUES IA SCIENTIFIQUE */}
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      NOVA V2 (alimentaire)
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-pink-500 rounded-full mr-1"></span>
                      INCI V2 (cosmétiques)
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      ECO V2 (détergents)
                    </div>
                  </div>
                </div>

                {/* Loading */}
                {isLoadingSuggestions && (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
                    <span className="text-sm text-gray-500">Analyse IA en cours...</span>
                  </div>
                )}

                {/* 🔬 SUGGESTIONS ENRICHIES IA */}
                {!isLoadingSuggestions && suggestions.length > 0 && (
                  <div className="max-h-80 overflow-y-auto">
                    <div className="py-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors">
                            {suggestion.icon ? (
                              <span className="text-lg">{suggestion.icon}</span>
                            ) : (
                              <Search className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{suggestion.query}</div>
                            {suggestion.category && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {suggestion.category}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {suggestion.query.includes('bio') && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Bio</span>
                            )}
                            {suggestion.query.includes('sans') && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Clean</span>
                            )}
                            <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* 🔬 FOOTER SUGGESTIONS AVEC ACTIONS RAPIDES */}
                    <div className="border-t border-gray-100 p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setShowSearchDropdown(false);
                              navigate('/scan');
                            }}
                            className="flex items-center text-xs text-gray-600 hover:text-green-600 transition-colors"
                          >
                            <Camera className="w-3 h-3 mr-1" />
                            Scanner
                          </button>
                          <button
                            onClick={() => {
                              setShowSearchDropdown(false);
                              navigate('/multi-scan');
                            }}
                            className="flex items-center text-xs text-gray-600 hover:text-purple-600 transition-colors"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Multi-Produits
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Appuyez <kbd className="px-1 bg-gray-200 rounded">↵</kbd> pour analyser
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🔬 ÉTAT VIDE AMÉLIORÉ */}
                {!isLoadingSuggestions && suggestions.length === 0 && quickSearchQuery && (
                  <div className="p-6 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-800 mb-2">Aucune suggestion</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Appuyez Entrée pour analyser "<span className="font-medium">{quickSearchQuery}</span>" 
                      avec notre IA scientifique
                    </p>
                    <div className="flex space-x-2 justify-center">
                      <button
                        onClick={() => {
                          setShowSearchDropdown(false);
                          navigate('/scan');
                        }}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                      >
                        📷 Scanner
                      </button>
                      <button
                        onClick={() => {
                          setShowSearchDropdown(false);
                          navigate('/multi-scan');
                        }}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        ✨ Analyse manuelle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===== MENU DESKTOP ===== */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/scan" 
              className="flex items-center text-gray-600 hover:text-green-600 font-medium transition-colors group"
            >
              <Camera className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
              Scanner
            </Link>
            
            <Link 
              to="/multi-scan" 
              className="flex items-center text-gray-600 hover:text-purple-600 font-medium transition-colors group"
            >
              <Sparkles className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
              Multi-Produits
            </Link>
            
            <Link 
              to="/dashboard" 
              className="flex items-center text-gray-600 hover:text-blue-600 font-medium transition-colors group"
            >
              <BarChart3 className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
              Dashboard
            </Link>

            {/* Dropdown À propos */}
            <div className="relative group">
              <button className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors">
                À propos
                <ChevronDown className="h-4 w-4 ml-1 group-hover:rotate-180 transition-transform" />
              </button>
              
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link to="/about" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors">
                  🌱 Notre mission
                </Link>
                <Link to="/blog" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors">
                  📚 Blog
                </Link>
                <Link to="/contact" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors">
                  📧 Contact
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <div className="px-4 py-2 text-xs text-gray-500">
                    🔬 IA scientifique propriétaire
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== BOUTON MENU MOBILE ===== */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* ===== MENU MOBILE ÉTENDU ===== */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link 
                to="/" 
                className="flex items-center px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setIsOpen(false)}
              >
                <Home className="h-4 w-4 mr-3" />
                Accueil
              </Link>
              
              <Link 
                to="/search" 
                className="flex items-center px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setIsOpen(false)}
              >
                <Search className="h-4 w-4 mr-3" />
                IA Scientifique
              </Link>
              
              <Link 
                to="/scan" 
                className="flex items-center px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setIsOpen(false)}
              >
                <Camera className="h-4 w-4 mr-3" />
                Scanner Code-Barres
              </Link>
              
              <Link 
                to="/multi-scan" 
                className="flex items-center px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setIsOpen(false)}
              >
                <Sparkles className="h-4 w-4 mr-3" />
                Analyse Multi-Produits
              </Link>
              
              <Link 
                to="/dashboard" 
                className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setIsOpen(false)}
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                Dashboard Personnel
              </Link>
              
              {/* 🔬 SECTION IA SCIENTIFIQUE MOBILE */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="px-3 py-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">🔬 IA Scientifique Multi-Catégories</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      NOVA V2 Alimentaire
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                      INCI V2 Cosmétiques
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      ECO V2 Détergents
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      INSERM/ANSES validé
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <Link 
                  to="/about" 
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <Info className="h-4 w-4 mr-3" />
                  À propos
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;