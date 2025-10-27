// frontend/src/hooks/useAutocomplete.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

interface Suggestion {
  id?: string;
  name: string;
  brand?: string;
  category: string;
  imageUrl?: string;
  score?: number;
  barcode?: string;
  query?: string;
  icon?: string;
}

interface AutocompleteResult {
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
}

export const useAutocomplete = (query: string, debounceMs: number = 300): AutocompleteResult => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    // Annuler requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer nouveau AbortController
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';
      const response = await axios.get(`${API_URL}/algolia/autocomplete`, {
        params: { q: searchQuery, limit: 5 },
        signal: abortControllerRef.current.signal
      });

      if (response.data.success) {
        setSuggestions(response.data.data.suggestions || []);
      } else {
        setSuggestions([]);
      }
    } catch (err: any) {
      if (err.name !== 'CanceledError') {
        console.error('Autocomplete error:', err);
        setError('Erreur de recherche');
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Si query vide, fetch suggestions populaires
    if (!query || query.trim().length === 0) {
      fetchSuggestions('');
      return;
    }

    // Si query < 2 caractères, ne pas chercher
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce: attendre X ms avant de chercher
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, debounceMs, fetchSuggestions]);

  return { suggestions, loading, error };
};