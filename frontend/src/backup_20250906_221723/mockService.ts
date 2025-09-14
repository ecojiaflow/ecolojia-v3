// PATH: frontend/src/services/mockService.ts
import { getTrendingMockProducts, getMockProductById } from '../data/mockProducts';

// Types for dashboard
interface DashboardStats {
  totalScans: number;
  avgHealthScore: number;
  avgEnvScore: number;
  improvement: number;
  streak: number;
  topCategories: Array<{ name: string; count: number; score: number }>;
  monthlyProgress: Array<{ month: string; health: number; env: number }>;
  recentScans: Array<{
    id: string;
    name: string;
    category: string;
    healthScore: number;
    date: string;
    image: string;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress: number;
  }>;
}

// Helper to generate realistic dashboard data
const generateDashboardStats = (period: 'week' | 'month' | 'year' = 'month'): DashboardStats => {
  const multiplier = period === 'week' ? 0.25 : period === 'month' ? 1 : 12;
  
  // Get recent products for recent scans
  const trendingProducts = getTrendingMockProducts();
  const recentScans = trendingProducts.slice(0, 5).map((product, index) => ({
    id: product._id || product.barcode || '',
    name: product.name,
    category: product.category === 'food' ? 'Alimentaire' : 
              product.category === 'cosmetics' ? 'Cosmétiques' : 'Détergents',
    healthScore: product.scores?.healthScore || 50,
    date: index === 0 ? 'Il y a 2h' : 
          index === 1 ? 'Il y a 5h' : 
          index === 2 ? 'Hier' : 'Il y a 2 jours',
    image: product.image_url || product.imageUrl || 
           'https://images.unsplash.com/photo-1588080873526-9a3a8dc5735e?w=100'
  }));

  // Generate progress data based on period
  let monthlyProgress;
  if (period === 'week') {
    monthlyProgress = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => ({
      month: day,
      health: 70 + Math.floor(Math.random() * 10),
      env: 65 + Math.floor(Math.random() * 10)
    }));
  } else if (period === 'month') {
    monthlyProgress = ['S1', 'S2', 'S3', 'S4'].map((week, i) => ({
      month: week,
      health: 65 + i * 5,
      env: 60 + i * 5
    }));
  } else {
    monthlyProgress = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
      .map((month, i) => ({
        month,
        health: 60 + i * 2,
        env: 55 + i * 2
      }));
  }

  return {
    totalScans: Math.floor(47 * multiplier),
    avgHealthScore: 73,
    avgEnvScore: 68,
    improvement: period === 'week' ? 5 : period === 'month' ? 15 : 25,
    streak: period === 'week' ? 7 : period === 'month' ? 15 : 45,
    topCategories: [
      { name: 'Alimentaire', count: Math.floor(28 * multiplier), score: 75 },
      { name: 'Cosmétiques', count: Math.floor(12 * multiplier), score: 68 },
      { name: 'Détergents', count: Math.floor(7 * multiplier), score: 72 }
    ],
    monthlyProgress,
    recentScans,
    achievements: [
      {
        id: '1',
        name: '🌱 Première analyse',
        description: 'Analyser votre premier produit',
        icon: '🌱',
        unlocked: true,
        progress: 100
      },
      {
        id: '2',
        name: '🏃 Série de 7 jours',
        description: 'Scanner au moins un produit par jour pendant 7 jours',
        icon: '🏃',
        unlocked: true,
        progress: 100
      },
      {
        id: '3',
        name: '🥇 100 produits analysés',
        description: 'Atteindre 100 produits scannés',
        icon: '🥇',
        unlocked: false,
        progress: Math.floor(47 * multiplier)
      },
      {
        id: '4',
        name: '🌍 Éco-warrior',
        description: 'Choisir 10 alternatives plus écologiques',
        icon: '🌍',
        unlocked: false,
        progress: 60
      },
      {
        id: '5',
        name: '🎯 Score parfait',
        description: 'Scanner 5 produits avec un score > 90',
        icon: '🎯',
        unlocked: false,
        progress: 40
      },
      {
        id: '6',
        name: '💬 Expert IA',
        description: 'Utiliser le chat IA 20 fois',
        icon: '💬',
        unlocked: false,
        progress: 25
      }
    ]
  };
};

// Chat responses
const chatResponses = {
  additif: "Les additifs E150d, E952, E211 présents dans ce produit sont des colorants et conservateurs. L'E150d (caramel) est généralement sans danger mais peut contenir des résidus. L'E952 (cyclamate) et E211 (benzoate de sodium) sont plus controversés. Je recommande de limiter leur consommation.",
  bio: "Je recommande de privilégier les produits bio certifiés. Ils garantissent l'absence de pesticides de synthèse, d'OGM et d'additifs chimiques. Recherchez les labels AB, Eurofeuille ou Demeter pour une garantie maximale.",
  nova: "La classification NOVA évalue le degré de transformation des aliments de 1 (non transformé) à 4 (ultra-transformé). Les groupes 3 et 4 contiennent souvent des additifs, du sucre ajouté et des graisses hydrogénées. Privilégiez les groupes 1 et 2 pour une alimentation plus saine.",
  default: "Je suis votre assistant nutritionnel ECOLOJIA. Je peux vous aider à comprendre les analyses de produits, décoder les additifs et vous donner des conseils pour une alimentation plus saine. Que souhaitez-vous savoir ?"
};

// Mock service
export const mockService = {
  // Dashboard
  dashboard: {
    async getStats(period: 'week' | 'month' | 'year' = 'month') {
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateDashboardStats(period);
    },
    
    async getInsights() {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        "📈 Votre score santé s'est amélioré de 15% ce mois-ci !",
        "🥗 Vous privilégiez de plus en plus les produits bio (+23%)",
        "⚠️ Attention : 3 produits de votre historique contiennent des additifs à éviter",
        "💡 Astuce : Remplacez le Nutella par une pâte à tartiner bio pour gagner 40 points",
        "🏆 Plus que 53 scans pour débloquer le badge 'Expert nutrition' !"
      ];
    },
    
    async exportData(format: 'pdf' | 'json' = 'pdf') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const stats = generateDashboardStats('month');
      const content = format === 'json' 
        ? JSON.stringify(stats, null, 2)
        : `ECOLOJIA - Rapport mensuel\n\nTotal scans: ${stats.totalScans}\nScore moyen: ${stats.avgHealthScore}/100`;
      
      return new Blob([content], { 
        type: format === 'json' ? 'application/json' : 'application/pdf' 
      });
    },
    
    async getAchievements() {
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateDashboardStats().achievements;
    }
  },

  // Chat IA
  ai: {
    async chat(message: string, context?: any) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const lowerMessage = message.toLowerCase();
      
      // Check for keywords
      for (const [keyword, response] of Object.entries(chatResponses)) {
        if (keyword !== 'default' && lowerMessage.includes(keyword)) {
          return {
            response,
            suggestions: [
              "Quels sont les additifs à éviter absolument ?",
              "Comment lire une étiquette nutritionnelle ?",
              "Qu'est-ce que la classification NOVA ?"
            ]
          };
        }
      }
      
      return {
        response: chatResponses.default,
        suggestions: [
          "Qu'est-ce que la classification NOVA ?",
          "Comment choisir des produits sains ?",
          "Quels additifs sont dangereux ?"
        ]
      };
    },
    
    async getSuggestions(productId?: string) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (productId) {
        const product = getMockProductById(productId);
        if (product?.category === 'food') {
          return [
            `Pourquoi ce produit a un score de ${product.scores?.healthScore || 50}/100 ?`,
            "Existe-t-il des alternatives plus saines ?",
            "Quels sont les additifs présents ?"
          ];
        }
      }
      
      return [
        "Comment améliorer mon alimentation ?",
        "Qu'est-ce que la classification NOVA ?",
        "Comment éviter les produits ultra-transformés ?"
      ];
    }
  },

  // Analysis
  analysis: {
    async analyzeProduct(data: { barcode?: string; name?: string; image?: string }) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Try to find product by barcode or name
      let product = null;
      if (data.barcode) {
        product = getMockProductById(data.barcode);
      } else if (data.name) {
        const products = getTrendingMockProducts();
        product = products.find(p => 
          p.name.toLowerCase().includes(data.name!.toLowerCase())
        );
      }
      
      if (!product) {
        throw new Error('Produit non trouvé');
      }
      
      return {
        product,
        analysis: {
          productId: product._id,
          summary: `${product.name} est un produit ${product.category === 'food' ? 'alimentaire' : product.category === 'cosmetics' ? 'cosmétique' : 'détergent'} avec un score santé de ${product.scores?.healthScore || 50}/100.`,
          healthImpact: {
            score: product.scores?.healthScore || 50,
            analysis: product.scores?.healthScore! >= 70 ? 
              "Ce produit présente un bon profil santé avec peu d'additifs et une composition équilibrée." :
              "Ce produit contient plusieurs additifs et ingrédients transformés qui peuvent impacter la santé.",
            concerns: product.scores?.healthScore! < 50 ? 
              ["Additifs controversés", "Sucres ajoutés", "Graisses saturées"] : [],
            benefits: product.scores?.healthScore! >= 70 ? 
              ["Peu d'additifs", "Ingrédients naturels", "Bonne valeur nutritionnelle"] : []
          },
          environmentImpact: {
            score: product.scores?.environmentScore || 60,
            analysis: "Impact environnemental modéré. Privilégiez les alternatives locales et bio."
          },
          alternatives: getTrendingMockProducts()
            .filter(p => p.category === product.category && p.scores?.healthScore! > product.scores?.healthScore!)
            .slice(0, 3)
            .map(alt => ({
              productId: alt._id,
              name: alt.name,
              reason: `Meilleur score santé (${alt.scores?.healthScore}/100)`,
              improvement: `+${(alt.scores?.healthScore || 0) - (product.scores?.healthScore || 0)} points`
            })),
          personalizedAdvice: "Limitez la consommation de ce produit et privilégiez des alternatives plus naturelles."
        }
      };
    },
    
    async getHistory(page = 1, limit = 20) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const products = getTrendingMockProducts();
      const start = (page - 1) * limit;
      const items = products.slice(start, start + limit).map((product, index) => ({
        id: `analysis-${Date.now()}-${index}`,
        productId: product._id,
        product,
        timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        score: product.scores?.healthScore || 50
      }));
      
      return {
        items,
        total: products.length,
        page,
        totalPages: Math.ceil(products.length / limit)
      };
    }
  },

  // Quota management
  quota: {
    async getQuotas() {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.quotas || { scansRemaining: 30, aiChatsRemaining: 5 };
    },
    
    async updateQuota(type: 'scan' | 'chat') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.subscription?.tier !== 'premium') {
        if (type === 'scan') {
          user.quotas.scansRemaining = Math.max(0, (user.quotas?.scansRemaining || 30) - 1);
        } else {
          user.quotas.aiChatsRemaining = Math.max(0, (user.quotas?.aiChatsRemaining || 5) - 1);
        }
        localStorage.setItem('user', JSON.stringify(user));
      }
      return user.quotas;
    }
  },

  // Payment
  payment: {
    async createCheckoutSession(plan: 'monthly' | 'annual') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        url: `https://lemonsqueezy.com/checkout?plan=${plan}`,
        sessionId: `mock-session-${Date.now()}`
      };
    },
    
    async getSubscription() {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        active: user.subscription?.tier === 'premium',
        plan: user.subscription?.tier || 'free',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }
};

export default mockService;