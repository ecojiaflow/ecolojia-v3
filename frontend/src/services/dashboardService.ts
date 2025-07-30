// frontend/src/services/dashboardService.ts
import { apiClient } from './apiClient';

// Interfaces pour la nouvelle structure
interface DashboardStats {
  overview: {
    totalAnalyses: number;
    avgHealthScore: number;
    minHealthScore: number;
    maxHealthScore: number;
    categories: {
      food: number;
      cosmetics: number;
      detergents: number;
    };
  };
  trends: {
    healthScoreImprovement: number;
    comparedToLastMonth: number;
    currentStreak: number;
    bestStreak: number;
  };
  recommendations: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    icon: string;
    cta: string;
  }>;
  recentAnalyses: Array<{
    id: string;
    productName: string;
    category: string;
    healthScore: number;
    date: string;
    trend: 'up' | 'down' | 'stable';
    alternatives: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: string;
    progress?: number;
    maxProgress?: number;
  }>;
  community: {
    averageScore: number;
    userRank: number;
    totalUsers: number;
    topCategory: string;
  };
  weeklyDigest: {
    scansCount: number;
    avgScore: number;
    bestProduct: {
      name: string;
      score: number;
    };
    worstProduct: {
      name: string;
      score: number;
    };
    discoveries: number;
    alternatives: number;
  };
}

// Interface pour la structure attendue par le composant
interface ComponentDashboardStats {
  totalScans: number;
  healthScoreAverage: number;
  categoryBreakdown: {
    food: number;
    cosmetics: number;
    detergents: number;
  };
  recentAnalyses: Array<{
    _id: string;
    productName: string;
    score: number;
    category: string;
    date: string;
  }>;
  weeklyTrend: Array<{
    day: string;
    scans: number;
  }>;
}

class DashboardService {
  async getStats(range: 'week' | 'month' | 'year' = 'month'): Promise<ComponentDashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats', {
        params: { range }
      });
      
      // Transformer les données vers le format attendu par le composant
      return this.transformStatsForComponent(response.data);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      console.log('Using demo data due to error');
      return this.getDemoStats();
    }
  }

  private transformStatsForComponent(data: DashboardStats): ComponentDashboardStats {
    return {
      totalScans: data.overview?.totalAnalyses || 0,
      healthScoreAverage: data.overview?.avgHealthScore || 0,
      categoryBreakdown: {
        food: data.overview?.categories?.food || 0,
        cosmetics: data.overview?.categories?.cosmetics || 0,
        detergents: data.overview?.categories?.detergents || 0
      },
      recentAnalyses: data.recentAnalyses?.map(analysis => ({
        _id: analysis.id,
        productName: analysis.productName,
        score: analysis.healthScore,
        category: analysis.category,
        date: analysis.date
      })) || [],
      weeklyTrend: this.generateWeeklyTrend(data.weeklyDigest)
    };
  }

  private generateWeeklyTrend(weeklyDigest: DashboardStats['weeklyDigest']): ComponentDashboardStats['weeklyTrend'] {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const totalScans = weeklyDigest?.scansCount || 12;
    
    // Distribuer les scans de manière réaliste sur la semaine
    const distribution = [0.15, 0.18, 0.14, 0.20, 0.16, 0.10, 0.07];
    
    return days.map((day, index) => ({
      day,
      scans: Math.round(totalScans * distribution[index])
    }));
  }

  private getDemoStats(): ComponentDashboardStats {
    return {
      totalScans: 12,
      healthScoreAverage: 75,
      categoryBreakdown: {
        food: 8,
        cosmetics: 3,
        detergents: 1
      },
      recentAnalyses: [
        {
          _id: '1',
          productName: 'Yaourt nature bio',
          category: 'food',
          score: 92,
          date: new Date().toISOString()
        },
        {
          _id: '2',
          productName: 'Shampoing doux sans sulfates',
          category: 'cosmetics',
          score: 78,
          date: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: '3',
          productName: 'Lessive écologique',
          category: 'detergents',
          score: 85,
          date: new Date(Date.now() - 172800000).toISOString()
        }
      ],
      weeklyTrend: [
        { day: 'Lun', scans: 2 },
        { day: 'Mar', scans: 3 },
        { day: 'Mer', scans: 1 },
        { day: 'Jeu', scans: 2 },
        { day: 'Ven', scans: 2 },
        { day: 'Sam', scans: 1 },
        { day: 'Dim', scans: 1 }
      ]
    };
  }

  async exportDashboardData(format: 'pdf' | 'csv'): Promise<Blob> {
    try {
      const response = await apiClient.get('/dashboard/export', {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      const stats = await this.getStats();
      
      if (format === 'csv') {
        const csv = this.generateCSV(stats);
        return new Blob([csv], { type: 'text/csv' });
      } else {
        const text = this.generateTextReport(stats);
        return new Blob([text], { type: 'text/plain' });
      }
    }
  }

  private generateCSV(stats: ComponentDashboardStats): string {
    const lines = [
      'Métrique,Valeur',
      `Total analyses,${stats.totalScans}`,
      `Score moyen,${stats.healthScoreAverage}`,
      `Analyses alimentaires,${stats.categoryBreakdown.food}`,
      `Analyses cosmétiques,${stats.categoryBreakdown.cosmetics}`,
      `Analyses détergents,${stats.categoryBreakdown.detergents}`
    ];
    
    lines.push('');
    lines.push('Analyses récentes');
    lines.push('Produit,Catégorie,Score,Date');
    
    stats.recentAnalyses.forEach(analysis => {
      lines.push(
        `"${analysis.productName}",${analysis.category},${analysis.score},"${new Date(analysis.date).toLocaleDateString('fr-FR')}"`
      );
    });
    
    return lines.join('\n');
  }

  private generateTextReport(stats: ComponentDashboardStats): string {
    const date = new Date().toLocaleDateString('fr-FR');
    const time = new Date().toLocaleTimeString('fr-FR');
    
    let report = `
RAPPORT ECOLOJIA
================
Généré le ${date} à ${time}

VUE D'ENSEMBLE
--------------
Total des analyses : ${stats.totalScans}
Score de santé moyen : ${stats.healthScoreAverage}/100

RÉPARTITION PAR CATÉGORIE
-------------------------
• Alimentaire : ${stats.categoryBreakdown.food} analyses
• Cosmétiques : ${stats.categoryBreakdown.cosmetics} analyses
• Détergents : ${stats.categoryBreakdown.detergents} analyses

ANALYSES RÉCENTES
-----------------
`;

    stats.recentAnalyses.forEach((analysis, index) => {
      report += `
${index + 1}. ${analysis.productName}
   Catégorie : ${analysis.category === 'food' ? 'Alimentaire' : 
                  analysis.category === 'cosmetics' ? 'Cosmétique' : 'Détergent'}
   Score : ${analysis.score}/100
   Date : ${new Date(analysis.date).toLocaleDateString('fr-FR')}
`;
    });

    report += `
ACTIVITÉ HEBDOMADAIRE
--------------------
`;
    
    stats.weeklyTrend.forEach(day => {
      report += `${day.day} : ${day.scans} scan(s)\n`;
    });

    report += `
================
Fin du rapport
`;

    return report;
  }

  // Méthodes additionnelles pour accéder aux nouvelles données
  async getFullStats(range: 'week' | 'month' | 'year' = 'month'): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats', {
        params: { range }
      });
      return response.data;
    } catch (error) {
      return this.getFullDemoStats();
    }
  }

  private getFullDemoStats(): DashboardStats {
    return {
      overview: {
        totalAnalyses: 12,
        avgHealthScore: 75,
        minHealthScore: 45,
        maxHealthScore: 92,
        categories: {
          food: 8,
          cosmetics: 3,
          detergents: 1
        }
      },
      trends: {
        healthScoreImprovement: 12,
        comparedToLastMonth: 15,
        currentStreak: 5,
        bestStreak: 12
      },
      recommendations: [
        {
          id: '1',
          type: 'welcome',
          title: 'Bienvenue sur ECOLOJIA !',
          description: 'Commencez par scanner votre premier produit',
          impact: 'high',
          icon: '🎉',
          cta: 'Scanner un produit'
        },
        {
          id: '2',
          type: 'health',
          title: 'Améliorez votre alimentation',
          description: 'Votre score moyen peut être amélioré avec des choix plus sains',
          impact: 'medium',
          icon: '🍎',
          cta: 'Voir les conseils'
        }
      ],
      recentAnalyses: [
        {
          id: '1',
          productName: 'Yaourt nature bio',
          category: 'food',
          healthScore: 92,
          date: new Date().toISOString(),
          trend: 'up',
          alternatives: 3
        },
        {
          id: '2',
          productName: 'Shampoing doux sans sulfates',
          category: 'cosmetics',
          healthScore: 78,
          date: new Date(Date.now() - 86400000).toISOString(),
          trend: 'stable',
          alternatives: 5
        },
        {
          id: '3',
          productName: 'Lessive écologique',
          category: 'detergents',
          healthScore: 85,
          date: new Date(Date.now() - 172800000).toISOString(),
          trend: 'up',
          alternatives: 2
        }
      ],
      achievements: [
        {
          id: '1',
          title: 'Première semaine',
          description: 'Utilisez ECOLOJIA pendant 7 jours',
          icon: '🏆',
          progress: 5,
          maxProgress: 7
        }
      ],
      community: {
        averageScore: 72,
        userRank: 1250,
        totalUsers: 5000,
        topCategory: 'Alimentaire'
      },
      weeklyDigest: {
        scansCount: 12,
        avgScore: 78,
        bestProduct: {
          name: 'Pommes bio',
          score: 95
        },
        worstProduct: {
          name: 'Chips saveur barbecue',
          score: 35
        },
        discoveries: 5,
        alternatives: 8
      }
    };
  }
}

export const dashboardService = new DashboardService();