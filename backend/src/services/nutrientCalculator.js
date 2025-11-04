// PATH: backend/src/services/nutrientCalculator.js
// VERSION: v1.0 - CALCULS AUTOMATIQUES NOVA/NUTRI/ADDITIFS/ECO

/**
 * SERVICE DE CALCUL AUTOMATIQUE DES SCORES
 * 
 * Ce service calcule automatiquement les champs que DeepSeek ne renvoie jamais :
 * - novaGroup : Calculé depuis ingredients_text
 * - nutriScore : Calculé depuis nutriments (formule officielle SPF)
 * - additives : Extraits depuis ingredients_text
 * - ecoScore : Estimation simple
 */

class NutrientCalculator {

  // ============================================================================
  // NOVA GROUP CALCULATION (1-4)
  // ============================================================================
  
  calculateNovaGroup(ingredients_text = '', product_name = '') {
    if (!ingredients_text) {
      console.log('[NutrientCalculator] ⚠️ Pas d\'ingrédients → NOVA 3 (défaut)');
      return 3;
    }

    const text = (ingredients_text + ' ' + product_name).toLowerCase();

    // NOVA 4 : Mots-clés ultra-transformés (liste PAHO 2019)
    const ultraProcessedKeywords = [
      'sirop glucose', 'sirop fructose', 'dextrose', 'maltodextrine',
      'huile hydrogénée', 'protéine hydrolysée',
      'arôme', 'colorant', 'émulsifiant', 'stabilisant', 'épaississant',
      'exhausteur goût', 'conservateur'
    ];

    const hasUltraProcessed = ultraProcessedKeywords.some(keyword =>
      text.includes(keyword)
    );

    if (hasUltraProcessed) {
      console.log('[NutrientCalculator] ✅ NOVA 4 détecté (ultra-transformé)');
      return 4;
    }

    console.log('[NutrientCalculator] ✅ NOVA 3 (transformé standard)');
    return 3;
  }

  // ============================================================================
  // NUTRI-SCORE CALCULATION (A-E)
  // ============================================================================
  
  calculateNutriScore(nutriments = {}) {
    if (!nutriments.energy && !nutriments['energy-kcal']) {
      console.log('[NutrientCalculator] ⚠️ Pas de calories → Nutri-Score C (défaut)');
      return 'C';
    }

    const energy = nutriments.energy || nutriments['energy-kcal'] || 0;
    const sugars = nutriments.sugars || 0;
    const saturatedFat = nutriments['saturated-fat'] || nutriments.saturatedFat || 0;
    const sodium = nutriments.sodium || (nutriments.salt || 0) * 0.4;
    const fiber = nutriments.fiber || 0;
    const proteins = nutriments.proteins || 0;

    // Points négatifs
    let caloriesPoints = energy > 670 ? 10 : Math.max(0, Math.floor((energy - 335) / 33.5));
    let sugarsPoints = sugars > 45 ? 10 : Math.max(0, Math.floor((sugars - 4.5) / 4.05));
    let satFatPoints = saturatedFat > 10 ? 10 : Math.max(0, Math.floor((saturatedFat - 1) / 0.9));
    let sodiumPoints = sodium > 900 ? 10 : Math.max(0, Math.floor((sodium - 90) / 81));

    const negativePoints = caloriesPoints + sugarsPoints + satFatPoints + sodiumPoints;

    // Points positifs
    let fiberPoints = fiber > 4.7 ? 5 : Math.max(0, Math.floor((fiber - 0.9) / 0.76));
    let proteinPoints = proteins > 8 ? 5 : Math.max(0, Math.floor((proteins - 1.6) / 1.28));

    const positivePoints = fiberPoints + proteinPoints;
    const finalScore = negativePoints - positivePoints;

    let nutriScore;
    if (finalScore <= -1) nutriScore = 'A';
    else if (finalScore <= 2) nutriScore = 'B';
    else if (finalScore <= 10) nutriScore = 'C';
    else if (finalScore <= 18) nutriScore = 'D';
    else nutriScore = 'E';

    console.log('[NutrientCalculator] ✅ Nutri-Score ' + nutriScore + ' (' + finalScore + ' points)');
    return nutriScore;
  }

  // ============================================================================
  // ADDITIVES EXTRACTION
  // ============================================================================
  
  extractAdditives(ingredients_text = '') {
    if (!ingredients_text) return [];

    const regex = /E\d{3,4}/gi;
    const matches = ingredients_text.match(regex) || [];
    const unique = [...new Set(matches.map(e => e.toUpperCase()))];

    if (unique.length > 0) {
      console.log('[NutrientCalculator] ✅ ' + unique.length + ' additifs détectés : ' + unique.join(', '));
    }

    return unique;
  }

  // ============================================================================
  // ECO-SCORE ESTIMATION
  // ============================================================================
  
  estimateEcoScore(product) {
    const labels = product.labels || [];
    const novaGroup = product.novaGroup || 3;

    // Si bio → A
    if (labels.some(l => l.toLowerCase().includes('bio'))) {
      console.log('[NutrientCalculator] ✅ Eco-Score A (bio)');
      return 'A';
    }

    // Si NOVA 4 → D
    if (novaGroup === 4) {
      console.log('[NutrientCalculator] ✅ Eco-Score D (ultra-transformé)');
      return 'D';
    }

    // Sinon C (défaut)
    console.log('[NutrientCalculator] ✅ Eco-Score C (défaut)');
    return 'C';
  }
}

module.exports = new NutrientCalculator();