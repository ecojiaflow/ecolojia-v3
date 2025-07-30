// PATH: frontend/ecolojiaFrontV3/src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Leaf, Search, X, MessageCircle, BarChart3, TrendingUp, Target, Award, 
  Sparkles, Apple, Droplets, Camera, ArrowRight, Zap, Shield 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BarcodeScanner from '../components/scanner/BarcodeScanner';

// ✅ NOUVEAU : Composant EnhancedSearchInterface simplifié intégré
interface EnhancedSearchInterfaceProps {
  placeholder?: string;
  onResultSelect: (result: any) => void;
  showFilters?: boolean;
  className?: string;
  categories?: string[];
}

const EnhancedSearchInterface: React.FC<EnhancedSearchInterfaceProps> = ({
  placeholder = "Rechercher un produit...",
  onResultSelect,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const popularSuggestions = [
    { query: 'nutella bio', icon: '🍫', category: 'Alimentaire' },
    { query: 'shampoing sans sulfate', icon: '🧴', category: 'Cosmétiques' },
    { query: 'lessive écologique', icon: '🧽', category: 'Détergents' },
    { query: 'yaourt sans additifs', icon: '🥛', category: 'Alimentaire' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onResultSelect({ query: query.trim() });
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.query);
    onResultSelect(suggestion);
    setShowDropdown(false);
  };

  return (
    <div className={`enhanced-search-interface relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder={placeholder}
            className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all text-lg"
          />
        </div>
      </form>

      {/* Dropdown suggestions */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">
              {query ? 'Suggestions' : 'Recherches populaires'}
            </span>
          </div>

          <div className="py-2">
            {popularSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors">
                  <span className="text-lg">{suggestion.icon}</span>
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{suggestion.query}</div>
                  <div className="text-xs text-gray-500">{suggestion.category}</div>
                </div>
                
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ QuickStatsWidget intégré directement pour éviter les problèmes d'import
const QuickStatsWidgetIntegrated: React.FC = () => {
  const [stats, setStats] = useState({
    totalScans: 47,
    avgHealthScore: 73,
    improvement: 15,
    streak: 7,
    topProducts: 3,
    isLoading: true
  });

  useEffect(() => {
    // Simulation du chargement des stats
    const timer = setTimeout(() => {
      setStats(prev => ({ ...prev, isLoading: false }));
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (stats.isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">📊 Vos Stats Santé</h3>
        <BarChart3 className="w-6 h-6 text-green-500" />
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-3xl font-bold text-green-600 mb-1">{stats.totalScans}</div>
          <div className="text-sm text-gray-600">Produits analysés</div>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-3xl font-bold text-blue-600 mb-1">{stats.avgHealthScore}</div>
          <div className="text-sm text-gray-600">Score santé moyen</div>
        </div>
      </div>

      {/* Métriques secondaires */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Amélioration</span>
          </div>
          <span className="text-purple-600 font-bold">+{stats.improvement}%</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center">
            <Target className="w-5 h-5 text-orange-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Série active</span>
          </div>
          <span className="text-orange-600 font-bold">{stats.streak} jours</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <Award className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Top produits</span>
          </div>
          <span className="text-yellow-600 font-bold">{stats.topProducts} découverts</span>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center">
        <Link
          to="/dashboard"
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg inline-block"
        >
          📈 Voir le dashboard complet
        </Link>
      </div>

      {/* Footer widget */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 Analysez plus de produits pour des insights personnalisés
        </p>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  /* ---------- Détection mobile ---------- */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /* ---------- Scanner mobile ---------- */
  const handleScanSuccess = (barcode: string) => {
    console.log('📱 Code-barres scanné :', barcode);
    setShowScanner(false);
    const params = new URLSearchParams({ barcode, method: 'scan' });
    navigate(`/results?${params.toString()}`);
  };

  const handleCloseScanner = () => setShowScanner(false);
  const openScanner = () => setShowScanner(true);

  // ✅ Handler pour l'IA scientifique
  const handleScientificSearchSelect = (result: any) => {
    console.log('🔬 Analyse IA sélectionnée:', result);
    // Navigation intelligente selon le type de résultat
    if (result.barcode) {
      navigate(`/product?barcode=${result.barcode}&source=${result.source}`);
    } else if (result.id) {
      navigate(`/product/${result.id}?source=${result.source}`);
    } else if (result.query) {
      navigate(`/search?q=${encodeURIComponent(result.query)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(result.name || result.query || '')}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HERO SECTION AMÉLIORÉ ===== */}
      <section className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-16 md:py-24 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge NOUVEAU */}
          <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-80 backdrop-blur-sm rounded-full border border-green-200 mb-8">
            <Sparkles className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              Nouveau : IA Scientifique Multi-Catégories • 2M+ produits analysés
            </span>
          </div>

          {/* Logo Hero */}
          <div className="flex justify-center mb-8">
            <Leaf className="h-16 w-16 text-green-500 animate-pulse" />
          </div>

          {/* Titre principal */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            L'assistant IA pour une{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              consommation consciente
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            Analysez instantanément vos produits <strong>alimentaires</strong>, <strong>cosmétiques</strong> et <strong>détergents</strong> 
            grâce à notre IA scientifique basée sur INSERM, ANSES et EFSA
          </p>

          {/* ✅ IA SCIENTIFIQUE HERO */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white">
              <EnhancedSearchInterface
                placeholder="🔬 Recherchez parmi 2M+ produits analysés par IA... (nutella bio, shampoing L'Oréal, lessive Ariel)"
                onResultSelect={handleScientificSearchSelect}
                className="text-lg"
              />
            </div>
            
            {/* 🔬 Métriques de confiance scientifique */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              {[
                { 
                  number: 'IA', 
                  label: 'Scientifique', 
                  sublabel: 'Algorithmes NOVA, INCI, ECO propriétaires', 
                  color: 'text-green-600' 
                },
                { 
                  number: '3', 
                  label: 'Catégories', 
                  sublabel: 'Alimentaire, Cosmétique, Détergent', 
                  color: 'text-blue-600' 
                },
                { 
                  number: '<2s', 
                  label: 'Enrichissement', 
                  sublabel: 'Calcul temps réel', 
                  color: 'text-purple-600' 
                },
                { 
                  number: '100%', 
                  label: 'Scientifique', 
                  sublabel: 'INSERM, ANSES, EFSA', 
                  color: 'text-orange-600' 
                }
              ].map((metric, index) => (
                <div key={index} className="bg-white bg-opacity-70 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-50">
                  <div className={`text-2xl lg:text-3xl font-bold ${metric.color} mb-1`}>
                    {metric.number}
                  </div>
                  <div className="font-semibold text-gray-800 text-sm mb-1">
                    {metric.label}
                  </div>
                  <div className="text-xs text-gray-600">
                    {metric.sublabel}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggestions populaires */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { text: 'nutella bio', category: 'Alimentaire', icon: '🍫' },
                { text: 'shampoing sans sulfate', category: 'Cosmétiques', icon: '🧴' },
                { text: 'lessive écologique', category: 'Détergents', icon: '🧽' },
                { text: 'yaourt sans additifs', category: 'Alimentaire', icon: '🥛' }
              ].map((suggestion, index) => (
                <button
                  key={index}
                  className="group flex items-center px-4 py-2 bg-white bg-opacity-70 hover:bg-opacity-100 text-gray-700 rounded-full text-sm transition-all hover:scale-105 shadow-sm hover:shadow-md"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(suggestion.text)}`)}
                >
                  <span className="mr-2">{suggestion.icon}</span>
                  <span className="font-medium">{suggestion.text}</span>
                  <ArrowRight className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Boutons d'action principaux */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {/* Bouton scanner mobile */}
            {isMobile && (
              <button
                onClick={openScanner}
                className="inline-flex items-center px-8 py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Camera className="w-5 h-5 mr-2" />
                📷 Scanner un produit
              </button>
            )}
            
            {/* Multi-Produits */}
            <button
              onClick={() => navigate('/multi-scan')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              ✨ Analyse Multi-Catégories
            </button>
            
            {/* Dashboard */}
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              📊 Mon Dashboard
            </button>
          </div>

          {/* Note sur l'IA scientifique */}
          <div className="bg-blue-50 bg-opacity-80 backdrop-blur-sm border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">IA Scientifique Propriétaire</span>
            </div>
            <p className="text-sm text-blue-700">
              Notre intelligence artificielle combine <strong>algorithmes NOVA V2</strong> (classification scientifique), <strong>INCI V2</strong> (analyse cosmétiques) 
              et <strong>ECO V2</strong> (impact environnemental) pour des scores fiables basés sur INSERM, ANSES et EFSA.
            </p>
          </div>
        </div>
      </section>

      {/* ===== IA SCIENTIFIQUE MULTI-CATÉGORIES ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              🔬 IA Scientifique Multi-Catégories
            </h2>
            <p className="text-xl text-gray-600">
              La seule plateforme européenne avec algorithmes propriétaires spécialisés
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              {
                icon: <Shield className="w-8 h-8 text-green-600" />,
                title: 'Algorithmes Propriétaires',
                description: 'NOVA V2 + INCI V2 + ECO V2 développés en interne',
                count: '3'
              },
              {
                icon: <Zap className="w-8 h-8 text-blue-600" />,
                title: 'Enrichissement Temps Réel',
                description: 'Calcul automatique des scores sur tous produits',
                count: '<2s'
              },
              {
                icon: <Sparkles className="w-8 h-8 text-purple-600" />,
                title: 'IA Spécialisée',
                description: 'Adaptation automatique selon type de produit',
                count: '100%'
              },
              {
                icon: <Target className="w-8 h-8 text-orange-600" />,
                title: 'Base Scientifique',
                description: 'Critères validés INSERM, ANSES, EFSA',
                count: 'Expert'
              }
            ].map((advantage, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform border border-gray-100">
                  {advantage.icon}
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-2">{advantage.count}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{advantage.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{advantage.description}</p>
              </div>
            ))}
          </div>

          {/* 🔬 Base Scientifique ECOLOJIA */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
              🔬 Base Scientifique ECOLOJIA
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Apple className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Algorithme NOVA V2</h4>
                <p className="text-sm text-gray-600 mb-2">Classification scientifique basée sur INSERM avec détection ultra-transformation</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  INSERM validé
                </span>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-pink-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Algorithme INCI V2</h4>
                <p className="text-sm text-gray-600 mb-2">Analyse cosmétiques selon ANSES avec détection perturbateurs endocriniens</p>
                <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                  ANSES référentiel
                </span>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplets className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Algorithme ECO V2</h4>
                <p className="text-sm text-gray-600 mb-2">Impact environnemental selon REACH et OECD pour détergents</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  REACH/OECD
                </span>
              </div>
            </div>
            
            {/* Transparence méthodologique */}
            <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-4 text-center">
                🔍 Transparence Méthodologique
              </h4>
              <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">📊 Critères Objectifs</h5>
                  <ul className="space-y-1">
                    <li>• Classification NOVA 1-4 (INSERM 2024)</li>
                    <li>• Indice INCI perturbateurs endocriniens</li>
                    <li>• Score biodégradabilité OECD</li>
                    <li>• Détection additifs E-numbers</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">⚖️ Pondération Scientifique</h5>
                  <ul className="space-y-1">
                    <li>• Facteurs de risque EFSA</li>
                    <li>• Niveaux d'exposition ANSES</li>
                    <li>• Seuils réglementaires UE</li>
                    <li>• Études épidémiologiques récentes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 SECTION MULTI-PRODUITS - CONSERVÉE ET AMÉLIORÉE */}
      <section className="bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 text-white py-16 px-4 rounded-2xl mx-4 mb-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm font-medium mb-4">
              ✨ ANALYSE AVANCÉE
            </span>
            <h2 className="text-4xl font-bold mb-4">
              IA Spécialisée Multi-Catégories
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Notre IA s'adapte automatiquement selon le type de produit avec des critères scientifiques spécialisés
            </p>
          </div>

          {/* Features Grid améliorée */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
              <div className="text-4xl mb-3">🍎</div>
              <h3 className="font-semibold mb-2">Alimentaire</h3>
              <p className="text-sm opacity-90 mb-3">Classification NOVA, ultra-transformation, additifs E-numbers</p>
              <ul className="text-xs opacity-75 space-y-1">
                <li>• Score NOVA (INSERM)</li>
                <li>• Détection ultra-transformation</li>
                <li>• Analyse additifs</li>
                <li>• Score nutritionnel</li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="font-semibold mb-2">Cosmétiques</h3>
              <p className="text-sm opacity-90 mb-3">Perturbateurs endocriniens, allergènes INCI, naturalité</p>
              <ul className="text-xs opacity-75 space-y-1">
                <li>• Perturbateurs endocriniens</li>
                <li>• Allergènes réglementaires</li>
                <li>• Analyse INCI complète</li>
                <li>• Score naturalité</li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
              <div className="text-4xl mb-3">💧</div>
              <h3 className="font-semibold mb-2">Détergents</h3>
              <p className="text-sm opacity-90 mb-3">Impact environnemental, toxicité aquatique, biodégradabilité</p>
              <ul className="text-xs opacity-75 space-y-1">
                <li>• Toxicité vie aquatique</li>
                <li>• Biodégradabilité OECD</li>
                <li>• Émissions COV</li>
                <li>• Labels écologiques</li>
              </ul>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => navigate('/multi-scan')}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              🚀 Analyser Mes Produits
            </button>
            
            <button
              onClick={() => navigate('/search')}
              className="px-8 py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl font-semibold hover:bg-opacity-30 transition-all duration-200"
            >
              🔬 IA Scientifique
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm opacity-75">Catégories analysées</div>
            </div>
            <div>
              <div className="text-2xl font-bold">2M+</div>
              <div className="text-sm opacity-75">Produits analysables</div>
            </div>
            <div>
              <div className="text-2xl font-bold">AI</div>
              <div className="text-sm opacity-75">Enrichissement automatique</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== RESTE DU CONTENU CONSERVÉ ===== */}
      
      {/* FONCTIONNALITÉS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Intelligence Artificielle NOVA
            </h2>
            <p className="text-xl text-gray-600">
              Analysez vos produits avec notre IA révolutionnaire
            </p>
          </div>

          {/* Cartes des fonctionnalités */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Classification NOVA</h3>
              <p className="text-gray-600">
                Analyse automatique selon la classification scientifique NOVA (groupes 1-4)
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100">
              <div className="text-4xl mb-4">⚗️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Détection d'additifs</h3>
              <p className="text-gray-600">
                Identification des additifs alimentaires avec évaluation des risques
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Recommandations</h3>
              <p className="text-gray-600">
                Conseils personnalisés et alternatives naturelles suggérées
              </p>
            </div>
          </div>

          {/* Exemples d'analyses */}
          <div className="bg-gray-50 rounded-xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Exemples d'analyses NOVA
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/product/coca-cola-original"
                className="block bg-white border border-red-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mr-4 text-lg">
                    4
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">Coca-Cola Original</span>
                    <div className="text-sm text-gray-500">🥤 Boisson</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Groupe NOVA 4 – Ultra-transformé avec additifs E150d, E952, E211
                </p>
              </Link>

              <Link
                to="/product/nutella-pate-tartiner"
                className="block bg-white border border-red-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mr-4 text-lg">
                    4
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">Nutella</span>
                    <div className="text-sm text-gray-500">🍫 Pâte à tartiner</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Groupe NOVA 4 – Huile de palme, émulsifiants E322, E471
                </p>
              </Link>

              <Link
                to="/product/yaourt-nature-bio"
                className="block bg-white border border-green-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-4 text-lg">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">Yaourt Bio</span>
                    <div className="text-sm text-gray-500">🥛 Produit laitier</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Groupe NOVA 1 – Aliment non transformé, ferments naturels
                </p>
              </Link>
            </div>
          </div>

          {/* Call-to-action */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Prêt à analyser vos produits ?
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                to="/search"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🔬 IA Scientifique
              </Link>
              <Link
                to="/product"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                📊 Analyser un produit
              </Link>
              <Link
                to="/chat"
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                💬 Assistant Nutritionnel
              </Link>
              {!isMobile && (
                <Link
                  to="/scan"
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  📱 Scanner mobile
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD PERSONNEL */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              📊 Suivez Vos Progrès Santé
            </h2>
            <p className="text-xl text-gray-600">
              Votre coach personnel nutrition avec analytics avancées
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <QuickStatsWidgetIntegrated />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Tableau de bord intelligent
              </h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">📈</span>
                  <div>
                    <strong>Suivi évolution</strong> de votre score santé au fil du temps
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">🎯</span>
                  <div>
                    <strong>Objectifs personnalisés</strong> pour améliorer votre alimentation
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">🤖</span>
                  <div>
                    <strong>Insights IA</strong> et recommandations adaptées à vos habitudes
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">🏆</span>
                  <div>
                    <strong>Système d'achievements</strong> pour vous motiver
                  </div>
                </li>
              </ul>
              
              <div className="mt-6">
                <Link
                  to="/dashboard"
                  className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  🚀 Voir mon Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Fonctionnalités Dashboard */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-purple-200">
              <div className="text-4xl mb-3">📊</div>
              <h4 className="font-bold text-gray-800 mb-2">Score Santé</h4>
              <p className="text-sm text-gray-600">Suivi en temps réel de votre score global ECOLOJIA</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-purple-200">
              <div className="text-4xl mb-3">📈</div>
              <h4 className="font-bold text-gray-800 mb-2">Évolution</h4>
              <p className="text-sm text-gray-600">Graphiques d'amélioration de vos habitudes alimentaires</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-purple-200">
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="font-bold text-gray-800 mb-2">Objectifs</h4>
              <p className="text-sm text-gray-600">Goals personnalisés avec tracking de progression</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-purple-200">
              <div className="text-4xl mb-3">🏆</div>
              <h4 className="font-bold text-gray-800 mb-2">Achievements</h4>
              <p className="text-sm text-gray-600">Débloquez des badges selon vos progrès</p>
            </div>
          </div>
        </div>
      </section>

      {/* ASSISTANT IA NUTRITIONNEL */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              💬 Assistant IA Nutritionnel
            </h2>
            <p className="text-xl text-gray-600">
              Posez vos questions à notre expert en nutrition
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Votre expert personnel en nutrition
                </h3>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <div>
                      <strong>Conseils personnalisés</strong> basés sur vos analyses NOVA
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <div>
                      <strong>Explications détaillées</strong> sur les additifs alimentaires
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <div>
                      <strong>Recommandations</strong> d'alternatives plus saines
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <div>
                      <strong>Réponses instantanées</strong> 24h/24 basées sur la science
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-6 shadow-md mb-6">
                  <div className="text-6xl mb-4">🤖</div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-gray-700 italic text-sm">
                      "Bonjour ! Je suis votre assistant nutritionnel ECOLOJIA. 
                      Je peux vous aider à comprendre les analyses NOVA, 
                      décoder les additifs et vous donner des conseils 
                      pour une alimentation plus saine !"
                    </p>
                  </div>
                </div>
                
                <Link
                  to="/chat"
                  className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Démarrer une conversation
                </Link>
              </div>
            </div>
          </div>

          {/* Questions fréquentes */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
              💡 Questions fréquentes que vous pouvez poser :
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Ce produit est-il bon pour la santé ?",
                "Quels sont les additifs préoccupants ?",
                "Comment améliorer mon alimentation ?",
                "Que signifie le groupe NOVA 4 ?",
                "Existe-t-il des alternatives plus saines ?",
                "Comment lire une étiquette nutritionnelle ?"
              ].map((question, index) => (
                <Link
                  key={index}
                  to="/chat"
                  state={{ initialMessage: question }}
                  className="text-sm bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 px-4 py-3 rounded-lg transition-all duration-200 text-center text-gray-700 hover:text-purple-700"
                >
                  {question}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOURCES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Sources scientifiques</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl mb-3">🏥</div>
                <p className="text-gray-700 font-bold">INSERM 2024</p>
                <p className="text-sm text-gray-500">Classification NOVA</p>
              </div>
              <div>
                <div className="text-3xl mb-3">🇪🇺</div>
                <p className="text-gray-700 font-bold">EFSA</p>
                <p className="text-sm text-gray-500">Additifs alimentaires</p>
              </div>
              <div>
                <div className="text-3xl mb-3">🧪</div>
                <p className="text-gray-700 font-bold">ANSES</p>
                <p className="text-sm text-gray-500">Sécurité alimentaire</p>
              </div>
              <div>
                <div className="text-3xl mb-3">📊</div>
                <p className="text-gray-700 font-bold">PNNS</p>
                <p className="text-sm text-gray-500">Nutrition santé</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                <strong>🌱 Transparence scientifique :</strong> Toutes nos analyses s'appuient sur des
                sources officielles et des études scientifiques validées pour garantir la fiabilité
                de nos recommandations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={handleCloseScanner}
          isOpen={true}
        />
      )}
    </div>
  );
};

export default HomePage;