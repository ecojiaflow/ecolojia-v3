// PATH: frontend/src/services/search/UniversalSearchService.ts
// Universal Search Service - Multi-source product search
// Supports: OpenFoodFacts, OpenBeautyFacts, OpenProductsFacts

// ============================================
// INTERFACES & TYPES
// ============================================

export interface SearchResult {
  products: any[];
  totalResults: number;
  source: string;
  educational_tips?: string[];
}

export interface UniversalSearchOptions {
  query: string;
  category?: 'food' | 'cosmetics' | 'detergents' | 'all';
  limit?: number;
  filters?: {
    minScore?: number;
    labels?: string[];
    allergens?: string[];
  };
}

interface OpenBeautyFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  image_url?: string;
  image_front_url?: string;
  additives_tags?: string[];
  packaging?: string;
  labels?: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

// ============================================
// OPENBEAUTYFACTS API
// ============================================

class OpenBeautyFactsAPI {
  private readonly baseURL = 'https://world.openbeautyfacts.org';
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  async search(query: string, limit: number = 20): Promise<SearchResult> {
    const cacheKey = `beauty_search_${query}_${limit}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      console.log('OpenBeautyFacts: Search for:', query);

      const response = await fetch(
        `${this.baseURL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,categories,ingredients_text,image_url,image_front_url,additives_tags,packaging,labels`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const products = data.products || [];

      console.log(`OpenBeautyFacts: ${products.length} products found`);

      const result: SearchResult = {
        products: products.map((p: any) => this.normalizeProduct(p)),
        totalResults: data.count || products.length,
        source: 'OpenBeautyFacts',
        educational_tips: this.generateEducationalTips(products)
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;

    } catch (error) {
      console.warn('OpenBeautyFacts search failed:', error);
      return { products: [], totalResults: 0, source: 'OpenBeautyFacts' };
    }
  }

  async getByBarcode(barcode: string): Promise<OpenBeautyFactsProduct | null> {
    const cacheKey = `beauty_barcode_${barcode}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log('OpenBeautyFacts: Barcode lookup:', barcode);

      const response = await fetch(
        `${this.baseURL}/product/${barcode}.json?fields=code,product_name,brands,categories,ingredients_text,image_url,image_front_url,additives_tags,packaging,labels`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        console.log('OpenBeautyFacts: Product found');
        const product = this.normalizeProduct(data.product);
        this.cache.set(cacheKey, { data: product, timestamp: Date.now() });
        return product;
      }

      console.warn('OpenBeautyFacts: Product not found');
      return null;

    } catch (error) {
      console.warn('OpenBeautyFacts barcode lookup failed:', error);
      return null;
    }
  }

  // ANALYSIS HELPERS
  private analyzeIngredients(product: any) {
    const ingredients = product.ingredients_text || '';
    const inciIngredients = ingredients.split(',').map((i: string) => i.trim()).filter(Boolean);

    const analysis = {
      totalIngredients: inciIngredients.length,
      complexity: inciIngredients.length > 20 ? 'high' : inciIngredients.length > 10 ? 'medium' : 'low',
      naturalScore: 0
    };

    return analysis;
  }

  private generateEducationalTips(products: any[]): string[] {
    const tips: string[] = [];

    if (products.length === 0) return tips;

    const avgIngredients = products.reduce((sum, p) => {
      const count = (p.ingredients_text || '').split(',').length;
      return sum + count;
    }, 0) / products.length;

    if (avgIngredients > 20) {
      tips.push('Long ingredient lists may indicate complex formulations - consider simpler, more natural alternatives');
    }

    if (products.some(p => p.additives_tags && p.additives_tags.length > 5)) {
      tips.push('Some products contain multiple additives - look for cleaner formulas');
    }

    if (products.some(p => p.labels && p.labels.includes('organic'))) {
      tips.push('Organic certified products available - these guarantee natural ingredients');
    }

    if (products.some(p => p.packaging && p.packaging.includes('plastic'))) {
      tips.push('Consider products with eco-friendly packaging to reduce environmental impact');
    }

    return tips;
  }

  private normalizeProduct(product: any) {
    return {
      ...product,
      category: 'cosmetics',
      source: 'OpenBeautyFacts',
      _analyzed: {
        ingredients: this.analyzeIngredients(product)
      }
    };
  }

  // Product service wrapper
  productService = {
    getByBarcode: (barcode: string) => this.getByBarcode(barcode)
  };
}

// ============================================
// OPENPRODUCTSFACTS API
// ============================================

class OpenProductsFactsAPI {
  private readonly baseURL = 'https://world.openproductsfacts.org';
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 300000;

  async search(query: string, limit: number = 20): Promise<SearchResult> {
    const cacheKey = `products_search_${query}_${limit}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      console.log('OpenProductsFacts: Search for:', query);

      const response = await fetch(
        `${this.baseURL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,categories,ingredients_text,image_url,image_front_url,additives_tags,packaging,labels`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const products = data.products || [];

      console.log(`OpenProductsFacts: ${products.length} products found`);

      const result: SearchResult = {
        products: products.map((p: any) => this.normalizeProduct(p)),
        totalResults: data.count || products.length,
        source: 'OpenProductsFacts',
        educational_tips: this.generateEducationalTips(products)
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;

    } catch (error) {
      console.warn('OpenProductsFacts search failed:', error);
      return { products: [], totalResults: 0, source: 'OpenProductsFacts' };
    }
  }

  async getByBarcode(barcode: string): Promise<any | null> {
    const cacheKey = `products_barcode_${barcode}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log('OpenProductsFacts: Barcode lookup:', barcode);

      const response = await fetch(
        `${this.baseURL}/product/${barcode}.json?fields=code,product_name,brands,categories,ingredients_text,image_url,image_front_url,additives_tags,packaging,labels`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        console.log('OpenProductsFacts: Product found');
        const product = this.normalizeProduct(data.product);
        this.cache.set(cacheKey, { data: product, timestamp: Date.now() });
        return product;
      }

      console.warn('OpenProductsFacts: Product not found');
      return null;

    } catch (error) {
      console.warn('OpenProductsFacts barcode lookup failed:', error);
      return null;
    }
  }

  private analyzeIngredients(product: any) {
    const ingredients = product.ingredients_text || '';
    const ingredientList = ingredients.split(',').map((i: string) => i.trim()).filter(Boolean);

    return {
      totalIngredients: ingredientList.length,
      complexity: ingredientList.length > 15 ? 'high' : ingredientList.length > 8 ? 'medium' : 'low'
    };
  }

  private generateEducationalTips(products: any[]): string[] {
    const tips: string[] = [];

    if (products.length === 0) return tips;

    if (products.some(p => p.labels && p.labels.includes('eco'))) {
      tips.push('Eco-labeled products available - better for environment');
    }

    if (products.some(p => p.packaging && p.packaging.includes('recyclable'))) {
      tips.push('Look for recyclable packaging to reduce waste');
    }

    if (products.some(p => p.additives_tags && p.additives_tags.length > 3)) {
      tips.push('Some products contain chemical additives - consider natural alternatives');
    }

    return tips;
  }

  private normalizeProduct(product: any) {
    return {
      ...product,
      category: 'detergents',
      source: 'OpenProductsFacts',
      _analyzed: {
        ingredients: this.analyzeIngredients(product)
      }
    };
  }

  productService = {
    getByBarcode: (barcode: string) => this.getByBarcode(barcode)
  };
}

// ============================================
// UNIVERSAL SEARCH ENGINE
// ============================================

export class UniversalSearchService {
  private openBeautyFacts: OpenBeautyFactsAPI;
  private openProductsFacts: OpenProductsFactsAPI;
  private searchCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 300000;

  constructor() {
    // Initialize APIs
    this.openBeautyFacts = new OpenBeautyFactsAPI();
    this.openProductsFacts = new OpenProductsFactsAPI();
  }

  // ========== UNIVERSAL SEARCH ==========
  async search(options: UniversalSearchOptions): Promise<SearchResult> {
    const { query, category = 'all', limit = 20 } = options;
    const cacheKey = `universal_${query}_${category}_${limit}`;

    console.log('Universal Search:', { query, category, limit });

    // Avoid empty searches
    if (!query || query.trim().length < 2) {
      return { products: [], totalResults: 0, source: 'Universal' };
    }

    try {
      // 1. SEARCH IN ALGOLIA (primary source)
      const algoliaResults = await this.searchAlgolia(query, category, limit);

      // 2. SEARCH IN OPEN*FACTS APIs (parallel)
      const sources = [
        category === 'all' || category === 'cosmetics' ? this.openBeautyFacts.search(query, limit) : null,
        category === 'all' || category === 'detergents' ? this.openProductsFacts.search(query, limit) : null
      ].filter(Boolean);

      // 3. PARALLEL EXECUTION
      const results = await Promise.allSettled(sources as Promise<SearchResult>[]);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`Source ${index}: ${result.value.products.length} products`);
        } else {
          console.warn(`Source ${index} failed:`, result.reason);
        }
      });

      // 4. MERGE RESULTS
      const allProducts = results
        .filter((r): r is PromiseFulfilledResult<SearchResult> => r.status === 'fulfilled')
        .flatMap(r => r.value.products);

      // 5. REMOVE DUPLICATES (by barcode/code)
      const uniqueProducts = this.deduplicateProducts(allProducts);

      // 6. SORT BY RELEVANCE
      const sortedProducts = this.sortByRelevance(uniqueProducts, query);

      // 7. EDUCATIONAL TIPS
      const tips = this.generateUniversalTips(sortedProducts);

      // 8. FINAL RESULT
      const finalResult: SearchResult = {
        products: sortedProducts.slice(0, limit),
        totalResults: sortedProducts.length,
        source: 'Universal',
        educational_tips: tips
      };

      console.log(`Universal Search: ${finalResult.products.length} final products`);
      console.log(`Educational tips: ${tips.length} tips`);

      return finalResult;

    } catch (error) {
      console.error('Universal search error:', error);
      return { products: [], totalResults: 0, source: 'Universal' };
    }
  }

  // ========== BARCODE LOOKUP ==========
  async searchByBarcode(barcode: string): Promise<any | null> {
    console.log('Universal Barcode Search:', barcode);

    try {
      // 1. CHECK LOCAL ALGOLIA FIRST
      const localResult = await this.searchAlgoliaByBarcode(barcode);
      if (localResult) {
        console.log('Product found in local database');
        return localResult;
      }

      // 2. SEARCH IN EXTERNAL APIS (parallel)
      const sources = [
        this.openBeautyFacts.productService.getByBarcode(barcode),
        this.openProductsFacts.productService.getByBarcode(barcode)
      ];

      const results = await Promise.allSettled(sources);
      const sourceNames = ['OpenBeautyFacts', 'OpenProductsFacts'];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled' && result.value) {
          console.log(`Product found on ${sourceNames[i]}`);
          return result.value;
        }
      }

      console.log('Product not found on any source');
      return null;

    } catch (error) {
      console.error('Barcode search error:', error);
      return null;
    }
  }

  // ========== AUTOCOMPLETE ==========
  async autocomplete(query: string, limit: number = 8): Promise<string[]> {
    if (!query || query.length < 2) {
      return this.getPopularSearches();
    }

    try {
      // Search and extract unique product names
      const results = await this.search({ query, limit });
      const suggestions = results.products
        .map(p => p.product_name)
        .filter(Boolean)
        .slice(0, limit);

      return suggestions;

    } catch (error) {
      console.warn('Autocomplete error:', error);
      return this.getPopularSearches();
    }
  }

  // ========== SUGGESTIONS ==========
  async getSuggestions(query: string, category?: string): Promise<any[]> {
    const baseSuggestions = [
      // Food
      { query: 'nutella bio', type: 'product', icon: 'search' },
      { query: 'yaourt sans additifs', type: 'product', icon: 'search' },
      
      // Cosmetics
      { query: 'shampoing sans sulfate', type: 'product', icon: 'search' },
      { query: 'creme sans parabenes', type: 'product', icon: 'search' },
      
      // Detergents
      { query: 'lessive ecologique', type: 'product', icon: 'search' },
      { query: 'liquide vaisselle bio', type: 'product', icon: 'search' },
      
      // General
      { query: 'produits zero dechet', type: 'category', icon: 'leaf' }
    ];

    // Add query-specific suggestions
    const suggestions = [...baseSuggestions];

    if (query && query.length > 2) {
      // Food category
      if (category === 'food' || !category) {
        suggestions.push({ query: `${query} sans additifs`, type: 'product', icon: 'search' });
        suggestions.push({ query: `${query} NOVA 1`, type: 'product', icon: 'star' });
      }

      // Cosmetics category
      if (category === 'cosmetics' || !category) {
        suggestions.push({ query: `${query} sans parabenes`, type: 'product', icon: 'search' });
        suggestions.push({ query: `${query} hypoallergenique`, type: 'product', icon: 'shield' });
      }

      // Detergents category
      if (category === 'detergents' || !category) {
        suggestions.push({ query: `${query} ecologique`, type: 'product', icon: 'leaf' });
        suggestions.push({ query: `${query} biodegradable`, type: 'product', icon: 'droplet' });
      }
    }

    return suggestions.slice(0, 8);
  }

  // ========== SEARCH HISTORY ==========
  async getSearchHistory(userId?: string): Promise<string[]> {
    // This would be implemented with actual user storage
    return [];
  }

  async addToSearchHistory(query: string, userId?: string): Promise<void> {
    // This would be implemented with actual user storage
  }

  // ========== TRENDING SEARCHES ==========
  async getTrendingSearches(limit: number = 10): Promise<any[]> {
    // This would be implemented with analytics
    return this.getPopularSearches().map((query, index) => ({
      query,
      rank: index + 1,
      trend: 'up',
      icon: this.getCategoryIcon(query)
    }));
  }

  // ========== PRIVATE METHODS ==========

  private async searchAlgolia(query: string, category: string, limit: number): Promise<SearchResult> {
    // Placeholder for Algolia integration
    return { products: [], totalResults: 0, source: 'Algolia' };
  }

  private async searchAlgoliaByBarcode(barcode: string): Promise<any | null> {
    // Placeholder for Algolia barcode search
    return null;
  }

  private deduplicateProducts(products: any[]): any[] {
    const seen = new Set<string>();
    return products.filter(p => {
      const id = p.code || p.barcode || p.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  private sortByRelevance(products: any[], query: string): any[] {
    const lowerQuery = query.toLowerCase();
    
    return products.sort((a, b) => {
      const aName = (a.product_name || '').toLowerCase();
      const bName = (b.product_name || '').toLowerCase();
      
      const aExact = aName === lowerQuery;
      const bExact = bName === lowerQuery;
      if (aExact !== bExact) return aExact ? -1 : 1;
      
      const aStarts = aName.startsWith(lowerQuery);
      const bStarts = bName.startsWith(lowerQuery);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      
      const aIncludes = aName.includes(lowerQuery);
      const bIncludes = bName.includes(lowerQuery);
      if (aIncludes !== bIncludes) return aIncludes ? -1 : 1;
      
      return 0;
    });
  }

  private generateUniversalTips(products: any[]): string[] {
    const tips: string[] = [];

    if (products.length === 0) return tips;

    const categories = new Set(products.map(p => p.category));
    
    if (categories.has('cosmetics')) {
      tips.push('Check INCI ingredient lists for potentially harmful substances');
    }
    
    if (categories.has('detergents')) {
      tips.push('Eco-labeled detergents are better for the environment');
    }
    
    if (products.some(p => p.labels && p.labels.includes('organic'))) {
      tips.push('Organic products guarantee natural ingredients');
    }

    return tips;
  }

  private getPopularSearches(): string[] {
    return [
      'bio',
      'sans gluten',
      'vegan',
      'sans parabenes',
      'ecologique',
      'sans additifs',
      'naturel',
      'local'
    ];
  }

  private getCategoryIcon(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('bio') || lowerQuery.includes('organic')) return 'leaf';
    if (lowerQuery.includes('vegan')) return 'sprout';
    if (lowerQuery.includes('ecologique')) return 'recycle';
    return 'search';
  }
}

// ============================================
// OPENFOODFACTS (EXISTING CLASS - PRESERVED)
// ============================================

export class OpenFoodFactsAPI {
  private readonly baseURL = 'https://world.openfoodfacts.org';
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 300000;

  async search(query: string, limit: number = 20): Promise<SearchResult> {
    const cacheKey = `food_search_${query}_${limit}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      console.log('OpenFoodFacts: Search for:', query);

      const response = await fetch(
        `${this.baseURL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,categories,ingredients_text,image_url,image_front_url,nutrition_grade_fr,nova_group,ecoscore_grade,additives_tags,allergens`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const products = data.products || [];

      console.log(`OpenFoodFacts: ${products.length} products found`);

      const result: SearchResult = {
        products: products.map((p: any) => this.normalizeProduct(p)),
        totalResults: data.count || products.length,
        source: 'OpenFoodFacts',
        educational_tips: this.generateEducationalTips(products)
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;

    } catch (error) {
      console.warn('OpenFoodFacts search failed:', error);
      return { products: [], totalResults: 0, source: 'OpenFoodFacts' };
    }
  }

  async getByBarcode(barcode: string): Promise<any | null> {
    const cacheKey = `food_barcode_${barcode}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log('OpenFoodFacts: Barcode lookup:', barcode);

      const response = await fetch(
        `${this.baseURL}/api/v0/product/${barcode}.json`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        console.log('OpenFoodFacts: Product found');
        const product = this.normalizeProduct(data.product);
        this.cache.set(cacheKey, { data: product, timestamp: Date.now() });
        return product;
      }

      console.warn('OpenFoodFacts: Product not found');
      return null;

    } catch (error) {
      console.warn('OpenFoodFacts barcode lookup failed:', error);
      return null;
    }
  }

  private generateEducationalTips(products: any[]): string[] {
    const tips: string[] = [];

    if (products.length === 0) return tips;

    if (products.some(p => p.nova_group >= 4)) {
      tips.push('Some products are ultra-processed (NOVA 4) - prefer minimally processed foods');
    }

    if (products.some(p => p.nutrition_grade_fr && ['d', 'e'].includes(p.nutrition_grade_fr))) {
      tips.push('Some products have poor nutritional quality - check Nutri-Score');
    }

    if (products.some(p => p.additives_tags && p.additives_tags.length > 5)) {
      tips.push('Multiple additives detected - consider products with fewer additives');
    }

    return tips;
  }

  private normalizeProduct(product: any) {
    return {
      ...product,
      category: 'food',
      source: 'OpenFoodFacts'
    };
  }

  productService = {
    getByBarcode: (barcode: string) => this.getByBarcode(barcode)
  };
}

// ============================================
// EXPORT DEFAULT INSTANCE
// ============================================

export const universalSearchService = new UniversalSearchService();
export const openFoodFactsAPI = new OpenFoodFactsAPI();