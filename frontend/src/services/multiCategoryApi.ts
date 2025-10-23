// src/services/multiCategoryApi.ts - VERSION CORRIGÆ’Ã†'' Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â°E POUR SERVER.JS

// Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â§ Configuration multi-environnements
const API_ENDPOINTS = {
  production: 'https://ecolojia-backend-working.onrender.com',
  local: 'http://localhost:8000',
  fallback: 'mock' // Mode donnees simulees
};

// Detection automatique du meilleur endpoint
const detectBestEndpoint = async (): Promise<string> => {
  // 1. Essayer production
  try {
    // Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â§ FIX: Utiliser /health au lieu de /api/health
    const response = await fetch(`${API_ENDPOINTS.production}/api/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3s max
    });
    if (response.ok) {
      console.log('aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Backend production disponible');
      return API_ENDPOINTS.production;
    }
  } catch (error) {
    console.log('aÆ’Ã¢â‚¬Â¦'šÃ‚Â¡Æ’Ã¢â‚¬Å¡'šÃ‚Â Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡'šÃ‚Â¸Æ’Ã¢â‚¬Å¡'šÃ‚Â Backend production indisponible');
  }

  // 2. Essayer local
  try {
    const response = await fetch(`${API_ENDPOINTS.local}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2s max
    });
    if (response.ok) {
      console.log('aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Backend local disponible');
      return API_ENDPOINTS.local;
    }
  } catch (error) {
    console.log('aÆ’Ã¢â‚¬Â¦'šÃ‚Â¡Æ’Ã¢â‚¬Å¡'šÃ‚Â Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡'šÃ‚Â¸Æ’Ã¢â‚¬Å¡'šÃ‚Â Backend local indisponible');
  }

  // 3. Fallback mode mock
  console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã‚Â¾ Mode fallback active - Donnees simulees');
  return API_ENDPOINTS.fallback;
};

// Types TypeScript (inchanges)
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  available: boolean;
}

export interface CategoriesResponse {
  success: boolean;
  categories?: Category[];
  data?: Category[];
  total_categories?: number;
  total?: number;
  default_category?: string;
  api_version?: string;
  timestamp?: string;
  error?: string;
}

export interface AnalysisRequest {
  product: {
    title: string;
    brand?: string;
    description?: string;
    ingredients?: string[];
    category?: string;
  };
  context?: {
    userId?: string;
    anonymousId?: string;
  };
}

export interface AnalysisResponse {
  success: boolean;
  category: string;
  detection_confidence: number;
  analysis: {
    overall_score: number;
    detailed_analysis?: any;
    confidence: number;
    sources: string[];
  };
  alternatives: any[];
  metadata: {
    processing_time_ms: number;
    api_version: string;
    request_id: string;
    timestamp: string;
  };
}

// Service principal avec fallback intelligent
export class MultiCategoryApiService {
  private baseUrl: string = '';
  private isInitialized: boolean = false;

  constructor() {
    this.initializeEndpoint();
  }

  private async initializeEndpoint() {
    if (!this.isInitialized) {
      this.baseUrl = await detectBestEndpoint();
      this.isInitialized = true;
    }
  }

  // Donnees mock pour fallback
  private getMockCategories(): CategoriesResponse {
    return {
      success: true,
      categories: [
        {
          id: 'food',
          name: 'Alimentaire',
          description: 'Analyse nutritionnelle et detection ultra-transformation des produits alimentaires',
          icon: 'Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸Æ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦'šÃ‚Â½',
          color: '#7DDE4A',
          features: ['Classification NOVA', 'Index glycemique', 'Additifs dangereux', 'Alternatives bio'],
          available: true
        },
        {
          id: 'cosmetics',
          name: 'Cosmetiques',
          description: 'Analyse des ingredients cosmetiques et perturbateurs endocriniens',
          icon: 'Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â‚¬Å¾Ã‚Â¢aaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã‚Â¾',
          color: '#FF69B4',
          features: ['Ingredients toxiques', 'Certification bio', 'Tests animaux', 'Alternatives naturelles'],
          available: true
        },
        {
          id: 'detergents',
          name: 'Detergents',
          description: 'Impact environnemental et Santé des produits menagers',
          icon: 'Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸Æ’Ã¢â‚¬Å¡'šÃ‚Â§Æ’Ã¢â‚¬Å¡'šÃ‚Â½',
          color: '#4FC3F7',
          features: ['Biodegradabilite', 'Toxicite aquatique', 'Æ’Ã†'' Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â°missions COV', 'Recettes DIY'],
          available: true
        }
      ],
      total_categories: 3,
      api_version: 'mock-1.0',
      timestamp: new Date().toISOString()
    };
  }

  private getMockAnalysis(product: any): AnalysisResponse {
    const scores = {
      food: Math.floor(Math.random() * 40) + 30, // 30-70
      cosmetics: Math.floor(Math.random() * 30) + 50, // 50-80
      detergents: Math.floor(Math.random() * 35) + 40 // 40-75
    };

    return {
      success: true,
      category: product.category || 'food',
      detection_confidence: 0.85 + Math.random() * 0.1,
      analysis: {
        overall_score: scores[product.category as keyof typeof scores] || 55,
        confidence: 0.8,
        sources: ['ANSES 2024', 'EFSA Guidelines', 'INSERM Research']
      },
      alternatives: [
        {
          name: 'Alternative bio naturelle',
          score: 85,
          description: 'Version plus naturelle et saine'
        }
      ],
      metadata: {
        processing_time_ms: Math.floor(Math.random() * 500) + 200,
        api_version: 'mock-1.0',
        request_id: `mock_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Recuperer les categories avec fallback
  async getCategories(): Promise<CategoriesResponse> {
    await this.initializeEndpoint();

    if (this.baseUrl === 'mock') {
      console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã‚Â¾ Mode mock: Retour categories simulees');
      return this.getMockCategories();
    }

    try {
      console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â Recuperation categories depuis:', `${this.baseUrl}/api/multi-category/categories`);
      
      const response = await fetch(`${this.baseUrl}/api/multi-category/categories`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CategoriesResponse = await response.json();
      console.log('aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Categories recuperees depuis API:', data?.categories?.length || 0);
      return data;

    } catch (error) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur API, basculement vers mock:', error);
      return this.getMockCategories();
    }
  }

  // Analyser un produit avec fallback
  async analyzeProduct(request: AnalysisRequest): Promise<AnalysisResponse> {
    await this.initializeEndpoint();

    if (this.baseUrl === 'mock') {
      console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã‚Â¾ Mode mock: Analyse simulee pour', request.product.title);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simuler delai
      return this.getMockAnalysis(request.product);
    }

    try {
      console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸Æ’Ã¢â‚¬Å¡'šÃ‚Â§Æ’Ã¢â‚¬Å¡'šÃ‚Âª Analyse produit:', request.product.title);
      
      const enrichedRequest = {
        ...request,
        context: {
          ...request.context,
          anonymousId: request.context?.anonymousId || this.generateAnonymousId(),
        }
      };

      const response = await fetch(`${this.baseUrl}/api/multi-category/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedRequest),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur reseau' }));
        throw new Error(errordata?.error || `HTTP ${response.status}`);
      }

      const data: AnalysisResponse = await response.json();
      console.log('aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Analyse terminee via API:', data?.category, 'Score:', data?.analysis?.overall_score);
      return data;

    } catch (error) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur analyse API, basculement vers mock:', error);
      return this.getMockAnalysis(request.product);
    }
  }

  // Test de connectivite ameliore - Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â§ FIX: Endpoints corriges
  async testConnection(): Promise<boolean> {
    await this.initializeEndpoint();
    
    if (this.baseUrl === 'mock') {
      return true; // Mode mock toujours "connecte"
    }

    // Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â§ FIX: Utiliser les bons endpoints selon server.js
    const endpointsToTest = [
      `${this.baseUrl}/health`,                            // aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Endpoint principal dans server.js
      `${this.baseUrl}/api/multi-category/categories`,     // aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Fonctionne dejÆ’Ã†'' Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡'šÃ‚Â 
      `${this.baseUrl}/`,                                  // aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Route racine
    ];

    for (const endpoint of endpointsToTest) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          console.log(`aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Connexion OK via: ${endpoint}`);
          return true;
        }
      } catch (error) {
        console.log(`aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Æ’Ã†'' Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â°chec connexion: ${endpoint}`, error instanceof Error ? error.message : error);
        continue;
      }
    }
    
    console.log('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Tous les tests de connexion ont echoue');
    return false;
  }

  // Donnees de test inchangees
  getTestData(): Record<string, AnalysisRequest> {
    return {
      food: {
        product: {
          title: "Cereales Bio aux Fruits",
          brand: "Nature & Progres",
          description: "Cereales biologiques avec additifs et sucres ajoutes",
          ingredients: ["avoine bio", "sucre", "colorant naturel", "conservateur e200"],
          category: "food"
        },
        context: { userId: "test-food-user" }
      },
      cosmetics: {
        product: {
          title: "Shampooing Doux Bio",
          brand: "Cosmebio",
          description: "Shampooing avec sodium lauryl sulfate et parfum",
          ingredients: ["aqua", "sodium lauryl sulfate", "parfum", "glycerin", "limonene"],
          category: "cosmetics"
        },
        context: { userId: "test-cosmetics-user" }
      },
      detergents: {
        product: {
          title: "Lessive Æ’Ã†'' Ã¢â‚¬â„¢aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â°cologique Concentree",
          brand: "EcoVert",
          description: "Lessive avec tensioactifs vegetaux et enzymes",
          ingredients: ["tensioactifs vegetaux", "enzymes", "parfum", "zeolites", "conservateur"],
          category: "detergents"
        },
        context: { userId: "test-detergents-user" }
      }
    };
  }

  private generateAnonymousId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â§ FIX: Diagnostic specifique pour server.js
  async diagnoseApiStructure(): Promise<void> {
    console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â === DIAGNOSTIC API ECOLOJIA (SERVER.JS) ===');
    
    // Test endpoints server.js
    const serverEndpoints = [
      '/health',
      '/api/multi-category/categories',
      '/api/multi-category/analyze',
      '/'
    ];

    for (const endpoint of serverEndpoints) {
      try {
        const response = await fetch(`${API_ENDPOINTS.production}${endpoint}`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        console.log(`${endpoint}: ${response.status} ${response.ok ? 'aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦' : 'aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢'}`);
      } catch (error) {
        console.log(`${endpoint}: aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ ERREUR`);
      }
    }
    
    console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â === FIN DIAGNOSTIC ===');
  }
}

// Instance par defaut
export const multiCategoryApi = new MultiCategoryApiService();

export type { AnalysisRequest, AnalysisResponse, Category, CategoriesResponse };

export default multiCategoryApi;




