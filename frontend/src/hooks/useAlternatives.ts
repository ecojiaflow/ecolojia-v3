// ═══════════════════════════════════════════════════════════════════
// ECOLOJIA V3.2 - HOOK useAlternatives
// ═══════════════════════════════════════════════════════════════════
// 
// OBJECTIF : Connexion au backend alternatives avec gestion d'états
// USAGE : const { alternatives, loading, error } = useAlternatives({ productId })
//
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { findAlternativesByProductId } from '../services/alternativesService';

// ═══════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════

export interface Alternative {
  _id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  barcode?: string;
  scores: {
    overallScore: number;
    breakdown?: Record<string, any>;
  };
  categoryType: 'food' | 'cosmetics' | 'detergents';
  labels?: string[];
  improvements?: string[];
  matchScore?: number;
  reasons?: string[];
}

export interface AlternativesMetrics {
  duration: number;
  dbHits: number;
  aiHits: number;
  cached: boolean;
}

export interface UseAlternativesOptions {
  productId: string | null | undefined;
  maxResults?: number;
  userPreferences?: {
    allergens?: string[];
    labels?: string[];
    maxPrice?: number;
  };
  enabled?: boolean; // Pour lazy loading
}

export interface UseAlternativesReturn {
  alternatives: Alternative[];
  loading: boolean;
  error: Error | null;
  source: 'db_strict' | 'db_relaxed' | 'ai' | 'none' | null;
  metrics: AlternativesMetrics | null;
  originalProduct: {
    id: string;
    name: string;
    score: number;
  } | null;
  refetch: () => Promise<void>;
  hasAlternatives: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// HOOK useAlternatives
// ═══════════════════════════════════════════════════════════════════

export function useAlternatives(
  options: UseAlternativesOptions
): UseAlternativesReturn {
  const { 
    productId, 
    maxResults = 5, 
    userPreferences, 
    enabled = true 
  } = options;

  // ───────────────────────────────────────────────────────────────
  // ÉTAT LOCAL
  // ───────────────────────────────────────────────────────────────
  
  const [state, setState] = useState<{
    alternatives: Alternative[];
    loading: boolean;
    error: Error | null;
    source: 'db_strict' | 'db_relaxed' | 'ai' | 'none' | null;
    metrics: AlternativesMetrics | null;
    originalProduct: {
      id: string;
      name: string;
      score: number;
    } | null;
  }>({
    alternatives: [],
    loading: false,
    error: null,
    source: null,
    metrics: null,
    originalProduct: null
  });

  // ───────────────────────────────────────────────────────────────
  // FONCTION FETCH ALTERNATIVES
  // ───────────────────────────────────────────────────────────────
  
  const fetchAlternatives = useCallback(async () => {
    // Vérifier conditions de fetch
    if (!enabled || !productId) {
      console.log('[useAlternatives] Fetch désactivé ou productId manquant');
      return;
    }

    console.log(`[useAlternatives] Fetching alternatives pour ${productId}`);

    // Début chargement
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }));

    try {
// Appel service (qui appelle /api/alternatives/:productId)
      const response = await findAlternativesByProductId(productId);

      console.log(`[useAlternatives] ✅ ${response.alternatives?.length || 0} alternatives reçues`);
      console.log(`[useAlternatives] Source: ${response.source}`);

      // Mise à jour état avec réponse complète
      setState({
        alternatives: response.alternatives || [],
        loading: false,
        error: null,
        source: response.source || 'none',
        metrics: response.metrics || null,
        originalProduct: response.original || null
      });

    } catch (err) {
      console.error('[useAlternatives] ❌ Erreur:', err);

      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err : new Error('Erreur inconnue')
      }));
    }
  }, [productId, maxResults, userPreferences, enabled]);

  // ───────────────────────────────────────────────────────────────
  // EFFET : Fetch automatique au montage ou changement productId
  // ───────────────────────────────────────────────────────────────
  
  useEffect(() => {
    fetchAlternatives();
  }, [fetchAlternatives]);

  // ───────────────────────────────────────────────────────────────
  // RETOUR
  // ───────────────────────────────────────────────────────────────
  
  return {
    ...state,
    refetch: fetchAlternatives,
    hasAlternatives: state.alternatives.length > 0
  };
}

// ═══════════════════════════════════════════════════════════════════
// HOOK UTILITAIRE : useAlternativesLazy (fetch manuel)
// ═══════════════════════════════════════════════════════════════════

export function useAlternativesLazy() {
  const [state, setState] = useState<UseAlternativesReturn>({
    alternatives: [],
    loading: false,
    error: null,
    source: null,
    metrics: null,
    originalProduct: null,
    refetch: async () => {},
    hasAlternatives: false
  });

  const fetchAlternatives = useCallback(async (
    productId: string,
    options?: Omit<UseAlternativesOptions, 'productId'>
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await findAlternativesByProductId(productId);

      setState({
        alternatives: response.alternatives || [],
        loading: false,
        error: null,
        source: response.source || 'none',
        metrics: response.metrics || null,
        originalProduct: response.original || null,
        refetch: () => fetchAlternatives(productId, options),
        hasAlternatives: (response.alternatives?.length || 0) > 0
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err : new Error('Erreur inconnue')
      }));
    }
  }, []);

  return {
    ...state,
    fetch: fetchAlternatives
  };
}
