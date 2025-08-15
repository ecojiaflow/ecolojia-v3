// PATH: frontend/src/hooks/useUniversalSearch.ts
import { useCallback, useRef, useState } from 'react';
import searchService, { SearchFilters } from '@/services/searchService';

interface UseSearchReturn {
  results: any[];
  loading: boolean;
  error: string | null;
  searchTime: number;
  totalResults: number;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  clearResults: () => void;
}

export function useUniversalSearch(): UseSearchReturn {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const lastQuery = useRef<string>('');

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setSearchTime(0);
    setTotalResults(0);
  }, []);

  const search = useCallback(async (query: string, filters: SearchFilters = {}) => {
    const q = (query || '').trim();
    lastQuery.current = q;
    if (!q) {
      clearResults();
      return;
    }

    setLoading(true);
    setError(null);

    const t0 = performance.now();
    const resp = await searchService.universalSearch(q, filters);
    const t1 = performance.now();

    if (lastQuery.current !== q) {
      // une nouvelle recherche a commencé entre-temps → on ignore
      setLoading(false);
      return;
    }

    if (!resp.success || !resp.data) {
      setError(resp.error || 'Erreur de recherche');
      setResults([]);
      setSearchTime(Math.round(t1 - t0));
      setTotalResults(0);
      setLoading(false);
      return;
    }

    setResults(resp.data.results || []);
    setTotalResults(resp.data.total || (resp.data.results?.length ?? 0));
    setSearchTime(resp.data.timeMS || Math.round(t1 - t0));
    setLoading(false);
  }, [clearResults]);

  return { results, loading, error, searchTime, totalResults, search, clearResults };
}
