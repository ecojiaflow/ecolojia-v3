// PATH: frontend/src/services/analytics/UserAnalytics.ts
/**
 * Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  ECOLOJIA User Analytics Service
 * Infrastructure de tracking pour Dashboard Personnel
 * Stockage local + calculs metriques avances
 */

// aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ INTERFACES PRINCIPALES
export interface ProductAnalysis {
  id: string;
  productName: string;
  novaGroup: number;
  healthScore: number;
  ultraTransformLevel?: number;
  additives: string[];
  ingredients: string;
  analysisSource: 'nova' | 'ultra-transform' | 'combined';
  timestamp: Date;
  sessionId: string;
  userRating?: number; // Note utilisateur 1-5
  isBookmarked?: boolean;
}

export interface HealthMetrics {
  avgNovaScore: number;           // Score NOVA moyen sur 100
  ultraTransformPercent: number;  // % produits ultra-transformes
  additivesCount: number;         // Nombre total additifs
  avgAdditivesPerProduct: number; // Additifs moyens par produit
  bioPercent: number;            // % produits bio detectes
  healthScore: number;           // Score global ECOLOJIA 0-100
  improvementTrend: number;      // Tendance d'amelioration %
  lastUpdated: Date;
}

export interface ScoreEvolution {
  date: Date;
  healthScore: number;
  scansCount: number;
  novaDistribution: { 1: number; 2: number; 3: number; 4: number };
  dailyInsight: string;
}

export interface PersonalizedInsight {
  id: string;
  type: 'progress' | 'warning' | 'tip' | 'achievement' | 'goal';
  title: string;
  message: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: 'health' | 'environment' | 'budget' | 'knowledge';
  isRead: boolean;
  createdAt: Date;
  data?: any; // Donnees supplementaires pour l'insight
}

export interface UserGoal {
  id: string;
  type: 'reduce_ultra_processed' | 'increase_bio' | 'reduce_additives' | 'improve_score' | 'custom';
  title: string;
  description: string;
  target: number;           // Valeur cible
  current: number;          // Valeur actuelle
  unit: string;            // Unite (%, points, nombre)
  deadline: Date;          // Date limite
  isCompleted: boolean;
  progress: number;        // Progression 0-100%
  createdAt: Date;
}

export interface UserData {
  sessionId: string;
  startDate: Date;
  scannedProducts: ProductAnalysis[];
  currentMetrics: HealthMetrics;
  goals: UserGoal[];
  insights: PersonalizedInsight[];
  preferences: {
    language: string;
    notifications: boolean;
    targetHealthScore: number;
    priorityFocus: 'health' | 'environment' | 'budget';
  };
  achievements: Achievement[];
  weeklyReports: WeeklyReport[];
  version: string; // Pour migrations futures
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'analyzer' | 'improver' | 'explorer' | 'challenger';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface WeeklyReport {
  weekOf: Date;
  scansCount: number;
  avgHealthScore: number;
  improvement: number;
  topAchievement: string;
  mainInsight: string;
  nextWeekGoal: string;
  generatedAt: Date;
}

// aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ SERVICE PRINCIPAL
class UserAnalyticsService {
  private sessionId: string;
  private readonly storageKey = 'ecolojia_user_data';
  private readonly sessionKey = 'ecolojia_session_id';
  private readonly version = '1.0.0';

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.migrateDataIfNeeded();
  }

  // ===== TRACKING PRINCIPAL =====

  /**
   * Enregistrer une nouvelle analyse de produit
   */
  trackProductScan(analysis: Omit<ProductAnalysis, 'id' | 'timestamp' | 'sessionId'>): void {
    const userData = this.getUserData();
    
    const fullAnalysis: ProductAnalysis = {
      ...analysis,
      id: this.generateId(),
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    userDat?.scannedProducts.push(fullAnalysis);
    
    // Limiter Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  1000 scans pour eviter overflow localStorage
    if (userDat?.scannedProducts.length > 1000) {
      userDat?.scannedProducts = userDat?.scannedProducts.slice(-800);
    }

    // Recalculer metriques
    userDat?.currentMetrics = this.calculateMetrics(userDat?.scannedProducts);
    
    // Generer nouveaux insights
    this.generateInsightsFromScan(userData, fullAnalysis);
    
    // Verifier achievements
    this.checkAchievements(userData);
    
    // Sauvegarder
    this.saveUserData(userData);
    
    console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Scan tracke:', {
      product: analysis.productName,
      nova: analysis.novaGroup,
      totalScans: userDat?.scannedProducts.length,
      healthScore: userDat?.currentMetrics.healthScore
    });
  }

  /**
   * Obtenir metriques actuelles
   */
  getCurrentMetrics(): HealthMetrics {
    const userData = this.getUserData();
    return userDat?.currentMetrics;
  }

  /**
   * Obtenir evolution sur une periode
   */
  getHealthEvolution(days: number = 30): ScoreEvolution[] {
    const userData = this.getUserData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Filtrer produits recents
    const recentProducts = userDat?.scannedProducts
      .filter(p => new Date(p.timestamp) >= cutoffDate);

    if (recentProducts.length === 0) return [];

    // Grouper par jour
    const dailyGroups = recentProducts.reduce((groups, product) => {
      const dateKey = new Date(product.timestamp).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(product);
      return groups;
    }, {} as Record<string, ProductAnalysis[]>);

    // Calculer metriques par jour
    return Object.entries(dailyGroups)
      .map(([dateStr, products]) => {
        const date = new Date(dateStr);
        const dayMetrics = this.calculateMetrics(products);
        const distribution = this.getNovaDistribution(products);
        
        return {
          date,
          healthScore: dayMetrics.healthScore,
          scansCount: products.length,
          novaDistribution: distribution,
          dailyInsight: this.generateDayInsight(dayMetrics, products)
        };
      })
      .sort((a, b) => ?.date.getTime() - b.date.getTime());
  }

  /**
   * Obtenir insights personnalises
   */
  getPersonalizedInsights(): PersonalizedInsight[] {
    const userData = this.getUserData();
    return userDat?.insights
      .sort((a, b) => b.createdAt.getTime() - ?.createdAt.getTime())
      .slice(0, 10); // 10 insights recents
  }

  /**
   * Marquer insight comme lu
   */
  markInsightAsRead(insightId: string): void {
    const userData = this.getUserData();
    const insight = userDat?.insights.find(i => i.id === insightId);
    if (insight) {
      insight.isRead = true;
      this.saveUserData(userData);
    }
  }

  /**
   * Obtenir goals utilisateur
   */
  getUserGoals(): UserGoal[] {
    const userData = this.getUserData();
    return userDat?.goals.sort((a, b) => b.createdAt.getTime() - ?.createdAt.getTime());
  }

  /**
   * Ajouter nouveau goal
   */
  addUserGoal(goalData: Omit<UserGoal, 'id' | 'createdAt' | 'progress' | 'current'>): void {
    const userData = this.getUserData();
    
    const goal: UserGoal = {
      ...goalData,
      id: this.generateId(),
      createdAt: new Date(),
      current: this.getCurrentValueForGoalType(goalDat?.type),
      progress: 0
    };

    userDat?.goals.push(goal);
    this.updateGoalProgress(userData, goal);
    this.saveUserData(userData);
  }

  /**
   * Obtenir achievements debloques
   */
  getAchievements(): Achievement[] {
    const userData = this.getUserData();
    return userDat?.achievements.sort((a, b) => b.unlockedAt.getTime() - ?.unlockedAt.getTime());
  }

  /**
   * Generer rapport hebdomadaire
   */
  generateWeeklyReport(): WeeklyReport | null {
    const userData = this.getUserData();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyScans = userDat?.scannedProducts
      .filter(p => new Date(p.timestamp) >= oneWeekAgo);

    if (weeklyScans.length === 0) return null;

    const weeklyMetrics = this.calculateMetrics(weeklyScans);
    const previousWeekMetrics = this.getPreviousWeekMetrics(userData);
    const improvement = weeklyMetrics.healthScore - (previousWeekMetrics?.healthScore || 50);

    const report: WeeklyReport = {
      weekOf: new Date(),
      scansCount: weeklyScans.length,
      avgHealthScore: weeklyMetrics.healthScore,
      improvement: Math.round(improvement * 10) / 10,
      topAchievement: this.getTopAchievementThisWeek(userData),
      mainInsight: this.generateMainWeeklyInsight(weeklyMetrics, improvement),
      nextWeekGoal: this.generateNextWeekGoal(weeklyMetrics),
      generatedAt: new Date()
    };

    // Sauvegarder le rapport
    userDat?.weeklyReports.unshift(report);
    if (userDat?.weeklyReports.length > 12) { // Garder 3 mois
      userDat?.weeklyReports = userDat?.weeklyReports.slice(0, 12);
    }
    this.saveUserData(userData);

    return report;
  }

  // ===== MÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°THODES PRIVÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ES DE CALCUL =====

  private calculateMetrics(products: ProductAnalysis[]): HealthMetrics {
    if (products.length === 0) {
      return this.getDefaultMetrics();
    }

    // Score NOVA moyen
    const novaScores = products.map(p => this.novaToScore(p.novaGroup));
    const avgNovaScore = Math.round(novaScores.reduce((a, b) => ? + b, 0) / novaScores.length);

    // % Ultra-transformes
    const ultraCount = products.filter(p => p.novaGroup === 4).length;
    const ultraTransformPercent = Math.round((ultraCount / products.length) * 100);

    // Additifs
    const totalAdditives = products.reduce((sum, p) => sum + p.additives.length, 0);
    const avgAdditivesPerProduct = Math.round((totalAdditives / products.length) * 10) / 10;

    // % Bio (detection basique)
    const bioProducts = products.filter(p => 
      p.productName.toLowerCase().includes('bio') || 
      p.ingredients.toLowerCase().includes('bio')
    ).length;
    const bioPercent = Math.round((bioProducts / products.length) * 100);

    // Score global
    const healthScore = this.calculateGlobalHealthScore({
      avgNovaScore,
      ultraTransformPercent,
      avgAdditivesPerProduct,
      bioPercent
    });

    // Tendance d'amelioration
    const improvementTrend = this.calculateImprovementTrend(products);

    return {
      avgNovaScore,
      ultraTransformPercent,
      additivesCount: totalAdditives,
      avgAdditivesPerProduct,
      bioPercent,
      healthScore: Math.round(healthScore),
      improvementTrend: Math.round(improvementTrend * 10) / 10,
      lastUpdated: new Date()
    };
  }

  private calculateGlobalHealthScore(metrics: Partial<HealthMetrics>): number {
    let score = 100;

    // Base sur score NOVA (60% du poids)
    score = (metrics.avgNovaScore || 50) * 0.6;

    // Penalite ultra-transformes (25% du poids)
    const ultraPenalty = (metrics.ultraTransformPercent || 0) * 0.8;
    score += (100 - ultraPenalty) * 0.25;

    // Bonus/malus additifs (10% du poids)
    const additivesImpact = Math.max(0, 100 - ((metrics.avgAdditivesPerProduct || 0) * 10));
    score += additivesImpact * 0.1;

    // Bonus bio (5% du poids)
    const bioBonus = (metrics.bioPercent || 0) * 0.3;
    score += bioBonus * 0.05;

    return Math.max(0, Math.min(100, score));
  }

  private calculateImprovementTrend(products: ProductAnalysis[]): number {
    if (products.length < 10) return 0;

    const sorted = [...products].sort((a, b) => ?.timestamp.getTime() - b.timestamp.getTime());
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const firstScore = this.calculateMetrics(firstHalf).healthScore;
    const secondScore = this.calculateMetrics(secondHalf).healthScore;

    return secondScore - firstScore;
  }

  private generateInsightsFromScan(userData: UserData, analysis: ProductAnalysis): void {
    const insights: PersonalizedInsight[] = [];

    // Insight produit ultra-transforme
    if (analysis.novaGroup === 4) {
      insights.push({
        id: this.generateId(),
        type: 'warning',
        title: 'aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Produit ultra-transforme detecte',
        message: `"${analysis.productName}" est classe NOVA 4 avec ${analysis.additives.length} additif(s)`,
        action: 'Rechercher une alternative NOVA 1-2',
        priority: 'high',
        category: 'health',
        isRead: false,
        createdAt: new Date(),
        data: { productName: analysis.productName, novaGroup: analysis.novaGroup }
      });
    }

    // Insight progression
    if (userDat?.scannedProducts.length >= 5) {
      const recent5 = userDat?.scannedProducts.slice(-5);
      const avgRecentScore = this.calculateMetrics(recent5).healthScore;
      const overallScore = userDat?.currentMetrics.healthScore;

      if (avgRecentScore > overallScore + 5) {
        insights.push({
          id: this.generateId(),
          type: 'progress',
          title: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â  Excellent progres !',
          message: `Vos 5 derniers scans montrent une amelioration de ${Math.round(avgRecentScore - overallScore)} points`,
          action: 'Continuez sur cette lancee !',
          priority: 'medium',
          category: 'health',
          isRead: false,
          createdAt: new Date()
        });
      }
    }

    // Ajouter insights (max 50 pour eviter overflow)
    userDat?.insights.unshift(...insights);
    if (userDat?.insights.length > 50) {
      userDat?.insights = userDat?.insights.slice(0, 50);
    }
  }

  private checkAchievements(userData: UserData): void {
    const newAchievements: Achievement[] = [];
    const existingIds = new Set(userDat?.achievements.map(a => ?.id));

    // Achievement: Premier scan
    if (userDat?.scannedProducts.length === 1 && !existingIds.has('first_scan')) {
      newAchievements.push({
        id: 'first_scan',
        title: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Premier Scan',
        description: 'Votre premiere analyse NOVA !',
        icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â',
        unlockedAt: new Date(),
        category: 'analyzer',
        rarity: 'common'
      });
    }

    // Achievement: 10 scans
    if (userDat?.scannedProducts.length >= 10 && !existingIds.has('scanner_enthusiast')) {
      newAchievements.push({
        id: 'scanner_enthusiast',
        title: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Explorateur NOVA',
        description: '10 produits analyses !',
        icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±',
        unlockedAt: new Date(),
        category: 'analyzer',
        rarity: 'common'
      });
    }

    // Achievement: Score eleve
    if (userDat?.currentMetrics.healthScore >= 80 && !existingIds.has('health_champion')) {
      newAchievements.push({
        id: 'health_champion',
        title: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂaaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Champion Sante',
        description: 'Score sante superieur Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  80 !',
        icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂaaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ',
        unlockedAt: new Date(),
        category: 'improver',
        rarity: 'rare'
      });
    }

    // Achievement: Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°viter ultra-transformes
    if (userDat?.currentMetrics.ultraTransformPercent <= 20 && userDat?.scannedProducts.length >= 20 && !existingIds.has('ultra_avoider')) {
      newAchievements.push({
        id: 'ultra_avoider',
        title: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Anti Ultra-Transforme',
        description: 'Moins de 20% d\'ultra-transformes !',
        icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â',
        unlockedAt: new Date(),
        category: 'improver',
        rarity: 'epic'
      });
    }

    userDat?.achievements.push(...newAchievements);
  }

  // ===== MÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°THODES UTILITAIRES =====

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem(this.sessionKey);
    if (!sessionId) {
      sessionId = `ecolojia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(this.sessionKey, sessionId);
    }
    return sessionId;
  }

  private getUserData(): UserData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir dates string en objets Date
        return this.deserializeDates(parsed);
      }
    } catch (error) {
      console.warn('Erreur parsing user data, reset:', error);
    }

    return this.createDefaultUserData();
  }

  private saveUserData(data: UserData): void {
    try {
      // Serialiser les dates
      const serialized = this.serializeDates(data);
      localStorage.setItem(this.storageKey, JSON.stringify(serialized));
    } catch (error) {
      console.error('Erreur sauvegarde user data:', error);
      // Nettoyer si quota depasse
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldData();
      }
    }
  }

  private createDefaultUserData(): UserData {
    return {
      sessionId: this.sessionId,
      startDate: new Date(),
      scannedProducts: [],
      currentMetrics: this.getDefaultMetrics(),
      goals: [],
      insights: [],
      preferences: {
        language: 'fr',
        notifications: true,
        targetHealthScore: 75,
        priorityFocus: 'health'
      },
      achievements: [],
      weeklyReports: [],
      version: this.version
    };
  }

  private getDefaultMetrics(): HealthMetrics {
    return {
      avgNovaScore: 0,
      ultraTransformPercent: 0,
      additivesCount: 0,
      avgAdditivesPerProduct: 0,
      bioPercent: 0,
      healthScore: 50,
      improvementTrend: 0,
      lastUpdated: new Date()
    };
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private novaToScore(novaGroup: number): number {
    switch (novaGroup) {
      case 1: return 95;
      case 2: return 75;
      case 3: return 50;
      case 4: return 25;
      default: return 50;
    }
  }

  private getNovaDistribution(products: ProductAnalysis[]) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 };
    products.forEach(p => {
      if (p.novaGroup >= 1 && p.novaGroup <= 4) {
        distribution[p.novaGroup as keyof typeof distribution]++;
      }
    });
    return distribution;
  }

  private generateDayInsight(metrics: HealthMetrics, products: ProductAnalysis[]): string {
    if (metrics.healthScore >= 80) return 'Excellente journee sante ! Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸';
    if (metrics.healthScore >= 60) return 'Bonne progression nutritionnelle Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â';
    if (metrics.ultraTransformPercent > 50) return 'Attention aux ultra-transformes aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â';
    return 'Continuez vos efforts ! Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬aÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âª';
  }

  private getCurrentValueForGoalType(type: UserGoal['type']): number {
    const metrics = this.getCurrentMetrics();
    switch (type) {
      case 'reduce_ultra_processed': return metrics.ultraTransformPercent;
      case 'increase_bio': return metrics.bioPercent;
      case 'reduce_additives': return metrics.avgAdditivesPerProduct;
      case 'improve_score': return metrics.healthScore;
      default: return 0;
    }
  }

  private updateGoalProgress(userData: UserData, goal: UserGoal): void {
    const current = this.getCurrentValueForGoalType(goal.type);
    goal.current = current;

    // Calculer progression selon le type
    switch (goal.type) {
      case 'reduce_ultra_processed':
      case 'reduce_additives':
        // Pour reduction, progression = (valeur_initiale - actuelle) / (valeur_initiale - target)
        goal.progress = Math.max(0, Math.min(100, ((100 - current) / (100 - goal.target)) * 100));
        break;
      case 'increase_bio':
      case 'improve_score':
        // Pour augmentation, progression = actuelle / target
        goal.progress = Math.max(0, Math.min(100, (current / goal.target) * 100));
        break;
    }

    goal.isCompleted = goal.progress >= 100;
  }

  private generateMainWeeklyInsight(metrics: HealthMetrics, improvement: number): string {
    if (improvement >= 10) return `Amelioration exceptionnelle de ${improvement} points !`;
    if (improvement >= 5) return `Belle progression de ${improvement} points cette semaine`;
    if (improvement >= 0) return 'Stabilite maintenue, continuez vos efforts';
    return `Petit recul de ${Math.abs(improvement)} points, reprenons les bonnes habitudes`;
  }

  private generateNextWeekGoal(metrics: HealthMetrics): string {
    if (metrics.ultraTransformPercent > 60) return 'Reduire les ultra-transformes Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  moins de 50%';
    if (metrics.bioPercent < 20) return 'Essayer 3 nouveaux produits bio';
    if (metrics.healthScore < 70) return 'Atteindre un score sante de 75';
    return 'Maintenir vos bonnes habitudes alimentaires';
  }

  private getTopAchievementThisWeek(userData: UserData): string {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentAchievements = userDat?.achievements.filter(a => ?.unlockedAt >= weekAgo);
    if (recentAchievements.length === 0) return 'Aucun achievement cette semaine';
    
    const latest = recentAchievements.sort((a, b) => b.unlockedAt.getTime() - ?.unlockedAt.getTime())[0];
    return latest.title;
  }

  private getPreviousWeekMetrics(userData: UserData): HealthMetrics | null {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const previousWeekProducts = userDat?.scannedProducts.filter(p => {
      const date = new Date(p.timestamp);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });

    return previousWeekProducts.length > 0 ? this.calculateMetrics(previousWeekProducts) : null;
  }

  private migrateDataIfNeeded(): void {
    const userData = this.getUserData();
    if (userDat?.version !== this.version) {
      // Migrations futures ici
      userDat?.version = this.version;
      this.saveUserData(userData);
    }
  }

  private serializeDates(obj: any): any {
    if (obj instanceof Date) return { __date: obj.toISOString() };
    if (Array.isArray(obj)) return obj.map(item => this.serializeDates(item));
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.serializeDates(obj[key]);
      }
      return result;
    }
    return obj;
  }

  private deserializeDates(obj: any): any {
    if (obj && obj.__date) return new Date(obj.__date);
    if (Array.isArray(obj)) return obj.map(item => this.deserializeDates(item));
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.deserializeDates(obj[key]);
      }
      return result;
    }
    return obj;
  }

  private cleanupOldData(): void {
    try {
      const userData = this.getUserData();
      // Garder seulement les 200 scans les plus recents
      userDat?.scannedProducts = userDat?.scannedProducts.slice(-200);
      // Garder seulement les 20 insights les plus recents
      userDat?.insights = userDat?.insights.slice(0, 20);
      // Garder seulement les 6 rapports les plus recents
      userDat?.weeklyReports = userDat?.weeklyReports.slice(0, 6);
      this.saveUserData(userData);
    } catch (error) {
      console.error('Erreur cleanup:', error);
    }
  }

  // ===== MÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°THODES PUBLIQUES SUPPLÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°MENTAIRES =====

  /**
   * Obtenir statistiques generales
   */
  getOverallStats() {
    const userData = this.getUserData();
    return {
      totalScans: userDat?.scannedProducts.length,
      daysSinceStart: Math.floor((Date.now() - userDat?.startDate.getTime()) / (1000 * 60 * 60 * 24)),
      achievementsCount: userDat?.achievements.length,
      activeGoals: userDat?.goals.filter(g => !g.isCompleted).length,
      weeklyReportsCount: userDat?.weeklyReports.length
    };
  }

  /**
   * Exporter donnees utilisateur (RGPD)
   */
  exportUserData(): string {
    const userData = this.getUserData();
    return JSON.stringify(userData, null, 2);
  }

  /**
   * Reset complet des donnees
   */
  resetAllData(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.sessionKey);
    console.log('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Donnees utilisateur reinitialisees');
  }

  /**
   * Obtenir top produits par categorie
   */
  getTopProductsByHealthScore(limit: number = 5): ProductAnalysis[] {
    const userData = this.getUserData();
    return userDat?.scannedProducts
      .sort((a, b) => b.healthScore - ?.healthScore)
      .slice(0, limit);
  }

  /**
   * Obtenir produits les plus problematiques
   */
  getWorstProducts(limit: number = 5): ProductAnalysis[] {
    const userData = this.getUserData();
    return userDat?.scannedProducts
      .filter(p => p.novaGroup >= 3)
      .sort((a, b) => ?.healthScore - b.healthScore)
      .slice(0, limit);
  }
}

// Export singleton
export const userAnalytics = new UserAnalyticsService();
export default UserAnalyticsService;



