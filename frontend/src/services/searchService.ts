// PATH: src/services/searchService.ts
import api from './apiClient';

// Types pour la réponse de recherche
export interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  barcode: string;
  imageUrl: string;
  ingredients?: {
    text: string;
  };
  nova_group?: number | null;
  nutriscore_grade?: string | null;
  analysisData?: {
    healthScore: number;
    environmentScore: number;
    socialScore: number;
  };
  scanCount?: number;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Types pour gérer les deux formats de réponse possibles
export type SearchResponse = 
  | {
      success: true;
      data: {
        products: Product[];
        pagination?: {
          total: number;
          page: number;
          pages: number;
          limit: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      };
    }
  | {
      success: true;
      products: Product[];
    };

/**
 * Recherche de produits via l'API
 * Utilise /api/algolia/search en priorité (avec pagination)
 * Fallback sur /api/products/search si nécessaire
 * @param query - Terme de recherche
 * @returns Promise avec les résultats de recherche
 */
export async function searchProducts(query: string): Promise<SearchResponse> {
  const q = encodeURIComponent((query || '').trim());
  
  try {
    // Route principale avec pagination et structure complète
    const response = await api.get<SearchResponse>(`/api/algolia/search?q=${q}`);
    return response;
  } catch (error: any) {
    // Si la route Algolia échoue, essayer la route products
    if (error?.message?.includes('404') || error?.message?.includes('Network')) {
      try {
        const fallbackResponse = await api.get<SearchResponse>(`/api/products/search?q=${q}`);
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('Erreur sur les deux routes de recherche:', fallbackError);
      }
    }
    
    console.error('Erreur lors de la recherche:', error);
    
    // Retourner une réponse vide en cas d'erreur
    return {
      success: true,
      products: []
    };
  }
}

/**
 * Extrait les produits de la réponse de recherche
 * Gère les deux formats de réponse possibles
 * @param payload - Réponse de l'API
 * @returns Tableau de produits
 */
export function extractProducts(payload: SearchResponse | null | undefined): Product[] {
  if (!payload || !payload.success) {
    return [];
  }
  
  // Format 1: { data: { products: [] } }
  if ('data' in payload && payload.data?.products) {
    return Array.isArray(payload.data.products) ? payload.data.products : [];
  }
  
  // Format 2: { products: [] }
  if ('products' in payload) {
    return Array.isArray(payload.products) ? payload.products : [];
  }
  
  return [];
}

/**
 * Recherche de produits avec gestion de la pagination
 * @param query - Terme de recherche
 * @param page - Numéro de page (0-indexé)
 * @param limit - Nombre d'éléments par page
 */
export async function searchProductsPaginated(
  query: string, 
  page: number = 0, 
  limit: number = 20
): Promise<SearchResponse> {
  const q = encodeURIComponent((query || '').trim());
  
  try {
    const response = await api.get<SearchResponse>(
      `/api/algolia/search?q=${q}&page=${page}&limit=${limit}`
    );
    return response;
  } catch (error: any) {
    console.error('Erreur lors de la recherche paginée:', error);
    return {
      success: false,
      data: {
        products: []
      }
    };
  }
}

// Export du service
export const searchService = { 
  searchProducts, 
  searchProductsPaginated,
  extractProducts 
};

export default searchService;