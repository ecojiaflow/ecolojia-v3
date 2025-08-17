// PATH: frontend/src/services/demoService.ts
// Service pour gerer les donnees de demonstration

// Definir les couleurs localement
const COLORS = {
  primary: '#7DDE4A',
  secondary: '#4A90E2',
  warning: '#F5A623',
  danger: '#D0021B',
  success: '#7DDE4A',
  info: '#4A90E2'
};

// Types
interface DemoProduct {
  _id: string;
  name: string;
  brand: string;
  barcode: string;
  category: 'food' | 'cosmetic' | 'detergent';
  images: string[];
  ingredients?: string[];
  nutritionalInfo?: any;
  certifications?: string[];
}

interface DemoAnalysis {
  productId: string;
  productName: string;
  productBrand: string;
  category: string;
  healthScore: number;
  environmentScore: number;
  socialScore: number;
  overallScore: number;
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  novaGroup?: 1 | 2 | 3 | 4;
  ecoScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  ingredients: string[];
  additives: Array<{
    code: string;
    name: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  allergens: string[];
  alternatives: Array<{
    productId: string;
    name: string;
    brand: string;
    score: number;
    reason: string;
  }>;
}

class DemoService {
  private static instance: DemoService;
  
  // Base de donnees demo
  private demoProducts: DemoProduct[] = [
    {
      _id: 'demo-1',
      name: 'Yaourt Nature Bio',
      brand: 'Danone',
      barcode: '3033710065967',
      category: 'food',
      images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400'],
      ingredients: ['Lait entier bio', 'Ferments lactiques'],
      certifications: ['Bio', 'Sans additifs']
    },
    {
      _id: 'demo-2',
      name: 'Shampoing Doux Sans Sulfates',
      brand: 'L\'Oreal',
      barcode: '3474636871179',
      category: 'cosmetic',
      images: ['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400'],
      ingredients: ['Aqua', 'Sodium Cocoyl Isethionate', 'Cocamidopropyl Betaine'],
      certifications: ['Sans sulfates', 'Vegan']
    },
    {
      _id: 'demo-3',
      name: 'Lessive Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°cologique',
      brand: 'Arbre Vert',
      barcode: '3450601030178',
      category: 'detergent',
      images: ['https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400'],
      ingredients: ['Agents de surface d\'origine vegetale', 'Enzymes'],
      certifications: ['Ecolabel', 'Biodegradable']
    }
  ];

  private demoAnalyses: Record<string, DemoAnalysis> = {
    'demo-1': {
      productId: 'demo-1',
      productName: 'Yaourt Nature Bio',
      productBrand: 'Danone',
      category: 'food',
      healthScore: 92,
      environmentScore: 88,
      socialScore: 85,
      overallScore: 88,
      nutriScore: 'A',
      novaGroup: 1,
      ecoScore: 'A',
      ingredients: ['Lait entier bio', 'Ferments lactiques'],
      additives: [],
      allergens: ['Lactose'],
      alternatives: [
        {
          productId: 'alt-1',
          name: 'Yaourt Grec Nature',
          brand: 'Oikos',
          score: 90,
          reason: 'Plus riche en proteines'
        }
      ]
    },
    'demo-2': {
      productId: 'demo-2',
      productName: 'Shampoing Doux Sans Sulfates',
      productBrand: 'L\'Oreal',
      category: 'cosmetic',
      healthScore: 78,
      environmentScore: 72,
      socialScore: 80,
      overallScore: 77,
      ingredients: ['Aqua', 'Sodium Cocoyl Isethionate', 'Cocamidopropyl Betaine'],
      additives: [
        {
          code: 'CI 19140',
          name: 'Tartrazine',
          risk: 'medium'
        }
      ],
      allergens: [],
      alternatives: [
        {
          productId: 'alt-2',
          name: 'Shampoing Solide Bio',
          brand: 'Lamazuna',
          score: 85,
          reason: 'Sans emballage plastique'
        }
      ]
    },
    'demo-3': {
      productId: 'demo-3',
      productName: 'Lessive Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°cologique',
      productBrand: 'Arbre Vert',
      category: 'detergent',
      healthScore: 85,
      environmentScore: 92,
      socialScore: 88,
      overallScore: 88,
      ecoScore: 'A',
      ingredients: ['Agents de surface d\'origine vegetale', 'Enzymes'],
      additives: [],
      allergens: [],
      alternatives: [
        {
          productId: 'alt-3',
          name: 'Lessive en Feuilles',
          brand: 'Tru Earth',
          score: 95,
          reason: 'Zero dechet, ultra concentre'
        }
      ]
    }
  };

  static getInstance(): DemoService {
    if (!DemoService.instance) {
      DemoService.instance = new DemoService();
    }
    return DemoService.instance;
  }

  /**
   * Rechercher des produits
   */
  async searchProducts(query: string): Promise<DemoProduct[]> {
    // Simuler un delai
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const lowercaseQuery = query.toLowerCase();
    return this.demoProducts.filter(product => 
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.brand.toLowerCase().includes(lowercaseQuery) ||
      product.barcode.includes(query)
    );
  }

  /**
   * Obtenir un produit par code-barres
   */
  async getProductByBarcode(barcode: string): Promise<DemoProduct | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.demoProducts.find(p => p.barcode === barcode) || null;
  }

  /**
   * Obtenir une analyse
   */
  async getAnalysis(productId: string): Promise<DemoAnalysis | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.demoAnalyses[productId] || null;
  }

  /**
   * Analyser un produit (simulation)
   */
  async analyzeProduct(productData: any): Promise<DemoAnalysis> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generer des scores aleatoires mais realistes
    const healthScore = Math.floor(Math.random() * 30) + 70;
    const environmentScore = Math.floor(Math.random() * 30) + 65;
    const socialScore = Math.floor(Math.random() * 30) + 60;
    
    return {
      productId: `demo-${Date.now()}`,
      productName: productDat?.name || 'Produit Analyse',
      productBrand: productDat?.brand || 'Marque Inconnue',
      category: productDat?.category || 'food',
      healthScore,
      environmentScore,
      socialScore,
      overallScore: Math.round((healthScore + environmentScore + socialScore) / 3),
      nutriScore: this.calculateNutriScore(healthScore),
      novaGroup: this.calculateNovaGroup(productDat?.ingredients),
      ecoScore: this.calculateEcoScore(environmentScore),
      ingredients: productDat?.ingredients || [],
      additives: this.extractAdditives(productDat?.ingredients || []),
      allergens: this.extractAllergens(productDat?.ingredients || []),
      alternatives: this.generateAlternatives(productDat?.category)
    };
  }

  /**
   * Obtenir l'historique (demo)
   */
  async getHistory(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return Object.values(this.demoAnalyses).map((analysis, index) => ({
      _id: `history-${index}`,
      productId: analysis.productId,
      productName: analysis.productName,
      productBrand: analysis.productBrand,
      category: analysis.category,
      analysisDate: new Date(Date.now() - index * 86400000).toISOString(),
      scores: {
        health: analysis.healthScore,
        environment: analysis.environmentScore,
        social: analysis.socialScore,
        overall: analysis.overallScore
      },
      nutriScore: analysis.nutriScore,
      novaGroup: analysis.novaGroup,
      isFavorite: index === 0
    }));
  }

  /**
   * Obtenir les statistiques du dashboard
   */
  async getDashboardStats(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      totalScans: 47,
      healthScoreAverage: 82,
      categoryBreakdown: {
        food: 35,
        cosmetics: 8,
        detergents: 4
      },
      monthlyProgress: 15,
      topCategory: 'Alimentation',
      recentAnalyses: Object.values(this.demoAnalyses).map(a => ({
        _id: ?.productId,
        productName: ?.productName,
        score: ?.overallScore,
        category: ?.category,
        date: new Date().toISOString(),
        nutriScore: ?.nutriScore,
        ecoScore: ?.ecoScore
      })),
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

  /**
   * Demarrer une session de demonstration
   */
  async startDemoSession(): Promise<{
    token: string;
    refreshToken: string;
    user: any;
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const demoUser = {
      _id: 'demo-user-' + Date.now(),
      email: 'demo@ecoloji?.app',
      name: 'Utilisateur Demo',
      profile: {
        firstName: 'Utilisateur',
        lastName: 'Demo',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=7DDE4A&color=fff',
        createdAt: new Date().toISOString()
      },
      tier: 'premium', // Acces complet en mode demo
      emailVerified: true,
      quotas: {
        scansUsed: 15,
        scansLimit: -1, // Illimite
        aiChatsUsed: 10,
        aiChatsLimit: -1,
        lastReset: new Date().toISOString()
      },
      preferences: {
        allergies: [],
        dietaryRestrictions: [],
        healthGoals: ['Manger sainement', 'Reduire les additifs'],
        notificationsEnabled: true,
        language: 'fr',
        theme: 'light'
      }
    };

    return {
      token: 'demo-token-' + Date.now(),
      refreshToken: 'demo-refresh-token-' + Date.now(),
      user: demoUser
    };
  }

  /**
   * Terminer la session de demonstration
   */
  async endDemoSession(): Promise<void> {
    // Nettoyer les donnees locales
    localStorage.removeItem('ecolojia_token');
    localStorage.removeItem('ecolojia_refresh_token');
    localStorage.removeItem('ecolojia_user');
    localStorage.removeItem('ecolojia_demo_mode');
  }

  /**
   * Methodes utilitaires privees
   */
  private calculateNutriScore(healthScore: number): 'A' | 'B' | 'C' | 'D' | 'E' {
    if (healthScore >= 90) return 'A';
    if (healthScore >= 80) return 'B';
    if (healthScore >= 70) return 'C';
    if (healthScore >= 60) return 'D';
    return 'E';
  }

  private calculateNovaGroup(ingredients: string[]): 1 | 2 | 3 | 4 {
    if (ingredients.length <= 5) return 1;
    if (ingredients.length <= 10) return 2;
    if (ingredients.length <= 15) return 3;
    return 4;
  }

  private calculateEcoScore(environmentScore: number): 'A' | 'B' | 'C' | 'D' | 'E' {
    if (environmentScore >= 90) return 'A';
    if (environmentScore >= 80) return 'B';
    if (environmentScore >= 70) return 'C';
    if (environmentScore >= 60) return 'D';
    return 'E';
  }

  private extractAdditives(ingredients: string[]): any[] {
    const additivePatterns = /E\d{3,4}[a-z]?/gi;
    const additives: any[] = [];
    
    ingredients.forEach(ingredient => {
      const matches = ingredient.match(additivePatterns);
      if (matches) {
        matches.forEach(match => {
          additives.push({
            code: match.toUpperCase(),
            name: `Additif ${match}`,
            risk: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
          });
        });
      }
    });
    
    return additives;
  }

  private extractAllergens(ingredients: string[]): string[] {
    const commonAllergens = ['gluten', 'lait', 'Æ’Ã†â€™aÃ¢â€šÂ¬Ã‚Â¦aaÃ¢â‚¬Å¡Ã‚Â¬â€¦Ã¢â‚¬Å“uf', 'soja', 'fruits Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  coque', 'arachide'];
    const found: string[] = [];
    
    ingredients.forEach(ingredient => {
      const lower = ingredient.toLowerCase();
      commonAllergens.forEach(allergen => {
        if (lower.includes(allergen) && !found.includes(allergen)) {
          found.push(allergen);
        }
      });
    });
    
    return found;
  }

  private generateAlternatives(category: string): any[] {
    const alternatives = {
      food: [
        { productId: 'alt-f1', name: 'Alternative Bio', brand: 'NatureBio', score: 95, reason: 'Meilleur pour la sante' },
        { productId: 'alt-f2', name: 'Option Locale', brand: 'Ferme du Coin', score: 92, reason: 'Circuit court' }
      ],
      cosmetic: [
        { productId: 'alt-c1', name: 'Cosmetique Naturel', brand: 'Pure Nature', score: 88, reason: 'Ingredients naturels' },
        { productId: 'alt-c2', name: 'Version Solide', brand: 'ZeroWaste', score: 90, reason: 'Sans emballage' }
      ],
      detergent: [
        { productId: 'alt-d1', name: 'Detergent Æ’Ã†â€™â€ Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚Â°cologique', brand: 'EcoClean', score: 94, reason: 'Biodegradable' },
        { productId: 'alt-d2', name: 'Alternative Maison', brand: 'DIY', score: 96, reason: 'Fait maison' }
      ]
    };
    
    return alternatives[category as keyof typeof alternatives] || [];
  }
}

export default DemoService.getInstance();


