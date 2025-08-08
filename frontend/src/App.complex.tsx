// PATH: frontend/src/App.tsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
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
  LogOut,
  X
} from 'lucide-react';

// ✅ IMPORTS D'AUTHENTIFICATION
import { AuthProvider } from './auth/context/AuthContext';
import { AuthPage } from './auth/components/AuthPage';
import { useAuth } from './auth/hooks/useAuth';

// ✅ IMPORTS COMPOSANTS STATIQUES
import LoadingSpinner from './components/LoadingSpinner';

// ✅ IMPORT DU LAYOUT ET PRIVATE ROUTE
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';

// ✅ PAGES PRINCIPALES (EAGER LOADING)
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';
import ProductNotFoundPage from './pages/ProductNotFoundPage';
import ChatPage from './pages/ChatPage';
import Results from './pages/Results';
import Scan from './pages/Scan';

// ✅ PAGES OPTIONNELLES (avec fallback)
const TestAffiliate = lazy(() => 
  import('./pages/TestAffiliate')
    .catch(() => ({ default: () => <div className="p-8 text-center">Page TestAffiliate non disponible</div> }))
);

const Demo = lazy(() => 
  import('./pages/Demo')
    .catch(() => ({ default: () => <div className="p-8 text-center">Page Demo non disponible</div> }))
);

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
    .catch(() => ({ default: () => <HistoryPageBuiltIn /> }))
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

// Pages de profil et paramètres
const ProfilePage = lazy(() => 
  import('./pages/ProfilePage')
    .then(module => ({ default: module.default || module.ProfilePage }))
    .catch(() => ({ default: () => <ProfilePageBuiltIn /> }))
);

const SettingsPage = lazy(() => 
  import('./pages/SettingsPage')
    .then(module => ({ default: module.default || module.SettingsPage }))
    .catch(() => ({ default: () => <SettingsPageBuiltIn /> }))
);

// ✅ NOUVELLES PAGES COSMÉTIQUES ET DÉTERGENTS
const CosmeticAnalysisPage = lazy(() => 
  import('./pages/CosmeticAnalysisPage')
    .then(module => ({ default: module.default || module.CosmeticAnalysisPage }))
    .catch(() => ({ default: () => <div className="p-8 text-center">Page d'analyse cosmétique en construction</div> }))
);

const DetergentAnalysisPage = lazy(() => 
  import('./pages/DetergentAnalysisPage')
    .then(module => ({ default: module.default || module.DetergentAnalysisPage }))
    .catch(() => ({ default: () => <div className="p-8 text-center">Page d'analyse détergent en construction</div> }))
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

// ✅ PAGE MULTI-PRODUITS AVEC LOADING STATES (FALLBACK)
const MultiProductScanPageBuiltIn: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'food' | 'cosmetics' | 'detergents'>('food');
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

        <div className="text-center">
          <button
            onClick={handleAnalyze}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Commencer l'analyse
          </button>
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
          <LoadingSpinner size="large" message="Chargement de votre dashboard..." />
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
                📊 Dashboard de {user?.name || 'Utilisateur'}
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
            🎯 Continuez votre parcours santé, {user?.name || 'vous'} !
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

// ✅ PAGES FALLBACK SIMPLES
const HistoryPageBuiltIn: React.FC = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">📜 Historique</h1>
        <p className="text-gray-600">Votre historique d'analyses sera disponible ici.</p>
      </div>
    </div>
  </div>
);

const ProfilePageBuiltIn: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">👤 Mon Profil</h1>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="text-lg font-medium">{user?.name || 'Utilisateur'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium">{user?.email || 'email@example.com'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <p className="text-lg font-medium">{user?.tier === 'premium' ? '⭐ Premium' : '🆓 Gratuit'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsPageBuiltIn: React.FC = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">⚙️ Paramètres</h1>
        <p className="text-gray-600">Les paramètres seront disponibles prochainement.</p>
      </div>
    </div>
  </div>
);

// ✅ Composant de chargement pour Suspense
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4 animate-pulse">🌱</div>
      <LoadingSpinner size="large" message="Chargement de la page..." />
    </div>
  </div>
);

// ✅ APPLICATION PRINCIPALE
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Routes>
              {/* Route d'authentification (publique) */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Routes protégées avec Layout unifié */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  {/* ===== PAGE D'ACCUEIL ===== */}
                  <Route path="/" element={<HomePage />} />
                  
                  {/* ===== RECHERCHE ET SCAN ===== */}
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/scan" element={<Scan />} />
                  <Route path="/multi-scan" element={
                    <Suspense fallback={<PageLoader />}>
                      <MultiProductScanPage />
                    </Suspense>
                  } />
                  
                  {/* ===== PRODUITS ET ANALYSES ===== */}
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/product" element={<ProductPage />} />
                  <Route path="/product-not-found" element={<ProductNotFoundPage />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/unified-results" element={
                    <Suspense fallback={<PageLoader />}>
                      <UnifiedResultsPage />
                    </Suspense>
                  } />
                  <Route path="/analyze/manual" element={
                    <Suspense fallback={<PageLoader />}>
                      <ManualAnalysisPage />
                    </Suspense>
                  } />
                  <Route path="/analyze" element={<ProductPage />} />
                  
                  {/* ===== CATÉGORIES SPÉCIFIQUES ===== */}
                  <Route path="/products/:productId/cosmetic" element={
                    <Suspense fallback={<PageLoader />}>
                      <CosmeticAnalysisPage />
                    </Suspense>
                  } />
                  <Route path="/products/:productId/detergent" element={
                    <Suspense fallback={<PageLoader />}>
                      <DetergentAnalysisPage />
                    </Suspense>
                  } />
                  <Route path="/cosmetics" element={
                    <Suspense fallback={<PageLoader />}>
                      <MultiProductScanPage />
                    </Suspense>
                  } />
                  <Route path="/detergents" element={
                    <Suspense fallback={<PageLoader />}>
                      <MultiProductScanPage />
                    </Suspense>
                  } />
                  
                  {/* ===== TABLEAU DE BORD ET HISTORIQUE ===== */}
                  <Route path="/dashboard" element={
                    <Suspense fallback={<PageLoader />}>
                      <DashboardPage />
                    </Suspense>
                  } />
                  <Route path="/history" element={
                    <Suspense fallback={<PageLoader />}>
                      <HistoryPage />
                    </Suspense>
                  } />
                  
                  {/* ===== CHAT IA ===== */}
                  <Route path="/chat" element={<ChatPage />} />
                  
                  {/* ===== PROFIL ET PARAMÈTRES ===== */}
                  <Route path="/profile" element={
                    <Suspense fallback={<PageLoader />}>
                      <ProfilePage />
                    </Suspense>
                  } />
                  <Route path="/settings" element={
                    <Suspense fallback={<PageLoader />}>
                      <SettingsPage />
                    </Suspense>
                  } />
                  
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
                            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Notre Mission</h2>
                            <p className="text-gray-600 mb-4">
                              Démocratiser l'accès à une consommation éclairée et responsable en fournissant une analyse 
                              instantanée et scientifique de tous les produits du quotidien.
                            </p>
                            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Nos Valeurs</h2>
                            <ul className="list-disc list-inside text-gray-600 space-y-2">
                              <li>🔬 Rigueur scientifique basée sur INSERM, ANSES, EFSA</li>
                              <li>🌍 Impact environnemental et durabilité</li>
                              <li>💚 Santé et bien-être des consommateurs</li>
                              <li>🔒 Protection des données personnelles (RGPD)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  } />
                  
                  <Route path="/privacy" element={
                    <div className="min-h-screen bg-gray-50 py-12">
                      <div className="max-w-4xl mx-auto px-4">
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                          <h1 className="text-3xl font-bold text-gray-800 mb-6">🔒 Politique de Confidentialité</h1>
                          <div className="prose max-w-none text-gray-600">
                            <p className="mb-4">
                              ECOLOJIA respecte votre vie privée et s'engage à protéger vos données personnelles 
                              conformément au Règlement Général sur la Protection des Données (RGPD).
                            </p>
                            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Données collectées</h2>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Informations de compte (email, nom)</li>
                              <li>Historique des analyses de produits</li>
                              <li>Préférences alimentaires et allergies (optionnel)</li>
                              <li>Données d'utilisation anonymisées</li>
                            </ul>
                            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Vos droits</h2>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Accès à vos données personnelles</li>
                              <li>Rectification et suppression</li>
                              <li>Portabilité des données</li>
                              <li>Opposition au traitement</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  } />
                  
                  <Route path="/terms" element={
                    <div className="min-h-screen bg-gray-50 py-12">
                      <div className="max-w-4xl mx-auto px-4">
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                          <h1 className="text-3xl font-bold text-gray-800 mb-6">📋 Conditions d'utilisation</h1>
                          <div className="prose max-w-none text-gray-600">
                            <p className="mb-4">
                              En utilisant ECOLOJIA, vous acceptez les présentes conditions d'utilisation.
                            </p>
                            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Service informatif</h2>
                            <p className="mb-4">
                              ECOLOJIA fournit des analyses à titre informatif uniquement. Les résultats ne constituent 
                              pas des conseils médicaux ou nutritionnels professionnels.
                            </p>
                            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Utilisation acceptable</h2>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Usage personnel et non commercial</li>
                              <li>Respect des quotas d'utilisation</li>
                              <li>Interdiction de contourner les limitations</li>
                              <li>Respect de la propriété intellectuelle</li>
                            </ul>
                          </div>
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
                            Débloquez toutes les fonctionnalités avancées pour une expérience complète
                          </p>
                          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            <div className="p-6 bg-gray-50 rounded-lg">
                              <h3 className="text-lg font-semibold mb-4">🆓 Gratuit</h3>
                              <div className="text-3xl font-bold mb-4">0€</div>
                              <ul className="text-left space-y-2 text-sm mb-6">
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                  30 scans/mois
                                </li>
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                  Analyse complète IA
                                </li>
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                  3 catégories de produits
                                </li>
                                <li className="flex items-center text-gray-400">
                                  <X className="w-4 h-4 mr-2" />
                                  Chat IA personnalisé
                                </li>
                                <li className="flex items-center text-gray-400">
                                  <X className="w-4 h-4 mr-2" />
                                  Export de données
                                </li>
                                <li className="flex items-center text-gray-400">
                                  <X className="w-4 h-4 mr-2" />
                                  Historique illimité
                                </li>
                              </ul>
                            </div>
                            <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 relative">
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                  POPULAIRE
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold mb-4 text-purple-800">⭐ Premium</h3>
                              <div className="text-3xl font-bold mb-1">2,49€</div>
                              <div className="text-sm text-gray-600 mb-4">par mois</div>
                              <ul className="text-left space-y-2 text-sm mb-6">
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                                  <strong>Scans illimités</strong>
                                </li>
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                                  <strong>Chat IA illimité</strong>
                                </li>
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                                  Dashboard avancé
                                </li>
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                                  Export PDF/Excel
                                </li>
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                                  Historique complet
                                </li>
                                <li className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                                  Support prioritaire
                                </li>
                              </ul>
                              <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                                🚀 Commencer l'essai gratuit
                              </button>
                              <p className="text-xs text-gray-600 mt-2">7 jours d'essai gratuit • Sans engagement</p>
                            </div>
                          </div>
                          <div className="mt-12 p-6 bg-blue-50 rounded-lg max-w-2xl mx-auto">
                            <h3 className="font-semibold text-blue-800 mb-2">💡 Pourquoi passer Premium ?</h3>
                            <p className="text-sm text-blue-700">
                              Accédez à notre assistant IA personnel qui répond à toutes vos questions nutritionnelles, 
                              exportez vos analyses pour votre médecin, et suivez votre progression santé avec des 
                              graphiques détaillés. Idéal pour les familles et les professionnels de santé.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  } />
                  
                  {/* ===== DÉMO ET TESTS ===== */}
                  <Route path="/demo" element={
                    <Suspense fallback={<PageLoader />}>
                      <Demo />
                    </Suspense>
                  } />
                  <Route path="/test-affiliate" element={
                    <Suspense fallback={<PageLoader />}>
                      <TestAffiliate />
                    </Suspense>
                  } />
                  
                  {/* ===== 404 ===== */}
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="text-8xl mb-4">🤔</div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Page introuvable</h1>
                        <p className="text-gray-600 mb-6">La page que vous recherchez n'existe pas.</p>
                        <a href="/" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Retour à l'accueil
                        </a>
                      </div>
                    </div>
                  } />
                </Route>
              </Route>
              
              {/* Redirection par défaut */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
        
        {/* Toast notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
              padding: '16px',
            },
            success: {
              style: {
                background: '#10B981',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#EF4444',
              },
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;