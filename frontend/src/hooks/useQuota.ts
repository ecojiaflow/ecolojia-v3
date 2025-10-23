// PATH: frontend/src/hooks/useQuota.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../Contexts/AuthContext';
import quotaService from '../services/quotaService';
import { toast } from 'react-hot-toast';

interface Quotas {
  scansRemaining?: number;
  aiChatsRemaining?: number;
  scansResetDate?: string;
  aiChatsResetDate?: string;
  
  // Format alternatif utilisé par le backend
  scans?: {
    dailyRemaining: number;
    monthlyRemaining: number;
    dailyLimit: number;
    monthlyLimit: number;
    nextReset: string;
  };
  
  aiQuestions?: {
    dailyRemaining: number;
    monthlyRemaining: number;
    dailyLimit: number;
    monthlyLimit: number;
    nextReset: string;
  };
}

interface UseQuotaReturn {
  quotas: Quotas | null;
  isLoading: boolean;
  error: string | null;
  
  // Méthodes attendues par ChatPage
  canUseAI: () => boolean;
  incrementUsage: (type: 'scan' | 'aiQuestion') => Promise<void>;
  
  // Méthodes existantes
  consumeQuota: (type: 'scan' | 'chat') => Promise<void>;
  refreshQuotas: () => Promise<void>;
  canScan: boolean;
  canChat: boolean;
}

export function useQuota(): UseQuotaReturn {
  const { user, isAuthenticated, isPremium } = useAuthContext();
  const [quotas, setQuotas] = useState<Quotas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load quotas on mount or when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadQuotas();
    }
  }, [isAuthenticated, user?.id]);

  const loadQuotas = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Essayer de charger les quotas via le service
      const quotaData = await quotaService.getQuotas();
      setQuotas(quotaData);
    } catch (err) {
      console.error('Error loading quotas:', err);
      
      // Si l'erreur est 404, utiliser les quotas par défaut
      if (err.response?.status === 404) {
        const defaultQuotas = isPremium ? {
          scansRemaining: -1, // Illimité
          aiChatsRemaining: -1, // Illimité
          aiQuestions: {
            dailyRemaining: -1,
            monthlyRemaining: -1,
            dailyLimit: -1,
            monthlyLimit: -1,
            nextReset: ''
          },
          scans: {
            dailyRemaining: -1,
            monthlyRemaining: -1,
            dailyLimit: -1,
            monthlyLimit: -1,
            nextReset: ''
          }
        } : {
          scansRemaining: 30,
          aiChatsRemaining: 5,
          aiQuestions: {
            dailyRemaining: 5,
            monthlyRemaining: 5,
            dailyLimit: 5,
            monthlyLimit: 5,
            nextReset: ''
          },
          scans: {
            dailyRemaining: 30,
            monthlyRemaining: 30,
            dailyLimit: 30,
            monthlyLimit: 30,
            nextReset: ''
          }
        };
        
        setQuotas(defaultQuotas);
      } else {
        setError('Impossible de charger les quotas');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const consumeQuota = useCallback(async (type: 'scan' | 'chat') => {
    if (isPremium) {
      console.log('Premium user - no quota consumption');
      return;
    }

    try {
      setError(null);
      const response = await quotaService.consume(type);
      
      if (response?.quotas) {
        setQuotas(response.quotas);
      }
    } catch (err: any) {
      console.error('Error consuming quota:', err);
      
      // Si le quota est épuisé
      if (err.response?.status === 403) {
        toast.error('Quota épuisé ! Passez à Premium pour continuer.');
      } else {
        toast.error('Erreur lors de la consommation du quota');
      }
      
      throw err;
    }
  }, [isPremium]);

  // Méthode pour ChatPage - vérifie si l'utilisateur peut utiliser l'IA
  const canUseAI = useCallback(() => {
    if (isPremium) return true;
    
    // Vérifier les différents formats de quotas
    if (quotas?.aiQuestions) {
      return quotas.aiQuestions.dailyRemaining > 0 || quotas.aiQuestions.monthlyRemaining > 0;
    }
    
    if (quotas?.aiChatsRemaining !== undefined) {
      return quotas.aiChatsRemaining > 0;
    }
    
    // Par défaut, autoriser si pas de quotas chargés
    return true;
  }, [isPremium, quotas]);

  // Méthode pour ChatPage - incrémenter l'usage
  const incrementUsage = useCallback(async (type: 'scan' | 'aiQuestion') => {
    if (isPremium) {
      console.log('Premium user - no quota consumption');
      return;
    }

    // Mapper aiQuestion vers chat pour le backend
    const mappedType = type === 'aiQuestion' ? 'chat' : type;
    
    try {
      await consumeQuota(mappedType);
    } catch (err) {
      // Propager l'erreur pour que ChatPage puisse la gérer
      throw err;
    }
  }, [isPremium, consumeQuota]);

  const refreshQuotas = useCallback(async () => {
    await loadQuotas();
  }, []);

  // Compute if user can perform actions
  const canScan = isPremium || 
    (quotas?.scansRemaining !== undefined ? quotas.scansRemaining > 0 : true) ||
    (quotas?.scans ? quotas.scans.dailyRemaining > 0 || quotas.scans.monthlyRemaining > 0 : true);
    
  const canChat = canUseAI();

  // For non-authenticated users, return default free quotas
  if (!isAuthenticated) {
    return {
      quotas: {
        scansRemaining: 30,
        aiChatsRemaining: 5,
        aiQuestions: {
          dailyRemaining: 5,
          monthlyRemaining: 5,
          dailyLimit: 5,
          monthlyLimit: 5,
          nextReset: ''
        }
      },
      isLoading: false,
      error: null,
      canUseAI: () => true,
      incrementUsage: async () => {
        console.warn('Cannot consume quota - user not authenticated');
      },
      consumeQuota: async () => {
        console.warn('Cannot consume quota - user not authenticated');
      },
      refreshQuotas: async () => {},
      canScan: true,
      canChat: true
    };
  }

  return {
    quotas,
    isLoading,
    error,
    canUseAI,
    incrementUsage,
    consumeQuota,
    refreshQuotas,
    canScan,
    canChat
  };
}