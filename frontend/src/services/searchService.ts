// PATH: frontend/src/services/searchService.ts
import apiClient from './apiClient';

// Export du type SearchItem pour visionService
export interface SearchItem {
  _id?: string;
  id?: string;
  objectID?: string;
  name?: string;
  productName?: string;
  brand?: string;
  barcode?: string;
  category?: string;
  score?: number;
  imageUrl?: string;
  [k: string]: any;
}

export interface ProductHit extends SearchItem {
  image?: string;
  ingredients?: string;
  nova?: number;
  additives?: any[];
  healthScore?: number;
  environmentScore?: number;
  socialScore?: number;
  globalScore?: number;
  nutriScore?: string;
  ecoScore?: string;
}

interface SearchParams {
  query: string;
  filters?: any;
  page?: number;
  hitsPerPage?: number;
}

interface SearchResponse {
  hits: ProductHit[];
  totalHits: number;
  page: number;
  totalPages: number;
  processingTimeMs: number;
}

class SearchService {
  async search(query: string, options?: { limit?: number; page?: number; category?: string }): Promise<SearchItem[]> {
    const startTime = Date.now();
    
    try {
      const response = await apiClient.get('/products/search', {
        params: {
          q: query,
          limit: options?.limit || 20,
          ...(options?.page && { page: options.page }),
          ...(options?.category && { category: options.category })
        }
      });
      
      // Extraire les produits selon différents formats possibles
      let products = [];
      if (response.data?.success && response.data?.products) {
        products = response.data.products;
      } else if (response.data?.products) {
        products = response.data.products;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.products) {
        products = response.products;
      }
      
      // Normaliser les produits en SearchItem
      return products.map((p: any) => ({
        _id: p._id || p.id,
        id: p._id || p.id,
        objectID: p._id || p.id || p.objectID,
        name: p.name || p.productName || 'Produit sans nom',
        productName: p.productName || p.name,
        brand: p.brand,
        barcode: p.barcode,
        category: p.category,
        score: p.score,
        imageUrl: p.imageUrl || p.image
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async searchWithParams(params: SearchParams): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      const response = await apiClient.get('/products', {
        params: {
          q: params.query,
          page: params.page,
          limit: params.hitsPerPage
        }
      });
      
      // Utiliser la même logique d'extraction que dans search()
      let products = [];
      if (response.data?.success && response.data?.products) {
        products = response.data?.products;
      } else if (response.data?.products) {
        products = response.data?.products;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.products) {
        products = response.products;
      }
      
      // Mapper vers ProductHit
      const hits = products.map((product: any, index: number) => {
        const hit: ProductHit = {
          objectID: product._id || product.id || `product-${index}`,
          _id: product._id,
          id: product.id || product._id,
          name: product.name || 'Produit sans nom',
          productName: product.productName || product.name,
          brand: product.brand || 'Marque inconnue',
          image: product.imageUrl || product.image || '/placeholder.png',
          imageUrl: product.imageUrl || product.image || '/placeholder.png',
          barcode: product.barcode || '',
          category: product.category || 'food',
          ingredients: product.ingredients || '',
          nova: product.nova,
          additives: product.additives || []
        };
        
        // Ajouter les scores depuis analysisData
        if (product.analysisData) {
          hit.healthScore = product.analysisData?.healthScore || 0;
          hit.environmentScore = product.analysisData?.environmentScore || 0;
          hit.socialScore = product.analysisData?.socialScore;
          
          if (product.analysisData?.details) {
            hit.nutriScore = product.analysisData?.details.nutriscore;
            hit.ecoScore = product.analysisData?.details.ecoscore;
          }
        }
        
        return hit;
      });
      
      return {
        hits,
        totalHits: hits.length,
        page: 0,
        totalPages: 1,
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        hits: [],
        totalHits: 0,
        page: 0,
        totalPages: 0,
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  async searchByBarcode(barcode: string): Promise<ProductHit | null> {
    try {
      const response = await apiClient.get(`/products/barcode/${barcode}`);
      
      if (!response.data || response.data?.success === false) {
        return null;
      }
      
      const product = response.data?.product || response.data;
      
      return {
        objectID: product._id || product.id || product.barcode,
        _id: product._id,
        id: product.id || product._id,
        name: product.name || 'Sans nom',
        productName: product.productName || product.name,
        brand: product.brand || '',
        image: product.imageUrl || product.image || '/placeholder.png',
        imageUrl: product.imageUrl || product.image || '/placeholder.png',
        barcode: product.barcode,
        category: product.category || 'food',
        ingredients: product.ingredients || '',
        nova: product.nova,
        additives: product.additives || [],
        healthScore: product.analysisData?.healthScore || 0,
        environmentScore: product.analysisData?.environmentScore || 0,
        socialScore: product.analysisData?.socialScore,
        nutriScore: product.analysisData?.details?.nutriscore,
        ecoScore: product.analysisData?.details?.ecoscore
      };
    } catch (error) {
      console.error('Barcode search error:', error);
      return null;
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    try {
      const response = await apiClient.get('/products/search', {
        params: { q: query, limit: 10 }
      });
      
      const products = response.data?.products || response.products || [];
      
      // Extraire les noms et marques uniques
      const suggestions = new Set<string>();
      products.forEach((p: any) => {
        if (p.name) suggestions.add(p.name);
        if (p.brand) suggestions.add(p.brand);
      });
      
      return Array.from(suggestions).slice(0, 10);
    } catch (error) {
      return [];
    }
  }

  async getTrending(limit: number = 10): Promise<SearchItem[]> {
    try {
      const response = await apiClient.get('/products/trending', {
        params: { limit }
      });
      
      const products = response.data?.products || response.products || [];
      return products.map((p: any) => ({
        _id: p._id || p.id,
        id: p._id || p.id,
        objectID: p._id || p.id || p.objectID,
        name: p.name || p.productName || 'Produit sans nom',
        productName: p.productName || p.name,
        brand: p.brand,
        barcode: p.barcode,
        category: p.category,
        score: p.score,
        imageUrl: p.imageUrl || p.image
      }));
    } catch (error) {
      console.error('Get trending error:', error);
      return [];
    }
  }
}

export function extractProducts(response: SearchResponse | any): ProductHit[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response?.hits) {
    return response.hits;
  }
  if (response?.data?.hits) {
    return response.data?.hits;
  }
  if (response?.data?.products) {
    return response.data?.products;
  }
  if (response?.products) {
    return response.products;
  }
  return [];
}

const searchService = new SearchService();
export default searchService;
