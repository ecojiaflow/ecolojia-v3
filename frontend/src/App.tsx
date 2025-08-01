// PATH: frontend/ecolojiaFrontV3/src/App.tsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  Award, 
  Calendar,
  BarChart3,
  Zap,
  Heart,
  Leaf,
  AlertTriangle,
  Star,
  Download,
  RefreshCw,
  Plus,
  Search,
  Camera,
  Package,
  CheckCircle,
  Eye,
  Sparkles,
  Upload,
  User,
  LogOut
} from 'lucide-react';

// ✅ IMPORTS D'AUTHENTIFICATION
import { AuthProvider } from './auth/context/AuthContext';
import { AuthPage } from './auth/components/AuthPage';
import { useAuth } from './auth/hooks/useAuth';

// ✅ IMPORTS COMPOSANTS STATIQUES
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// ✅ PAGES PRINCIPALES (EAGER LOADING)
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';
import ProductNotFoundPage from './pages/ProductNotFoundPage';
import ChatPage from './pages/ChatPage';
import Results from './pages/Results';
import Scan from './pages/Scan';
import TestAffiliate from './pages/TestAffiliate';
import Demo from './pages/Demo';

// ✅ PAGES LAZY LOADING AVEC FALLBACK
const UnifiedResultsPage = lazy(() => 
  import('./pages/UnifiedResultsPage')
    .then(module => ({ default: module.UnifiedResultsPage || module.default }))
    .catch(() => ({ default: () => <div className="p-8 text-center">Page UnifiedResults en construction</div> }))
);

const ManualAnalysisPage = lazy(() => 
  import('./pages/ManualAnalysisPage')
    .then(module => ({ default: module.ManualAnalysisPage || module.default }))
    .catch(() => ({ default: () => <div className="p-8 text-center">Page ManualAnalysis en construction</div> }))
);

const HistoryPage = lazy(() => 
  import('./pages/HistoryPage')
    .then(module => ({ default: module.HistoryPage || module.default }))
    .catch(() => ({ default: () => <div className="p-8 text-center">Page History en construction</div> }))
);

const MultiProductScanPage = lazy(() => 
  import('./pages/MultiProductScanPage')
    .then(module => ({ default: module.default || module.MultiProductScanPage }))
    .catch(() => ({ default: () => <MultiProductScanPageBuiltIn /> }))
);

const DashboardPage = lazy(() => 
  import('./pages/DashboardPage')
    .then(module => ({ default: module.default || module.DashboardPage }))
    .catch(() => ({ default: () => <DashboardPageBuiltIn /> }))
);

// ✅ HOOK POUR GÉRER LES ÉTATS DE CHARGEMENT
const useAnalysisProgress = (category: string) => {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const stages = [
    { label: 'Initialisation...', duration: 500 },
    { label: 'Analyse composition...', duration: 1500 },
    { label: 'Calcul score ECOLOJIA...', duration: 1000 },
    { label: 'Recherche alternatives...', duration: 800 },
    { label: 'Finalisation...', duration: 200 }
  ];

  const simulateAnalysis = async () => {
    for (let i = 0; i < stages.length; i++) {
      setStage(i);
      setProgress(0);
      
      const duration = stages[i].duration;
      const steps = 20;
      const stepDuration = duration / steps;
      
      for (let j = 0; j <= steps; j++) {
        setProgress((j / steps) * 100);
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  };

  return { stage, progress, simulateAnalysis, stages };
};

// ✅ COMPOSANT LOADING STATES INTELLIGENT
interface SmartLoadingProps {
  stage: number;
  progress: number;
  category: string;
}

const SmartLoading: React.FC<SmartLoadingProps> = ({ stage, progress, category }) => {
  const stages = [
    { 
      label: 'Initialisation...', 
      icon: <Zap className="w-6 h-6" />,
      color: 'text-blue-500'
    },
    { 
      label: 'Analyse composition...', 
      icon: <Eye className="w-6 h-6" />,
      color: 'text-green-500'
    },
    { 
      label: 'Calcul score ECOLOJIA...', 
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'text-purple-500'
    },
    { 
      label: 'Recherche alternatives...', 
      icon: <Search className="w-6 h-6" />,
      color: 'text-orange-500'
    },
    { 
      label: 'Finalisation...', 
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'text-green-600'
    }
  ];

  const categoryEmojis = {
    food: '🍎',
    cosmetics: '🧴',
    detergents: '🧽'
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">
          {categoryEmojis[category as keyof typeof categoryEmojis] || '📦'}
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          Analyse en cours...
        </h2>
        <p className="text-gray-600 mt-2">
          Notre IA analyse votre produit {category === 'food' ? 'alimentaire' : category === 'cosmetics' ? 'cosmétique' : 'détergent'}
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {stages.map((stageInfo, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              index < stage ? 'bg-green-100 text-green-600' :
              index === stage ? `${stageInfo.color.replace('text-', 'text-')} bg-current bg-opacity-10` :
              'bg-gray-100 text-gray-400'
            }`}>
              {index < stage ? (
                <CheckCircle className="w-4 h-4" />
              ) : index === stage ? (
                <div className="w-3 h-3 bg-current rounded-full animate-pulse"></div>
              ) : (
                <div className="w-3 h-3 bg-current rounded-full opacity-30"></div>
              )}
            </div>
            <span className={`ml-3 text-sm ${
              index <= stage ? 'text-gray-800 font-medium' : 'text-gray-500'
            }`}>
              {stageInfo.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          {Math.round(progress)}% terminé
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Le saviez-vous ?</strong>
          {category === 'food' && ' ECOLOJIA détecte automatiquement les produits ultra-transformés selon la classification NOVA.'}
          {category === 'cosmetics' && ' Notre IA identifie les perturbateurs endocriniens selon les listes officielles européennes.'}
          {category === 'detergents' && ' Nous analysons l\'impact environnemental selon les standards OECD et Ecolabel.'}
        </p>
      </div>
    </div>
  );
};

// ✅ INTERFACE DE RECHERCHE UNIVERSELLE
interface QuickSearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

const QuickUniversalSearch: React.FC<QuickSearchProps> = ({ 
  onSearch, 
  placeholder = "🔍 Rechercher un produit..." 
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    setTimeout(() => {
      if (onSearch) {
        onSearch(query);
      } else {
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
      }
      setIsSearching(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl shadow-sm focus-within:border-green-500 focus-within:shadow-md transition-all">
        <Search className="absolute left-4 h-5 w-5 text-gray-400" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isSearching}
          className="flex-1 px-12 py-4 bg-transparent border-0 focus:outline-none text-gray-800 placeholder-gray-500"
        />

        <div className="flex items-center space-x-2 px-4">
          <button
            onClick={() => window.location.href = '/search'}
            className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
            title="Scanner code-barres"
          >
            <Camera className="h-4 w-4" />
          </button>

          <button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Chercher'
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {['nutella bio', 'shampoing sans sulfate', 'lessive écologique'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setQuery(suggestion)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-full transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

// ✅ NAVBAR AUTHENTIFIÉE
const AuthenticatedNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-3">
              <div className="text-2xl">🌱</div>
              <span className="text-xl font-bold text-gray-800">ECOLOJIA</span>
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="/search" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              🔍 Recherche
            </a>
            <a href="/scan" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              📱 Scanner
            </a>
            <a href="/chat" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              💬 Chat IA
            </a>
            <a href="/dashboard" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              📊 Dashboard
            </a>
            <a href="/history" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              📚 Historique
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user?.currentUsage?.scansThisMonth || 0}</span>
                <span className="text-gray-400">/{user?.quotas?.scansPerMonth === -1 ? '∞' : user?.quotas?.scansPerMonth || 30} scans</span>
              </div>
              
              {user?.tier === 'premium' && (
                <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-medium">
                  ⭐ Premium
                </span>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <User className="w-4 h-4 text-gray-600" />
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.name || 'Utilisateur'}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                    <p className="text-xs font-medium mt-1">
                      {user?.tier === 'premium' ? (
                        <span className="text-purple-600">⭐ Compte Premium</span>
                      ) : (
                        <span className="text-gray-500">🆓 Compte Gratuit</span>
                      )}
                    </p>
                  </div>

                  <div className="px-4 py-2">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Scans ce mois:</span>
                        <span className="font-medium">
                          {user?.currentUsage?.scansThisMonth || 0}
                          {user?.quotas?.scansPerMonth !== -1 && `/${user?.quotas?.scansPerMonth || 30}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Questions IA aujourd'hui:</span>
                        <span className="font-medium">
                          {user?.currentUsage?.aiQuestionsToday || 0}
                          {user?.quotas?.aiQuestionsPerDay !== -1 && `/${user?.quotas?.aiQuestionsPerDay || 0}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-2">
                    <a href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      📊 Mon Dashboard
                    </a>
                    <a href="/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      📚 Mon Historique
                    </a>
                    {user?.tier !== 'premium' && (
                      <a href="/premium" className="block px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors">
                        ⭐ Passer Premium
                      </a>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ✅ PAGE D'ACCUEIL AUTHENTIFIÉE
const AuthenticatedHomePage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🌱 Bonjour {user?.name} !
              </h1>
              <p className="text-gray-600">
                Bienvenue sur ECOLOJIA - Votre assistant IA pour une consommation éclairée
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                {user?.tier === 'premium' ? (
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full font-medium">
                    ⭐ Premium Actif
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    🆓 Gratuit
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">Membre depuis {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'aujourd\'hui'}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-semibold text-gray-800">Scans ce mois</h3>
            <p className="text-2xl font-bold text-green-600">
              {user?.currentUsage?.scansThisMonth || 0}
            </p>
            <p className="text-sm text-gray-500">
              / {user?.quotas?.scansPerMonth === -1 ? '∞' : user?.quotas?.scansPerMonth || 30}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="font-semibold text-gray-800">Questions IA aujourd'hui</h3>
            <p className="text-2xl font-bold text-blue-600">
              {user?.currentUsage?.aiQuestionsToday || 0}
            </p>
            <p className="text-sm text-gray-500">
              / {user?.quotas?.aiQuestionsPerDay === -1 ? '∞' : user?.quotas?.aiQuestionsPerDay || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800">Exports ce mois</h3>
            <p className="text-2xl font-bold text-purple-600">
              {user?.currentUsage?.exportsThisMonth || 0}
            </p>
            <p className="text-sm text-gray-500">
              / {user?.quotas?.exportsPerMonth === -1 ? '∞' : user?.quotas?.exportsPerMonth || 0}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              🌍 Recherche Universelle ECOLOJIA
            </h2>
            <QuickUniversalSearch placeholder="🔍 Recherchez parmi des millions de produits..." />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            🚀 Actions rapides
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/scan" className="block p-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all">
              <div className="text-3xl mb-2">📱</div>
              <div className="font-semibold">Scanner Produit</div>
              <div className="text-sm opacity-90">Code-barres ou photo</div>
            </a>
            
            <a href="/chat" className="block p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all">
              <div className="text-3xl mb-2">🤖</div>
              <div className="font-semibold">Chat IA Expert</div>
              <div className="text-sm opacity-90">
                {user?.tier === 'premium' ? 'Questions illimitées' : 'Passez Premium'}
              </div>
            </a>
            
            <a href="/dashboard" className="block p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all">
              <div className="text-3xl mb-2">📊</div>
              <div className="font-semibold">Mon Dashboard</div>
              <div className="text-sm opacity-90">Analyses et progrès</div>
            </a>
            
            <a href="/history" className="block p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all">
              <div className="text-3xl mb-2">📚</div>
              <div className="font-semibold">Mon Historique</div>
              <div className="text-sm opacity-90">Toutes mes analyses</div>
            </a>
          </div>
        </div>

        {(user?.currentUsage?.scansThisMonth || 0) === 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              👋 Commencez votre première analyse !
            </h3>
            <p className="text-gray-600 mb-4">
              Découvrez instantanément si vos produits sont sains avec notre IA scientifique.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                🔬 Analyse NOVA
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                🌿 Ultra-transformation
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                🎯 Score santé /100
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                💡 Alternatives
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ PAGE MULTI-PRODUITS AVEC LOADING STATES (FALLBACK)
const MultiProductScanPageBuiltIn: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'food' | 'cosmetics' | 'detergents'>('food');
  const [scanMode, setScanMode] = useState<'barcode' | 'manual' | 'search'>('search');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { stage, progress, simulateAnalysis } = useAnalysisProgress(selectedCategory);

  const categories = [
    {
      id: 'food' as const,
      name: 'Alimentaire',
      icon: '🍎',
      description: 'Analyse NOVA & ultra-transformation',
      examples: ['Plats préparés', 'Boissons', 'Snacks', 'Conserves']
    },
    {
      id: 'cosmetics' as const,
      name: 'Cosmétiques',
      icon: '🧴',
      description: 'Perturbateurs endocriniens & allergènes',
      examples: ['Crèmes', 'Shampooings', 'Maquillage', 'Parfums']
    },
    {
      id: 'detergents' as const,
      name: 'Détergents',
      icon: '🧽',
      description: 'Impact environnemental & toxicité',
      examples: ['Lessives', 'Produits ménagers', 'Savons', 'Dégraissants']
    }
  ];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    try {
      await simulateAnalysis();
      
      setTimeout(() => {
        window.location.href = '/search';
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <SmartLoading 
          stage={stage} 
          progress={progress} 
          category={selectedCategory} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Analysez tous vos produits du quotidien
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Analysez la composition de vos produits alimentaires, cosmétiques et détergents 
            avec notre IA scientifique avancée
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <QuickUniversalSearch 
            placeholder={`🔍 Rechercher un produit ${selectedCategory === 'food' ? 'alimentaire' : selectedCategory === 'cosmetics' ? 'cosmétique' : 'détergent'}...`}
          />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-center mb-6">
            Choisissez la catégorie de produit
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`category-card cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">{category.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {category.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 justify-center">
                    {category.examples.map((example, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
                
                {selectedCategory === category.id && (
                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      ✓ Sélectionné
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ DASHBOARD AVEC INFOS UTILISATEUR (FALLBACK)
const DashboardPageBuiltIn: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const [stats] = useState({
    totalAnalyses: user?.currentUsage?.scansThisMonth || 0,
    averageScore: 73,
    improvementRate: 15.2,
    currentStreak: 7
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Chargement de votre dashboard...</h3>
          <p className="text-gray-600">Calcul de vos métriques santé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 Dashboard de {user?.name}
              </h1>
              <p className="text-gray-600">
                Membre depuis {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'aujourd\'hui'}
              </p>
            </div>
            <div className="text-right">
              {user?.tier === 'premium' ? (
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium">
                  ⭐ Premium Actif
                </span>
              ) : (
                <a href="/premium" className="inline-block px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                  ⭐ Passer Premium
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Score Santé</h3>
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {stats.averageScore}
              </div>
              <div className="text-sm text-gray-500">sur 100</div>
              <div className="mt-2 text-sm font-medium text-green-600">
                ↗️ +{stats.improvementRate} pts
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Analyses</h3>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {user?.currentUsage?.scansThisMonth || 0}
              </div>
              <div className="text-sm text-gray-500">ce mois</div>
              <div className="text-sm text-blue-600 mt-2">
                Quota: {user?.quotas?.scansPerMonth === -1 ? '∞' : user?.quotas?.scansPerMonth || 30}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Questions IA</h3>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {user?.currentUsage?.aiQuestionsToday || 0}
              </div>
              <div className="text-sm text-gray-500">aujourd'hui</div>
              <div className="text-xs text-gray-400 mt-2">
                {user?.tier === 'premium' ? '🤖 Illimitées' : '⭐ Premium requis'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Exports</h3>
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {user?.currentUsage?.exportsThisMonth || 0}
              </div>
              <div className="text-sm text-gray-500">ce mois</div>
              <div className="text-xs text-gray-400 mt-2">
                {user?.tier === 'premium' ? `/${user?.quotas?.exportsPerMonth || 10}` : '⭐ Premium requis'}
              </div>
            </div>
          </div>
        </div>

        {user?.tier !== 'premium' && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  ⭐ Débloquez toutes les fonctionnalités Premium
                </h3>
                <p className="text-purple-700">
                  Chat IA illimité • Analyses illimitées • Dashboard avancé • Export données
                </p>
              </div>
              <a href="/premium" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all font-medium">
                🚀 Passer Premium
              </a>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🎯 Continuez votre parcours santé, {user?.name} !
          </h2>
          <p className="text-gray-600 mb-6">
            Vous avez utilisé {user?.currentUsage?.scansThisMonth || 0} scans ce mois. 
            Continuez à analyser vos produits pour améliorer votre santé !
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/search" className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl">
              🔍 Recherche Universelle
            </a>
            <a href="/multi-scan" className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl">
              ✨ Multi-Produits
            </a>
            <a href="/chat" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl">
              💬 Assistant IA
              {user?.tier !== 'premium' && <span className="ml-1">⭐</span>}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ ROUTE PROTÉGÉE
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🌱</div>
          <div className="text-xl font-semibold text-gray-800 mb-2">ECOLOJIA</div>
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// ✅ APPLICATION PRINCIPALE
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Routes>
            {/* Route d'authentification (publique) */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Routes protégées avec navbar authentifiée */}
            <Route path="/*" element={
              <ProtectedRoute>
                <AuthenticatedNavbar />
                <main className="flex-1">
                  <Suspense fallback={
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
                        <h3 className="text-lg font-medium text-gray-800">Chargement...</h3>
                      </div>
                    </div>
                  }>
                    <Routes>
                      {/* ===== PAGE D'ACCUEIL AUTHENTIFIÉE ===== */}
                      <Route path="/" element={<AuthenticatedHomePage />} />
                      
                      {/* ===== PAGES PRINCIPALES (protégées) ===== */}
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/product/:id" element={<ProductPage />} />
                      <Route path="/product" element={<ProductPage />} />
                      <Route path="/product-not-found" element={<ProductNotFoundPage />} />
                      <Route path="/chat" element={<ChatPage />} />
                      
                      {/* ===== NOUVELLES ROUTES AJOUTÉES ===== */}
                      <Route path="/results" element={<UnifiedResultsPage />} />
                      <Route path="/analyze/manual" element={<ManualAnalysisPage />} />
                      <Route path="/history" element={<HistoryPage />} />
                      
                      {/* ===== DASHBOARD ===== */}
                      <Route path="/dashboard" element={<DashboardPage />} />
                      
                      {/* ===== ROUTES MULTI-PRODUITS ===== */}
                      <Route path="/multi-scan" element={<MultiProductScanPage />} />
                      <Route path="/cosmetics" element={<MultiProductScanPage />} />
                      <Route path="/detergents" element={<MultiProductScanPage />} />
                      
                      {/* ===== SCAN & RÉSULTATS ===== */}
                      <Route path="/scan" element={<Scan />} />
                      <Route path="/analyze" element={<ProductPage />} />
                      
                      {/* ===== DÉMO ===== */}
                      <Route path="/demo" element={<Demo />} />
                      {/* ===== ROUTE TEST AFFILIATE ===== */}
                      <Route path="/test-affiliate" element={<TestAffiliate />} />
                      
                      {/* ===== PAGES LÉGALES ===== */}
                      <Route path="/about" element={
                        <div className="min-h-screen bg-gray-50 py-12">
                          <div className="max-w-4xl mx-auto px-4">
                            <div className="bg-white rounded-xl p-8 shadow-sm">
                              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                                🌱 À propos d'ECOLOJIA
                              </h1>
                              <div className="prose max-w-none">
                                <p className="text-lg text-gray-600 mb-6">
                                  ECOLOJIA est un assistant IA révolutionnaire qui vous aide à faire des choix 
                                  de consommation plus conscients et responsables.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      } />
                      
                      <Route path="/privacy" element={
                        <div className="min-h-screen bg-gray-50 py-12">
                          <div className="max-w-4xl mx-auto px-4">
                            <div className="bg-white rounded-xl p-8 shadow-sm">
                              <h1 className="text-3xl font-bold text-gray-800 mb-6">🔒 Confidentialité</h1>
                              <p className="text-gray-600">
                                ECOLOJIA respecte votre vie privée conformément au RGPD.
                              </p>
                            </div>
                          </div>
                        </div>
                      } />
                      
                      <Route path="/terms" element={
                        <div className="min-h-screen bg-gray-50 py-12">
                          <div className="max-w-4xl mx-auto px-4">
                            <div className="bg-white rounded-xl p-8 shadow-sm">
                              <h1 className="text-3xl font-bold text-gray-800 mb-6">📋 Conditions d'utilisation</h1>
                              <p className="text-gray-600">
                                Conditions d'utilisation d'ECOLOJIA - Service informatif uniquement.
                              </p>
                            </div>
                          </div>
                        </div>
                      } />
                      
                      {/* ===== PAGE PREMIUM ===== */}
                      <Route path="/premium" element={
                        <div className="min-h-screen bg-gray-50 py-12">
                          <div className="max-w-4xl mx-auto px-4">
                            <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                              <h1 className="text-3xl font-bold text-gray-800 mb-6">⭐ ECOLOJIA Premium</h1>
                              <p className="text-xl text-gray-600 mb-8">
                                Débloquez toutes les fonctionnalités avancées
                              </p>
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 bg-gray-50 rounded-lg">
                                  <h3 className="text-lg font-semibold mb-4">🆓 Gratuit</h3>
                                  <ul className="text-left space-y-2 text-sm">
                                    <li>✅ 30 scans/mois</li>
                                    <li>✅ IA scientifique complète</li>
                                    <li>❌ Chat IA personnalisé</li>
                                    <li>❌ Export de données</li>
                                  </ul>
                                </div>
                                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                                  <h3 className="text-lg font-semibold mb-4 text-purple-800">⭐ Premium - 12.99€/mois</h3>
                                  <ul className="text-left space-y-2 text-sm">
                                    <li>✅ Scans illimités</li>
                                    <li>✅ Chat IA personnalisé</li>
                                    <li>✅ Dashboard avancé</li>
                                    <li>✅ Export données</li>
                                  </ul>
                                  <button className="mt-4 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold">
                                    🚀 Passer Premium
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      } />
                      
                      {/* ===== 404 ===== */}
                      <Route path="*" element={
                        <div className="min-h-screen flex items-center justify-center bg-gray-50">
                          <div className="text-center">
                            <div className="text-8xl mb-4">🤔</div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">Page introuvable</h1>
                            <p className="text-gray-600 mb-6">La page demandée n'existe pas.</p>
                            <a href="/" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                              🏠 Retour à l'accueil
                            </a>
                          </div>
                        </div>
                      } />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </ProtectedRoute>
            } />
            
            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;