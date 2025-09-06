// PATH: frontend/src/hooks/useQuota.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../Contexts/AuthContext';
import { mockService } from '../services/mockService';
import { ENV } from '../env';
import { apiClient } from '../services/apiClient';

interface Quotas {
  scansRemaining: number;
  aiChatsRemaining: number;
  scansResetDate?: string;
  aiChatsResetDate?: string;
}

interface UseQuotaReturn {
  quotas: Quotas | null;
  isLoading: boolean;
  error: string | null;
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

      if (ENV.MOCK_MODE) {
        // Use mock service
        const mockQuotas = await mockService.quota.getQuotas();
        setQuotas(mockQuotas);
      } else {
        // Use real API
        const response = await apiClient.get('/user/quotas');
        setQuotas(response.data);
      }
    } catch (err) {
      console.error('Error loading quotas:', err);
      setError('Impossible de charger les quotas');
      
      // Fallback to user quotas if available
      if (user?.quotas) {
        setQuotas(user.quotas);
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

      if (ENV.MOCK_MODE) {
        // Use mock service
        const updatedQuotas = await mockService.quota.updateQuota(type);
        setQuotas(updatedQuotas);
      } else {
        // Use real API
        const response = await apiClient.post('/user/consume-quota', { type });
        setQuotas(response.data.quotas);
      }
    } catch (err) {
      console.error('Error consuming quota:', err);
      setError('Erreur lors de la consommation du quota');
      throw err;
    }
  }, [isPremium]);

  const refreshQuotas = useCallback(async () => {
    await loadQuotas();
  }, []);

  // Compute if user can perform actions
  const canScan = isPremium || (quotas?.scansRemaining ?? 0) > 0;
  const canChat = isPremium || (quotas?.aiChatsRemaining ?? 0) > 0;

  // For non-authenticated users, return default free quotas
  if (!isAuthenticated) {
    return {
      quotas: {
        scansRemaining: 30,
        aiChatsRemaining: 5
      },
      isLoading: false,
      error: null,
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
    consumeQuota,
    refreshQuotas,
    canScan,
    canChat
  };
}