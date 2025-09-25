// Adaptation à votre structure existante
import { productService } from '../services/api'; // Utilise votre service existant

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "") || "";

export type SearchResult = {
  items: any[];     // produits pour la recherche
  source: "algolia" | "local";
  total?: number;
};

async function fetchJSON(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Service de recherche unifié qui tente Algolia puis fallback local
 * Compatible avec votre architecture existante
 */
export async function searchProducts(query: string, filters?: {
  category?: string;
  limit?: number;
}): Promise<SearchResult> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return { items: [], source: "local" };

  const { category, limit = 20 } = filters || {};

  // 1) Tentative Algolia via votre backend existant
  try {
    const algoliaUrl = `${API_BASE}/api/algolia/search`;
    const params = new URLSearchParams({ q: trimmedQuery });
    if (category) params.append('category', category);
    if (limit) params.append('limit', limit.toString());

    const data = await fetchJSON(`${algoliaUrl}?${params}`);
    
    // Si Algolia retourne des résultats réels (pas un mock)
    const hits = Array.isArray(data?.hits) ? data.hits : [];
    if (hits.length > 0 && data?.source !== "mock") {
      return { 
        items: hits, 
        source: "algolia",
        total: data?.nbHits || hits.length 
      };
    }
  } catch (error) {
    console.warn('Algolia search failed, falling back to local:', error);
  }

  // 2) Fallback vers votre productService existant
  try {
    // Utilise votre méthode existante
    const response = await productService.searchProducts({
      query: trimmedQuery,
      category,
      limit
    });
    
    // Adaptation selon la structure de votre réponse
    const items = response?.products || response?.items || response || [];
    
    return { 
      items: Array.isArray(items) ? items : [],
      source: "local",
      total: response?.total || items.length
    };
  } catch (error) {
    console.error('Local search failed:', error);
    return { items: [], source: "local" };
  }
}

/**
 * Recherche par code-barre (peut utiliser Algolia + OFF fallback)
 */
export async function searchByBarcode(barcode: string): Promise<any> {
  try {
    // Utilise votre service existant qui gère déjà OFF
    return await productService.getProductByBarcode(barcode);
  } catch (error) {
    console.error('Barcode search failed:', error);
    throw error;
  }
}

/**
 * Obtenir les détails d'un produit par ID
 */
export async function getProductDetails(id: string): Promise<any> {
  try {
    return await productService.getProductById(id);
  } catch (error) {
    console.error('Get product details failed:', error);
    throw error;
  }
}
