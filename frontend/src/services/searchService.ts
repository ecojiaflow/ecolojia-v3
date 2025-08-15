// PATH: frontend/src/services/searchService.ts
import api, { ApiResponse } from './apiClient';

export interface SearchFilters {
  categories?: string[];
  nutriScore?: string[];
  labels?: string[];
}

export interface RawSearchPayload {
  // tolérant: différentes formes possibles
  data?: { products?: any[]; hits?: any[]; items?: any[]; total?: number; timeMS?: number };
  products?: any[];
  hits?: any[];
  items?: any[];
  total?: number;
  nbHits?: number;
  timeMS?: number;
}

export interface NormalizedSearch {
  results: any[];
  total: number;
  timeMS: number;
}

function extract(payload: RawSearchPayload): NormalizedSearch {
  const d: any = payload || {};
  const nested = d.data || {};
  const results =
    nested.products || nested.hits || nested.items ||
    d.products || d.hits || d.items || [];
  const total = d.total || nested.total || d.nbHits || results.length || 0;
  const timeMS = d.timeMS || nested.timeMS || 0;
  return { results, total, timeMS };
}

function toQuery(params: Record<string, string | string[] | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => q.append(k, x));
    else q.set(k, v);
  }
  return q.toString();
}

// 1) Essaye Algolia: /api/algolia/search?q=...
// 2) Sinon fallback Products: /api/products/search?q=...
export async function universalSearch(query: string, filters: SearchFilters = {}): Promise<{
  success: boolean;
  data?: NormalizedSearch;
  error?: string;
}> {
  const baseParams: Record<string, any> = { q: (query || '').trim() };
  if (filters.categories?.length) baseParams.category = filters.categories;
  if (filters.nutriScore?.length) baseParams.nutriScore = filters.nutriScore;
  if (filters.labels?.length) baseParams.label = filters.labels;

  // Try Algolia
  const qs = toQuery(baseParams);
  let res: ApiResponse<RawSearchPayload> = await api.get(`/api/algolia/search?${qs}`);

  if (!res.success) {
    // Fallback Products
    res = await api.get(`/api/products/search?${qs}`);
  }

  if (!res.success) {
    return { success: false, error: res.error || 'SEARCH_FAILED' };
  }

  const normalized = extract(res.data as RawSearchPayload);
  return { success: true, data: normalized };
}

export default { universalSearch };
