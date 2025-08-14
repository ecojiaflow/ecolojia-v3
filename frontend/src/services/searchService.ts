// PATH: frontend/src/services/searchService.ts
export type SearchResponse =
  | { data: { products: any[] } }
  | { products: any[] }
  | { hits: any[] }         // cas Algolia
  | { items: any[] };

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') || '';

/**
 * Recherche de produits SANS en-têtes d'authentification.
 * Endpoint aligné: GET /api/algolia/search?q=...
 */
export async function searchProducts(query: string): Promise<SearchResponse> {
  const q = encodeURIComponent((query || '').trim());
  const url = API_BASE
    ? `${API_BASE}/api/algolia/search?q=${q}`
    : `/api/algolia/search?q=${q}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  const json = await res.json().catch(() => ({}));
  return json as SearchResponse;
}

/** Normalise la liste de produits depuis différentes formes de payload */
export function extractProducts(payload: SearchResponse): any[] {
  const anyData: any = payload || {};
  if (Array.isArray(anyData?.data?.products)) return anyData.data.products;
  if (Array.isArray(anyData?.products)) return anyData.products;
  if (Array.isArray(anyData?.hits)) return anyData.hits;
  if (Array.isArray(anyData?.items)) return anyData.items;
  return [];
}

/** ✅ Compatibilité avec l’import existant: export nommé ET export par défaut */
export const searchService = {
  searchProducts,
  extractProducts
};

export default searchService;
