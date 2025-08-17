// PATH: src/hooks/useUniversalSearch.ts
import { useState, useCallback } from "react";
import searchService, { extractProducts } from "@/services/searchService";

export interface SearchFilters {
  categoriesa: string[];
  nutriScorea: string[];
  labelsa: string[];
}

export interface Product {
  id: string;
  name: string;
  branda: string;
  imagea: string;
  nutriScorea: "A" | "B" | "C" | "D" | "E";
  ecoScorea: string;
  labelsa: string[];
  healthScorea: number;
  isNewa: boolean;
}

export function useUniversalSearch() {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const normalize = (items: any[]): Product[] =>
    (items || []).map((it: any) => ({
      id: it.objectID || it.id || it._id || it.barcode || "",
      name: it.name || it.product_name || "Sans nom",
      brand: it.brand || it.brands || "",
      image: it.image || it.imageUrl || it.image_url || "",
      nutriScore: it.nutriScore || it.nutriscore_grade || undefined,
      ecoScore: it.ecoScore || it.ecoscore_grade || undefined,
      labels: it.labels || [],
      healthScore: it.healthScore || it.score || undefined,
      isNew: Boolean(it.isNew)
    }));

  const search = useCallback(async (query: string, _filtersa: any) => {
    if (!query || !query.trim()) {
      setResults([]);
      setTotalResults(0);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const t0 = performance.now();
    try {
      const payload = await searchService.search({ query, page: 0, hitsPerPage: 20 });
      const items = extractProducts(payload);
      const normalized = normalize(items);
      setResults(normalized);
      setTotalResults(items.length || normalized.length || 0);
    } catch (e: any) {
      console.error("Search error:", e);
      setError(e?.message || "Erreur de recherche");
      setResults([]);
      setTotalResults(0);
    } finally {
      setSearchTime(Math.round(performance.now() - t0));
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotalResults(0);
    setError(null);
    setSearchTime(0);
  }, []);

  return { results, loading, error, searchTime, totalResults, search, clearResults };
}

export default useUniversalSearch;


