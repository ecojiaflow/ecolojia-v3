// ========================================
// 1. DashboardPage.tsx CORRIGÃ‰
// ========================================
// PATH: frontend/src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Package, Star, AlertCircle,

  ArrowUpRight, ArrowDownRight, Calendar,
  ChevronRight, Target, Award, ShoppingBag,
  LogIn, X, Download, Filter, RefreshCw
} from 'lucide-react';
import mockService from '../services/mockService';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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
import { dashboardService } from '../services/api';
import { useAuthContext } from '../Contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { MOCK_MODE } from '../config/mock.config';

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
    productBrand?: string;
    score: number;
    category: string;
    date: string;
    nutriScore?: string;
    ecoScore?: string;
    novaGroup?: number;
  }>;
  weeklyTrend: Array<{
    day: string;
    scans: number;
  }>;
  achievements?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
    progress: number;
  }>;
}

// DonnÃ©es mockÃ©es pour le mode demo
const MOCK_STATS: DashboardStats = {
  totalScans: 147,
  healthScoreAverage: 73,
  categoryBreakdown: {
    food: 89,
    cosmetics: 34,
    detergents: 24
  },
  monthlyProgress: 15,
  topCategory: 'Alimentation',
  recentAnalyses: [
    {
      _id: '1',
      productName: 'Yaourt Bio Nature',
      productBrand: 'Les 2 Vaches',
      score: 92,
      category: 'food',
      date: new Date().toISOString(),
      nutriScore: 'A',
      ecoScore: 'A',
      novaGroup: 1
    },
    {
      _id: '2',
      productName: 'Shampoing Doux',
      productBrand: 'L\'OrÃ©al',
      score: 68,
      category: 'cosmetics',
      date: new Date(Date.now() - 86400000).toISOString(),
      nutriScore: undefined,
      ecoScore: 'C'
    },
    {
      _id: '3',
      productName: 'Lessive Ã‰cologique',
      productBrand: 'Ecover',
      score: 85,
      category: 'detergents',
      date: new Date(Date.now() - 172800000).toISOString(),
      ecoScore: 'B'
    }
  ],
  weeklyTrend: [
    { day: 'Lun', scans: 12 },
    { day: 'Mar', scans: 19 },
    { day: 'Mer', scans: 15 },
    { day: 'Jeu', scans: 25 },
    { day: 'Ven', scans: 22 },
    { day: 'Sam', scans: 31 },
    { day: 'Dim', scans: 23 }
  ],
  achievements: [
    {
      id: '1',
      name: 'Premier Scan',
      description: 'Effectuez votre premier scan',
      icon: 'ðŸŽ¯',
      unlockedAt: new Date().toISOString(),
      progress: 100
    },
    {
      id: '2',
      name: 'Ã‰co-Warrior',
      description: 'Scannez 50 produits Ã©cologiques',
      icon: 'ðŸŒ¿',
      progress: 34
    },
    {
      id: '3',
      name: 'SantÃ© Avant Tout',
      description: 'Maintenez un score santÃ© moyen > 80',
      icon: 'â¤ï¸',
      progress: 73
    }
  ]
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginBanner, setShowLoginBanner] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // En mode mock ou non connectÃ©, utiliser les donnÃ©es mockÃ©es
      if (MOCK_MODE || !isAuthenticated) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler dÃ©lai
        setStats(MOCK_STATS);
        if (!isAuthenticated) {
          setShowLoginBanner(true);
        }
        return;
      }
      
      // Appel API rÃ©el
      const data = await dashboardService.getStats(selectedPeriod);
      setStats(data);
      
    } catch (error: any) {
      console.error('Erreur dashboard:', error);
      setError('Impossible de charger les donnÃ©es');
      // Fallback sur les donnÃ©es mockÃ©es
      setStats(MOCK_STATS);
      
      if (error.response?.status === 401) {
        setShowLoginBanner(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (MOCK_MODE || !isAuthenticated) {
        toast.error('Connectez-vous pour exporter vos donnÃ©es');
        return;
      }

      const blob = await dashboardService.exportData('pdf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecolojia-dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export rÃ©ussi !');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  // Configuration des graphiques
  const lineChartData = {
    labels: stats.weeklyTrend.map(d => d.day),
    datasets: [
      {
        label: 'Scans',
        data: stats.weeklyTrend.map(d => d.scans),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const doughnutData = {
    labels: ['Alimentation', 'CosmÃ©tiques', 'DÃ©tergents'],
    datasets: [
      {
        data: [
          stats.categoryBreakdown.food,
          stats.categoryBreakdown.cosmetics,
          stats.categoryBreakdown.detergents
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return 'ðŸŽ';
      case 'cosmetics': return 'ðŸ’„';
      case 'detergents': return 'ðŸ§½';
      default: return 'ðŸ“¦';
    }
  };

  const getNutriScoreColor = (score?: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-green-100 text-green-700',
      'B': 'bg-lime-100 text-lime-700',
      'C': 'bg-yellow-100 text-yellow-700',
      'D': 'bg-orange-100 text-orange-700',
      'E': 'bg-red-100 text-red-700'
    };
    return colors[score || ''] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* BanniÃ¨re mode demo / non connectÃ© */}
      {showLoginBanner && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">
                {MOCK_MODE ? 'Mode dÃ©monstration actif' : 'Connectez-vous pour voir vos vraies statistiques'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </button>
              )}
              <button
                onClick={() => setShowLoginBanner(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {isAuthenticated && user ? `Bonjour ${user.firstName || 'Utilisateur'} !` : 'Tableau de bord'}
              </h1>
              <p className="text-gray-600 mt-1">
                {MOCK_MODE ? 'DÃ©couvrez ce que ECOLOJIA peut vous offrir' : 'Voici un aperÃ§u de vos analyses de produits'}
              </p>
            </div>
            
            <div className="flex gap-3">
              {/* SÃ©lecteur de pÃ©riode */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette annÃ©e</option>
              </select>

              {/* Bouton refresh */}
              <button
                onClick={fetchDashboardData}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Actualiser"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Bouton export */}
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total scans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                +{stats.monthlyProgress}%
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalScans}</h3>
            <p className="text-gray-600 text-sm mt-1">Produits scannÃ©s</p>
          </motion.div>

          {/* Score moyen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                +8%
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.healthScoreAverage}%</h3>
            <p className="text-gray-600 text-sm mt-1">Score santÃ© moyen</p>
          </motion.div>

          {/* Progression mensuelle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Target className="w-6 h-6 text-amber-600" />
              </div>
              <span className={`text-sm font-medium flex items-center gap-1 ${
                stats.monthlyProgress > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.monthlyProgress > 0 ? '+' : ''}{stats.monthlyProgress}%
                {stats.monthlyProgress > 0 ? 
                  <ArrowUpRight className="w-4 h-4" /> : 
                  <ArrowDownRight className="w-4 h-4" />
                }
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">En progrÃ¨s</h3>
            <p className="text-gray-600 text-sm mt-1">Ce mois-ci</p>
          </motion.div>

          {/* CatÃ©gorie favorite */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <ShoppingBag className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.topCategory}</h3>
            <p className="text-gray-600 text-sm mt-1">CatÃ©gorie prÃ©fÃ©rÃ©e</p>
          </motion.div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tendance hebdomadaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ActivitÃ© de la semaine
            </h3>
            <div className="h-64">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </motion.div>

          {/* RÃ©partition par catÃ©gorie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              RÃ©partition
            </h3>
            <div className="h-48 flex items-center justify-center mb-4">
              <div className="w-48 h-48">
                <Doughnut data={doughnutData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Alimentation
                </span>
                <span className="font-medium">{stats.categoryBreakdown.food}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  CosmÃ©tiques
                </span>
                <span className="font-medium">{stats.categoryBreakdown.cosmetics}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                  DÃ©tergents
                </span>
                <span className="font-medium">{stats.categoryBreakdown.detergents}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Achievements / Badges */}
        {stats.achievements && stats.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-sm mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Vos accomplissements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 ${
                    achievement.progress === 100 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{achievement.name}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progression</span>
                      <span className="font-medium">{achievement.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analyses rÃ©centes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Analyses rÃ©centes
              </h3>
              <button
                onClick={() => navigate('/history')}
                className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
              >
                Voir tout
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {stats.recentAnalyses.length > 0 ? (
              stats.recentAnalyses.map((analysis, index) => (
                <motion.div
                  key={analysis._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/results?id=${analysis._id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryIcon(analysis.category)}</span>
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {analysis.productName}
                          </h4>
                          {analysis.productBrand && (
                            <p className="text-sm text-gray-600">{analysis.productBrand}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500">
                          {new Date(analysis.date).toLocaleDateString('fr-FR')}
                        </span>
                        {analysis.nutriScore && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getNutriScoreColor(analysis.nutriScore)}`}>
                            Nutri-Score {analysis.nutriScore}
                          </span>
                        )}
                        {analysis.novaGroup && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            NOVA {analysis.novaGroup}
                          </span>
                        )}
                        {analysis.ecoScore && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getNutriScoreColor(analysis.ecoScore)}`}>
                            Ã‰co-Score {analysis.ecoScore}
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
              <div className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune analyse rÃ©cente</p>
                <button
                  onClick={() => navigate('/search')}
                  className="mt-4 text-green-600 hover:text-green-700 font-medium"
                >
                  Scanner mon premier produit
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA Mode demo */}
        {(MOCK_MODE || !isAuthenticated) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-8 bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center"
          >
            <Award className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">
              PrÃªt Ã  analyser vos propres produits ?
            </h3>
            <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
              CrÃ©ez votre compte gratuit et commencez Ã  faire des choix Ã©clairÃ©s pour votre santÃ© et l'environnement
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                CrÃ©er mon compte
              </button>
              <button
                onClick={() => navigate('/premium')}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all border border-white"
              >
                DÃ©couvrir Premium
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

