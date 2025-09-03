// ============================================================================
// APPROCHE 1 : INTƒÆ’†â€™aaâ€šÂ¬‚Â°GRATION DIRECTE DANS SEARCHPAGE EXISTANTE
// ============================================================================

// PATH: frontend/ecolojiaFrontV3/src/pages/SearchPage.tsx (VERSION AMƒÆ’†â€™aaâ€šÂ¬‚Â°LIORƒÆ’†â€™aaâ€šÂ¬‚Â°E)

import React, { useState, useEffect } from 'react';
import { universalSearchEngine } from '../services/search/UniversalSearchService';
import { EnhancedSearchInterface } from '../components/search/EnhancedSearchInterface';

const ImprovedSearchPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStats, setSearchStats] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ƒÆ’‚Â°ƒâ€¦‚Â¸aaâ€šÂ¬‚Âƒâ€š‚Â Recherche Produits
          </h1>
          
          {/* NOUVEAU : Badge "Recherche Universelle" discret */}
          <div className="flex items-center text-sm text-gray-600">
            <span>Alimentaire aaâ€šÂ¬ƒâ€š‚Â¢ Cosmetiques aaâ€šÂ¬ƒâ€š‚Â¢ Detergents</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              aƒâ€¦aâ‚¬Å“ƒâ€š‚Â¨ Multi-sources
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Interface de recherche amelioree */}
        <div className="mb-8">
          // <EnhancedSearchInterface
            placeholder="ƒÆ’‚Â°ƒâ€¦‚Â¸aaâ€šÂ¬‚Âƒâ€š‚Â Rechercher un produit... (nutella, shampoing bio, lessive ecologique)"
            onResultSelect={(result) => {
              // Navigation vers analyse
              window.location.href = `/product/${result.id}`;
            }}
            showFilters={true}
          // />
        </div>

        {/* Metriques discretes SEULEMENT si recherche effectuee */}
        {searchStats && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="text-blue-800">
                <strong>{searchStats.totalResults}</strong> resultats trouves 
                en <strong>{searchStats.searchTime}ms</strong>
              </div>
              <div className="text-blue-600">
                Sources : {searchStats.sources.join(' aaâ€šÂ¬ƒâ€š‚Â¢ ')}
              </div>
            </div>
          </div>
        )}

        {/* Resultats */}
        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <SearchResultCard key={index} result={result} // />
          ))}
        </div>

        {/* Suggestions contextuelles en bas */}
        {searchResults.length === 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              ƒÆ’‚Â°ƒâ€¦‚Â¸aaâ€šÂ¬aâ€žÂ¢ƒâ€š‚Â¡ Suggestions populaires
            </h2>
            <PopularSearches // />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// APPROCHE 2 : NAVBAR DROPDOWN INTELLIGENT
// ============================================================================

// PATH: frontend/ecolojiaFrontV3/src/components/Navbar.tsx (VERSION SMART)

const SmartNavbar: React.FC = () => {
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Leaf className="h-8 w-8 text-green-600 mr-2" // />
              <span className="text-xl font-bold text-gray-800">ECOLOJIA</span>
            </Link>
          </div>

          {/* NOUVEAU : Recherche centrale intelligente */}
          <div className="flex-1 max-w-2xl mx-8 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" // />
              <input
                type="text"
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Rechercher un produit... (nutella, shampoing bio)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              // />
              
              {/* Badge multi-sources */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-gray-500">Multi-sources</span>
              </div>
            </div>

            {/* Dropdown suggestions */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <QuickSearchSuggestions 
                  query={quickSearchQuery}
                  onSelect={(result) => {
                    setShowSearchDropdown(false);
                    // Navigation directe
                    window.location.href = `/product/${result.id}`;
                  }}
                // />
              </div>
            )}
          </div>

          {/* Menu classique */}
          <div className="flex items-center space-x-4">
            <Link to="/scan" className="flex items-center text-gray-600 hover:text-gray-800">
              <Camera className="h-4 w-4 mr-1" // />
              Scanner
            </Link>
            <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-800">
              <BarChart3 className="h-4 w-4 mr-1" // />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ============================================================================
// APPROCHE 3 : HOMEPAGE SEARCH-FIRST
// ============================================================================

// PATH: frontend/ecolojiaFrontV3/src/pages/HomePage.tsx (VERSION SEARCH-CENTRIC)

const SearchFirstHomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section = Recherche */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            L'assistant IA pour une consommation consciente
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Analysez instantanement vos produits alimentaires, cosmetiques et detergents
          </p>

          {/* RECHERCHE CENTRALE HERO */}
          <div className="max-w-2xl mx-auto mb-12">
            // <EnhancedSearchInterface
              placeholder="ƒÆ’‚Â°ƒâ€¦‚Â¸aaâ€šÂ¬‚Âƒâ€š‚Â Recherchez votre premier produit... (nutella, shampoing L'Oreal, lessive Ariel)"
              showFilters={false}
              className="text-lg"
            // />
            
            {/* Suggestions immediates */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['nutella bio', 'shampoing sans sulfate', 'lessive ecologique'].map((suggestion) => (
                <button
                  key={suggestion}
                  className="px-4 py-2 bg-white bg-opacity-70 hover:bg-opacity-100 text-gray-700 rounded-full text-sm transition-all"
                  onClick={() => window.location.href = `/search?q=${encodeURIComponent(suggestion)}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Metriques de confiance */}
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">2M+</div>
              <div className="text-gray-600">Produits analysables</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">3</div>
              <div className="text-gray-600">Categories couvertes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">&lt;2s</div>
              <div className="text-gray-600">Temps d'analyse</div>
            </div>
          </div>
        </div>
      </div>

      {/* Le reste de la homepage... */}
      <FeaturesSection // />
      <TestimonialsSection // />
      <CTASection // />
    </div>
  );
};

// ============================================================================
// APPROCHE 4 : WIDGET RECHERCHE UNIVERSEL
// ============================================================================

// Composant reutilisable partout
const UniversalSearchWidget: React.FC<{
  size?: 'small' | 'medium' | 'large';
  context?: 'navbar' | 'hero' | 'page';
  showStats?: boolean;
}> = ({ size = 'medium', context = 'page', showStats = false }) => {
  
  const sizeClasses = {
    small: 'text-sm py-2',
    medium: 'text-base py-3', 
    large: 'text-lg py-4'
  };

  return (
    <div className="universal-search-widget">
      <div className={`relative ${sizeClasses[size]}`}>
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" // />
        
        <input
          type="text"
          placeholder="ƒÆ’‚Â°ƒâ€¦‚Â¸aaâ€šÂ¬‚Âƒâ€š‚Â Rechercher parmi 2M+ produits..."
          className={`w-full pl-12 pr-4 ${sizeClasses[size]} border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all`}
          onFocus={() => {
            // Redirection intelligente selon contexte
            if (context === 'navbar') {
              // Ouvrir dropdown
            } else {
              // Redirection vers page de recherche
              window.location.href = '/search';
            }
          }}
        // />
        
        {/* Badge multi-sources */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Multi-sources
          </span>
        </div>
      </div>

      {/* Stats contextuelles */}
      {showStats && (
        <div className="mt-2 text-center text-sm text-gray-500">
          2M+ produits aaâ€šÂ¬ƒâ€š‚Â¢ 3 categories aaâ€šÂ¬ƒâ€š‚Â¢ Recherche instantanee
        </div>
      )}
    </div>
  );
};

// ============================================================================
// RECOMMANDATION FINALE
// ============================================================================

/*
ƒÆ’‚Â°ƒâ€¦‚Â¸ƒâ€¦‚Â½ƒâ€š‚Â¯ APPROCHE RECOMMANDƒÆ’†â€™aaâ€šÂ¬‚Â°E : HYBRIDE

1. HOMEPAGE = Recherche Hero (Approche 3)
   aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ Positionnement immediat comme moteur de recherche
   aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ UX intuitive : voir aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ chercher aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ analyser

2. NAVBAR = Recherche centrale (Approche 2) 
   aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ Accessible partout
   aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ Dropdown intelligent avec suggestions

3. SEARCH PAGE = Version amelioree (Approche 1)
   aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ Page dediee pour recherches avancees
   aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ Metriques contextuelles uniquement

4. WIDGET = Composant universel (Approche 4)
   aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ Reutilisable partout
   aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ Consistent UX

AVANTAGES :
aƒâ€¦aâ‚¬Å“aaâ€šÂ¬‚Â¦ UX intuitive : recherche omnipresente
aƒâ€¦aâ‚¬Å“aaâ€šÂ¬‚Â¦ SEO : Homepage optimisee "recherche produits"
aƒâ€¦aâ‚¬Å“aaâ€šÂ¬‚Â¦ Conversion : flux naturel recherche aaaâ€šÂ¬‚Â aaâ€šÂ¬aâ€žÂ¢ analyse
aƒâ€¦aâ‚¬Å“aaâ€šÂ¬‚Â¦ Differenciation : "Google des produits ethiques"
aƒâ€¦aâ‚¬Å“aaâ€šÂ¬‚Â¦ Metriques : affichees dans contexte pertinent
*/


