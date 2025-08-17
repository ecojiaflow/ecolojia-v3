// frontend/src/hooks/useQuot?.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { fetchUserQuota, refreshQuotaAfterAnalysis, DetailedQuotaData, DetailedQuotaResponse } from '../api/realApi';

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
  resetDatea: string;
  limitTypea: 'daily' | 'monthly';
  error?: string;
}

export const useQuota = () => {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated, isDemoMode, simulateScan, simulateAIQuestion } = useAuth();

  // aaaa CONVERSION DEPUIS ANCIEN FORMAT
  const convertFromLegacyQuota = useCallback((legacyData: DetailedQuotaData): QuotaStatus => {
    return {
      tier: 'free', // Assuming legacy was free tier
      scans: {
        used: legacydata?.used_analyses,
        limit: legacydata?.daily_limit,
        remaining: legacydata?.remaining_analyses,
        resetDate: legacydata?.reset_time
      },
      aiQuestions: {
        dailyUsed: 0,
        dailyLimit: 3,
        dailyRemaining: 3,
        monthlyUsed: 0,
        monthlyLimit: 15,
        monthlyRemaining: 15,
        resetDate: legacydata?.reset_time
      },
      exports: {
        used: 0,
        limit: 2,
        remaining: 2,
        resetDate: legacydata?.reset_time
      },
      features: {
        deepSeekAI: false,
        advancedAnalytics: false,
        apiAccess: false,
        coaching: false
      },
      lastUpdated: new Date().toISOString()
    };
  }, []);

  // aaaa CHARGER STATUS QUOTAS (COMPATIBLE ANCIEN + NOUVEAU)
  const fetchQuotaStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mode demo : utiliser donnees fictives
      if (isDemoMode && user) {
        const demoQuotas: QuotaStatus = {
          tier: user.tier,
          scans: {
            used: user.currentUsage?.scansThisMonth || 0,
            limit: user.tier === 'premium' ? -1 : 25,
            remaining: user.tier === 'premium' ? -1 : 
              Math.max(0, 25 - (user.currentUsage?.scansThisMonth || 0)),
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
          },
          aiQuestions: {
            dailyUsed: user.currentUsage?.aiQuestionsToday || 0,
            dailyLimit: user.tier === 'premium' ? -1 : 3,
            dailyRemaining: user.tier === 'premium' ? -1 :
              Math.max(0, 3 - (user.currentUsage?.aiQuestionsToday || 0)),
            monthlyUsed: user.currentUsage?.aiQuestionsToday || 0,
            monthlyLimit: user.tier === 'premium' ? -1 : 15,
            monthlyRemaining: user.tier === 'premium' ? -1 :
              Math.max(0, 15 - (user.currentUsage?.aiQuestionsToday || 0)),
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
          },
          exports: {
            used: user.currentUsage?.exportsThisMonth || 0,
            limit: user.tier === 'premium' ? 50 : 2,
            remaining: user.tier === 'premium' ? 
              Math.max(0, 50 - (user.currentUsage?.exportsThisMonth || 0)) :
              Math.max(0, 2 - (user.currentUsage?.exportsThisMonth || 0)),
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
          },
          features: {
            deepSeekAI: user.tier === 'premium',
            advancedAnalytics: user.tier === 'premium',
            apiAccess: user.tier === 'premium',
            coaching: user.tier === 'premium'
          },
          lastUpdated: new Date().toISOString()
        };
        
        setQuotaStatus(demoQuotas);
        return;
      }

      // Mode reel : essayer nouvelle API d'abord, fallback ancien format
      if (!isAuthenticated) {
        setQuotaStatus(null);
        return;
      }

      try {
        // Tentative nouvelle API
        const response = await fetch('/api/quota/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('ecolojia_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.success) {
            setQuotaStatus(data?.data);
            return;
          }
        }
      } catch (newApiError) {
        console.log('Nouvelle API non disponible, utilisation ancien format...');
      }

      // Fallback vers ancien format
      try {
        const legacyResponse: DetailedQuotaResponse = await fetchUserQuota();
        
        if (legacyResponse.success && legacyResponse.quota) {
          const convertedQuota = convertFromLegacyQuota(legacyResponse.quota);
          setQuotaStatus(convertedQuota);
          console.log('aaaa Quota charge (format legacy):', convertedQuota);
        } else {
          throw new Error(legacyResponse.error || 'Erreur quota legacy');
        }
      } catch (legacyError) {
        console.error('aa Erreur quota legacy:', legacyError);
        
        // Quota de secours
        const fallbackQuota: QuotaStatus = {
          tier: 'free',
          scans: {
            used: 0,
            limit: 25,
            remaining: 25,
            resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          aiQuestions: {
            dailyUsed: 0,
            dailyLimit: 3,
            dailyRemaining: 3,
            monthlyUsed: 0,
            monthlyLimit: 15,
            monthlyRemaining: 15,
            resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          exports: {
            used: 0,
            limit: 2,
            remaining: 2,
            resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          features: {
            deepSeekAI: false,
            advancedAnalytics: false,
            apiAccess: false,
            coaching: false
          },
          lastUpdated: new Date().toISOString()
        };
        
        setQuotaStatus(fallbackQuota);
        setError('Mode hors ligne - quotas par defaut');
      }

    } catch (err) {
      console.error('aa Erreur fetch quotas:', err);
      setError(err instanceof Error ? err.message : 'Erreur quotas');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isDemoMode, user, convertFromLegacyQuota]);

  // aaaa VaaRIFIER QUOTA AVANT ACTION
  const checkQuota = useCallback(async (action: 'scan' | 'aiQuestion' | 'export'): Promise<QuotaCheck> => {
    if (!quotaStatus) {
      return { allowed: false, remaining: 0, error: 'No quota status' };
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
        // Verifier quota journalier d'abord
        const dailyRemaining = quotaStatus.aiQuestions.dailyLimit === -1 ? -1 : 
          quotaStatus.aiQuestions.dailyRemaining;
        
        if (dailyRemaining === 0) {
          return {
            allowed: false,
            remaining: 0,
            limitType: 'daily',
            resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Demain
          };
        }

        // Puis verifier quota mensuel
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
        return { allowed: false, remaining: 0, error: 'Unknown action' };
    }
  }, [quotaStatus]);

  // aaaa INCRaaMENTER USAGE APRaS ACTION (COMPATIBLE ANCIEN + NOUVEAU)
  const incrementUsage = useCallback(async (action: 'scan' | 'aiQuestion' | 'export'): Promise<boolean> => {
    try {
      // Mode demo : utiliser simulation
      if (isDemoMode) {
        if (action === 'scan' && simulateScan) {
          simulateScan('food'); // Categorie par defaut
          await fetchQuotaStatus(); // Refresh quotas
          return true;
        }
        if (action === 'aiQuestion' && simulateAIQuestion) {
          const success = simulateAIQuestion();
          await fetchQuotaStatus(); // Refresh quotas
          return success;
        }
        return true;
      }

      // Mode reel : essayer nouvelle API d'abord
      try {
        const response = await fetch('/api/quota/increment', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('ecolojia_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action })
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.success) {
            setQuotaStatus(data?.data); // Nouveau status apres increment
            return true;
          }
        }
      } catch (newApiError) {
        console.log('Nouvelle API non disponible, utilisation ancien format...');
      }

      // Fallback vers ancien format (pour scans seulement)
      if (action === 'scan') {
        try {
          const legacyResponse = await refreshQuotaAfterAnalysis();
          
          if (legacyResponse.success && legacyResponse.quota) {
            const convertedQuota = convertFromLegacyQuota(legacyResponse.quota);
            setQuotaStatus(convertedQuota);
            console.log('aaaa Quota mis  jour (format legacy):', convertedQuota);
            return true;
          }
        } catch (legacyError) {
          console.error('aa Erreur legacy increment:', legacyError);
        }
      }

      return false;

    } catch (err) {
      console.error('aa Erreur increment usage:', err);
      return false;
    }
  }, [isDemoMode, simulateScan, simulateAIQuestion, fetchQuotaStatus, convertFromLegacyQuota]);

  // aaaa VaaRIFICATEURS RAPIDES
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

  // aaaa MaaTRIQUES POUR UI
  const getScansProgress = useCallback((): number => {
    if (!quotaStatus || quotaStatus.scans.limit === -1) return 0;
    return (quotaStatus.scans.used / quotaStatus.scans.limit) * 100;
  }, [quotaStatus]);

  const getAIQuestionsProgress = useCallback((): { daily: number; monthly: number } => {
    if (!quotaStatus) return { daily: 0, monthly: 0 };
    
    const daily = quotaStatus.aiQuestions.dailyLimit === -1 ? 0 :
      (quotaStatus.aiQuestions.dailyUsed / quotaStatus.aiQuestions.dailyLimit) * 100;
    
    const monthly = quotaStatus.aiQuestions.monthlyLimit === -1 ? 0 :
      (quotaStatus.aiQuestions.monthlyUsed / quotaStatus.aiQuestions.monthlyLimit) * 100;
    
    return { daily, monthly };
  }, [quotaStatus]);

  // aaaa CHARGE INITIAL
  useEffect(() => {
    if (isAuthenticated || isDemoMode) {
      fetchQuotaStatus();
    }
  }, [isAuthenticated, isDemoMode, fetchQuotaStatus]);

  return {
    // aatat
    quotaStatus,
    isLoading,
    error,
    
    // Actions
    fetchQuotaStatus,
    checkQuota,
    incrementUsage,
    
    // Verificateurs
    canScan,
    canUseAI,
    canExport,
    hasFeature,
    
    // Metriques UI
    getScansProgress,
    getAIQuestionsProgress,
    
    // Helpers
    isFreeTier: quotaStatus?.tier === 'free',
    isPremiumTier: quotaStatus?.tier === 'premium',
    
    // aaaa COMPATIBILITaa ANCIEN FORMAT
    quotaData: quotaStatus ? {
      used_analyses: quotaStatus.scans.used,
      remaining_analyses: quotaStatus.scans.remaining,
      daily_limit: quotaStatus.scans.limit === -1 ? 999 : quotaStatus.scans.limit,
      reset_time: quotaStatus.scans.resetDate,
      current_date: new Date().toISOString().split('T')[0]
    } : null,
    canAnalyze: canScan(),
    timeUntilReset: quotaStatus ? getTimeUntilReset(quotaStatus.scans.resetDate) : '',
    refreshQuota: fetchQuotaStatus
  };

  // Helper pour calculer temps jusqu'au reset (compatibilite)
  function getTimeUntilReset(resetTime: string): string {
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
  }
};



