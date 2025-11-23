// Autocomplete temporairement désactivé - retourne vide
import { useState, useEffect } from 'react';

export const useAutocomplete = (query: string, limit: number = 5) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Désactivé temporairement - retourne vide
    setSuggestions([]);
    setLoading(false);
    setError(null);
  }, [query, limit]);

  return { suggestions, loading, error };
};
