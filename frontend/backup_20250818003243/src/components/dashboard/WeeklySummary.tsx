// frontend/src/components/dashboard/WeeklySummary.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Award, Target, ChevronLeft, ChevronRight, Download, Mail } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface WeeklySummaryData {
  period: {
    start: string;
    end: string;
    weekNumber: number;
  };
  stats: {
    totalScans: number;
    avgHealthScore: number;
    bestProduct: {
      name: string;
      score: number;
      date: string;
    };
    worstProduct: {
      name: string;
      score: number;
      date: string;
    };
    categoriesScanned: string[];
    improvementFromLastWeek: number;
  };
  insights: Array<{
    type: 'achievement' | 'improvement' | 'warning' | 'tip';
    title: string;
    description: string;
  }>;
  goals: {
    achieved: Array<{
      title: string;
      description: string;
    }>;
    nextWeek: Array<{
      title: string;
      target: string;
    }>;
  };
}

export const WeeklySummary: React.FC = () => {
  const [summaryData, setSummaryData] = useState<WeeklySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    fetchWeeklySummary();
  }, [currentWeek]);

  const fetchWeeklySummary = async () => {
    try {
      setLoading(true);
      const weekStart = startOfWeek(currentWeek, { locale: fr });
      const data = await dashboardService.getWeeklySummary(weekStart.toISOString());
      setSummaryData(data);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentWeek(direction === 'prev' ? subWeeks(currentWeek, 1) : addWeeks(currentWeek, 1));
      setIsAnimating(false);
    }, 200);
  };

  const handleExportPDF = async () => {
    try {
      toast.loading('Generation du rapport PDF...');
      await dashboardService.exportWeeklySummaryPDF(currentWeek.toISOString());
      toast.success('Rapport telecharge !');
    } catch (error) {
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  const handleEmailSummary = async () => {
    try {
      toast.loading('Envoi du resume par email...');
      await dashboardService.emailWeeklySummary(currentWeek.toISOString());
      toast.success('Resume envoye par email !');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return 'aa';
      case 'improvement': return 'aaa';
      case 'warning': return 'a';
      case 'tip': return 'aaa';
      default: return 'aaa';
    }
  };

  const getScoreChange = (improvement: number) => {
    if (improvement > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="font-medium">+{improvement}%</span>
        </div>
      );
    } else if (improvement < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          <span className="font-medium">{improvement}%</span>
        </div>
      );
    }
    return <span className="text-gray-500">Stable</span>;
  };

  if (loading && !summaryData) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!summaryData) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-purple-600" />
            Resume Hebdomadaire
          </h2>
          <p className="text-gray-600 mt-1">
            Semaine {summaryDat?.period.weekNumber} ? {format(new Date(summaryDat?.period.start), 'd MMM', { locale: fr })} - {format(new Date(summaryDat?.period.end), 'd MMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={currentWeek > new Date()}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isAnimating && (
          <motion.div
            key={currentWeek.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Analyses</p>
                    <p className="text-2xl font-bold text-gray-800">{summaryDat?.stats.totalScans}</p>
                  </div>
                  <div className="text-3xl">aa</div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Score moyen</p>
                    <p className="text-2xl font-bold text-gray-800">{summaryDat?.stats.avgHealthScore}/100</p>
                  </div>
                  {getScoreChange(summaryDat?.stats.improvementFromLastWeek)}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Meilleur score</p>
                    <p className="text-lg font-bold text-gray-800 truncate">{summaryDat?.stats.bestProduct.name}</p>
                    <p className="text-sm text-gray-600">{summaryDat?.stats.bestProduct.score}/100</p>
                  </div>
                  <div className="text-3xl">a</div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">a ameliorer</p>
                    <p className="text-lg font-bold text-gray-800 truncate">{summaryDat?.stats.worstProduct.name}</p>
                    <p className="text-sm text-gray-600">{summaryDat?.stats.worstProduct.score}/100</p>
                  </div>
                  <div className="text-3xl">a</div>
                </div>
              </motion.div>
            </div>

            {/* Insights */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">aa Insights de la semaine</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {summaryDat?.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'achievement' ? 'border-green-500 bg-green-50' :
                      insight.type === 'improvement' ? 'border-blue-500 bg-blue-50' :
                      insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      'border-purple-500 bg-purple-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                      <div>
                        <h4 className="font-medium text-gray-800">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Achieved Goals */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-green-600" />
                  Objectifs atteints
                </h3>
                <div className="space-y-2">
                  {summaryDat?.goals.achieved.length > 0 ? (
                    summaryDat?.goals.achieved.map((goal, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg"
                      >
                        <span className="text-green-600">aaaa</span>
                        <div>
                          <p className="font-medium text-gray-800">{goal.title}</p>
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Aucun objectif specifique cette semaine</p>
                  )}
                </div>
              </div>

              {/* Next Week Goals */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Objectifs semaine prochaine
                </h3>
                <div className="space-y-2">
                  {summaryDat?.goals.nextWeek.map((goal, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg"
                    >
                      <span className="text-blue-600">aaaaaa</span>
                      <div>
                        <p className="font-medium text-gray-800">{goal.title}</p>
                        <p className="text-sm text-gray-600">{goal.target}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-3 pt-4 border-t">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportPDF}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Telecharger PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEmailSummary}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Envoyer par email
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// aaaa ? ajouter  la toute fin :
export default WeeklySummary;
// EOF



