// PATH: src/services/searchService.ts
import api from './apiClient';

export type SearchResponse =
  | { data: { products: any[] } }
  | { products: any[] }
  | { hits: any[] }
  | { items: any[] };

export async function searchProducts(query: string): Promise<SearchResponse> {
  const q = encodeURIComponent((query || '').trim());

  // Stratégie résiliente : on essaie plusieurs endpoints connus.
  const candidates = [
    `/api/algolia/search?q=${q}`,
    `/api/products/search?q=${q}`,
    `/api/search?q=${q}`,
  ];

  let lastErr: unknown = null;
  for (const path of candidates) {
    try {
      return await api.get<SearchResponse>(path);
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || '');
      // On enchaîne uniquement si c'est un 404 (endpoint non présent)
      if (!msg.startsWith('HTTP 404')) {
        throw e;
      }
    }
  }
  // Si on arrive ici : tous ont renvoyé 404
  throw (lastErr instanceof Error ? lastErr : new Error('HTTP 404'));
}

export function extractProducts(payload: SearchResponse): any[] {
  const d: any = payload || {};
  if (Array.isArray(d?.data?.products)) return d.data.products;
  if (Array.isArray(d?.products)) return d.products;
  if (Array.isArray(d?.hits)) return d.hits;
  if (Array.isArray(d?.items)) return d.items;
  return [];
}

export const searchService = { searchProducts, extractProducts };
export default searchService;
