// PATH: frontend/src/services/configService.ts
import { API_CONFIG } from '../config/api.config';

export type AppMode = 'demo' | 'production';

export class ConfigService {
  private static instance: ConfigService;
  private mode: AppMode = 'demo';
  private authToken: string | null = null;

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  constructor() {
    // Initialiser le mode basé sur la présence d'un token
    const token = localStorage.getItem('ecolojia_token');
    if (token) {
      this.mode = 'production';
      this.authToken = token;
    }
  }

  setMode(mode: AppMode): void {
    this.mode = mode;
    console.log(`Ã°Å¸â€â€ž App mode switched to: ${mode}`);
  }

  getMode(): AppMode {
    return this.mode;
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      this.setMode('production');
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  isDemo(): boolean {
    return this.mode === 'demo';
  }

  /**
   * Génère une réponse de démonstration pour les appels API en mode démo
   */
  private getDemoResponse(endpoint: string, method: string = 'GET'): any {
    // Réponses de démo selon l'endpoint
    if (endpoint.includes('/auth/login')) {
      return {
        success: true,
        token: 'demo-token-' + Date.now(),
        refreshToken: 'demo-refresh-token-' + Date.now(),
        user: {
          _id: 'demo-user-id',
          email: 'demo@ecolojia.app',
          name: 'Utilisateur Démo',
          profile: {
            firstName: 'Utilisateur',
            lastName: 'Démo',
            createdAt: new Date().toISOString()
          },
          tier: 'premium', // Mode démo avec toutes les fonctionnalités
          emailVerified: true,
          quotas: {
            scansUsed: 15,
            scansLimit: -1, // Illimité en démo
            aiChatsUsed: 10,
            aiChatsLimit: -1,
            lastReset: new Date().toISOString()
          }
        },
        expiresIn: 3600
      };
    }

    if (endpoint.includes('/dashboard/stats')) {
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
        recentAnalyses: [
          {
            _id: '1',
            productName: 'Yaourt Nature Bio Danone',
            score: 92,
            category: 'food',
            date: new Date().toISOString(),
            nutriScore: 'A',
            ecoScore: 'A'
          },
          {
            _id: '2',
            productName: 'Shampoing Solide L\'Oréal',
            score: 78,
            category: 'cosmetics',
            date: new Date(Date.now() - 86400000).toISOString(),
            ecoScore: 'B'
          }
        ],
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

    if (endpoint.includes('/history')) {
      return [
        {
          _id: '1',
          productId: 'prod-1',
          productName: 'Yaourt Nature Bio',
          productBrand: 'Danone',
          category: 'food',
          analysisDate: new Date().toISOString(),
          scores: {
            health: 92,
            environment: 88,
            social: 85,
            overall: 88
          },
          nutriScore: 'A',
          novaGroup: 1,
          isFavorite: true
        },
        {
          _id: '2',
          productId: 'prod-2',
          productName: 'Shampoing Solide',
          productBrand: 'L\'Oréal',
          category: 'cosmetic',
          analysisDate: new Date(Date.now() - 86400000).toISOString(),
          scores: {
            health: 78,
            environment: 82,
            social: 75,
            overall: 78
          },
          isFavorite: false
        }
      ];
    }

    if (endpoint.includes('/favorites')) {
      return [
        {
          _id: '1',
          productId: 'prod-1',
          name: 'Yaourt Nature Bio',
          brand: 'Danone',
          category: 'food',
          scores: {
            health: 92,
            environment: 88,
            social: 85,
            overall: 88
          },
          nutriScore: 'A',
          addedAt: new Date().toISOString(),
          tags: ['Bio', 'Sans additifs', 'Local']
        }
      ];
    }

    if (endpoint.includes('/algolia/trending')) {
      return {
        products: [
          {
            objectID: '1',
            name: 'Yaourt Nature Bio',
            brand: 'Danone',
            category: 'food',
            score: 92,
            image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=150',
            tags: ['Bio', 'Sans additifs']
          },
          {
            objectID: '2',
            name: 'Shampoing Doux Sans Sulfates',
            brand: 'L\'Oréal',
            category: 'cosmetics',
            score: 78,
            image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=150',
            tags: ['Sans sulfates', 'Naturel']
          },
          {
            objectID: '3',
            name: 'Lessive Ãƒâ€°cologique',
            brand: 'Arbre Vert',
            category: 'detergents',
            score: 85,
            image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=150',
            tags: ['Ãƒâ€°cologique', 'Biodégradable']
          }
        ]
      };
    }

    if (endpoint.includes('/analysis')) {
      return {
        success: true,
        data: {
          productId: 'demo-product',
          name: 'Produit Démo',
          brand: 'Marque Démo',
          category: 'food',
          healthScore: 85,
          environmentScore: 78,
          ethicsScore: 82,
          overallScore: 82,
          novaGroup: 2,
          nutriScore: 'B',
          ingredients: ['Eau', 'Sucre', 'Arômes naturels'],
          additives: [],
          allergens: [],
          alternatives: []
        }
      };
    }

    if (endpoint.includes('/users/preferences')) {
      return {
        notifications: {
          push: true,
          email: false,
          weeklyReport: true,
          productAlerts: true,
          marketingEmails: false
        },
        privacy: {
          shareAnalytics: true,
          personalizedAds: false,
          publicProfile: false
        },
        appearance: {
          theme: 'light',
          language: 'fr',
          compactMode: false
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30
        }
      };
    }

    // Réponse par défaut
    return {
      success: true,
      data: [],
      message: 'Demo response'
    };
  }

  /**
   * Effectue une requête API ou retourne des données de démo
   */
  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (this.isDemo()) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Retourner la réponse de démo
      return this.getDemoResponse(endpoint, options.method || 'GET');
    }

    // En mode production, laisser passer la requête normalement
    throw new Error('Use apiClient for production requests');
  }

  /**
   * Wrapper pour les requêtes API avec fallback démo
   */
  async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      if (this.isDemo()) {
        return await this.makeRequest(endpoint, options);
      }
      
      // En production, utiliser le vrai API client
      const response = await fetch(`${API_CONFIG.getCurrentUrl()}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      
      // En cas d'erreur, essayer le mode démo
      if (!this.isDemo()) {
        console.log('Switching to demo mode due to API error');
        this.setMode('demo');
        return await this.makeRequest(endpoint, options);
      }
      
      throw error;
    }
  }

  /**
   * Obtenir l'URL de base selon le mode
   */
  getBaseUrl(): string {
    return this.isDemo() ? '' : API_CONFIG.getCurrentUrl();
  }

  /**
   * Vérifier si une fonctionnalité est disponible
   */
  isFeatureEnabled(feature: string): boolean {
    const demoFeatures = [
      'analysis',
      'dashboard',
      'history',
      'favorites',
      'profile',
      'settings'
    ];

    const premiumFeatures = [
      'unlimited-scans',
      'export-data',
      'ai-chat',
      'advanced-analytics'
    ];

    if (this.isDemo()) {
      // En mode démo, toutes les fonctionnalités sont disponibles
      return true;
    }

    // En production, vérifier selon le plan de l'utilisateur
    const user = JSON.parse(localStorage.getItem('ecolojia_user') || '{}');
    
    if (premiumFeatures.includes(feature)) {
      return user.tier === 'premium' || user.tier === 'family';
    }

    return demoFeatures.includes(feature);
  }
}

export default ConfigService.getInstance();
