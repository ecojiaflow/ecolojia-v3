// ============================================================================
// ECOLOJIA SCORING ENGINE V3 - MÉTHODOLOGIE SCIENTIFIQUE VALIDÉE
// ============================================================================
// Sources officielles :
// - ANSES (Agence Nationale Sécurité Sanitaire Alimentation)
// - OMS (Organisation Mondiale de la Santé)
// - EFSA (European Food Safety Authority)
// - Santé Publique France (Programme National Nutrition Santé 2019-2023)
// - Base Carbone ADEME v12.1 (2024)
//
// Dernière mise à jour : 7 octobre 2025
// Validation : En cours (consulter nutritionniste diplômé recommandé)
// ============================================================================

/**
 * CALCUL SCORE ALIMENTAIRE
 * Formule : Santé (50%) + Nutrition (30%) + Environnement (15%) + Éthique (5%)
 * 
 * @param {Object} product - Produit depuis OpenFoodFacts/MongoDB
 * @returns {Object} Scores détaillés + breakdown
 */
function calculateFoodScores(data) {
  // PHASE 7-BIS - Recalibration stricte scientifique
  // Base plus basse pour éviter sur-notation
  let healthScore = 40;
  let environmentScore = 40;

  // === SANTÉ ===
  
  // NOVA (impact MAJEUR)
  if (data.novaGroup) {
    const novaGroup = parseInt(data.novaGroup);
    switch (novaGroup) {
      case 1:
        healthScore += 30; // Brut
        break;
      case 2:
        healthScore += 15; // Ingrédients culinaires
        break;
      case 3:
        healthScore += 5; // Transformé
        break;
      case 4:
        healthScore -= 30; // PÉNALITÉ FORTE ultra-transformé
        break;
    }
  }

  // Nutri-Score (impact FORT)
  if (data.nutriScore) {
    const nutri = data.nutriScore.toLowerCase();
    switch (nutri) {
      case 'a':
        healthScore += 25;
        break;
      case 'b':
        healthScore += 15;
        break;
      case 'c':
        healthScore += 5;
        break;
      case 'd':
        healthScore -= 10;
        break;
      case 'e':
        healthScore -= 20; // FORTE PÉNALITÉ
        break;
    }
  }

  // Additifs (pénalité progressive)
  const additives = data.additives || [];
  if (additives.length > 0) {
    healthScore -= Math.min(additives.length * 2, 15);
  }

  // Allergènes
  const allergens = data.allergens || [];
  if (allergens.length > 3) {
    healthScore -= 5;
  }

  // Labels positifs
  const labels = data.labels || [];
  const positiveLabels = ['bio', 'organic', 'ab', 'eurofeuille'];
  const hasPositiveLabel = labels.some(l => 
    positiveLabels.some(p => l.toLowerCase().includes(p))
  );
  if (hasPositiveLabel) {
    healthScore += 10;
  }

  // === ENVIRONNEMENT ===
  
  // Eco-Score
  if (data.ecoScore) {
    const eco = data.ecoScore.toLowerCase();
    switch (eco) {
      case 'a':
        environmentScore += 30;
        break;
      case 'b':
        environmentScore += 20;
        break;
      case 'c':
        environmentScore += 5;
        break;
      case 'd':
        environmentScore -= 10;
        break;
      case 'e':
        environmentScore -= 20;
        break;
    }
  }

  // Packaging
  if (data.packaging) {
    const pkg = JSON.stringify(data.packaging).toLowerCase();
    if (pkg.includes('plastique') || pkg.includes('plastic')) {
      environmentScore -= 8;
    }
    if (pkg.includes('recyclable') || pkg.includes('recycled')) {
      environmentScore += 5;
    }
  }

  // Origine
  if (data.origin) {
    const origin = data.origin.toLowerCase();
    if (origin.includes('france') || origin.includes('local')) {
      environmentScore += 10;
    } else if (origin.includes('europe') || origin.includes('ue')) {
      environmentScore += 5;
    }
  }

  // Labels environnementaux
  const ecoLabels = ['bio', 'msc', 'rainforest', 'fairtrade'];
  const hasEcoLabel = labels.some(l => 
    ecoLabels.some(e => l.toLowerCase().includes(e))
  );
  if (hasEcoLabel) {
    environmentScore += 8;
  }

  // === CALCUL FINAL ===
  
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
  environmentScore = Math.max(0, Math.min(100, Math.round(environmentScore)));

  const globalScore = Math.round(healthScore * 0.6 + environmentScore * 0.4);

  return {
    overallScore: globalScore,
    healthScore,
    environmentScore,
    breakdown: {
      nova: data.novaGroup || null,
      nutriscore: data.nutriScore || null,
      ecoscore: data.ecoScore || null,
      additives: additives.length,
      allergens: allergens.length,
      labels: labels.length
    }
  };
}

function calculateDetergentScores(product) {
  // TODO: Appliquer même rigueur scientifique
  return {
    overallScore: 50,
    environmentScore: 50,
    cleaningScore: 50,
    skinSafetyScore: 50
  };
}

// ============================================================================
// EXPORT
// ============================================================================

module.exports = {
  calculateFoodScores,
  calculateCosmeticScores,
  calculateDetergentScores
};
