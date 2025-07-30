// frontend/src/components/dashboard/CommunityComparison.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Award, BarChart3, Info } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ComparisonData {
  user: {
    avgHealthScore: number;
    totalAnalyses: number;
    categoriesAnalyzed: number;
    scoreByCategory: Record<string, number>;
  };
  community: {
    avgHealthScore: number;
    totalUsers: number;
    totalAnalyses: number;
    avgAnalysesPerUser: number;
    scoreDistribution: Array<{ range: string; count: number; percentage: number }>;
  };
  percentile: number;
  rank: string;
  message: string;
}

export const CommunityComparison: React.FC = () => {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'categories' | 'distribution'>('overview');

  useEffect(() => {
    fetchComparisonData();
  }, []);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getCommunityComparison();
      setComparisonData(data);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (percentile: number) => {
    if (percentile >= 90) return 'from-yellow-400 to-yellow-600';
    if (percentile >= 75) return 'from-purple-400 to-purple-600';
    if (percentile >= 50) return 'from-blue-400 to-blue-600';
    if (percentile >= 25) return 'from-green-400 to-green-600';
    return 'from-gray-400 to-gray-600';
  };

  const getRankIcon = (percentile: number) => {
    if (percentile >= 90) return '🏆';
    if (percentile >= 75) return '🥈';
    if (percentile >= 50) return '🥉';
    return '📊';
  };

  const getRankTitle = (percentile: number) => {
    if (percentile >= 90) return 'Expert Ecolojia';
    if (percentile >= 75) return 'Utilisateur Avancé';
    if (percentile >= 50) return 'Utilisateur Régulier';
    if (percentile >= 25) return 'Débutant Motivé';
    return 'Nouvel Utilisateur';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!comparisonData) return null;

  // Prepare radar chart data
  const radarData = [
    {
      subject: 'Score Santé',
      user: comparisonData.user.avgHealthScore,
      community: comparisonData.community.avgHealthScore,
      fullMark: 100
    },
    {
      subject: 'Analyses/Mois',
      user: Math.min(comparisonData.user.totalAnalyses, 100),
      community: Math.min(comparisonData.community.avgAnalysesPerUser, 100),
      fullMark: 100
    },
    {
      subject: 'Diversité',
      user: comparisonData.user.categoriesAnalyzed * 33.33,
      community: 66.67, // Moyenne communauté (2 catégories)
      fullMark: 100
    }
  ];

  // Score distribution colors
  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Users className="w-6 h-6 mr-2 text-blue-600" />
          Comparaison avec la Communauté
        </h2>
        <p className="text-gray-600 mt-1">Découvrez comment vous vous situez par rapport aux autres utilisateurs</p>
      </div>

      {/* Rank Badge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className={`bg-gradient-to-r ${getRankColor(comparisonData.percentile)} rounded-2xl p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-4xl">{getRankIcon(comparisonData.percentile)}</span>
                <div>
                  <h3 className="text-2xl font-bold">{getRankTitle(comparisonData.percentile)}</h3>
                  <p className="text-white/80">Top {100 - comparisonData.percentile}% des utilisateurs</p>
                </div>
              </div>
              <p className="text-white/90">{comparisonData.message}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{comparisonData.percentile}°</div>
              <div className="text-sm text-white/80">Percentile</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* View Selector */}
      <div className="flex space-x-2 mb-6">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
          { id: 'categories', label: 'Par catégorie', icon: TrendingUp },
          { id: 'distribution', label: 'Distribution', icon: Award }
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id as any)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              selectedView === view.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <view.icon className="w-4 h-4 mr-2" />
            {view.label}
          </button>
        ))}
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Votre score moyen</span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{comparisonData.user.avgHealthScore}/100</div>
              <div className="text-sm text-gray-500">
                vs {comparisonData.community.avgHealthScore}/100 communauté
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Vos analyses</span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{comparisonData.user.totalAnalyses}</div>
              <div className="text-sm text-gray-500">
                vs {Math.round(comparisonData.community.avgAnalysesPerUser)} en moyenne
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Position globale</span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">#{Math.round((100 - comparisonData.percentile) * comparisonData.community.totalUsers / 100)}</div>
              <div className="text-sm text-gray-500">
                sur {comparisonData.community.totalUsers} utilisateurs
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Vous" dataKey="user" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="Communauté" dataKey="community" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {selectedView === 'categories' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-4">
            {Object.entries(comparisonData.user.scoreByCategory || {}).map(([category, score]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{category}</span>
                  <span className={`font-bold ${score > 70 ? 'text-green-600' : score > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {score}/100
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-3 rounded-full ${
                        score > 70 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <div 
                    className="absolute top-0 h-3 w-1 bg-gray-600"
                    style={{ left: `${comparisonData.community.avgHealthScore}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                      Moy. communauté
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {selectedView === 'distribution' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Distribution des scores dans la communauté</h3>
            <p className="text-sm text-gray-600">Votre position est indiquée par la barre en surbrillance</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData.community.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Pourcentage']}
                  labelFormatter={(label) => `Score ${label}`}
                />
                <Bar dataKey="percentage" name="% d'utilisateurs">
                  {comparisonData.community.scoreDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.range.includes(comparisonData.user.avgHealthScore.toString()) 
                          ? '#3b82f6' 
                          : '#e5e7eb'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
};
export default CommunityComparison;
// EOF