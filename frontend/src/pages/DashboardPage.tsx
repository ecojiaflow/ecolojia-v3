// frontend/ecolojiaFrontV3/src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { Line, Doughnut } from 'react-chartjs-2';
import { dashboardService } from '../services/dashboardService';
import LoadingSpinner from '../components/LoadingSpinner';
import { TrendingUp, Award, Target, AlertCircle } from 'lucide-react';

// Enregistrement des composants Chart.js
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

interface AnalysisData {
  _id: string;
  productName: string;
  score: number;
  category: string;
  date: string;
}

interface Stats {
  totalScans: number;
  healthScoreAverage: number;
  categoryBreakdown: {
    food: number;
    cosmetics: number;
    detergents: number;
  };
  recentAnalyses: AnalysisData[];
  weeklyTrend: Array<{
    day: string;
    scans: number;
  }>;
}

// Fonction de test pour debug
async function testDashboardConnection() {
  console.log('🔍 Test de connexion Dashboard...');
  
  try {
    const response = await fetch('http://localhost:5001/api/dashboard/stats', {
      headers: {
        'Authorization': 'Bearer test-token-507f1f77bcf86cd799439011',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Dashboard data (fetch direct):', data);
      return data;
    } else {
      console.error('❌ Erreur serveur:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
    return null;
  }
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsUsingDemoData(false);
      
      console.log('📊 Fetching dashboard stats...');
      
      // Tenter d'abord via le service
      try {
        const data = await dashboardService.getStats();
        console.log('✅ Stats reçues via service:', data);
        setStats(data);
        return;
      } catch (serviceError) {
        console.error('⚠️ Service error, trying direct fetch...', serviceError);
      }
      
      // Si le service échoue, tenter un fetch direct
      const directData = await testDashboardConnection();
      if (directData) {
        // Transformer les données si nécessaire
        const transformedData = {
          totalScans: directData.overview?.totalAnalyses || 0,
          healthScoreAverage: directData.overview?.avgHealthScore || 0,
          categoryBreakdown: directData.overview?.categories || { food: 0, cosmetics: 0, detergents: 0 },
          recentAnalyses: (directData.recentAnalyses || []).map((a: any) => ({
            _id: a.id || a._id,
            productName: a.productName,
            score: a.healthScore,
            category: a.category,
            date: a.date
          })),
          weeklyTrend: generateWeeklyTrend(directData)
        };
        setStats(transformedData);
        return;
      }
      
      // Si tout échoue, utiliser les données de démo
      console.log('📊 Using demo data...');
      setIsUsingDemoData(true);
      setStats(getDemoStats());
      
    } catch (err: any) {
      console.error('❌ Error fetching dashboard stats:', err);
      setError('Impossible de charger les données. Mode démo activé.');
      setIsUsingDemoData(true);
      setStats(getDemoStats());
    } finally {
      setLoading(false);
    }
  };

  // Générer les données de tendance hebdomadaire
  function generateWeeklyTrend(data: any): Array<{ day: string; scans: number }> {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const total = data?.weeklyDigest?.scansCount || 12;
    const distribution = [0.15, 0.18, 0.14, 0.20, 0.16, 0.10, 0.07];
    
    return days.map((day, index) => ({
      day,
      scans: Math.round(total * distribution[index])
    }));
  }

  // Données de démonstration
  function getDemoStats(): Stats {
    return {
      totalScans: 47,
      healthScoreAverage: 73,
      categoryBreakdown: {
        food: 35,
        cosmetics: 8,
        detergents: 4
      },
      recentAnalyses: [
        {
          _id: '1',
          productName: 'Yaourt Nature Bio',
          score: 92,
          category: 'food',
          date: new Date().toISOString()
        },
        {
          _id: '2',
          productName: 'Shampoing Sans Sulfate L\'Oréal',
          score: 78,
          category: 'cosmetics',
          date: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: '3',
          productName: 'Nutella Pâte à Tartiner',
          score: 45,
          category: 'food',
          date: new Date(Date.now() - 172800000).toISOString()
        },
        {
          _id: '4',
          productName: 'Lessive Écologique Arbre Vert',
          score: 85,
          category: 'detergents',
          date: new Date(Date.now() - 259200000).toISOString()
        },
        {
          _id: '5',
          productName: 'Coca-Cola Original',
          score: 38,
          category: 'food',
          date: new Date(Date.now() - 345600000).toISOString()
        }
      ],
      weeklyTrend: [
        { day: 'Lun', scans: 7 },
        { day: 'Mar', scans: 9 },
        { day: 'Mer', scans: 6 },
        { day: 'Jeu', scans: 10 },
        { day: 'Ven', scans: 8 },
        { day: 'Sam', scans: 5 },
        { day: 'Dim', scans: 2 }
      ]
    };
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Aucune donnée disponible</p>
          <button 
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Configuration des graphiques
  const categoryData = {
    labels: ['Alimentaire', 'Cosmétiques', 'Détergents'],
    datasets: [{
      data: [
        stats.categoryBreakdown?.food || 0,
        stats.categoryBreakdown?.cosmetics || 0,
        stats.categoryBreakdown?.detergents || 0
      ],
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const weeklyData = {
    labels: stats.weeklyTrend?.map(item => item.day) || [],
    datasets: [{
      label: 'Scans',
      data: stats.weeklyTrend?.map(item => item.scans) || [],
      fill: true,
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderColor: '#22C55E',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#22C55E',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10
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

  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">📊 Tableau de bord</h1>
              <p className="text-gray-600 mt-2">Suivez votre progression santé</p>
            </div>
            {isUsingDemoData && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                <p className="text-sm text-amber-800">🔄 Mode démonstration actif</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total des scans</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {stats.totalScans || 0}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  +12 cette semaine
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Score moyen</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {stats.healthScoreAverage || 0}
                  <span className="text-lg font-normal text-gray-500">/100</span>
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <p className="text-xs text-green-600">+5 vs mois dernier</p>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Cette semaine</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {stats.weeklyTrend?.reduce((sum, day) => sum + day.scans, 0) || 0}
                </p>
                <div className="flex items-center mt-2">
                  <Award className="w-4 h-4 text-amber-500 mr-1" />
                  <p className="text-xs text-amber-600">Série de 7 jours !</p>
                </div>
              </div>
              <div className="bg-amber-100 p-3 rounded-xl">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition par catégorie</h3>
            <div className="h-64">
              <Doughnut data={categoryData} options={doughnutOptions} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Activité hebdomadaire</h3>
            <div className="h-64">
              <Line data={weeklyData} options={{ ...chartOptions, maintainAspectRatio: false }} />
            </div>
          </motion.div>
        </div>

        {/* Recent Analyses */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Analyses récentes</h3>
            <button className="text-sm text-green-600 hover:text-green-700 font-medium">
              Voir tout →
            </button>
          </div>
          
          <div className="space-y-4">
            {stats.recentAnalyses && stats.recentAnalyses.length > 0 ? (
              stats.recentAnalyses.map((analysis) => (
                <motion.div 
                  key={analysis._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-12 rounded-full ${
                      analysis.score >= 80 ? 'bg-green-500' :
                      analysis.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-800">{analysis.productName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(analysis.date).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${analysis.category === 'food' ? 'bg-green-100 text-green-800' : 
                        analysis.category === 'cosmetics' ? 'bg-blue-100 text-blue-800' : 
                        'bg-amber-100 text-amber-800'}`}>
                      {analysis.category === 'food' ? '🍎 Alimentaire' :
                       analysis.category === 'cosmetics' ? '✨ Cosmétique' : '🧽 Détergent'}
                    </span>
                    <div className="text-right">
                      <span className={`text-2xl font-bold
                        ${analysis.score >= 80 ? 'text-green-600' :
                          analysis.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {analysis.score}
                      </span>
                      <p className="text-xs text-gray-500">Score</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune analyse récente</p>
                <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Scanner un produit
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <button className="bg-green-500 hover:bg-green-600 text-white rounded-xl p-4 flex items-center justify-center space-x-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Scanner un produit</span>
          </button>
          
          <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-4 flex items-center justify-center space-x-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">Exporter les données</span>
          </button>
          
          <button className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl p-4 flex items-center justify-center space-x-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <span className="font-medium">Voir les insights</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;