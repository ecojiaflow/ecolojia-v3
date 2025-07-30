// PATH: frontend/ecolojiaFrontV3/src/components/analytics/QuickStatsWidget.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react';
import { useUserAnalytics } from '../../hooks/useUserAnalytics';

/**
 * 📊 QuickStatsWidget - Aperçu Analytics pour HomePage
 * Widget compact qui montre les stats essentielles utilisateur
 * Incite à aller vers le dashboard complet
 */

const QuickStatsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { getHealthMetrics, getScoreEvolution, getGoalsProgress, hasData } = useUserAnalytics();

  const healthMetrics = getHealthMetrics();
  const scoreEvolution = getScoreEvolution();
  const goalsProgress = getGoalsProgress();

  // Si pas de données, afficher widget démo
  if (!hasData()) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Votre Dashboard Personnel
          </h3>
          <p className="text-gray-600 text-sm">
            Analysez vos premiers produits pour débloquer vos statistiques
          </p>
        </div>

        {/* Stats Démo */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">--</div>
            <p className="text-xs text-green-700 font-medium">Score Santé</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">--</div>
            <p className="text-xs text-blue-700 font-medium">Analyses</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">--</div>
            <p className="text-xs text-purple-700 font-medium">Objectifs</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">--</div>
            <p className="text-xs text-orange-700 font-medium">Badges</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          Découvrir mon Dashboard
        </button>

        <div className="mt-4 p-3 bg-purple-50 rounded-lg text-center">
          <p className="text-purple-700 text-xs">
            <strong>🎯 Première étape :</strong> Analysez 3 produits pour commencer !
          </p>
        </div>
      </div>
    );
  }

  // Calculs pour les stats
  const currentScore = healthMetrics.currentHealthScore;
  const totalAnalyses = healthMetrics.totalScans;
  const activeGoals = goalsProgress.filter(g => g.progress < 100).length;
  const completedAchievements = healthMetrics.achievementsEarned;
  
  // Évolution score (derniers 7 jours vs précédents)
  const recentEvolution = scoreEvolution.slice(-7);
  const previousEvolution = scoreEvolution.slice(-14, -7);
  const avgRecent = recentEvolution.length > 0 
    ? recentEvolution.reduce((sum, s) => sum + s.score, 0) / recentEvolution.length 
    : currentScore;
  const avgPrevious = previousEvolution.length > 0 
    ? previousEvolution.reduce((sum, s) => sum + s.score, 0) / previousEvolution.length 
    : avgRecent;
  const trend = avgRecent - avgPrevious;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            📊 Vos Statistiques
          </h3>
          <p className="text-gray-600 text-sm">
            Aperçu de vos progrès nutrition
          </p>
        </div>
        <div className="text-right">
          {trend > 0 && (
            <div className="flex items-center text-green-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="font-medium">+{trend.toFixed(1)} pts</span>
            </div>
          )}
          {trend < 0 && (
            <div className="flex items-center text-orange-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
              <span className="font-medium">{trend.toFixed(1)} pts</span>
            </div>
          )}
          {trend === 0 && (
            <div className="flex items-center text-gray-600 text-sm">
              <span className="font-medium">Stable</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{currentScore}</div>
          <p className="text-xs text-green-700 font-medium">Score Santé</p>
          <p className="text-xs text-green-600 mt-1">/100</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{totalAnalyses}</div>
          <p className="text-xs text-blue-700 font-medium">Analyses</p>
          <p className="text-xs text-blue-600 mt-1">réalisées</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{activeGoals}</div>
          <p className="text-xs text-purple-700 font-medium">Objectifs</p>
          <p className="text-xs text-purple-600 mt-1">en cours</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{completedAchievements}</div>
          <p className="text-xs text-orange-700 font-medium">Badges</p>
          <p className="text-xs text-orange-600 mt-1">obtenus</p>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="space-y-3 mb-6">
        {/* Score Santé Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-green-500 mr-2">❤️</div>
            <span className="text-sm font-medium text-gray-700">Score Santé Global</span>
          </div>
          <div className="flex items-center">
            <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${currentScore}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-800">{currentScore}%</span>
          </div>
        </div>

        {/* Objectif Principal */}
        {goalsProgress.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-4 h-4 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Objectif Principal</span>
            </div>
            <div className="flex items-center">
              <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${goalsProgress[0]?.progress || 0}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-800">{Math.round(goalsProgress[0]?.progress || 0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          Voir Dashboard Complet
        </button>
        
        <button
          onClick={() => navigate('/product')}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center justify-center"
        >
          🔬 Analyser un nouveau produit
        </button>
      </div>

      {/* Insight du jour */}
      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
        <p className="text-purple-700 text-xs text-center">
          <strong>💡 Insight :</strong> 
          {currentScore >= 75 
            ? " Excellente hygiène alimentaire ! Continuez ainsi."
            : currentScore >= 50 
            ? " Bon progrès ! Réduisez les produits ultra-transformés."
            : " Optimisez vos choix avec moins d'additifs."
          }
        </p>
      </div>
    </div>
  );
};

export default QuickStatsWidget;