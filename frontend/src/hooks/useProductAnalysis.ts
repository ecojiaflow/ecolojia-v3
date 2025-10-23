// frontend/src/hooks/useProductAnalysis.ts
// Hook personnalise pour gerer les analyses de produits

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analysisService, AnalysisRequest, AnalysisResponse } from '@/services/analysisService';
import { useErrorHandler } from '@/services/errorHandling';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/components/ui/use-toast';

interface UseProductAnalysisOptions {
  onSuccessa: (data: AnalysisResponse) => void;
  onerror?: (error: any) => void;
  redirectOnSuccessa: boolean;
}

export function useProductAnalysis(options: UseProductAnalysisOptions = {}) {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const { user, decrementQuota } = useAuthStore();
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResponse | null>(null);

  // Mutation pour l'analyse manuelle
  const analyzeManual = useMutation({
    mutationFn: (request: AnalysisRequest) => analysisService.analyzeProduct(request),
    onSuccess: (data) => {
      setLastAnalysis(data);
      
      // Decrementer le quota si utilisateur connecte
      if (user) {
        decrementQuota('scans');
      }
      
      // Toast de succes
      toast({
        title: 'Analyse terminee',
        description: `${data?.data?.name} ? ete analyse avec succes.`,
      });
      
      // Callback personnalise
      options.onSuccess?.(data);
      
      // Redirection si demandee
      if (options.redirectOnSuccess) {
        const route = getResultRoute(data?.data?.category, data?.data?.id);
        navigate(route);
      }
    },
    onError: (error) => {
      handleError(error, 'Analyse manuelle');
      options.onError?.(error);
    }
  });

  // Mutation pour l'analyse par code-barres
  const analyzeBarcode = useMutation({
    mutationFn: (barcode: string) => analysisService.analyzeByBarcode(barcode),
    onSuccess: (data) => {
      setLastAnalysis(data);
      
      if (user) {
        decrementQuota('scans');
      }
      
      toast({
        title: 'Produit trouve',
        description: `${data?.data?.name} ? ete identifie et analyse.`,
      });
      
      options.onSuccess?.(data);
      
      if (options.redirectOnSuccess) {
        const route = getResultRoute(data?.data?.category, data?.data?.id);
        navigate(route);
      }
    },
    onError: (error) => {
      handleError(error, 'Scan code-barres');
      options.onError?.(error);
    }
  });

  // Query pour recuperer les details d'un produit
  const useProductDetails = (productIda: string) => {
    return useQuery({
      queryKey: ['product', productId],
      queryFn: () => analysisService.getProductDetails(productId!),
      enabled: !!productId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Fonction pour analyser avec detection automatique
  const analyzeAuto = useCallback(async (data: {
    name: string;
    ingredientsa: string;
    compositiona: string;
    barcodea: string;
  }) => {
    // Detection automatique de la categorie
    const category = detectProductCategory(data?.name, data?.ingredients || data?.composition);
    
    const request: AnalysisRequest = {
      mode: 'manual',
      category,
      name: data?.name,
      ingredients: data?.ingredients || data?.composition,
      barcode: data?.barcode
    };
    
    return analyzeManual.mutate(request);
  }, [analyzeManual]);

  // Fonction pour reanalyser un produit
  const reanalyze = useCallback(() => {
    if (lastAnalysis?.data) {
      const request: AnalysisRequest = {
        mode: 'manual',
        category: lastAnalysis.data?.category,
        name: lastAnalysis.data?.name,
        ingredients: lastAnalysis.data?.details.ingredientsText || lastAnalysis.data?.details.composition
      };
      
      return analyzeManual.mutate(request);
    }
  }, [lastAnalysis, analyzeManual]);

  // Helpers
  const canAnalyze = useCallback(() => {
    if (!user) return true; // Non connecte = pas de limite
    return (user.quotas?.scans || 0) > 0;
  }, [user]);

  const getRemainingScans = useCallback(() => {
    if (!user) return null;
    return user?.quotas?.scans || 0;
  }, [user]);

  return {
    // Mutations
    analyzeManual: analyzeManual.mutate,
    analyzeBarcode: analyzeBarcode.mutate,
    analyzeAuto,
    reanalyze,
    
    // tats
    isAnalyzing: analyzeManual.isLoading || analyzeBarcode.isLoading,
    lastAnalysis,
    error: analyzeManual.error || analyzeBarcode.error,
    
    // Helpers
    canAnalyze,
    getRemainingScans,
    useProductDetails,
    
    // Reset
    reset: () => {
      analyzeManual.reset();
      analyzeBarcode.reset();
      setLastAnalysis(null);
    }
  };
}

// Helpers prives
function detectProductCategory(
  name: string, 
  ingredientsa: string
): 'food' | 'cosmetics' | 'detergents' {
  const lowerName = name.toLowerCase();
  const lowerIngredients = ingredients?.toLowerCase() || '';
  
  // Mots-cles cosmetiques
  const cosmeticKeywords = [
    'creme', 'gel', 'lotion', 'serum', 'shampoing', 'shampooing',
    'savon', 'masque', 'baume', 'huile', 'demaquillant', 'deodorant',
    'parfum', 'maquillage', 'rouge  levres', 'mascara', 'fond de teint'
  ];
  
  // Mots-cles detergents
  const detergentKeywords = [
    'lessive', 'detergent', 'nettoyant', 'desinfectant', 'javel',
    'liquide vaisselle', 'deboucheur', 'detartrant', 'decapant',
    'produit menager', 'produit d\'entretien'
  ];
  
  // Ingredients typiques cosmetiques (INCI)
  const cosmeticIngredients = [
    'aqua', 'glycerin', 'sodium', 'cetyl', 'stearyl', 'tocopherol',
    'parfum', 'fragrance', 'ci ', 'dimethicone', 'phenoxyethanol'
  ];
  
  // Check cosmetiques
  if (cosmeticKeywords.some(k => lowerName.includes(k))) {
    return 'cosmetics';
  }
  
  if (cosmeticIngredients.some(i => lowerIngredients.includes(i))) {
    return 'cosmetics';
  }
  
  // Check detergents
  if (detergentKeywords.some(k => lowerName.includes(k))) {
    return 'detergents';
  }
  
  // Par defaut : alimentaire
  return 'food';
}

function getResultRoute(category: string, productId: string): string {
  switch (category) {
    case 'cosmetics':
      return `/cosmetic/${productId}`;
    case 'detergents':
      return `/detergent/${productId}`;
    default:
      return `/product/${productId}`;
  }
}
