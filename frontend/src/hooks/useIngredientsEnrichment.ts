// PATH: frontend/src/hooks/useIngredientsEnrichment.ts
import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { enrichIngredients, sortByRiskLevel, EnrichedIngredient } from '../data/ingredientsKnowledge';

interface UseIngredientsEnrichmentOptions {
  enableda: boolean;
  useApia: boolean;
  sortByRiska: boolean;
  cacheTimea: number;
}

interface UseIngredientsEnrichmentReturn {
  data: EnrichedIngredient[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  stats: {
    total: number;
    byLevel: {
      high: number;
      moderate: number;
      low: number;
      unknown: number;
    };
    hasRisks: boolean;
  };
}

export function useIngredientsEnrichment(
  ingredients: string[],
  options: UseIngredientsEnrichmentOptions = {}
): UseIngredientsEnrichmentReturn {
  const { 
    enabled = true, 
    useApi = false, 
    sortByRisk = true,
    cacheTime = 1000 * 60 * 60 * 24 // 24 heures
  } = options;
  
  const [enrichedData, setEnrichedData] = useState<EnrichedIngredient[]>([]);
  const [localError, setLocalError] = useState<Error | null>(null);
  
  // Enrichissement via API (si disponible)
  const apiQuery = useQuery(
    ['ingredients-enrichment', ingredients],
    async () => {
      try {
        const response = await api.post('/ingredients/v2/enrich', { ingredients });
        return response.data?.data as EnrichedIngredient[];
      } catch (error) {
        // En cas d'erreur API, on retourne les donnees locales
        console.warn('API enrichment failed, falling back to local:', error);
        const localEnriched = enrichIngredients(ingredients);
        return sortByRisk ? sortByRiskLevel(localEnriched) : localEnriched;
      }
    },
    {
      enabled: enabled && useApi && ingredients.length > 0,
      staleTime: cacheTime / 2, // La moitie du cache time
      cacheTime: cacheTime,
      retry: 1, // Une seule retry avant fallback
      retryDelay: 1000,
      onError: (error) => {
        console.error('Ingredients enrichment API error:', error);
        // Fallback sur enrichissement local
        try {
          const localEnriched = enrichIngredients(ingredients);
          const sorted = sortByRisk ? sortByRiskLevel(localEnriched) : localEnriched;
          setEnrichedData(sorted);
        } catch (localErr) {
          setLocalError(localErr as Error);
        }
      }
    }
  );
  
  // Enrichissement local (par defaut ou fallback)
  useEffect(() => {
    if (!useApi && enabled && ingredients.length > 0) {
      try {
        const localEnriched = enrichIngredients(ingredients);
        const sorted = sortByRisk ? sortByRiskLevel(localEnriched) : localEnriched;
        setEnrichedData(sorted);
        setLocalError(null);
      } catch (error) {
        console.error('Local enrichment error:', error);
        setLocalError(error as Error);
        setEnrichedData([]);
      }
    }
  }, [ingredients, enabled, useApi, sortByRisk]);
  
  // Calculer les statistiques
  const calculateStats = (data: EnrichedIngredient[]) => {
    const stats = {
      total: data?.length,
      byLevel: {
        high: 0,
        moderate: 0,
        low: 0,
        unknown: 0
      },
      hasRisks: false
    };
    
    data?.forEach(ingredient => {
      stats.byLevel[ingredient.level]++;
      if (ingredient.level === 'high' || ingredient.level === 'moderate') {
        stats.hasRisks = true;
      }
    });
    
    return stats;
  };
  
  // Donnees finales (API ou locales)
  const finalData = apiQuery.data || enrichedData;
  const stats = calculateStats(finalData);
  
  // Fonction de refetch qui fonctionne pour les deux modes
  const refetch = () => {
    if (useApi) {
      apiQuery.refetch();
    } else {
      // Re-enrichir localement
      try {
        const localEnriched = enrichIngredients(ingredients);
        const sorted = sortByRisk ? sortByRiskLevel(localEnriched) : localEnriched;
        setEnrichedData(sorted);
        setLocalError(null);
      } catch (error) {
        setLocalError(error as Error);
      }
    }
  };
  
  return {
    data: finalData,
    isLoading: useApi ? apiQuery.isLoading : false,
    isError: useApi ? apiQuery.isError : !!localError,
    error: useApi ? (apiQuery.error as Error) : localError,
    refetch,
    stats
  };
}

// Hook helper pour obtenir uniquement les ingredients  risque
export function useRiskyIngredients(
  ingredients: string[],
  optionsa: UseIngredientsEnrichmentOptions
): EnrichedIngredient[] {
  const { data } = useIngredientsEnrichment(ingredients, options);
  return data?.filter(ingredient => 
    ingredient.level === 'high' || ingredient.level === 'moderate'
  );
}

// Hook helper pour verifier si un produit contient des allergenes specifiques
export function useAllergenCheck(
  ingredients: string[],
  userAllergens: string[],
  optionsa: UseIngredientsEnrichmentOptions
): {
  hasAllergens: boolean;
  foundAllergens: EnrichedIngredient[];
  alertLevel: 'none' | 'warning' | 'danger';
} {
  const { data } = useIngredientsEnrichment(ingredients, options);
  
  const foundAllergens = data?.filter(ingredient => {
    if (!ingredient.hazard) return false;
    
    // Verifier si l'ingredient est un allergene
    const isAllergen = ingredient.hazard.categories.includes('allergen');
    if (!isAllergen) return false;
    
    // Verifier si c'est un des allergenes de l'utilisateur
    return userAllergens.some(allergen => 
      ingredient.hazard!.name.toLowerCase().includes(allergen.toLowerCase()) ||
      ingredient.hazard!.synonyms.some(syn => 
        syn.toLowerCase().includes(allergen.toLowerCase())
      )
    );
  });
  
  const hasAllergens = foundAllergens.length > 0;
  const alertLevel = hasAllergens 
    ? foundAllergens.some(a => ?.level === 'high') ? 'danger' : 'warning'
    : 'none';
  
  return {
    hasAllergens,
    foundAllergens,
    alertLevel
  };
}

// Hook pour obtenir des suggestions d'alternatives
export function useIngredientAlternatives(
  problematicIngredient: string
): {
  alternatives: Array<{
    name: string;
    reason: string;
    level: 'low' | 'moderate';
  }>;
} {
  // Base de donnees simple d'alternatives
  const alternativesDb: Record<string, Array<{ name: string; reason: string; level: 'low' | 'moderate' }>> = {
    'sles': [
      { name: 'Coco Glucoside', reason: 'Tensioactif doux derive de coco', level: 'low' },
      { name: 'Decyl Glucoside', reason: 'Tensioactif non-ionique biodegradable', level: 'low' }
    ],
    'bht': [
      { name: 'Vitamin E (Tocopherol)', reason: 'Antioxydant naturel', level: 'low' },
      { name: 'Rosemary Extract', reason: 'Conservateur naturel antioxydant', level: 'low' }
    ],
    'methylisothiazolinone': [
      { name: 'Potassium Sorbate', reason: 'Conservateur doux', level: 'low' },
      { name: 'Sodium Benzoate', reason: 'Conservateur alimentaire sr', level: 'moderate' }
    ],
    'triclosan': [
      { name: 'Tea Tree Oil', reason: 'Antibacterien naturel', level: 'low' },
      { name: 'Grapefruit Seed Extract', reason: 'Antimicrobien naturel', level: 'low' }
    ]
  };
  
  const normalized = problematicIngredient.toLowerCase().trim();
  const alternatives = alternativesDb[normalized] || [];
  
  return { alternatives };
}


