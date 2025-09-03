// PATH: frontend/src/services/mockService.ts
export interface DashboardStats {
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

const mockService = {
  getDashboardStats(): DashboardStats {
    return {
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
          productBrand: 'L\'Oréal',  // Apostrophe échappée correctement
          score: 68,
          category: 'cosmetics',
          date: new Date(Date.now() - 86400000).toISOString(),
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
  }
};

export default mockService;