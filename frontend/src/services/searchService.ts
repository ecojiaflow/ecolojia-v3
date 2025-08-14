// PATH: src/services/searchService.ts
export type SearchResponse =
  | { data: { products: any[] } }
  | { products: any[] }
  | { hits: any[] }
  | { items: any[] };

const API_BASE = (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') || '';

export async function searchProducts(query: string): Promise<SearchResponse> {
  const q = encodeURIComponent((query || '').trim());
  const url = API_BASE ? ${API_BASE}/api/algolia/search?q= : /api/algolia/search?q=;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || HTTP );
  return (await res.json().catch(() => ({}))) as SearchResponse;
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