// PATH: src/services/searchService.ts
import api from './apiClient';

export type SearchResponse =
  | { data: { products: any[] } }
  | { products: any[] }
  | { hits: any[] }
  | { items: any[] };

export async function searchProducts(query: string): Promise<SearchResponse> {
  const q = encodeURIComponent((query || '').trim());
  return await api.get<SearchResponse>(`/api/algolia/search?q=${q}`);
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
