// PATH: frontend/src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Package, Star, AlertCircle,
  ArrowUpRight, ArrowDownRight, Calendar,
  ChevronRight, Target, Award, ShoppingBag,
  LogIn, X, Download, Filter, RefreshCw,
  FileText
} from 'lucide-react';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Mode démo désactivé - utilise la vraie API
const MOCK_MODE = false;

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

// Données mockées pour le mode demo
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
      productBrand: 'L\'Oréal',
      score: 68,
      category: 'cosmetics',
      date: new Date(Date.now() - 86400000).toISOString(),
      nutriScore: undefined,
      ecoScore: 'C'
    },
    {
      _id: '3',
      productName: 'Lessive Écologique',
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
      icon: '🎯',
      unlockedAt: new Date().toISOString(),
      progress: 100
    },
    {
      id: '2',
      name: 'Éco-Warrior',
      description: 'Scannez 50 produits écologiques',
      icon: '🌿',
      progress: 34
    },
    {
      id: '3',
      name: 'Santé Avant Tout',
      description: 'Maintenez un score santé moyen > 80',
      icon: '❤️',
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

  useEffect(() => {
    if (!isAuthenticated && !MOCK_MODE) {
      setShowLoginBanner(true);
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // En mode mock ou non connecté, utiliser les données mockées
      if (MOCK_MODE || !isAuthenticated) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler délai
        setStats(MOCK_STATS);
        return;
      }
      
      // Appel API réel
      const data = await dashboardService.getStats(selectedPeriod);
      setStats(data);
      
    } catch (error: any) {
      console.error('Erreur dashboard:', error);
      setError('Impossible de charger les données');
      // Fallback sur les données mockées
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const dashboardElement = document.getElementById('dashboard-content');
      if (!dashboardElement) {
        toast.error('Erreur lors de la génération du PDF');
        return;
      }

      // Afficher un message de chargement
      toast.loading('Génération du PDF en cours...', { id: 'pdf-export' });

      // Créer un nouveau document PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Ajouter le titre
      pdf.setFontSize(20);
      pdf.text('ECOLOJIA - Tableau de bord', pageWidth / 2, 20, { align: 'center' });
      
      // Ajouter les informations utilisateur
      pdf.setFontSize(12);
      pdf.text(`Utilisateur: ${user?.firstName || 'Demo'} ${user?.lastName || 'User'}`, 20, 35);
      pdf.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 20, 42);
      pdf.text(`Période: ${selectedPeriod === 'week' ? 'Cette semaine' : selectedPeriod === 'month' ? 'Ce mois' : 'Cette année'}`, 20, 49);
      
      // Ajouter une ligne de séparation
      pdf.line(20, 55, pageWidth - 20, 55);
      
      // Statistiques principales
      let yPosition = 65;
      pdf.setFontSize(16);
      pdf.text('Statistiques principales', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      const statsData = [
        ['Total de scans', `${stats.totalScans}`],
        ['Score santé moyen', `${stats.healthScoreAverage}%`],
        ['Progression mensuelle', `${stats.monthlyProgress > 0 ? '+' : ''}${stats.monthlyProgress}%`],
        ['Catégorie favorite', stats.topCategory]
      ];
      
      statsData.forEach(([label, value]) => {
        pdf.text(`${label}:`, 20, yPosition);
        pdf.text(value, 100, yPosition);
        yPosition += 7;
      });
      
      // Répartition par catégorie
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.text('Répartition par catégorie', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      const categoryData = [
        ['Alimentation', `${(stats?.categoryBreakdown?.food || 0)} produits`],
        ['Cosmétiques', `${(stats?.categoryBreakdown?.cosmetics || 0)} produits`],
        ['Détergents', `${(stats?.categoryBreakdown?.detergents || 0)} produits`]
      ];
      
      categoryData.forEach(([label, value]) => {
        pdf.text(`${label}:`, 20, yPosition);
        pdf.text(value, 100, yPosition);
        yPosition += 7;
      });
      
      // Analyses récentes
      if (stats?.recentAnalyses?.length > 0) {
        yPosition += 10;
        pdf.setFontSize(16);
        pdf.text('Analyses récentes', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(10);
        stats.recentAnalyses.slice(0, 5).forEach((analysis) => {
          const date = format(new Date(analysis.date), 'dd/MM/yyyy', { locale: fr });
          pdf.text(`${date} - ${analysis.productName} (${analysis.score}%)`, 20, yPosition);
          yPosition += 6;
          
          // Vérifier si on doit passer à la page suivante
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }
      
      // Ajouter un pied de page
      pdf.setFontSize(8);
      pdf.text('Généré par ECOLOJIA - www.ecolojia.app', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Sauvegarder le PDF
      pdf.save(`ecolojia-dashboard-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast.success('Export PDF réussi !', { id: 'pdf-export' });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error('Erreur lors de l\'export', { id: 'pdf-export' });
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
    labels: stats.weeklyTrend?.map(d => d.day),
    datasets: [
      {
        label: 'Scans',
        data: stats.weeklyTrend?.map(d => d.scans),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const doughnutData = {
    labels: ['Alimentation', 'Cosmétiques', 'Détergents'],
    datasets: [
      {
        data: [
          (stats?.categoryBreakdown?.food || 0),
          (stats?.categoryBreakdown?.cosmetics || 0),
          (stats?.categoryBreakdown?.detergents || 0)
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
      case 'food': return '🍎';
      case 'cosmetics': return '💄';
      case 'detergents': return '🧽';
      default: return '📦';
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
      {/* Bannière mode demo / non connecté */}
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
                {MOCK_MODE ? 'Mode démonstration actif' : 'Connectez-vous pour voir vos vraies statistiques'}
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
                {isAuthenticated && user ? `Bonjour ${user?.firstName || 'Utilisateur'} !` : 'Tableau de bord'}
              </h1>
              <p className="text-gray-600 mt-1">
                {MOCK_MODE ? 'Découvrez ce que ECOLOJIA peut vous offrir' : 'Voici un aperçu de vos analyses de produits'}
              </p>
            </div>
            
            <div className="flex gap-3">
              {/* Sélecteur de période */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
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
                onClick={handleExportPDF}
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
      <div id="dashboard-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                +8%
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.healthScoreAverage}%</h3>
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
            <h3 className="text-2xl font-bold text-gray-800">En progrès</h3>
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
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <ShoppingBag className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.topCategory}</h3>
            <p className="text-gray-600 text-sm mt-1">Catégorie préférée</p>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Répartition
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
                <span className="font-medium">{(stats?.categoryBreakdown?.food || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  Cosmétiques
                </span>
                <span className="font-medium">{(stats?.categoryBreakdown?.cosmetics || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                  Détergents
                </span>
                <span className="font-medium">{(stats?.categoryBreakdown?.detergents || 0)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Achievements / Badges */}
        {stats.achievements && stats?.achievements?.length > 0 && (
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
              {stats.achievements?.map((achievement) => (
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

        {/* Analyses récentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Analyses récentes
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
            {stats?.recentAnalyses?.length > 0 ? (
              stats.recentAnalyses?.map((analysis, index) => (
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
                            Éco-Score {analysis.ecoScore}
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
                <p className="text-gray-500">Aucune analyse récente</p>
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
              Prêt à analyser vos propres produits ?
            </h3>
            <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
              Créez votre compte gratuit et commencez à faire des choix éclairés pour votre santé et l'environnement
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Créer mon compte
              </button>
              <button
                onClick={() => navigate('/premium')}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all border border-white"
              >
                Découvrir Premium
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;