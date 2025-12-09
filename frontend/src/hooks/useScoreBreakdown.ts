// frontend/src/hooks/useScoreBreakdown.ts
// VERSION 3.2.0 - NE GÉNÈRE PLUS DE SCORES (utilise backend uniquement)

/**
 * Hook pour récupérer le breakdown des scores depuis le backend
 * 
 * ⚠️ IMPORTANT V3.2.0:
 * - NE GÉNÈRE PLUS de scores côté frontend
 * - Retourne uniquement product.scores?.breakdown du backend
 * - Si pas de breakdown → retourne null (affichera "N/A" dans UI)
 * 
 * RATIONALE:
 * Générer des scores côté frontend causait des incohérences graves
 * (ex: Nutella affichait 50/100 au lieu du vrai 29/100 calculé scientifiquement)
 */

export const useScoreBreakdown = (product: any) => {
  // Si pas de produit, retourner null
  if (!product) {
    return null;
  }

  // Si pas de scores ou pas de breakdown, retourner null
  if (!product.scores || !product.scores.breakdown) {
    console.warn('[useScoreBreakdown] Pas de breakdown disponible - afficher "Données insuffisantes"');
    return null;
  }

  // Retourner le breakdown du backend tel quel
  return product.scores.breakdown;
};

// ============================================================================
// ANCIENNES FONCTIONS DE CALCUL SUPPRIMÉES
// ============================================================================
// Les fonctions calculateNovaScore, calculateNutriScore, etc. ont été supprimées
// car elles généraient des scores fantaisistes.
// 
// Le scoring scientifique se fait UNIQUEMENT côté backend avec scoringUnified V3.2.0
// ============================================================================
