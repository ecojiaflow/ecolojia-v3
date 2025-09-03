// PATH: frontend/src/hooks/useQuota.ts
import { useState, useEffect } from 'react';
import { useAuthContext } from '../Contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Quota {
  scansRemaining: number;
  aiChatsRemaining: number;
  scansResetDate?: Date;
  aiChatsResetDate?: Date;
}

export const useQuota = () => {
  const { user, refreshUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quotas par défaut selon le plan
  const defaultQuotas = {
    free: {
      scansRemaining: 30,
      aiChatsRemaining: 5,
    },
    premium: {
      scansRemaining: 999999, // Illimité
      aiChatsRemaining: 500,
    }
  };

  // Récupérer les quotas depuis l'utilisateur ou utiliser les valeurs par défaut
  const quotas: Quota = {
    scansRemaining: user?.quotas?.scansRemaining ?? (user?.plan === 'premium' ? defaultQuotas.premium.scansRemaining : defaultQuotas.free.scansRemaining),
    aiChatsRemaining: user?.quotas?.aiChatsRemaining ?? (user?.plan === 'premium' ? defaultQuotas.premium.aiChatsRemaining : defaultQuotas.free.aiChatsRemaining),
    scansResetDate: user?.quotas?.scansResetDate ? new Date(user.quotas.scansResetDate) : undefined,
    aiChatsResetDate: user?.quotas?.aiChatsResetDate ? new Date(user.quotas.aiChatsResetDate) : undefined,
  };

  // Vérifier si un quota est épuisé
  const canScan = quotas.scansRemaining > 0;
  const canChat = quotas.aiChatsRemaining > 0;

  // Rafraîchir les quotas depuis le serveur
  const refreshQuotas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await refreshUser();
    } catch (err: any) {
      const message = err?.message || 'Erreur lors de la récupération des quotas';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier et consommer un quota de scan
  const consumeScanQuota = async (): Promise<boolean> => {
    if (!canScan) {
      toast.error('Quota de scans épuisé. Passez à Premium pour des scans illimités !');
      return false;
    }
    
    // Le backend décrémentera automatiquement lors de l'appel API
    // On rafraîchit juste les quotas après
    try {
      await refreshQuotas();
      return true;
    } catch {
      return false;
    }
  };

  // Vérifier et consommer un quota de chat
  const consumeChatQuota = async (): Promise<boolean> => {
    if (!canChat) {
      toast.error('Quota de chats IA épuisé. Passez à Premium pour plus de chats !');
      return false;
    }
    
    try {
      await refreshQuotas();
      return true;
    } catch {
      return false;
    }
  };

  // Calculer le pourcentage utilisé
  const getUsagePercentage = (type: 'scans' | 'chats'): number => {
    const max = user?.plan === 'premium' 
      ? (type === 'scans' ? defaultQuotas.premium.scansRemaining : defaultQuotas.premium.aiChatsRemaining)
      : (type === 'scans' ? defaultQuotas.free.scansRemaining : defaultQuotas.free.aiChatsRemaining);
    
    const remaining = type === 'scans' ? quotas.scansRemaining : quotas.aiChatsRemaining;
    const used = max - remaining;
    
    return Math.round((used / max) * 100);
  };

  // Formater la date de reset
  const formatResetDate = (date?: Date): string => {
    if (!date) return 'Non définie';
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `dans ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `dans ${hours} heure${hours > 1 ? 's' : ''}`;
    return 'bientôt';
  };

  return {
    quotas,
    canScan,
    canChat,
    isLoading,
    error,
    refreshQuotas,
    consumeScanQuota,
    consumeChatQuota,
    getUsagePercentage,
    formatResetDate,
    isPremium: user?.plan === 'premium',
  };
};