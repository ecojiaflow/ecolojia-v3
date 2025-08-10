// PATH: frontend/src/services/searchService.ts
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { ConfigService } from './configService';
import api from './apiClient';
import { API_CONFIG } from '../config/api.config';

// Types
export interface SearchResult {
  objectID: string;
  name: string;
  brand: string;
  category: string;
  barcode?: string;
  image?: string;
  score?: number;
  tags?: string[];
  _highlightResult?: any;
}

export interface SearchFilters {
  category?: string;
  minScore?: number;
  maxScore?: number;
  tags?: string[];
  brands?: string[];
  certifications?: string[];
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  page?: number;
  hitsPerPage?: number;
  facets?: string[];
}

export interface SearchResponse {
  hits: SearchResult[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  facets?: Record<string, Record<string, number>>;
  query: string;
}

// Configuration Algolia
const ALGOLIA_CONFIG = {
  appId: import.meta.env.VITE_ALGOLIA_APP_ID || 'demo',
  searchKey: import.meta.env.VITE_ALGOLIA_SEARCH_KEY || 'demo',
  indexName: 'products',
  indices: {
    products: 'products',
    productsRelevance: 'products_relevance',
    productsPrice: 'products_price_asc',
    productsScore: 'products_score_desc'
  }
};

class SearchService {
  private static instance: SearchService;
  private client: SearchClient | null = null;
  private index: SearchIndex | null = null;
  private configService = ConfigService.getInstance();

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  constructor() {
    this.initializeAlgolia();
  }

  private initializeAlgolia(): void {
    // Utiliser isDemo() au lieu de isDemoMode()
    if (!this.configService.isDemo() && ALGOLIA_CONFIG.appId !== 'demo') {
      try {
        this.client = algoliasearch(ALGOLIA_CONFIG.appId, ALGOLIA_CONFIG.searchKey);
        this.index = this.client.initIndex(ALGOLIA_CONFIG.indexName);
        console.log('✅ Algolia initialized');
      } catch (error) {
        console.error('❌ Algolia initialization error:', error);
      }
    }
  }

  /**
   * Recherche de produits
   */
  async searchProducts(options: SearchOptions): Promise<SearchResponse> {
    try {
      // Mode démo
      if (this.configService.isDemo() || !this.index) {
        return this.getDemoSearchResults(options);
      }

      // Construire les filtres
      const filters = this.buildFilters(options.filters);

      // Recherche Algolia
      const response = await this.index.search(options.query, {
        page: options.page || 0,
        hitsPerPage: options.hitsPerPage || 20,
        filters,
        facets: options.facets || ['category', 'brand', 'tags']
      });

      return {
        hits: response.hits as SearchResult[],
        nbHits: response.nbHits,
        page: response.page,
        nbPages: response.nbPages,
        hitsPerPage: response.hitsPerPage,
        processingTimeMS: response.processingTimeMS,
        facets: response.facets,
        query: options.query
      };
    } catch (error) {
      console.error('Search error:', error);
      return this.getDemoSearchResults(options);
    }
  }

  /**
   * Recherche avec autocomplétion
   */
  async searchAsYouType(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      if (this.configService.isDemo() || !this.index) {
        return this.getDemoSuggestions(query, limit);
      }

      const response = await this.index.search(query, {
        hitsPerPage: limit,
        attributesToHighlight: ['name', 'brand']
      });

      return response.hits as SearchResult[];
    } catch (error) {
      console.error('Autocomplete error:', error);
      return this.getDemoSuggestions(query, limit);
    }
  }

  /**
   * Recherche par code-barres
   */
  async searchByBarcode(barcode: string): Promise<SearchResult | null> {
    try {
      if (this.configService.isDemo()) {
        return this.getDemoBarcodeResult(barcode);
      }

      // Utiliser l'API backend
      const response = await api.get(`${API_CONFIG.ENDPOINTS.PRODUCTS.BY_BARCODE.replace(':barcode', barcode)}`);
      return response;
    } catch (error) {
      console.error('Barcode search error:', error);
      return null;
    }
  }

  /**
   * Obtenir les produits tendance
   */
  async getTrendingProducts(limit: number = 10): Promise<SearchResult[]> {
    try {
      if (this.configService.isDemo()) {
        return this.getDemoTrendingProducts(limit);
      }

      const response = await api.get(`${API_CONFIG.ENDPOINTS.SEARCH.TRENDING}?limit=${limit}`);
      return response.products || [];
    } catch (error) {
      console.error('Trending products error:', error);
      return this.getDemoTrendingProducts(limit);
    }
  }

  /**
   * Obtenir les suggestions de recherche
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      if (this.configService.isDemo() || !this.index) {
        return this.getDemoSearchSuggestions(query);
      }

      // Utiliser l'API backend pour les suggestions
      const response = await api.get(`${API_CONFIG.ENDPOINTS.SEARCH.SUGGESTIONS}?q=${query}`);
      return response.suggestions || [];
    } catch (error) {
      console.error('Suggestions error:', error);
      return this.getDemoSearchSuggestions(query);
    }
  }

  /**
   * Construire les filtres Algolia
   */
  private buildFilters(filters?: SearchFilters): string {
    if (!filters) return '';

    const filterParts: string[] = [];

    if (filters.category) {
      filterParts.push(`category:${filters.category}`);
    }

    if (filters.minScore !== undefined) {
      filterParts.push(`score >= ${filters.minScore}`);
    }

    if (filters.maxScore !== undefined) {
      filterParts.push(`score <= ${filters.maxScore}`);
    }

    if (filters.brands && filters.brands.length > 0) {
      const brandFilters = filters.brands.map(b => `brand:"${b}"`).join(' OR ');
      filterParts.push(`(${brandFilters})`);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagFilters = filters.tags.map(t => `tags:"${t}"`).join(' OR ');
      filterParts.push(`(${tagFilters})`);
    }

    return filterParts.join(' AND ');
  }

  /**
   * Résultats de démo
   */
  private getDemoSearchResults(options: SearchOptions): SearchResponse {
    const allProducts = this.getDemoProducts();
    
    // Filtrer par query
    let filtered = allProducts;
    if (options.query) {
      const query = options.query.toLowerCase();
      filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Appliquer les filtres
    if (options.filters) {
      if (options.filters.category) {
        filtered = filtered.filter(p => p.category === options.filters!.category);
      }
      if (options.filters.minScore !== undefined) {
        filtered = filtered.filter(p => (p.score || 0) >= options.filters!.minScore!);
      }
    }

    // Pagination
    const page = options.page || 0;
    const hitsPerPage = options.hitsPerPage || 20;
    const start = page * hitsPerPage;
    const hits = filtered.slice(start, start + hitsPerPage);

    return {
      hits,
      nbHits: filtered.length,
      page,
      nbPages: Math.ceil(filtered.length / hitsPerPage),
      hitsPerPage,
      processingTimeMS: 10,
      query: options.query
    };
  }

  private getDemoSuggestions(query: string, limit: number): SearchResult[] {
    const products = this.getDemoProducts();
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.brand.toLowerCase().includes(query.toLowerCase())
    );
    return filtered.slice(0, limit);
  }

  private getDemoBarcodeResult(barcode: string): SearchResult | null {
    const products = this.getDemoProducts();
    return products.find(p => p.barcode === barcode) || null;
  }

  private getDemoTrendingProducts(limit: number): SearchResult[] {
    const products = this.getDemoProducts();
    return products
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
  }

  private getDemoSearchSuggestions(query: string): string[] {
    const suggestions = [
      'nutella bio',
      'yaourt nature',
      'shampoing sans sulfate',
      'lessive écologique',
      'huile d\'olive bio',
      'chocolat noir 70%',
      'dentifrice naturel',
      'savon de marseille'
    ];

    if (!query) return suggestions.slice(0, 5);

    return suggestions
      .filter(s => s.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }

  private getDemoProducts(): SearchResult[] {
    return [
      {
        objectID: '1',
        name: 'Yaourt Nature Bio',
        brand: 'Danone',
        category: 'food',
        barcode: '3033710065066',
        score: 92,
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200',
        tags: ['Bio', 'Sans additifs', 'Riche en protéines']
      },
      {
        objectID: '2',
        name: 'Shampoing Doux Sans Sulfates',
        brand: 'L\'Oréal',
        category: 'cosmetic',
        barcode: '3600523998012',
        score: 78,
        image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200',
        tags: ['Sans sulfates', 'Cheveux sensibles']
      },
      {
        objectID: '3',
        name: 'Lessive Écologique',
        brand: 'Arbre Vert',
        category: 'household',
        barcode: '3450601030307',
        score: 85,
        image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200',
        tags: ['Écologique', 'Biodégradable', 'Sans phosphates']
      },
      {
        objectID: '4',
        name: 'Nutella',
        brand: 'Ferrero',
        category: 'food',
        barcode: '3017620422003',
        score: 45,
        image: 'https://images.unsplash.com/photo-1614898986923-86c1c8a8a6c3?w=200',
        tags: ['Pâte à tartiner', 'Noisettes']
      },
      {
        objectID: '5',
        name: 'Coca-Cola Original',
        brand: 'Coca-Cola',
        category: 'food',
        barcode: '5449000000996',
        score: 32,
        image: 'https://images.unsplash.com/photo-1561758033-48d52648ae8b?w=200',
        tags: ['Boisson', 'Soda']
      },
      {
        objectID: '6',
        name: 'Crème Hydratante Bio',
        brand: 'Weleda',
        category: 'cosmetic',
        barcode: '4001638088428',
        score: 88,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200',
        tags: ['Bio', 'Hydratant', 'Peau sensible']
      },
      {
        objectID: '7',
        name: 'Liquide Vaisselle Citron',
        brand: 'Paic',
        category: 'household',
        barcode: '3015810106047',
        score: 65,
        image: 'https://images.unsplash.com/photo-1563123807-6e2c8a3e8b3a?w=200',
        tags: ['Dégraissant', 'Citron']
      },
      {
        objectID: '8',
        name: 'Chocolat Noir 70%',
        brand: 'Lindt',
        category: 'food',
        barcode: '3046920028004',
        score: 75,
        image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=200',
        tags: ['Chocolat', 'Cacao 70%', 'Antioxydants']
      }
    ];
  }

  /**
   * Réinitialiser le service (utile pour les tests)
   */
  reset(): void {
    this.client = null;
    this.index = null;
    this.initializeAlgolia();
  }
}

export const searchService = SearchService.getInstance();
export default searchService;