// PATH: src/services/searchService.ts
export type SearchResponse =
  | { data: { products: any[] } }
  | { products: any[] }
  | { hits: any[] }
  | { items: any[] };

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, "") || "";

/**
 * GET /api/algolia/search?q=<query>
 * Passe via le proxy Netlify en prod, ou via VITE_API_URL si défini.
 */
export async function searchProducts(query: string): Promise<SearchResponse> {
  const q = encodeURIComponent((query || "").trim());
  const url = API_BASE
    ? `${API_BASE}/api/algolia/search?q=${q}`
    : `/api/algolia/search?q=${q}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const json = await res.json().catch(() => ({}));
  return json as SearchResponse;
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