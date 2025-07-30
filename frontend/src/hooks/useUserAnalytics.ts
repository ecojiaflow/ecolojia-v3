// PATH: frontend/ecolojiaFrontV3/src/hooks/useUserAnalytics.ts
import { useState, useEffect, useCallback } from 'react';

// ✅ INTERFACES COMPATIBLES DASHBOARDPAGE
export interface HealthMetrics {
  healthScore: number;           // ← Nom attendu par DashboardPage
  totalScans: number;
  averageNovaScore: number;
  ultraTransformPercent: number; // ← Nom attendu par DashboardPage
  additivesCount: number;        // ← Nom attendu par DashboardPage
  bioProductsPercent: number;
  improvementTrend: number;      // ← Nom attendu par DashboardPage
  lastAnalysisDate: Date | null;
}

export interface ScoreEvolution {
  date: Date;
  healthScore: number;          // ← Nom attendu par DashboardPage
  novaGroup: number;
  scansCount: number;           // ← Nom attendu par DashboardPage
  productName?: string;
}

export interface PersonalizedInsight {
  id: string;
  title: string;
  message: string;
  action: string;               // ← Propriété attendue par DashboardPage
  priority: 'low' | 'medium' | 'high'; // ← Format attendu
  category: 'health' | 'nutrition' | 'additives' | 'nova' | 'bio';
  isRead: boolean;              // ← Propriété attendue par DashboardPage
  createdAt: Date;
}

export interface UserGoal {
  id: string;
  type: 'improve_score' | 'reduce_ultra_processed' | 'increase_bio' | 'reduce_additives' | 'custom'; // ← Format attendu
  title: string;
  description: string;
  target: number;               // ← Nom attendu par DashboardPage
  current: number;              // ← Nom attendu par DashboardPage
  progress: number;
  unit: string;
  deadline: Date;
  isCompleted: boolean;         // ← Propriété attendue par DashboardPage
  createdAt: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'scanner' | 'health' | 'consistency' | 'improvement';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  scansCount: number;           // ← Nom attendu par DashboardPage
  avgHealthScore: number;       // ← Nom attendu par DashboardPage
  improvement: number;
  bestProduct: string;
  worstProduct: string;
  mainInsight: string;          // ← Propriété attendue par DashboardPage
  nextWeekGoal: string;         // ← Propriété attendue par DashboardPage
}

export interface ProductAnalysis {
  id: string;
  productName: string;
  timestamp: Date;
  novaGroup: number;
  healthScore: number;
  ultraTransformLevel: number;
  additives: string[];
  ingredients: string;
  analysisSource: string;
  userRating?: number;
  isBookmarked: boolean;
  category?: string;
  isBio?: boolean;
}

export interface OverallStats {
  totalScans: number;
  totalDays: number;
  averageScansPerDay: number;
  firstScanDate: Date | null;
  lastScanDate: Date | null;
  favoriteCategory: string;
  improvementSinceStart: number;
}

/**
 * 📊 useUserAnalytics Hook - Compatible DashboardPage
 * Version adaptée pour fonctionner avec votre DashboardPage existant
 */
export const useUserAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== STORAGE KEYS ==========
  const STORAGE_KEYS = {
    analyses: 'ecolojia_user_analyses',
    goals: 'ecolojia_user_goals',
    achievements: 'ecolojia_user_achievements',
    insights: 'ecolojia_user_insights',
    preferences: 'ecolojia_user_preferences',
    weeklyReports: 'ecolojia_weekly_reports'
  };

  // ========== UTILITY FUNCTIONS ==========
  
  const getStoredData = useCallback((key: string, defaultValue: any = []) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn(`Erreur lecture ${key}:`, error);
      return defaultValue;
    }
  }, []);

  const saveData = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Erreur sauvegarde ${key}:`, error);
      setError('Erreur de sauvegarde');
      return false;
    }
  }, []);

  // ========== TRACKING FUNCTION ==========
  
  const trackScan = useCallback((analysis: Omit<ProductAnalysis, 'id' | 'timestamp'>) => {
    try {
      const analyses = getStoredData(STORAGE_KEYS.analyses, []);
      
      const newAnalysis: ProductAnalysis = {
        ...analysis,
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      
      analyses.push(newAnalysis);
      
      // Garder seulement les 100 dernières analyses
      if (analyses.length > 100) {
        analyses.splice(0, analyses.length - 100);
      }
      
      saveData(STORAGE_KEYS.analyses, analyses);
      
      console.log('📊 Analyse trackée:', newAnalysis.productName);
      return newAnalysis;
    } catch (error) {
      console.error('Erreur tracking scan:', error);
      setError('Erreur de tracking');
      return null;
    }
  }, [getStoredData, saveData]);

  // ========== MAIN DATA GETTERS (COMPATIBLES DASHBOARDPAGE) ==========

  const metrics = useCallback((): HealthMetrics | null => {
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    if (analyses.length === 0) return null;

    // Calcul score santé
    const healthScores = analyses.map((a: ProductAnalysis) => a.healthScore || 50);
    const healthScore = Math.round(healthScores.reduce((sum: number, score: number) => sum + score, 0) / healthScores.length);

    // Calcul NOVA moyen
    const novaScores = analyses.map((a: ProductAnalysis) => a.novaGroup || 2);
    const averageNovaScore = Number((novaScores.reduce((sum: number, nova: number) => sum + nova, 0) / novaScores.length).toFixed(1));

    // Calcul ultra-transformés
    const ultraCount = analyses.filter((a: ProductAnalysis) => (a.novaGroup || 2) >= 4).length;
    const ultraTransformPercent = Math.round((ultraCount / analyses.length) * 100);

    // Calcul additifs
    const additivesCount = analyses.reduce((total: number, a: ProductAnalysis) => total + (a.additives?.length || 0), 0);

    // Calcul bio
    const bioCount = analyses.filter((a: ProductAnalysis) => a.isBio === true).length;
    const bioProductsPercent = Math.round((bioCount / analyses.length) * 100);

    // Calcul tendance amélioration
    let improvementTrend = 0;
    if (analyses.length >= 4) {
      const recent = analyses.slice(-2);
      const previous = analyses.slice(-4, -2);
      if (recent.length === 2 && previous.length === 2) {
        const recentAvg = (recent[0].healthScore + recent[1].healthScore) / 2;
        const previousAvg = (previous[0].healthScore + previous[1].healthScore) / 2;
        improvementTrend = Math.round(recentAvg - previousAvg);
      }
    }

    return {
      healthScore,
      totalScans: analyses.length,
      averageNovaScore,
      ultraTransformPercent,
      additivesCount,
      bioProductsPercent,
      improvementTrend,
      lastAnalysisDate: analyses.length > 0 ? new Date(analyses[analyses.length - 1].timestamp) : null
    };
  }, [getStoredData]);

  const evolution = useCallback((): ScoreEvolution[] => {
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    
    // Grouper par jour
    const byDay = analyses.reduce((acc: any, analysis: ProductAnalysis) => {
      const date = new Date(analysis.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = { scores: [], novaGroups: [], count: 0, products: [] };
      }
      acc[date].scores.push(analysis.healthScore || 50);
      acc[date].novaGroups.push(analysis.novaGroup || 2);
      acc[date].count++;
      acc[date].products.push(analysis.productName);
      return acc;
    }, {});

    return Object.entries(byDay).map(([dateStr, data]: [string, any]) => ({
      date: new Date(dateStr),
      healthScore: Math.round(data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length),
      novaGroup: Math.round(data.novaGroups.reduce((sum: number, nova: number) => sum + nova, 0) / data.novaGroups.length),
      scansCount: data.count,
      productName: data.products[0]
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [getStoredData]);

  const insights = useCallback((): PersonalizedInsight[] => {
    const storedInsights = getStoredData(STORAGE_KEYS.insights, []);
    
    // Si pas d'insights, en générer quelques-uns basiques
    if (storedInsights.length === 0) {
      const currentMetrics = metrics();
      if (currentMetrics && currentMetrics.totalScans >= 3) {
        const generatedInsights: PersonalizedInsight[] = [];
        
        if (currentMetrics.ultraTransformPercent > 50) {
          generatedInsights.push({
            id: 'ultra_warning',
            title: 'Trop de produits ultra-transformés',
            message: `${currentMetrics.ultraTransformPercent}% de vos produits sont ultra-transformés (NOVA 4).`,
            action: 'Privilégiez les produits NOVA 1 et 2 pour votre prochaine analyse.',
            priority: 'high',
            category: 'health',
            isRead: false,
            createdAt: new Date()
          });
        }
        
        if (currentMetrics.healthScore >= 75) {
          generatedInsights.push({
            id: 'good_progress',
            title: 'Excellents choix alimentaires !',
            message: `Votre score de ${currentMetrics.healthScore}/100 montre de très bonnes habitudes.`,
            action: 'Continuez sur cette lancée en maintenant vos bonnes habitudes.',
            priority: 'low',
            category: 'health',
            isRead: false,
            createdAt: new Date()
          });
        }
        
        saveData(STORAGE_KEYS.insights, generatedInsights);
        return generatedInsights;
      }
    }
    
    return storedInsights;
  }, [getStoredData, saveData, metrics]);

  const goals = useCallback((): UserGoal[] => {
    const storedGoals = getStoredData(STORAGE_KEYS.goals, []);
    const currentMetrics = metrics();
    
    // Si pas d'objectifs et qu'on a des données, créer des objectifs par défaut
    if (storedGoals.length === 0 && currentMetrics && currentMetrics.totalScans >= 1) {
      const defaultGoals: UserGoal[] = [
        {
          id: 'improve_score_default',
          type: 'improve_score',
          title: 'Atteindre 75 points de score santé',
          description: 'Améliorer progressivement mes choix alimentaires',
          target: 75,
          current: currentMetrics.healthScore,
          progress: Math.min((currentMetrics.healthScore / 75) * 100, 100),
          unit: 'points',
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 jours
          isCompleted: currentMetrics.healthScore >= 75,
          createdAt: new Date()
        }
      ];
      
      if (currentMetrics.ultraTransformPercent > 30) {
        defaultGoals.push({
          id: 'reduce_ultra_default',
          type: 'reduce_ultra_processed',
          title: 'Réduire les ultra-transformés sous 30%',
          description: 'Limiter ma consommation de produits NOVA 4',
          target: 30,
          current: 100 - currentMetrics.ultraTransformPercent,
          progress: Math.min(((100 - currentMetrics.ultraTransformPercent) / 70) * 100, 100),
          unit: 'percent',
          deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 jours
          isCompleted: currentMetrics.ultraTransformPercent <= 30,
          createdAt: new Date()
        });
      }
      
      saveData(STORAGE_KEYS.goals, defaultGoals);
      return defaultGoals;
    }
    
    // Mettre à jour les progrès
    return storedGoals.map((goal: UserGoal) => {
      let current = goal.current;
      let progress = goal.progress;
      let isCompleted = goal.isCompleted;

      if (currentMetrics) {
        switch (goal.type) {
          case 'improve_score':
            current = currentMetrics.healthScore;
            progress = Math.min((current / goal.target) * 100, 100);
            isCompleted = current >= goal.target;
            break;
          case 'reduce_ultra_processed':
            current = 100 - currentMetrics.ultraTransformPercent;
            progress = Math.min((current / goal.target) * 100, 100);
            isCompleted = currentMetrics.ultraTransformPercent <= goal.target;
            break;
        }
      }

      return {
        ...goal,
        current: Math.round(current),
        progress: Math.round(progress),
        isCompleted
      };
    });
  }, [getStoredData, saveData, metrics]);

  const achievements = useCallback((): Achievement[] => {
    const storedAchievements = getStoredData(STORAGE_KEYS.achievements, []);
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    
    // Vérifier et débloquer nouveaux achievements
    const achievementRules = [
      {
        id: 'first_scan',
        title: '🔍 Premier Scan',
        description: 'Première analyse réalisée',
        icon: '🔍',
        category: 'scanner' as const,
        rarity: 'common' as const,
        check: () => analyses.length >= 1
      },
      {
        id: 'explorer',
        title: '📊 Explorateur',
        description: '5 analyses réalisées',
        icon: '📊',
        category: 'scanner' as const,
        rarity: 'common' as const,
        check: () => analyses.length >= 5
      },
      {
        id: 'analyst',
        title: '🧪 Analyste',
        description: '10 analyses réalisées',
        icon: '🧪',
        category: 'scanner' as const,
        rarity: 'rare' as const,
        check: () => analyses.length >= 10
      }
    ];
    
    const existingIds = storedAchievements.map((a: Achievement) => a.id);
    const newAchievements: Achievement[] = [];
    
    achievementRules.forEach(rule => {
      if (!existingIds.includes(rule.id) && rule.check()) {
        newAchievements.push({
          id: rule.id,
          title: rule.title,
          description: rule.description,
          icon: rule.icon,
          unlockedAt: new Date(),
          category: rule.category,
          rarity: rule.rarity
        });
      }
    });
    
    if (newAchievements.length > 0) {
      const allAchievements = [...storedAchievements, ...newAchievements];
      saveData(STORAGE_KEYS.achievements, allAchievements);
      return allAchievements;
    }
    
    return storedAchievements;
  }, [getStoredData, saveData]);

  const weeklyReport = useCallback((): WeeklyReport | null => {
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    if (analyses.length < 3) return null;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekAnalyses = analyses.filter((a: ProductAnalysis) => 
      new Date(a.timestamp) >= oneWeekAgo
    );
    
    if (weekAnalyses.length === 0) return null;
    
    const avgScore = Math.round(weekAnalyses.reduce((sum: number, a: ProductAnalysis) => 
      sum + (a.healthScore || 50), 0) / weekAnalyses.length);
    
    const bestProduct = weekAnalyses.reduce((best: ProductAnalysis, current: ProductAnalysis) => 
      (current.healthScore || 0) > (best.healthScore || 0) ? current : best
    );
    
    const worstProduct = weekAnalyses.reduce((worst: ProductAnalysis, current: ProductAnalysis) => 
      (current.healthScore || 100) < (worst.healthScore || 100) ? current : worst
    );
    
    return {
      weekStart: oneWeekAgo,
      weekEnd: new Date(),
      scansCount: weekAnalyses.length,
      avgHealthScore: avgScore,
      improvement: 0, // Simplifiéé pour l'instant
      bestProduct: bestProduct.productName,
      worstProduct: worstProduct.productName,
      mainInsight: avgScore >= 70 ? 'Excellente semaine, continuez !' : 'Vous pouvez mieux faire cette semaine.',
      nextWeekGoal: avgScore >= 70 ? 'Maintenir ce niveau' : 'Viser +5 points de score moyen'
    };
  }, [getStoredData]);

  const overallStats = useCallback((): OverallStats | null => {
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    if (analyses.length === 0) return null;

    const dates = analyses.map((a: ProductAnalysis) => new Date(a.timestamp));
    const firstScanDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const lastScanDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const totalDays = Math.max(1, Math.ceil((lastScanDate.getTime() - firstScanDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      totalScans: analyses.length,
      totalDays,
      averageScansPerDay: Number((analyses.length / totalDays).toFixed(1)),
      firstScanDate,
      lastScanDate,
      favoriteCategory: 'Alimentation',
      improvementSinceStart: 0
    };
  }, [getStoredData]);

  const topProducts = useCallback((): ProductAnalysis[] => {
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    return analyses
      .sort((a: ProductAnalysis, b: ProductAnalysis) => (b.healthScore || 0) - (a.healthScore || 0))
      .slice(0, 5);
  }, [getStoredData]);

  const worstProducts = useCallback((): ProductAnalysis[] => {
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    return analyses
      .sort((a: ProductAnalysis, b: ProductAnalysis) => (a.healthScore || 100) - (b.healthScore || 100))
      .slice(0, 5);
  }, [getStoredData]);

  // ========== FUNCTIONS EXPECTED BY DASHBOARDPAGE ==========

  const refreshData = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const markInsightAsRead = useCallback((insightId: string) => {
    const currentInsights = getStoredData(STORAGE_KEYS.insights, []);
    const updatedInsights = currentInsights.map((insight: PersonalizedInsight) => 
      insight.id === insightId ? { ...insight, isRead: true } : insight
    );
    saveData(STORAGE_KEYS.insights, updatedInsights);
  }, [getStoredData, saveData]);

  const addGoal = useCallback((goalData: Omit<UserGoal, 'id' | 'createdAt' | 'current' | 'progress' | 'isCompleted'>) => {
    const currentGoals = getStoredData(STORAGE_KEYS.goals, []);
    const newGoal: UserGoal = {
      ...goalData,
      id: `goal_${Date.now()}`,
      current: 0,
      progress: 0,
      isCompleted: false,
      createdAt: new Date()
    };
    
    currentGoals.push(newGoal);
    saveData(STORAGE_KEYS.goals, currentGoals);
  }, [getStoredData, saveData]);

  const generateWeeklyReport = useCallback(() => {
    return weeklyReport();
  }, [weeklyReport]);

  const getScansThisWeek = useCallback((): number => {
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return analyses.filter((a: ProductAnalysis) => 
      new Date(a.timestamp) >= oneWeekAgo
    ).length;
  }, [getStoredData]);

  const getImprovementLastWeek = useCallback((): number => {
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    if (analyses.length < 4) return 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const lastWeek = analyses.filter((a: ProductAnalysis) => {
      const date = new Date(a.timestamp);
      return date >= oneWeekAgo;
    });
    
    const previousWeek = analyses.filter((a: ProductAnalysis) => {
      const date = new Date(a.timestamp);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });
    
    if (lastWeek.length === 0 || previousWeek.length === 0) return 0;
    
    const lastWeekAvg = lastWeek.reduce((sum: number, a: ProductAnalysis) => 
      sum + (a.healthScore || 50), 0) / lastWeek.length;
    const previousWeekAvg = previousWeek.reduce((sum: number, a: ProductAnalysis) => 
      sum + (a.healthScore || 50), 0) / previousWeek.length;
    
    return Math.round(lastWeekAvg - previousWeekAvg);
  }, [getStoredData]);

  const hasUnreadInsights = useCallback((): boolean => {
    const currentInsights = getStoredData(STORAGE_KEYS.insights, []);
    return currentInsights.some((insight: PersonalizedInsight) => !insight.isRead);
  }, [getStoredData]);

  const getStreakDays = useCallback((): number => {
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    if (analyses.length === 0) return 0;
    
    // Simplifier : retourner le nombre de jours uniques avec analyses
    const uniqueDates = analyses
      .map((a: ProductAnalysis) => new Date(a.timestamp).toDateString())
      .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index);
    
    return Math.min(uniqueDates.length, 7); // Max 7 jours pour l'instant
  }, [getStoredData]);

  const exportData = useCallback((): string => {
    const data = {
      analyses: getStoredData(STORAGE_KEYS.analyses, []),
      goals: getStoredData(STORAGE_KEYS.goals, []),
      achievements: getStoredData(STORAGE_KEYS.achievements, []),
      insights: getStoredData(STORAGE_KEYS.insights, []),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(data, null, 2);
  }, [getStoredData]);

  const resetData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ Toutes les données supprimées');
  }, []);

  // ========== COMPATIBILITY FUNCTIONS ==========
  
  const hasData = useCallback((): boolean => {
    const analyses = getStoredData(STORAGE_KEYS.analyses, []);
    return analyses.length > 0;
  }, [getStoredData]);

  const getHealthMetrics = useCallback(() => {
    const m = metrics();
    if (!m) return {
      currentHealthScore: 0,
      totalScans: 0,
      averageNovaScore: 0,
      ultraTransformPercentage: 0,
      additivesAvoided: 0,
      achievementsEarned: 0,
      weeklyImprovement: 0,
      lastAnalysisDate: null
    };
    
    return {
      currentHealthScore: m.healthScore,
      totalScans: m.totalScans,
      averageNovaScore: m.averageNovaScore,
      ultraTransformPercentage: m.ultraTransformPercent,
      additivesAvoided: m.additivesCount,
      achievementsEarned: achievements().length,
      weeklyImprovement: m.improvementTrend,
      lastAnalysisDate: m.lastAnalysisDate
    };
  }, [metrics, achievements]);

  const getScoreEvolution = useCallback(() => {
    return evolution().map(e => ({
      date: e.date,
      score: e.healthScore,
      novaGroup: e.novaGroup,
      productName: e.productName || ''
    }));
  }, [evolution]);

  const getGoalsProgress = useCallback(() => {
    return goals().map(g => ({
      id: g.id,
      title: g.title,
      description: g.description,
      targetValue: g.target,
      currentValue: g.current,
      progress: g.progress,
      deadline: g.deadline,
      category: g.type.includes('score') ? 'health_score' as const : 
                g.type.includes('ultra') ? 'reduce_ultra' as const :
                g.type.includes('additives') ? 'limit_additives' as const :
                'increase_natural' as const,
      isActive: !g.isCompleted
    }));
  }, [goals]);

  // ========== RETURN COMPATIBLE AVEC DASHBOARDPAGE ==========
  
  return {
    // DashboardPage expected properties
    metrics,
    evolution,
    insights,
    goals,
    achievements,
    weeklyReport,
    overallStats,
    topProducts,
    worstProducts,
    loading,
    error,
    refreshData,
    markInsightAsRead,
    addGoal,
    generateWeeklyReport,
    getScansThisWeek,
    getImprovementLastWeek,
    hasUnreadInsights,
    getStreakDays,
    exportData,
    resetData,
    
    // Legacy compatibility (for QuickStatsWidget)
    trackScan,
    getHealthMetrics,
    getScoreEvolution,
    getGoalsProgress,
    hasData,
    getStoredData,
    saveData
  };
};

export default useUserAnalytics;