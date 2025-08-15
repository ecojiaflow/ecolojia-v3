// PATH: frontend/src/services/searchService.ts
import api from './apiClient';

const SEARCH_PATH =
  (import.meta as any)?.env?.VITE_SEARCH_PATH || '/api/algolia/search';

export type SearchResponse =
  | { data?: { products?: any[]; hits?: any[]; items?: any[] } }
  | { products?: any[]; hits?: any[]; items?: any[] }
  | any;

/**
 * Lance une recherche produits côté backend.
 * La route par défaut est /api/algolia/search?q=...
 * Si ton backend expose une autre route, définis VITE_SEARCH_PATH dans l'env.
 */
export async function searchProducts(query: string, filters?: Record<string, any>): Promise<SearchResponse> {
  const q = encodeURIComponent((query || '').trim());
  const params = new URLSearchParams({ q });
  // On sérialise quelques filtres simples si fournis
  if (filters && typeof filters === 'object') {
    Object.entries(filters).forEach(([k, v]) => {
      if (v == null) return;
      if (Array.isArray(v)) {
        if (v.length) params.append(k, v.join(','));
      } else {
        params.append(k, String(v));
      }
    });
  }
  return await api.get<SearchResponse>(`${SEARCH_PATH}?${params.toString()}`);
}

/**
 * Normalise la réponse quelle que soit la forme renvoyée.
 * Supporte {data:{products}}, {products}, {hits}, {items}.
 */
export function extractProducts(payload: SearchResponse): any[] {
  const d: any = payload || {};
  if (Array.isArray(d?.data?.products)) return d.data.products;
  if (Array.isArray(d?.data?.hits)) return d.data.hits;
  if (Array.isArray(d?.data?.items)) return d.data.items;
  if (Array.isArray(d?.products)) return d.products;
  if (Array.isArray(d?.hits)) return d.hits;
  if (Array.isArray(d?.items)) return d.items;
  return [];
}

const searchService = { searchProducts, extractProducts };
export default searchService;
