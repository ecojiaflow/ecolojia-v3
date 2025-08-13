// src/services/searchService.ts
import { API_CONFIG, buildApiUrl } from '../config/api.config';

export interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  barcode: string;
  imageUrl?: string;
  ingredients?: { text: string };
  nova_group?: number;
  nutriscore_grade?: string;
  analysisData?: {
    healthScore: number;
    environmentScore: number;
  };
}

export interface SearchResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  };
}

export const searchProducts = async (
  query: string,
  options: { category?: string; page?: number; limit?: number } = {}
): Promise<SearchResponse> => {
  try {
    const params = new URLSearchParams({
      q: query || '',
      ...(options.category && { category: options.category }),
      page: String(options.page || 0),
      limit: String(options.limit || 20)
    });

    const url = buildApiUrl(API_CONFIG.ENDPOINTS.ALGOLIA.SEARCH) + '?' + params;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.products) {
      return {
        success: false,
        data: {
          products: [],
          pagination: { total: 0, page: 0, pages: 0, limit: 20 }
        }
      };
    }

    return data;
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      data: {
        products: [],
        pagination: { total: 0, page: 0, pages: 0, limit: 20 }
      }
    };
  }
};

// Export nommé pour useUniversalSearch
export const searchService = {
  searchProducts,
  // Ajouter d'autres méthodes si nécessaire
  searchByBarcode: async (barcode: string) => {
    return searchProducts(barcode);
  },
  searchByCategory: async (category: string, query: string = '') => {
    return searchProducts(query, { category });
  }
};

// Export par défaut aussi pour compatibilité
export default searchService;
