// PATH: frontend/src/hooks/useQuota.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { fetchUserQuota, refreshQuotaAfterAnalysis, DetailedQuotaData, DetailedQuotaResponse } from '../api/realApi';
import toast from 'react-hot-toast';

interface QuotaStatus {
  tier: 'free' | 'premium';
  scans: {
    used: number;
    limit: number;
    remaining: number;
    resetDate: string;
  };
  aiQuestions: {
    dailyUsed: number;
    dailyLimit: number;
    dailyRemaining: number;
    monthlyUsed: number;
    monthlyLimit: number;
    monthlyRemaining: number;
    resetDate: string;
  };
  exports: {
    used: number;
    limit: number;
    remaining: number;
    resetDate: string;
  };
  features: {
    deepSeekAI: boolean;
    advancedAnalytics: boolean;
    apiAccess: boolean;
    coaching: boolean;
  };
  lastUpdated: string;
}

interface QuotaCheck {
  allowed: boolean;
  remaining: number;
  resetDate: string;
  limitType?: 'daily' | 'monthly';
  error?: string;
}

export const useQuota = () => {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuthContext();

  // Conversion depuis l'ancien format
  const convertFromLegacyQuota = useCallback((legacyData: DetailedQuotaData): QuotaStatus => {
    return {
      tier: (user?.subscription?.tier || 'free') as 'free' | 'premium',
      scans: {
        used: legacyData?.used_analyses || 0,
        limit: legacyData?.daily_limit || 30,
        remaining: legacyData?.remaining_analyses || 30,
        resetDate: legacyData?.reset_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      aiQuestions: {
        dailyUsed: 0,
        dailyLimit: 5,
        dailyRemaining: 5,
        monthlyUsed: 0,
        monthlyLimit: user?.subscription?.tier === 'premium' ? 500 : 5,
        monthlyRemaining: user?.subscription?.tier === 'premium' ? 500 : 5,
        resetDate: legacyData?.reset_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      exports: {
        used: 0,
        limit: user?.subscription?.tier === 'premium' ? 50 : 0,
        remaining: user?.subscription?.tier === 'premium' ? 50 : 0,
        resetDate: legacyData?.reset_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      features: {
        deepSeekAI: user?.subscription?.tier === 'premium',
        advancedAnalytics: user?.subscription?.tier === 'premium',
        apiAccess: user?.subscription?.tier === 'premium',
        coaching: user?.subscription?.tier === 'premium'
      },
      lastUpdated: new Date().toISOString()
    };
  }, [user]);

  // Charger le status des quotas
  const fetchQuotaStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isAuthenticated || !user) {
        setQuotaStatus(null);
        return;
      }

      // Essayer de récupérer les quotas depuis l'API
      const response = await fetchUserQuota();
      
      if (response.success && response.quota) {
        const convertedQuota = convertFromLegacyQuota(response.quota);
        setQuotaStatus(convertedQuota);
      } else {
        // Utiliser les quotas par défaut basés sur le tier
        const defaultQuota: QuotaStatus = {
          tier: (user?.subscription?.tier || 'free') as 'free' | 'premium',
          scans: {
            used: 0,
            limit: user?.subscription?.tier === 'premium' ? -1 : 30,
            remaining: user?.subscription?.tier === 'premium' ? -1 : 30,
            resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          aiQuestions: {
            dailyUsed: 0,
            dailyLimit: 5,
            dailyRemaining: 5,
            monthlyUsed: 0,
            monthlyLimit: user?.subscription?.tier === 'premium' ? 500 : 5,
            monthlyRemaining: user?.subscription?.tier === 'premium' ? 500 : 5,
            resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          exports: {
            used: 0,
            limit: user?.subscription?.tier === 'premium' ? 50 : 0,
            remaining: user?.subscription?.tier === 'premium' ? 50 : 0,
            resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          features: {
            deepSeekAI: user?.subscription?.tier === 'premium',
            advancedAnalytics: user?.subscription?.tier === 'premium',
            apiAccess: user?.subscription?.tier === 'premium',
            coaching: user?.subscription?.tier === 'premium'
          },
          lastUpdated: new Date().toISOString()
        };
        
        setQuotaStatus(defaultQuota);
      }

    } catch (err) {
      console.error('Erreur fetch quotas:', err);
      setError(err instanceof Error ? err.message : 'Erreur quotas');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, convertFromLegacyQuota]);

  // Vérifier quota avant action
  const checkQuota = useCallback(async (action: 'scan' | 'aiQuestion' | 'export'): Promise<QuotaCheck> => {
    if (!quotaStatus) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetDate: new Date().toISOString(),
        error: 'No quota status' 
      };
    }

    switch (action) {
      case 'scan':
        const scansRemaining = quotaStatus.scans.limit === -1 ? -1 : quotaStatus.scans.remaining;
        return {
          allowed: scansRemaining === -1 || scansRemaining > 0,
          remaining: scansRemaining,
          resetDate: quotaStatus.scans.resetDate
        };

      case 'aiQuestion':
        const dailyRemaining = quotaStatus.aiQuestions.dailyLimit === -1 ? -1 : 
          quotaStatus.aiQuestions.dailyRemaining;
        
        if (dailyRemaining === 0) {
          return {
            allowed: false,
            remaining: 0,
            limitType: 'daily',
            resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          };
        }

        const monthlyRemaining = quotaStatus.aiQuestions.monthlyLimit === -1 ? -1 :
          quotaStatus.aiQuestions.monthlyRemaining;

        return {
          allowed: monthlyRemaining === -1 || monthlyRemaining > 0,
          remaining: monthlyRemaining,
          limitType: 'monthly',
          resetDate: quotaStatus.aiQuestions.resetDate
        };

      case 'export':
        const exportsRemaining = quotaStatus.exports.limit === -1 ? -1 : quotaStatus.exports.remaining;
        return {
          allowed: exportsRemaining === -1 || exportsRemaining > 0,
          remaining: exportsRemaining,
          resetDate: quotaStatus.exports.resetDate
        };

      default:
        return { 
          allowed: false, 
          remaining: 0, 
          resetDate: new Date().toISOString(),
          error: 'Unknown action' 
        };
    }
  }, [quotaStatus]);

  // Incrémenter usage après action
  const incrementUsage = useCallback(async (action: 'scan' | 'aiQuestion' | 'export'): Promise<boolean> => {
    try {
      if (!quotaStatus) return false;

      // Mise à jour optimiste locale
      const newStatus = { ...quotaStatus };
      
      switch (action) {
        case 'scan':
          if (newStatus.scans.limit !== -1) {
            newStatus.scans.used++;
            newStatus.scans.remaining = Math.max(0, newStatus.scans.remaining - 1);
          }
          break;
          
        case 'aiQuestion':
          newStatus.aiQuestions.dailyUsed++;
          newStatus.aiQuestions.monthlyUsed++;
          if (newStatus.aiQuestions.dailyLimit !== -1) {
            newStatus.aiQuestions.dailyRemaining = Math.max(0, newStatus.aiQuestions.dailyRemaining - 1);
          }
          if (newStatus.aiQuestions.monthlyLimit !== -1) {
            newStatus.aiQuestions.monthlyRemaining = Math.max(0, newStatus.aiQuestions.monthlyRemaining - 1);
          }
          break;
          
        case 'export':
          if (newStatus.exports.limit !== -1) {
            newStatus.exports.used++;
            newStatus.exports.remaining = Math.max(0, newStatus.exports.remaining - 1);
          }
          break;
      }
      
      setQuotaStatus(newStatus);

      // Rafraîchir depuis l'API
      if (action === 'scan') {
        await refreshQuotaAfterAnalysis();
      }
      
      return true;

    } catch (err) {
      console.error('Erreur increment usage:', err);
      toast.error('Erreur lors de la mise à jour des quotas');
      return false;
    }
  }, [quotaStatus]);

  // Vérificateurs rapides
  const canScan = useCallback((): boolean => {
    if (!quotaStatus) return false;
    return quotaStatus.scans.limit === -1 || quotaStatus.scans.remaining > 0;
  }, [quotaStatus]);

  const canUseAI = useCallback((): boolean => {
    if (!quotaStatus) return false;
    return (quotaStatus.aiQuestions.dailyLimit === -1 || quotaStatus.aiQuestions.dailyRemaining > 0) &&
           (quotaStatus.aiQuestions.monthlyLimit === -1 || quotaStatus.aiQuestions.monthlyRemaining > 0);
  }, [quotaStatus]);

  const canExport = useCallback((): boolean => {
    if (!quotaStatus) return false;
    return quotaStatus.exports.limit === -1 || quotaStatus.exports.remaining > 0;
  }, [quotaStatus]);

  const hasFeature = useCallback((feature: keyof QuotaStatus['features']): boolean => {
    return quotaStatus?.features[feature] || false;
  }, [quotaStatus]);

  // Charge initial
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchQuotaStatus();
    }
  }, [isAuthenticated, user, fetchQuotaStatus]);

  // Helpers pour calculer le temps jusqu'au reset
  const getTimeUntilReset = useCallback((resetTime: string): string => {
    try {
      const reset = new Date(resetTime);
      const now = new Date();
      const diff = reset.getTime() - now.getTime();
      
      if (diff <= 0) return 'Maintenant';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}min`;
      }
      return `${minutes}min`;
    } catch {
      return 'Inconnu';
    }
  }, []);

  return {
    // État
    quotas: quotaStatus,
    isLoading,
    error,
    
    // Actions
    fetchQuotaStatus,
    checkQuota,
    incrementUsage,
    
    // Vérificateurs
    canScan,
    canUseAI,
    canExport,
    hasFeature,
    
    // Helpers
    isFreeTier: quotaStatus?.tier === 'free',
    isPremiumTier: quotaStatus?.tier === 'premium',
    timeUntilReset: quotaStatus ? getTimeUntilReset(quotaStatus.scans.resetDate) : '',
    
    // Compatibilité avec l'ancienne interface
    quotaData: quotaStatus ? {
      used_analyses: quotaStatus.scans.used,
      remaining_analyses: quotaStatus.scans.remaining,
      daily_limit: quotaStatus.scans.limit === -1 ? 999 : quotaStatus.scans.limit,
      reset_time: quotaStatus.scans.resetDate,
      current_date: new Date().toISOString().split('T')[0]
    } : null,
    canAnalyze: canScan(),
    refreshQuota: fetchQuotaStatus
  };
};