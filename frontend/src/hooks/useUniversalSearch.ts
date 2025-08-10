// hooks/useUniversalSearch.ts
import { useState, useCallback } from 'react';
import { searchService } from '@/services/searchService';
import { algoliaService } from '@/services/algolia/client';

export const useUniversalSearch = () => {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const response = await searchService.search(query, filters);
      setResults(response.hits);
      setTotalResults(response.nbHits);
      setSearchTime(Date.now() - startTime);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotalResults(0);
  }, []);

  return {
    results,
    loading,
    error,
    searchTime,
    totalResults,
    search,
    clearResults
  };
};