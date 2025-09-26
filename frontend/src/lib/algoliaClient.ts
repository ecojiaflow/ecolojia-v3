export type FacetMap = Record<string, Record<string, number>>;

export interface SearchParams {
  query: string;
  page?: number;
  hitsPerPage?: number;
  facetFilters?: (string | string[])[];
  numericFilters?: string[];
  fetchFacetsOnly?: boolean;
}

export interface SearchResponse<T = any> {
  hits: T[];
  page: number;
  nbPages: number;
  nbHits: number;
  facets?: FacetMap;
  processingTimeMS: number;
}

const APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID as string;
const SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string;
const INDEX = (import.meta.env.VITE_ALGOLIA_INDEX as string) || "products";
const ALGOLIA_DSN = `${APP_ID}-dsn.algolia.net`;

function headers() {
  return {
    "X-Algolia-Application-Id": APP_ID,
    "X-Algolia-API-Key": SEARCH_KEY,
    "Content-Type": "application/json",
  };
}

export async function searchAlgolia<T = any>(params: SearchParams): Promise<SearchResponse<T>> {
  const {
    query,
    page = 0,
    hitsPerPage = 20,
    facetFilters,
    numericFilters,
    fetchFacetsOnly = false,
  } = params;

  const body: any = {
    query,
    page,
    hitsPerPage: fetchFacetsOnly ? 0 : hitsPerPage,
    facets: ["brand","category"],
  };

  if (facetFilters?.length) body.facetFilters = facetFilters;
  if (numericFilters?.length) body.numericFilters = numericFilters;

  const res = await fetch(`https://${ALGOLIA_DSN}/1/indexes/${encodeURIComponent(INDEX)}/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Algolia search failed: ${res.status} ${await res.text()}`);
  return res.json();
}
