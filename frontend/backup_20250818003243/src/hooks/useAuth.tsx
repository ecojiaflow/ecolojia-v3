// PATH: frontend/src/hooks/useAuth.ts
// Hook unifie qui utilise le contexte existant

export { useAuth } from '../auth/context/AuthContext';
export { AuthContext } from '../auth/context/AuthContext';
export type { AuthContextType } from '../auth/types/AuthTypes';

// Si tu as besoin d'un hook supplementaire pour les quotas
export const useQuotas = () => {
  const { user, getRemainingQuota, canPerformAction } = useAuth();
  
  return {
    scansRemaining: getRemainingQuota('scans'),
    aiQuestionsRemaining: getRemainingQuota('aiQuestions'),
    canScan: canPerformAction('scan'),
    canAskAI: canPerformAction('aiQuestion'),
    isPremium: user?.tier === 'premium'
  };
};



