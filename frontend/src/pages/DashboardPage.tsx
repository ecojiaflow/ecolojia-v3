// PATH: frontend/src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Package, 
  Star, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronRight,
  Target,
  Award,
  ShoppingBag,
  LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import dashboardService from '../services/dashboardService';
import authService from '../services/authService';
import ConfigService from '../services/configService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  totalScans: number;
  healthScoreAverage: number;
  categoryBreakdown: {
    food: number;
    cosmetics: number;
    detergents: number;
  };
  monthlyProgress: number;
  topCategory: string;
  recentAnalyses: Array<{
    _id: string;
    productName: string;
    score: number;
    category: string;
    date: string;
    nutriScore?: string;
    ecoScore?: string;
  }>;
  weeklyTrend: Array<{
    day: string;
    scans: number;
  }>;
}

// Valeurs par défaut pour éviter les erreurs
const defaultStats: DashboardStats = {
  totalScans: 0,
  healthScoreAverage: 0,
  categoryBreakdown: {
    food: 0,
    cosmetics: 0,
    detergents: 0
  },
  monthlyProgress: 0,
  topCategory: 'Alimentation',
  recentAnalyses: [],
  weeklyTrend: []
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [showLoginBanner, setShowLoginBanner] = useState(false);
  
  const user = authService.getUser();
  const isPremium = authService.isPremium();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier si l'utilisateur est connecté
      const token = localStorage.getItem('ecolojia_token');
      
      if (!token && !ConfigService.isDemo()) {
        ConfigService.setMode('demo');
        setIsDemo(true);
        setShowLoginBanner(true);
      }
      
      const data = await dashboardService.getStats();
      // Fusionner avec les valeurs par défaut pour éviter les undefined
      setStats({
        ...defaultStats,
        ...data,
        categoryBreakdown: {
          ...defaultStats.categoryBreakdown,
          ...(data.categoryBreakdown || {})
        }
      });
      setIsDemo(ConfigService.isDemo());
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      
      // Si c'est une erreur de connexion ou mode démo, utiliser les données de démo
      if (error.isDemoMode || error.statusCode === 401 || error.statusCode === 0 || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        ConfigService.setMode('demo');
        setIsDemo(true);
        setShowLoginBanner(true);
        
        // Réessayer en mode démo
        try {
          const demoData = await dashboardService.getStats();
          setStats({
            ...defaultStats,
            ...demoData,
            categoryBreakdown: {
              ...defaultStats.categoryBreakdown,
              ...(demoData.categoryBreakdown || {})
            }
          });
        } catch (demoError) {
          console.error('Demo mode error:', demoError);
          setError('Impossible de charger les données de démonstration');
          setStats(defaultStats); // Utiliser les valeurs par défaut
        }
      } else {
        setError('Impossible de charger les données');
        setStats(defaultStats); // Utiliser les valeurs par défaut
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7DDE4A]"></div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-[#F7F9F4] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-6 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6BC93B] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Configuration des graphiques
  const lineChartData = {
    labels: stats.weeklyTrend?.map(d => d.day) || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Scans',
        data: stats.weeklyTrend?.map(d => d.scans) || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#7DDE4A',
        backgroundColor: 'rgba(125, 222, 74, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const doughnutData = {
    labels: ['Alimentation', 'Cosmétiques', 'Produits ménagers'],
    datasets: [
      {
        data: [
          stats.categoryBreakdown?.food || 0,
          stats.categoryBreakdown?.cosmetics || 0,
          stats.categoryBreakdown?.detergents || 0
        ],
        backgroundColor: ['#7DDE4A', '#4A90E2', '#F5A623'],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Bannière mode démo */}
      {showLoginBanner && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#7DDE4A] to-[#6BC93B] text-white p-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">
                Mode démonstration - Connectez-vous pour voir vos vraies statistiques
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-[#7DDE4A] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Se connecter
              </button>
              <button
                onClick={() => setShowLoginBanner(false)}
                className="text-white hover:text-gray-200"
              >
                âÅ“â€¢
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#DDE9DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#3B3B3B]">
                {isDemo ? 'Tableau de bord démo' : `Bonjour ${user?.profile?.firstName || 'Utilisateur'} !`}
              </h1>
              <p className="text-gray-600 mt-2">
                {isDemo 
                  ? 'Découvrez ce que ECOLOJIA peut vous offrir'
                  : 'Voici un aperçu de vos analyses de produits'
                }
              </p>
            </div>
            
            {!isPremium && !isDemo && (
              <button
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Award className="w-5 h-5" />
                <span>Passer Premium</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total scans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#7DDE4A]/10 rounded-lg">
                <Package className="w-6 h-6 text-[#7DDE4A]" />
              </div>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                +15%
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-[#3B3B3B]">{stats.totalScans || 0}</h3>
            <p className="text-gray-600 text-sm mt-1">Produits scannés</p>
          </motion.div>

          {/* Score moyen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#4A90E2]/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[#4A90E2]" />
              </div>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                +8%
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-[#3B3B3B]">{stats.healthScoreAverage || 0}%</h3>
            <p className="text-gray-600 text-sm mt-1">Score santé moyen</p>
          </motion.div>

          {/* Progression mensuelle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#F5A623]/10 rounded-lg">
                <Target className="w-6 h-6 text-[#F5A623]" />
              </div>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                {stats.monthlyProgress > 0 ? '+' : ''}{stats.monthlyProgress || 0}%
                {stats.monthlyProgress > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-[#3B3B3B]">En progrès</h3>
            <p className="text-gray-600 text-sm mt-1">Ce mois-ci</p>
          </motion.div>

          {/* Catégorie favorite */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#7DDE4A]/10 rounded-lg">
                <Star className="w-6 h-6 text-[#7DDE4A]" />
              </div>
              <ShoppingBag className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-[#3B3B3B]">{stats.topCategory || 'Alimentation'}</h3>
            <p className="text-gray-600 text-sm mt-1">Catégorie préférée</p>
          </motion.div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Tendance hebdomadaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">
              Activité de la semaine
            </h3>
            <div className="h-64">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Répartition par catégorie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-[#3B3B3B] mb-4">
              Répartition
            </h3>
            <div className="h-64 flex items-center justify-center">
              <div className="w-48 h-48">
                <Doughnut data={doughnutData} />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#7DDE4A] rounded-full"></span>
                  Alimentation
                </span>
                <span className="font-medium">{stats.categoryBreakdown?.food || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#4A90E2] rounded-full"></span>
                  Cosmétiques
                </span>
                <span className="font-medium">{stats.categoryBreakdown?.cosmetics || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#F5A623] rounded-full"></span>
                  Produits ménagers
                </span>
                <span className="font-medium">{stats.categoryBreakdown?.detergents || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Analyses récentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white rounded-xl shadow-sm"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#3B3B3B]">
                Analyses récentes
              </h3>
              <button
                onClick={() => navigate('/history')}
                className="text-[#7DDE4A] hover:text-[#6BC93B] font-medium text-sm flex items-center gap-1"
              >
                Voir tout
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {stats.recentAnalyses && stats.recentAnalyses.length > 0 ? (
              stats.recentAnalyses.map((analysis, index) => (
                <motion.div
                  key={analysis._id || `analysis-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/product/${analysis._id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[#3B3B3B]">
                        {analysis.productName}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-600">
                          {new Date(analysis.date).toLocaleDateString('fr-FR')}
                        </span>
                        {analysis.nutriScore && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            analysis.nutriScore === 'A' ? 'bg-green-100 text-green-700' :
                            analysis.nutriScore === 'B' ? 'bg-lime-100 text-lime-700' :
                            analysis.nutriScore === 'C' ? 'bg-yellow-100 text-yellow-700' :
                            analysis.nutriScore === 'D' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Nutri-Score {analysis.nutriScore}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        analysis.score >= 80 ? 'text-green-600' :
                        analysis.score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {analysis.score}%
                      </div>
                      <p className="text-sm text-gray-600">Score global</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">Aucune analyse récente</div>
            )}
          </div>
        </motion.div>

        {/* CTA Mode démo */}
        {isDemo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 bg-gradient-to-r from-[#7DDE4A] to-[#6BC93B] rounded-xl p-8 text-white text-center"
          >
            <h3 className="text-2xl font-bold mb-4">
              Prêt ÃƒÂ  analyser vos propres produits ?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Créez votre compte gratuit et commencez ÃƒÂ  faire des choix éclairés
            </p>
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-[#7DDE4A] px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Créer mon compte
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
