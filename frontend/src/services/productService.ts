// frontend/src/services/productService.ts
import { apiClient, getErrorMessage } from './apiClient';

// Types pour les produits
export interface Product {
  _id: string;
  barcode: string;
  name: string;
  nameTranslations?: {
    fr: string;
    en: string;
    [key: string]: string;
  };
  brand?: string;
  manufacturer?: string;
  category: 'food' | 'cosmetic' | 'detergent';
  subCategories?: string[];
  tags?: string[];
  images?: {
    front?: string;
    back?: string;
    ingredients?: string;
    nutrition?: string;
    [key: string]: string | undefined;
  };
  ingredients?: {
    list: any[];
    text: string;
  };
  certifications?: string[];
  labels?: string[];
  status?: string;
}

export interface AnalysisRequest {
  barcode?: string;
  productId?: string;
  productName?: string;
  ingredients?: string;
  category?: 'food' | 'cosmetic' | 'detergent';
  method?: 'scan' | 'search' | 'manual';
}

export interface AnalysisResponse {
  success: boolean;
  type: string;
  analysis: {
    score: number;
    grade: string;
    confidence: number;
    breakdown: {
      [key: string]: { score: number };
    };
    recommendations: string[];
    alternatives?: Product[];
    product_info?: any;
    meta?: {
      analysis_date: string;
      analysis_version: string;
      confidence: number;
    };
  };
  productSnapshot?: Product;
  disclaimers?: string[];
}

export interface SearchResponse {
  success: boolean;
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

class ProductService {
  
  // Recherche de produits
  async search(query: string, filters?: any): Promise<SearchResponse> {
    try {
      const response = await apiClient.get('/products/search', {
        params: {
          q: query,
          ...filters
        }
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Product search error:', message);
      throw new Error(message);
    }
  }

  // Obtenir un produit par ID
  async getById(productId: string): Promise<Product> {
    try {
      const response = await apiClient.get(`/products/${productId}`);
      return response.data.product || response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Get product error:', message);
      throw new Error(message);
    }
  }

  // Obtenir un produit par code-barres
  async getByBarcode(barcode: string): Promise<Product> {
    try {
      const response = await apiClient.get(`/products/barcode/${barcode}`);
      return response.data.product || response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Get product by barcode error:', message);
      throw new Error(message);
    }
  }

  // Analyser un produit (multi-catégories)
  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      // Déterminer l'endpoint selon la catégorie
      let endpoint = '/analysis';
      
      if (request.category) {
        switch (request.category) {
          case 'food':
            endpoint = '/food/analyze';
            break;
          case 'cosmetic':
            endpoint = '/cosmetic/analyze';
            break;
          case 'detergent':
            endpoint = '/detergent/analyze';
            break;
        }
      }

      // Si c'est un scan par code-barres
      if (request.barcode && request.method === 'scan') {
        endpoint += '/barcode';
      }

      const response = await apiClient.post(endpoint, request);
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Product analysis error:', message);
      throw new Error(message);
    }
  }

  // Analyse automatique (détecte la catégorie)
  async autoAnalyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const response = await apiClient.post('/analysis/auto', request);
      return response.data;
    } catch (error: any) {
      // Si l'analyse auto échoue, essayer de détecter la catégorie
      if (request.barcode) {
        try {
          const product = await this.getByBarcode(request.barcode);
          request.category = product.category;
          return await this.analyze(request);
        } catch (productError) {
          // Si le produit n'est pas trouvé, laisser l'erreur originale
        }
      }
      
      const message = getErrorMessage(error);
      console.error('Auto analysis error:', message);
      throw new Error(message);
    }
  }

  // Obtenir les produits tendance
  async getTrending(limit: number = 10): Promise<Product[]> {
    try {
      const response = await apiClient.get('/products/trending', {
        params: { limit }
      });
      return response.data.products || response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Get trending products error:', message);
      throw new Error(message);
    }
  }

  // Obtenir les alternatives d'un produit
  async getAlternatives(productId: string): Promise<Product[]> {
    try {
      const response = await apiClient.get(`/products/${productId}/alternatives`);
      return response.data.alternatives || response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Get alternatives error:', message);
      throw new Error(message);
    }
  }

  // Signaler un problème avec un produit
  async reportProduct(productId: string, reason: string, details?: string): Promise<any> {
    try {
      const response = await apiClient.post(`/products/${productId}/report`, {
        reason,
        details
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Report product error:', message);
      throw new Error(message);
    }
  }

  // Scanner un code-barres et analyser
  async scanAndAnalyze(barcode: string): Promise<AnalysisResponse> {
    return this.analyze({
      barcode,
      method: 'scan'
    });
  }

  // Analyser manuellement avec des ingrédients
  async analyzeManual(productName: string, ingredients: string, category: 'food' | 'cosmetic' | 'detergent'): Promise<AnalysisResponse> {
    return this.analyze({
      productName,
      ingredients,
      category,
      method: 'manual'
    });
  }
}

export const productService = new ProductService();

export default productService;
