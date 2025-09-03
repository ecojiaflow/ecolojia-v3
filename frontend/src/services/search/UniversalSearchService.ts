// PATH: frontend/ecolojiaFrontV3/src/services/search/UniversalSearchService.ts

import algoliasearch from 'algoliasearch/lite';
import { productService } from '../../services/api';

// ============================================================================
// INTERFACES & TYPES (Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TENDUES)
// ============================================================================

export interface SearchResult {
  id: string;
  name: string;
  brand?: string;
  category: 'food' | 'cosmetics' | 'detergents' | 'unknown';
  barcode?: string;
  image?: string;
  score?: number;
  source: 'algolia' | 'openfoodfacts' | 'openbeautyfacts' | 'openproductsfacts' | 'local' | 'enriched';
  confidence: number;
  enrichment?: ProductEnrichment;
  rawData?: any;
}

export interface ProductEnrichment {
  ecolojia_score: number;
  health_score: number;
  nova_group?: number;
  nutri_score?: string;
  ingredients?: string;
  additives_count: number;
  ultra_processed: boolean;
  educational_tips: string[];
  alternatives_available: number;
  // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ NOUVEAUX CHAMPS COSMÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TIQUES
  inci_ingredients?: string[];
  endocrine_disruptors?: number;
  allergens_count?: number;
  naturalness_score?: number;
  // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ NOUVEAUX CHAMPS DÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TERGENTS
  biodegradable?: boolean;
  eco_labels?: string[];
  aquatic_toxicity?: 'low' | 'medium' | 'high';
  voc_emissions?: 'low' | 'medium' | 'high';
}

export interface SearchSuggestion {
  query: string;
  type: 'product' | 'brand' | 'category' | 'ingredient';
  count?: number;
  category?: string;
  icon?: string;
}

export interface UniversalSearchOptions {
  categories?: ('food' | 'cosmetics' | 'detergents')[];
  includeIngredients?: boolean;
  enrichProducts?: boolean;
  maxResults?: number;
  timeout?: number;
}

// ============================================================================
// Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ OPEN BEAUTY FACTS API (COSMÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TIQUES)
// ============================================================================

interface OpenBeautyFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  image_url?: string;
  image_front_url?: string;
  additives_tags?: string[];
  packaging?: string;
  labels?: string;
}

class OpenBeautyFactsAPI {
  private baseURL = 'https://world.openbeautyfacts.org/api/v0';
  private cache = new Map<string, any>();

  async searchProducts(query: string, limit: number = 20): Promise<OpenBeautyFactsProduct[]> {
    const cacheKey = `beauty_search_${query}_${limit}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬aÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ OpenBeautyFacts: Recherche cosmetiques pour:', query);
      
      const response = await fetch(
        `${this.baseURL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,categories,ingredients_text,image_url,image_front_url,additives_tags,packaging,labels`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const products = data?.products?.filter(p => p.product_name) || [];
      
      this.cache.set(cacheKey, products);
      
      console.log(`aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ OpenBeautyFacts: ${products.length} cosmetiques trouves`);
      return products;

    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â OpenBeautyFacts search failed:', error);
      return [];
    }
  }

  async productService.getByBarcode(barcode: string): Promise<OpenBeautyFactsProduct | null> {
    const cacheKey = `beauty_barcode_${barcode}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬aÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ OpenBeautyFacts: Recherche cosmetique par code-barres:', barcode);
      
      const response = await fetch(
        `${this.baseURL}/product/${barcode}.json?fields=code,product_name,brands,categories,ingredients_text,image_url,image_front_url,additives_tags,packaging,labels`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data?.status === 1 && data?.product) {
        this.cache.set(cacheKey, data?.product);
        console.log('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ OpenBeautyFacts: Cosmetique trouve pour code-barres');
        return data?.product;
      }

      return null;

    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â OpenBeautyFacts barcode lookup failed:', error);
      return null;
    }
  }

  convertToSearchResult(product: OpenBeautyFactsProduct): SearchResult {
    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âª ANALYSE INCI POUR DÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TECTER ALLERGÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â NES ET PERTURBATEURS ENDOCRINIENS
    const ingredients = product.ingredients_text || '';
    const allergens = this.detectAllergens(ingredients);
    const endocrineDisruptors = this.detectEndocrineDisruptors(ingredients);
    const inciIngredients = this.parseInciIngredients(ingredients);
    const naturalnessScore = this.calculateNaturalnessScore(ingredients, product.labels || '');
    
    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ CALCUL SCORE ECOLOJIA COSMÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TIQUE SPÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°CIALISÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°
    let ecolojia_score = 70; // Base cosmetique
    
    // Penalites perturbateurs endocriniens (tres severe)
    if (endocrineDisruptors > 0) ecolojia_score -= endocrineDisruptors * 15;
    
    // Penalites allergenes
    if (allergens > 3) ecolojia_score -= 10;
    
    // Bonus naturalite
    ecolojia_score += Math.floor(naturalnessScore * 0.3);
    
    // Bonus si bio/naturel dans labels
    const isNatural = product.labels?.toLowerCase().includes('bio') || 
                     product.brands?.toLowerCase().includes('bio') ||
                     product.labels?.toLowerCase().includes('naturel');
    if (isNatural) ecolojia_score += 15;
    
    ecolojia_score = Math.max(0, Math.min(100, ecolojia_score));

    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ GÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°NÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°RATION TIPS Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°DUCATIFS COSMÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TIQUES SPÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°CIALISÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°S
    const educational_tips: string[] = [];
    
    if (endocrineDisruptors > 0) {
      educational_tips.push(`aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ${endocrineDisruptors} perturbateur(s) endocrinien(s) detecte(s) - Risque hormonal`);
    }
    
    if (allergens > 0) {
      educational_tips.push(`Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ ${allergens} allergene(s) identifie(s) - Verifiez votre tolerance cutanee`);
    }
    
    if (inciIngredients.length > 30) {
      educational_tips.push('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œaaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ Liste INCI longue - Privilegiez formules plus simples et naturelles');
    }

    if (naturalnessScore < 5) {
      educational_tips.push('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âª Formule tres synthetique - Considerez alternatives bio/naturelles');
    }

    return {
      id: product.code,
      name: product.product_name || 'Cosmetique sans nom',
      brand: product.brands,
      category: 'cosmetics',
      barcode: product.code,
      image: product.image_front_url || product.image_url,
      source: 'openbeautyfacts',
      confidence: 0.85,
      enrichment: {
        ecolojia_score,
        health_score: ecolojia_score,
        ingredients: product.ingredients_text,
        additives_count: 0, // Pas applicable aux cosmetiques
        ultra_processed: false, // Concept alimentaire
        educational_tips,
        alternatives_available: endocrineDisruptors > 0 ? Math.floor(Math.random() * 5) + 1 : 0,
        // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ DONNÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ES COSMÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TIQUES SPÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°CIALISÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ES
        inci_ingredients: inciIngredients,
        endocrine_disruptors: endocrineDisruptors,
        allergens_count: allergens,
        naturalness_score: naturalnessScore
      },
      rawData: product
    };
  }

  private detectAllergens(ingredients: string): number {
    // 26 allergenes reglementaires UE + additionnels
    const allergensRegex = [
      'limonene', 'linalool', 'citronellol', 'geraniol', 'benzyl alcohol',
      'benzyl salicylate', 'cinnamal', 'eugenol', 'hexyl cinnamal',
      'hydroxycitronellal', 'isoeugenol', 'amyl cinnamal', 'anise alcohol',
      'benzyl benzoate', 'benzyl cinnamate', 'cinnamyl alcohol',
      'citral', 'coumarin', 'farnesol', 'methyl 2-octynoate',
      // Allergenes additionnels frequents
      'parfum', 'fragrance', 'methylchloroisothiazolinone', 'methylisothiazolinone'
    ];
    
    const lower = ingredients.toLowerCase();
    return allergensRegex.filter(allergen => lower.includes(allergen)).length;
  }

  private detectEndocrineDisruptors(ingredients: string): number {
    // Base Commission Europeenne + ANSES + EWG
    const disruptorsRegex = [
      'triclosan', 'bht', 'bha', 'parabens?', 'methylparaben', 'propylparaben',
      'butylparaben', 'ethylparaben', 'benzophenone', 'octinoxate', 'homosalate', 
      'octisalate', 'oxybenzone', 'avobenzone', 'phthalates?', 'resorcinol',
      'phenoxyethanol', 'quaternium-15', 'dmdm hydantoin'
    ];
    
    const lower = ingredients.toLowerCase();
    return disruptorsRegex.filter(disruptor => 
      new RegExp(disruptor, 'i').test(lower)
    ).length;
  }

  private parseInciIngredients(ingredients: string): string[] {
    if (!ingredients) return [];
    
    return ingredients
      .split(/[,;]/)
      .map(ing => ing.trim())
      .filter(ing => ing.length > 2)
      .slice(0, 50); // Limiter pour performance
  }

  private calculateNaturalnessScore(ingredients: string, labels: string): number {
    const lower = ingredients.toLowerCase();
    const labelsLower = labels.toLowerCase();
    
    let score = 5; // Base neutre
    
    // Bonus ingredients naturels
    const naturalKeywords = [
      'water', 'aqua', 'oil', 'butter', 'extract', 'aloe', 'coconut',
      'olive', 'shea', 'argan', 'jojoba', 'essential oil'
    ];
    naturalKeywords.forEach(keyword => {
      if (lower.includes(keyword)) score += 0.5;
    });
    
    // Penalites ingredients synthetiques
    const syntheticKeywords = [
      'sodium lauryl sulfate', 'peg-', 'propylene glycol', 'dimethicone',
      'acrylate', 'polysorbate', 'synthetic', 'artificial'
    ];
    syntheticKeywords.forEach(keyword => {
      if (lower.includes(keyword)) score -= 1;
    });
    
    // Bonus labels bio
    if (labelsLower.includes('bio') || labelsLower.includes('organic')) score += 2;
    if (labelsLower.includes('natural') || labelsLower.includes('naturel')) score += 1;
    
    return Math.max(0, Math.min(10, score));
  }
}

// ============================================================================
// Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ OPEN PRODUCTS FACTS API (DÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TERGENTS)
// ============================================================================

interface OpenProductsFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  image_url?: string;
  image_front_url?: string;
  labels?: string;
  packaging?: string;
}

class OpenProductsFactsAPI {
  private baseURL = 'https://world.openproductsfacts.org/api/v0';
  private cache = new Map<string, any>();

  async searchProducts(query: string, limit: number = 15): Promise<OpenProductsFactsProduct[]> {
    const cacheKey = `products_search_${query}_${limit}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ OpenProductsFacts: Recherche detergents pour:', query);
      
      const response = await fetch(
        `${this.baseURL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,categories,ingredients_text,image_url,image_front_url,labels,packaging`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const products = data?.products?.filter(p => p.product_name) || [];
      
      this.cache.set(cacheKey, products);
      
      console.log(`aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ OpenProductsFacts: ${products.length} produits menagers trouves`);
      return products;

    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â OpenProductsFacts search failed:', error);
      return [];
    }
  }

  async productService.getByBarcode(barcode: string): Promise<OpenProductsFactsProduct | null> {
    const cacheKey = `products_barcode_${barcode}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ OpenProductsFacts: Recherche detergent par code-barres:', barcode);
      
      const response = await fetch(
        `${this.baseURL}/product/${barcode}.json?fields=code,product_name,brands,categories,ingredients_text,image_url,image_front_url,labels,packaging`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data?.status === 1 && data?.product) {
        this.cache.set(cacheKey, data?.product);
        console.log('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ OpenProductsFacts: Detergent trouve pour code-barres');
        return data?.product;
      }

      return null;

    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â OpenProductsFacts barcode lookup failed:', error);
      return null;
    }
  }

  convertToSearchResult(product: OpenProductsFactsProduct): SearchResult {
    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  ANALYSE COMPOSITION POUR IMPACT ENVIRONNEMENTAL
    const ingredients = product.ingredients_text || '';
    const toxicSurfactants = this.detectToxicSurfactants(ingredients);
    const ecoLabels = this.detectEcoLabels(product.labels || '');
    const biodegradable = this.assessBiodegradability(ingredients, ecoLabels);
    const aquaticToxicity = this.assessAquaticToxicity(toxicSurfactants);
    const vocEmissions = this.assessVocEmissions(ingredients);
    
    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ CALCUL SCORE ECOLOJIA DÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TERGENT (FOCUS ENVIRONNEMENTAL)
    let ecolojia_score = 60; // Base detergent (plus strict que cosmetique)
    
    // Bonus labels ecologiques (important)
    if (ecoLabels.length > 0) ecolojia_score += 25;
    
    // Penalites tensio-actifs toxiques (severe)
    if (toxicSurfactants > 0) ecolojia_score -= toxicSurfactants * 15;
    
    // Bonus biodegradabilite
    if (biodegradable) ecolojia_score += 15;
    
    // Penalite emissions COV
    if (vocEmissions === 'high') ecolojia_score -= 10;
    else if (vocEmissions === 'medium') ecolojia_score -= 5;
    
    ecolojia_score = Math.max(0, Math.min(100, ecolojia_score));

    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ GÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°NÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°RATION TIPS Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°DUCATIFS DÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TERGENTS SPÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°CIALISÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°S
    const educational_tips: string[] = [];
    
    if (toxicSurfactants > 0) {
      educational_tips.push(`Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  ${toxicSurfactants} tensio-actif(s) toxique(s) pour la vie aquatique - Impact ecologique`);
    }
    
    if (!biodegradable) {
      educational_tips.push('aaaÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Biodegradabilite non confirmee - Risque pollution eau/sol persistante');
    }
    
    if (ecoLabels.length > 0) {
      educational_tips.push(`Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ Certifie ${ecoLabels.join(', ')} - Choix ecologique valide scientifiquement`);
    }

    if (vocEmissions === 'high') {
      educational_tips.push('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬aÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°missions COV elevees - Risque qualite air interieur');
    }

    return {
      id: product.code,
      name: product.product_name || 'Produit menager sans nom',
      brand: product.brands,
      category: 'detergents',
      barcode: product.code,
      image: product.image_front_url || product.image_url,
      source: 'openproductsfacts',
      confidence: 0.8,
      enrichment: {
        ecolojia_score,
        health_score: ecolojia_score,
        ingredients: product.ingredients_text,
        additives_count: 0, // Pas applicable aux detergents
        ultra_processed: false, // Concept alimentaire
        educational_tips,
        alternatives_available: toxicSurfactants > 0 ? Math.floor(Math.random() * 3) + 1 : 0,
        // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ DONNÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ES DÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TERGENTS SPÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°CIALISÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ES
        biodegradable,
        eco_labels: ecoLabels,
        aquatic_toxicity: aquaticToxicity,
        voc_emissions: vocEmissions
      },
      rawData: product
    };
  }

  private detectToxicSurfactants(ingredients: string): number {
    // Tensio-actifs problematiques selon OECD + EPA
    const toxicSurfactants = [
      'sodium lauryl sulfate', 'sls', 'ammonium lauryl sulfate',
      'nonylphenol ethoxylate', 'linear alkylbenzene sulfonate',
      'phosphates', 'sodium laureth sulfate', 'sles', 'alkylphenol ethoxylate'
    ];
    
    const lower = ingredients.toLowerCase();
    return toxicSurfactants.filter(surfactant => lower.includes(surfactant)).length;
  }

  private detectEcoLabels(labels: string): string[] {
    // Labels ecologiques officiels reconnus
    const ecoLabelsRegex = [
      'ecolabel', 'ecocert', 'cradle to cradle', 'eu flower',
      'nordic swan', 'blue angel', 'green seal', 'ecologo'
    ];
    
    const lower = labels.toLowerCase();
    return ecoLabelsRegex.filter(label => lower.includes(label));
  }

  private assessBiodegradability(ingredients: string, ecoLabels: string[]): boolean {
    // Si labels eco, probablement biodegradable
    if (ecoLabels.length > 0) return true;
    
    // Recherche ingredients biodegradables connus
    const biodegradableKeywords = [
      'plant-based', 'coconut', 'palm', 'vegetable',
      'biodegradable', 'soap', 'sodium carbonate', 'citric acid'
    ];
    
    const lower = ingredients.toLowerCase();
    return biodegradableKeywords.some(keyword => lower.includes(keyword));
  }

  private assessAquaticToxicity(toxicSurfactants: number): 'low' | 'medium' | 'high' {
    if (toxicSurfactants === 0) return 'low';
    if (toxicSurfactants <= 2) return 'medium';
    return 'high';
  }

  private assessVocEmissions(ingredients: string): 'low' | 'medium' | 'high' {
    const highVocKeywords = [
      'alcohol', 'ethanol', 'isopropanol', 'acetone', 'toluene',
      'xylene', 'formaldehyde', 'ammonia'
    ];
    
    const lower = ingredients.toLowerCase();
    const vocCount = highVocKeywords.filter(voc => lower.includes(voc)).length;
    
    if (vocCount === 0) return 'low';
    if (vocCount <= 2) return 'medium';
    return 'high';
  }
}

// ============================================================================
// UNIVERSAL SEARCH ENGINE Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TENDU MULTI-SOURCES
// ============================================================================

export class UniversalSearchEngine {
  private algoliaClient: any;
  private openFoodFacts: OpenFoodFactsAPI;
  private openBeautyFacts: OpenBeautyFactsAPI; // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢
  private openProductsFacts: OpenProductsFactsAPI; // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢
  private searchHistory: string[] = [];
  private suggestionCache = new Map<string, SearchSuggestion[]>();

  constructor() {
    // Configuration Algolia existante
    this.algoliaClient = algoliasearch(
      'A2KJGZ2811',
      '085aeee2b3ec8efa66dabb7691a01b67'
    );
    
    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â INITIALISATION DES 5 SOURCES DE DONNÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ES
    this.openFoodFacts = new OpenFoodFactsAPI();
    this.openBeautyFacts = new OpenBeautyFactsAPI(); // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ COSMÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TIQUES
    this.openProductsFacts = new OpenProductsFactsAPI(); // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ DÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TERGENTS
    
    // Charger historique depuis localStorage
    this.loadSearchHistory();
  }

  // ========== Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡aÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ RECHERCHE UNIVERSELLE Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TENDUE 5 SOURCES ==========

  async search(
    query: string, 
    options: UniversalSearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      categories = ['food', 'cosmetics', 'detergents'],
      includeIngredients = true,
      enrichProducts = true,
      maxResults = 20,
      timeout = 5000
    } = options;

    console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Recherche universelle 5 sources:', { query, options });

    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°viter les recherches vides
    if (!query.trim()) {
      return [];
    }

    const startTime = Date.now();
    const allResults: SearchResult[] = [];

    try {
      // 1. Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂaaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ RECHERCHE PARALLÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â LE SUR TOUTES LES 5 SOURCES
      const searchPromises: Promise<SearchResult[]>[] = [];

      // Algolia (base existante - toutes categories)
      searchPromises.push(this.searchAlgolia(query, categories, Math.floor(maxResults * 0.25)));

      // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ OpenFoodFacts (alimentaire)
      if (categories.includes('food')) {
        searchPromises.push(this.searchOpenFoodFacts(query, Math.floor(maxResults * 0.25)));
      }

      // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬aÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ OpenBeautyFacts (cosmetiques)
      if (categories.includes('cosmetics')) {
        searchPromises.push(this.searchOpenBeautyFacts(query, Math.floor(maxResults * 0.25)));
      }

      // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ OpenProductsFacts (detergents)
      if (categories.includes('detergents')) {
        searchPromises.push(this.searchOpenProductsFacts(query, Math.floor(maxResults * 0.25)));
      }

      // Base locale (api - toutes categories)
      searchPromises.push(this.searchLocal(query, Math.floor(maxResults * 0.25)));

      // 2. aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ATTENDRE TOUTES LES RECHERCHES AVEC TIMEOUT
      const results = await Promise.allSettled(
        searchPromises.map(p => 
          Promise.race([
            p,
            new Promise<SearchResult[]>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeout)
            )
          ])
        )
      );

      // 3. Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  MERGER LES RÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°SULTATS AVEC LOGGING DÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TAILLÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°
      const sources = ['Algolia', 'OpenFoodFacts', 'OpenBeautyFacts', 'OpenProductsFacts', 'Local'];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ ${sources[index]}: ${result.value.length} resultats`);
          allResults.push(...result.value);
        } else {
          console.warn(`aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ ${sources[index]} failed:`, result.reason);
        }
      });

      // 4. Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂaaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ DÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°DUPLICATION INTELLIGENTE MULTI-SOURCES
      const deduplicatedResults = this.deduplicateResults(allResults);

      // 5. Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ ENRICHISSEMENT IA SI DEMANDÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°
      let finalResults = deduplicatedResults;
      if (enrichProducts) {
        finalResults = await this.enrichResults(deduplicatedResults);
      }

      // 6. Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â  TRI PAR PERTINENCE MULTI-CRITÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â RES
      finalResults = this.sortByRelevance(finalResults, query);

      // 7. aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â LIMITER RÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°SULTATS
      finalResults = finalResults.slice(0, maxResults);

      // 8. Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬aÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ SAUVEGARDER RECHERCHE
      this.saveSearch(query);

      const duration = Date.now() - startTime;
      console.log(`aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Recherche universelle terminee: ${finalResults.length} resultats en ${duration}ms`);
      console.log(`Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Sources utilisees: ${[...new Set(finalResults.map(r => r.source))].join(', ')}`);

      return finalResults;

    } catch (error) {
      console.error('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ Erreur recherche universelle:', error);
      return [];
    }
  }

  // ========== Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  RECHERCHE PAR CODE-BARRES Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TENDUE 5 SOURCES ==========

  async searchByBarcode(barcode: string): Promise<SearchResult | null> {
    console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Recherche universelle par code-barres sur 5 sources:', barcode);

    try {
      // 1. Essayer base locale d'abord (plus rapide)
      const localProduct = await productService.getByBarcode(barcode);
      if (localProduct) {
        console.log('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Produit trouve en local');
        return {
          id: localProduct.id,
          name: localProduct.title,
          brand: localProduct.brand || '',
          category: this.detectCategoryFromProduct(localProduct),
          barcode: barcode,
          image: localProduct.image_url,
          source: 'local',
          confidence: 1.0,
          rawData: localProduct
        };
      }

      // 2. Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂaaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ ESSAYER EN PARALLÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â LE SUR LES 3 SOURCES OPEN*FACTS
      const barcodePromises = [
        this.openFoodFacts.productService.getByBarcode(barcode),
        this.openBeautyFacts.productService.getByBarcode(barcode), // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢
        this.openProductsFacts.productService.getByBarcode(barcode) // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢
      ];

      const barcodeResults = await Promise.allSettled(barcodePromises);

      // Retourner le premier resultat trouve avec conversion appropriee
      for (let i = 0; i < barcodeResults.length; i++) {
        const result = barcodeResults[i];
        if (result.status === 'fulfilled' && result.value) {
          const apis = [this.openFoodFacts, this.openBeautyFacts, this.openProductsFacts];
          const sourceNames = ['OpenFoodFacts', 'OpenBeautyFacts', 'OpenProductsFacts'];
          console.log(`aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Produit trouve sur ${sourceNames[i]}`);
          return apis[i].convertToSearchResult(result.value);
        }
      }

      console.log('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ Produit non trouve sur aucune des 5 sources');
      return null;

    } catch (error) {
      console.error('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ Erreur recherche code-barres:', error);
      return null;
    }
  }

  // ========== Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ NOUVELLES MÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°THODES DE RECHERCHE SPÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°CIALISÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ES ==========

  private async searchOpenBeautyFacts(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const products = await this.openBeautyFacts.searchProducts(query, limit);
      return products.map(product => this.openBeautyFacts.convertToSearchResult(product));
    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â OpenBeautyFacts search failed:', error);
      return [];
    }
  }

  private async searchOpenProductsFacts(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const products = await this.openProductsFacts.searchProducts(query, limit);
      return products.map(product => this.openProductsFacts.convertToSearchResult(product));
    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â OpenProductsFacts search failed:', error);
      return [];
    }
  }

  // ========== Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ AUTO-COMPLÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TION ENRICHIE MULTI-CATÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°GORIES ==========

  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (query.length < 2) {
      return this.getPopularSuggestions();
    }

    const cacheKey = query.toLowerCase();
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    const suggestions: SearchSuggestion[] = [];

    try {
      // 1. Suggestions depuis l'historique
      const historySuggestions = this.getHistorySuggestions(query);
      suggestions.push(...historySuggestions);

      // 2. Suggestions de produits populaires
      const productSuggestions = await this.productService.search(query);
      suggestions.push(...productSuggestions);

      // 3. Suggestions d'ingredients/marques multi-categories
      const entitySuggestions = this.getEntitySuggestions(query);
      suggestions.push(...entitySuggestions);

      // Deduplication et tri
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
      const sortedSuggestions = uniqueSuggestions.slice(0, 8);

      this.suggestionCache.set(cacheKey, sortedSuggestions);
      
      return sortedSuggestions;

    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Erreur suggestions:', error);
      return this.getPopularSuggestions();
    }
  }

  // ========== MÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°THODES PRIVÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ES EXISTANTES (CONSERVÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ES + Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TENDUES) ==========

  private async searchAlgolia(
    query: string, 
    categories: string[], 
    limit: number
  ): Promise<SearchResult[]> {
    try {
      const index = this.algoliaClient.initIndex('ecolojia_products_staging');
      
      const algoliaResponse = await index.search(query, {
        hitsPerPage: limit,
        facetFilters: categories.length < 3 ? [`category:${categories.join(',')}`] : undefined
      });

      return algoliaResponse.hits.map((hit: any) => ({
        id: hit.objectID,
        name: hit.product_name || hit.name || hit.title || 'Produit sans nom',
        brand: hit.brands || hit.brand || hit.brand_name,
        category: this.mapCategory(hit.category),
        barcode: hit.barcode,
        image: hit.image_url || hit.image,
        source: 'algolia' as const,
        confidence: 0.8,
        rawData: hit
      }));

    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Algolia search failed:', error);
      return [];
    }
  }

  private async searchOpenFoodFacts(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const products = await this.openFoodFacts.searchProducts(query, limit);
      return products.map(product => this.openFoodFacts.convertToSearchResult(product));
    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â OpenFoodFacts search failed:', error);
      return [];
    }
  }

  private async searchLocal(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const suggestions = await productService.search(query);
      return suggestions.slice(0, limit).map(product => ({
        id: product.id,
        name: product.title,
        brand: product.brand || '',
        category: this.detectCategoryFromProduct(product),
        barcode: undefined,
        image: product.image_url,
        source: 'local' as const,
        confidence: 0.7,
        rawData: product
      }));
    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Local search failed:', error);
      return [];
    }
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const deduped: SearchResult[] = [];

    for (const result of results) {
      // Cle de deduplication basee sur nom + marque + categorie
      const key = `${result.name.toLowerCase()}_${(result.brand || '').toLowerCase()}_${result.category}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(result);
      } else {
        // Si doublon, garder celui avec la meilleure source (priorite)
        const existingIndex = deduped.findIndex(r => 
          `${r.name.toLowerCase()}_${(r.brand || '').toLowerCase()}_${r.category}` === key
        );
        
        if (existingIndex >= 0) {
          const existing = deduped[existingIndex];
          const sourceRanking = { 
            local: 5, 
            algolia: 4, 
            openfoodfacts: 3, 
            openbeautyfacts: 2, 
            openproductsfacts: 1 
          };
          
          if (sourceRanking[result.source] > sourceRanking[existing.source]) {
            deduped[existingIndex] = result;
          }
        }
      }
    }

    return deduped;
  }

  private async enrichResults(results: SearchResult[]): Promise<SearchResult[]> {
    // Enrichissement basique pour les resultats sans enrichment
    return results.map(result => {
      if (result.enrichment) {
        return result;
      }

      // Enrichissement basique base sur les donnees disponibles
      const hasIngredients = result.rawData?.ingredients_text || result.rawData?.ingredients;
      const hasBrand = result.brand && result.brand.length > 0;
      
      result.enrichment = {
        ecolojia_score: hasBrand ? 70 : 50,
        health_score: hasBrand ? 70 : 50,
        additives_count: hasIngredients ? Math.floor(Math.random() * 3) : 0,
        ultra_processed: false,
        educational_tips: [],
        alternatives_available: Math.floor(Math.random() * 3)
      };

      return result;
    });
  }

  private sortByRelevance(results: SearchResult[], query: string): SearchResult[] {
    const queryLower = query.toLowerCase();
    
    return results.sort((a, b) => {
      // 1. Correspondance exacte nom
      const aExactName = ?.name.toLowerCase().includes(queryLower) ? 1 : 0;
      const bExactName = b.name.toLowerCase().includes(queryLower) ? 1 : 0;
      if (aExactName !== bExactName) return bExactName - aExactName;

      // 2. Correspondance marque
      const aExactBrand = (?.brand || '').toLowerCase().includes(queryLower) ? 1 : 0;
      const bExactBrand = (b.brand || '').toLowerCase().includes(queryLower) ? 1 : 0;
      if (aExactBrand !== bExactBrand) return bExactBrand - aExactBrand;

      // 3. Score ECOLOJIA
      const aScore = ?.enrichment?.ecolojia_score || 0;
      const bScore = b.enrichment?.ecolojia_score || 0;
      if (aScore !== bScore) return bScore - aScore;

      // 4. Source prioritaire
      const sourceRanking = { 
        local: 5, 
        algolia: 4, 
        openfoodfacts: 3, 
        openbeautyfacts: 2, 
        openproductsfacts: 1 
      };
      return sourceRanking[b.source] - sourceRanking[?.source];
    });
  }

  private mapCategory(category: string): 'food' | 'cosmetics' | 'detergents' | 'unknown' {
    if (!category) return 'unknown';
    
    const lower = category.toLowerCase();
    
    if (lower.includes('food') || lower.includes('alimentaire') || lower.includes('nutrition')) {
      return 'food';
    }
    if (lower.includes('cosmetic') || lower.includes('beauty') || lower.includes('soin')) {
      return 'cosmetics';
    }
    if (lower.includes('detergent') || lower.includes('cleaning') || lower.includes('menager')) {
      return 'detergents';
    }
    
    return 'unknown';
  }

  private detectCategoryFromProduct(product: any): 'food' | 'cosmetics' | 'detergents' | 'unknown' {
    const title = (product.title || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    
    // Mots-cles alimentaire
    const foodKeywords = ['alimentaire', 'food', 'nutrition', 'bio', 'snack', 'boisson', 'yaourt'];
    if (foodKeywords.some(kw => title.includes(kw) || category.includes(kw))) {
      return 'food';
    }
    
    // Mots-cles cosmetique
    const cosmeticKeywords = ['cosmetic', 'beauty', 'soin', 'creme', 'shampoing', 'maquillage'];
    if (cosmeticKeywords.some(kw => title.includes(kw) || category.includes(kw))) {
      return 'cosmetics';
    }
    
    // Mots-cles detergent
    const detergentKeywords = ['detergent', 'cleaning', 'menager', 'lessive', 'vaisselle'];
    if (detergentKeywords.some(kw => title.includes(kw) || category.includes(kw))) {
      return 'detergents';
    }
    
    return 'unknown';
  }

  private getPopularSuggestions(): SearchSuggestion[] {
    return [
      // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ Alimentaire
      { query: 'nutella bio', type: 'product', icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â«', category: 'food' },
      { query: 'yaourt sans additifs', type: 'product', icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âº', category: 'food' },
      
      // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬aÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Cosmetiques
      { query: 'shampoing sans sulfate', type: 'product', icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´', category: 'cosmetics' },
      { query: 'creme sans parabenes', type: 'product', icon: 'aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨', category: 'cosmetics' },
      
      // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Detergents
      { query: 'lessive ecologique', type: 'product', icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½', category: 'detergents' },
      { query: 'liquide vaisselle bio', type: 'product', icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬aÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§', category: 'detergents' },
      
      // General
      { query: 'produits zero dechet', type: 'category', icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿' }
    ];
  }

  private getHistorySuggestions(query: string): SearchSuggestion[] {
    return this.searchHistory
      .filter(search => search.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(search => ({
        query: search,
        type: 'product' as const,
        icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â'
      }));
  }

  private async productService.search(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();
    
    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Suggestions contextuelle alimentaire
    if (queryLower.includes('bio') || queryLower.includes('naturel')) {
      suggestions.push({ query: `${query} sans additifs`, type: 'product', icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿', category: 'food' });
      suggestions.push({ query: `${query} NOVA 1`, type: 'product', icon: 'aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦', category: 'food' });
    }
    
    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Suggestions cosmetiques specialisees
    if (queryLower.includes('shampoing') || queryLower.includes('creme') || queryLower.includes('soin')) {
      suggestions.push({ query: `${query} sans parabenes`, type: 'product', icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â«', category: 'cosmetics' });
      suggestions.push({ query: `${query} hypoallergenique`, type: 'product', icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬aÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡', category: 'cosmetics' });
    }
    
    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Suggestions detergents specialisees
    if (queryLower.includes('lessive') || queryLower.includes('vaisselle') || queryLower.includes('menager')) {
      suggestions.push({ query: `${query} ecologique`, type: 'product', icon: 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â', category: 'detergents' });
      suggestions.push({ query: `${query} biodegradable`, type: 'product', icon: 'aaaÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â', category: 'detergents' });
    }
    
    return suggestions;
  }

  private getEntitySuggestions(query: string): SearchSuggestion[] {
    // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Suggestions d'entites etendues (marques, ingredients) par categorie
    const entities = [
      // Marques alimentaires
      { name: 'jardin bio', type: 'brand', category: 'food' },
      { name: 'bjorg', type: 'brand', category: 'food' },
      
      // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Marques cosmetiques
      { name: 'weleda', type: 'brand', category: 'cosmetics' },
      { name: 'cattier', type: 'brand', category: 'cosmetics' },
      { name: 'melvita', type: 'brand', category: 'cosmetics' },
      { name: 'loccitane', type: 'brand', category: 'cosmetics' },
      
      // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Marques detergents
      { name: 'ecover', type: 'brand', category: 'detergents' },
      { name: 'rainett', type: 'brand', category: 'detergents' },
      { name: 'arbre vert', type: 'brand', category: 'detergents' },
      { name: 'frosch', type: 'brand', category: 'detergents' },
      
      // Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Ingredients problematiques multi-categories
      { name: 'sans parabenes', type: 'ingredient', category: 'cosmetics' },
      { name: 'sans sulfates', type: 'ingredient', category: 'cosmetics' },
      { name: 'sans phosphates', type: 'ingredient', category: 'detergents' },
      { name: 'sans additifs', type: 'ingredient', category: 'food' }
    ];
    
    return entities
      .filter(entity => entity.name.includes(query.toLowerCase()))
      .map(entity => ({
        query: entity.name,
        type: entity.type as any,
        category: entity.category,
        icon: entity.category === 'food' ? 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½' : entity.category === 'cosmetics' ? 'aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨' : 'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½'
      }));
  }

  private deduplicateSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.query.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private loadSearchHistory(): void {
    try {
      const stored = localStorage.getItem('ecolojia_search_history');
      if (stored) {
        this.searchHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Erreur chargement historique recherche:', error);
    }
  }

  private saveSearch(query: string): void {
    try {
      // Ajouter au debut, eviter doublons
      this.searchHistory = [
        query,
        ...this.searchHistory.filter(q => q !== query)
      ].slice(0, 20); // Garder 20 dernieres recherches
      
      localStorage.setItem('ecolojia_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Erreur sauvegarde historique:', error);
    }
  }
}

// ============================================================================
// CLASSES OPENFOODFACTS EXISTANTES (CONSERVÃ†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ES)
// ============================================================================

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  nova_group?: number;
  nutriscore_grade?: string;
  image_url?: string;
  image_front_url?: string;
  additives_tags?: string[];
  ecoscore_grade?: string;
}

interface OpenFoodFactsSearchResponse {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_count: number;
  page_size: number;
}

class OpenFoodFactsAPI {
  private baseURL = 'https://world.openfoodfacts.org/api/v0';
  private cache = new Map<string, any>();

  async searchProducts(query: string, limit: number = 20): Promise<OpenFoodFactsProduct[]> {
    const cacheKey = `food_search_${query}_${limit}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ OpenFoodFacts: Recherche produits pour:', query);
      
      const response = await fetch(
        `${this.baseURL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,categories,ingredients_text,nova_group,nutriscore_grade,image_url,image_front_url,additives_tags,ecoscore_grade`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: OpenFoodFactsSearchResponse = await response.json();
      
      const products = data?.products?.filter(p => p.product_name) || [];
      
      this.cache.set(cacheKey, products);
      
      console.log(`aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ OpenFoodFacts: ${products.length} produits trouves`);
      return products;

    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â OpenFoodFacts search failed:', error);
      return [];
    }
  }

  async productService.getByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
    const cacheKey = `food_barcode_${barcode}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ OpenFoodFacts: Recherche par code-barres:', barcode);
      
      const response = await fetch(
        `${this.baseURL}/product/${barcode}.json?fields=code,product_name,brands,categories,ingredients_text,nova_group,nutriscore_grade,image_url,image_front_url,additives_tags,ecoscore_grade`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data?.status === 1 && data?.product) {
        this.cache.set(cacheKey, data?.product);
        console.log('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ OpenFoodFacts: Produit trouve pour code-barres');
        return data?.product;
      }

      return null;

    } catch (error) {
      console.warn('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â OpenFoodFacts barcode lookup failed:', error);
      return null;
    }
  }

  convertToSearchResult(product: OpenFoodFactsProduct): SearchResult {
    const additives_count = product.additives_tags?.length || 0;
    const ultra_processed = (product.nova_group || 1) >= 4;
    
    // Calcul score ECOLOJIA simplifie
    let ecolojia_score = 60; // Base
    
    if (product.nova_group === 1) ecolojia_score += 20;
    else if (product.nova_group === 4) ecolojia_score -= 25;
    
    if (product.nutriscore_grade === 'a') ecolojia_score += 15;
    else if (product.nutriscore_grade === 'e') ecolojia_score -= 15;
    
    if (additives_count === 0) ecolojia_score += 10;
    else if (additives_count > 5) ecolojia_score -= 15;
    
    ecolojia_score = Math.max(0, Math.min(100, ecolojia_score));

    // Generation tips educatifs
    const educational_tips: string[] = [];
    
    if (ultra_processed) {
      educational_tips.push('aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Produit ultra-transforme - Consommation occasionnelle recommandee');
    }
    
    if (additives_count > 3) {
      educational_tips.push(`Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âª ${additives_count} additifs detectes - Verifiez les E-numbers`);
    }
    
    if (product.nutriscore_grade && ['d', 'e'].includes(product.nutriscore_grade.toLowerCase())) {
      educational_tips.push('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Nutri-Score faible - Cherchez des alternatives plus saines');
    }

    return {
      id: product.code,
      name: product.product_name || 'Produit sans nom',
      brand: product.brands,
      category: 'food', // OpenFoodFacts = alimentaire
      barcode: product.code,
      image: product.image_front_url || product.image_url,
      source: 'openfoodfacts',
      confidence: 0.9,
      enrichment: {
        ecolojia_score,
        health_score: ecolojia_score,
        nova_group: product.nova_group,
        nutri_score: product.nutriscore_grade?.toLowerCase(),
        ingredients: product.ingredients_text,
        additives_count,
        ultra_processed,
        educational_tips,
        alternatives_available: ultra_processed ? Math.floor(Math.random() * 5) + 1 : 0
      },
      rawData: product
    };
  }
}

// ============================================================================
// Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â INSTANCE GLOBALE Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°TENDUE 5 SOURCES
// ============================================================================

export const universalSearchEngine = new UniversalSearchEngine();
export default universalSearchEngine;



