// mockService.ts - Donnees de fallback pour les routes manquantes
class MockService {
  private static instance: MockService;

  static getInstance(): MockService {
    if (!MockService.instance) {
      MockService.instance = new MockService();
    }
    return MockService.instance;
  }

  getDashboardStats() {
    return {
      totalScans: 127,
      healthScoreAverage: 72,
      categoryBreakdown: {
        food: 65,
        cosmetics: 38,
        detergents: 24
      },
      monthlyProgress: 15,
      topCategory: 'food',
      recentAnalyses: [
        {
          _id: '1',
          productName: 'Yaourt Nature Bio',
          productBrand: 'Danone',
          score: 85,
          category: 'food',
          date: new Date().toISOString(),
          nutriScore: 'A',
          ecoScore: 'B',
          novaGroup: 1
        },
        {
          _id: '2',
          productName: 'Shampooing Doux',
          productBrand: 'L\'Oreal',
          score: 72,
          category: 'cosmetics',
          date: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      weeklyTrend: [
        { day: 'Lun', scans: 18 },
        { day: 'Mar', scans: 22 },
        { day: 'Mer', scans: 15 },
        { day: 'Jeu', scans: 25 },
        { day: 'Ven', scans: 20 },
        { day: 'Sam', scans: 12 },
        { day: 'Dim', scans: 15 }
      ]
    };
  }

  getHistory() {
    return {
      analyses: [],
      total: 0,
      page: 1,
      limit: 10
    };
  }

  getProducts() {
    return [
      {
        _id: '1',
        name: 'Pates Completes Bio',
        brand: 'Barilla',
        category: 'food',
        barcode: '8076800195057',
        image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=200',
        scores: {
          healthScore: 82,
          environmentScore: 78,
          nova: 2,
          nutriscore: 'A'
        }
      },
      {
        _id: '2',
        name: 'Gel Douche Naturel',
        brand: 'Dove',
        category: 'cosmetics',
        barcode: '8710908852268',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200',
        scores: {
          healthScore: 75,
          environmentScore: 70
        }
      },
      {
        _id: '3',
        name: 'Lessive â€°cologique',
        brand: 'Ariel',
        category: 'detergents',
        barcode: '8001090962805',
        image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200',
        scores: {
          healthScore: 68,
          environmentScore: 85
        }
      }
    ];
  }
}

export default MockService.getInstance();

