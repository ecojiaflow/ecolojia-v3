// ═══════════════════════════════════════════════════════════════════
// ECOLOJIA V3.1 - HOOK useAIQuery
// ═══════════════════════════════════════════════════════════════════
//
// OBJECTIF : Recherche intelligente IA sur produits RÉELS de la base
// VISION : L'IA comprend langage naturel et cherche dans 37k+ produits
// USAGE : const { results, loading, query } = useAIQuery()
//
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { ENV } from '../env';

// ═══════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════

export interface AIQueryProduct {
  _id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  barcode?: string;
  categoryType: 'food' | 'cosmetics' | 'detergents';
  scores: {
    overallScore: number;
    healthScore?: number;
    ecoScore?: string;
  };
  labels?: string[];
  subcategory?: string;
  tags?: string[];
}

export interface AIQueryMetadata {
  source: 'algolia' | 'mongodb' | 'fallback';
  executionTime: number;
  cached: boolean;
  version: string;
}

export interface AIQueryResponse {
  success: boolean;
  intent: 'product_search' | 'education' | 'comparison' | 'alternative_request' | 'general';
  confidence: number;
  resultsCount: number;
  results: AIQueryProduct[];
  explanation: string;
  metadata: AIQueryMetadata;
  suggestions?: string[];
}

export interface UseAIQueryOptions {
  autoFetch?: boolean;
  maxResults?: number;
  userContext?: {
    diet?: string;
    allergens?: string[];
    preferences?: string[];
  };
}

export interface UseAIQueryReturn {
  // État
  results: AIQueryProduct[];
  loading: boolean;
  error: Error | null;
  
  // Métadonnées de la requête
  intent: AIQueryResponse['intent'] | null;
  confidence: number | null;
  explanation: string | null;
  metadata: AIQueryMetadata | null;
  suggestions: string[];
  
  // Actions
  query: (searchQuery: string) => Promise<void>;
  clear: () => void;
  
  // Helpers
  hasResults: boolean;
  isFromCache: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// HOOK useAIQuery
// ═══════════════════════════════════════════════════════════════════

export function useAIQuery(options: UseAIQueryOptions = {}): UseAIQueryReturn {
  const {
    maxResults = 20,
    userContext = {}
  } = options;

  // ───────────────────────────────────────────────────────────────
  // ÉTAT LOCAL
  // ───────────────────────────────────────────────────────────────

  const [state, setState] = useState<{
    results: AIQueryProduct[];
    loading: boolean;
    error: Error | null;
    intent: AIQueryResponse['intent'] | null;
    confidence: number | null;
    explanation: string | null;
    metadata: AIQueryMetadata | null;
    suggestions: string[];
  }>({
    results: [],
    loading: false,
    error: null,
    intent: null,
    confidence: null,
    explanation: null,
    metadata: null,
    suggestions: []
  });

  // ───────────────────────────────────────────────────────────────
  // FONCTION QUERY (recherche IA sur base réelle)
  // ───────────────────────────────────────────────────────────────

  const query = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      console.log('[useAIQuery] Query vide, annulation');
      return;
    }

    console.log(`[useAIQuery] 🔍 Recherche IA: "${searchQuery}"`);

    // Début chargement
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      // Appel API /api/ai/query (recherche intelligente sur base)
      const response = await fetch(`${ENV.API_URL}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          userContext: {
            ...userContext,
            maxResults
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data: AIQueryResponse = await response.json();

      console.log(`[useAIQuery] ✅ ${data.resultsCount} produits trouvés`);
      console.log(`[useAIQuery] Intent: ${data.intent} (confiance: ${data.confidence})`);
      console.log(`[useAIQuery] Source: ${data.metadata.source} | Cache: ${data.metadata.cached}`);

      // Mise à jour état avec réponse complète
      setState({
        results: data.results || [],
        loading: false,
        error: null,
        intent: data.intent,
        confidence: data.confidence,
        explanation: data.explanation,
        metadata: data.metadata,
        suggestions: data.suggestions || []
      });

    } catch (err) {
      console.error('[useAIQuery] ❌ Erreur:', err);

      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err : new Error('Erreur de recherche IA')
      }));
    }
  }, [maxResults, userContext]);

  // ───────────────────────────────────────────────────────────────
  // FONCTION CLEAR (reset)
  // ───────────────────────────────────────────────────────────────

  const clear = useCallback(() => {
    setState({
      results: [],
      loading: false,
      error: null,
      intent: null,
      confidence: null,
      explanation: null,
      metadata: null,
      suggestions: []
    });
  }, []);

  // ───────────────────────────────────────────────────────────────
  // RETOUR
  // ───────────────────────────────────────────────────────────────

  return {
    // État
    results: state.results,
    loading: state.loading,
    error: state.error,
    
    // Métadonnées
    intent: state.intent,
    confidence: state.confidence,
    explanation: state.explanation,
    metadata: state.metadata,
    suggestions: state.suggestions,
    
    // Actions
    query,
    clear,
    
    // Helpers
    hasResults: state.results.length > 0,
    isFromCache: state.metadata?.cached || false
  };
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════

export default useAIQuery;
