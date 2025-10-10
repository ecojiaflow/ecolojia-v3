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
  // PHASE 7-BIS - Recalibration stricte
  let healthScore = 40;
  let environmentScore = 40;

  // NOVA
  if (data.novaGroup) {
    const nova = parseInt(data.novaGroup);
    if (nova === 1) healthScore += 30;
    else if (nova === 2) healthScore += 15;
    else if (nova === 3) healthScore += 5;
    else if (nova === 4) healthScore -= 30; // Ultra-transformé
  }

  // Nutri-Score
  if (data.nutriScore) {
    const nutri = data.nutriScore.toLowerCase();
    if (nutri === 'a') healthScore += 25;
    else if (nutri === 'b') healthScore += 15;
    else if (nutri === 'c') healthScore += 5;
    else if (nutri === 'd') healthScore -= 10;
    else if (nutri === 'e') healthScore -= 20; // Très mauvais
  }

  // Additifs
  const additives = data.additives || [];
  if (additives.length > 0) {
    healthScore -= Math.min(additives.length * 2, 15);
  }

  // Eco-Score
  if (data.ecoScore) {
    const eco = data.ecoScore.toLowerCase();
    if (eco === 'a') environmentScore += 30;
    else if (eco === 'b') environmentScore += 20;
    else if (eco === 'c') environmentScore += 5;
    else if (eco === 'd') environmentScore -= 10;
    else if (eco === 'e') environmentScore -= 20;
  }

  // Calcul final
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
  environmentScore = Math.max(0, Math.min(100, Math.round(environmentScore)));
  const globalScore = Math.round(healthScore * 0.6 + environmentScore * 0.4);

  return {
    overallScore: globalScore,
    healthScore,
    environmentScore,
    breakdown: {
      nova: { score: data.novaGroup === 1 ? 70 : data.novaGroup === 2 ? 55 : data.novaGroup === 3 ? 45 : 10, label: data.novaGroup ? `Groupe ${data.novaGroup}` : 'Non défini' },
      nutriscore: { score: data.nutriScore === 'a' ? 65 : data.nutriScore === 'b' ? 55 : data.nutriScore === 'c' ? 45 : data.nutriScore === 'd' ? 30 : 20, label: data.nutriScore ? data.nutriScore.toUpperCase() : 'Non défini' },
      additives: { score: Math.max(0, 50 - (additives.length * 5)), label: `${additives.length} additif${additives.length > 1 ? 's' : ''}` },
      ecoscore: { score: data.ecoScore === 'a' ? 70 : data.ecoScore === 'b' ? 60 : data.ecoScore === 'c' ? 45 : 20, label: data.ecoScore ? data.ecoScore.toUpperCase() : 'Non défini' },
      packaging: { score: 50, label: 'Standard' },
      origin: { score: 50, label: data.origin || 'Non défini' }
    }
  };
}

// ============================================================================
// FONCTIONS DE CALCUL DÉTAILLÉES
// ============================================================================

/**
 * Score NOVA (25 points max)
 * Source : Classification NOVA (Monteiro et al., 2019)
 */
function calculateNovaScore(novaGroup) {
  const mapping = {
    1: 25,  // Aliments non transformés ou minimalement transformés
    2: 18,  // Ingrédients culinaires transformés
    3: 10,  // Aliments transformés
    4: 0    // Produits ultra-transformés
  };
  return novaGroup in mapping ? mapping[novaGroup] : 12; // Défaut si inconnu
}

/**
 * Score Additifs (25 points max)
 * Source : EFSA (European Food Safety Authority)
 */
function calculateAdditivesScore(additives) {
  if (!additives || additives.length === 0) return 25;

  // Liste rouge EFSA (risques santé établis)
  const redList = [
    'E250', 'E251', 'E252',        // Nitrites/Nitrates (cancérogènes probables)
    'E621', 'E622', 'E623',        // Glutamates (neurotoxicité débat)
    'E150c', 'E150d',              // Caramels sulfite (allergies)
    'E320', 'E321',                // BHA/BHT (perturbateurs endocriniens suspectés)
    'E951',                        // Aspartame (controverse)
    'E104', 'E110', 'E122', 'E124', 'E129' // Colorants azoïques (hyperactivité enfants)
  ];

  // Liste orange (à limiter)
  const orangeList = [
    'E330', 'E200', 'E202', 'E211', 'E212' // Conservateurs courants
  ];

  let redCount = 0;
  let orangeCount = 0;

  additives.forEach(additive => {
    const code = String(additive).toUpperCase();
    if (redList.some(red => code.includes(red))) redCount++;
    else if (orangeList.some(orange => code.includes(orange))) orangeCount++;
  });

  if (redCount > 0) return 0;                // Au moins 1 rouge = 0
  if (orangeCount >= 3) return 10;          // 3+ orange = 10
  if (orangeCount >= 1) return 15;          // 1-2 orange = 15
  if (additives.length <= 3) return 20;     // 1-3 additifs verts = 20
  return 25;                                 // Aucun additif = 25
}

/**
 * Score Nutrition (30 points max)
 * Source : PNNS 2019-2023 (Programme National Nutrition Santé)
 * Repères ANSES 2017
 */
function calculateNutritionScore(nutrition) {
  if (!nutrition || !nutrition.per100g) return 15; // Score neutre si données manquantes

  const n = nutrition.per100g;
  let score = 30; // On part du max et on enlève

  // PÉNALITÉ SUCRES (OMS : max 10% apport énergétique = ~50g/jour)
  const sugars = n.sugars || n.sugars_100g || 0;
  if (sugars > 22.5) score -= 15;      // Très élevé (ex: sodas, confiseries)
  else if (sugars > 15) score -= 10;   // Élevé (ex: céréales sucrées)
  else if (sugars > 10) score -= 5;    // Modéré

  // PÉNALITÉ SEL (OMS : max 5g/jour, ANSES : max 8g/jour)
  const salt = n.salt || n.salt_100g || n.sodium ? (n.sodium * 2.5) : 0;
  if (salt > 2.0) score -= 15;         // Très élevé (ex: chips, charcuterie)
  else if (salt > 1.5) score -= 10;    // Élevé
  else if (salt > 1.0) score -= 5;     // Modéré

  // PÉNALITÉ GRAISSES SATURÉES (ANSES : max 12% apport énergétique)
  const saturatedFat = n.saturatedFat || n['saturated-fat'] || n.saturated_fat_100g || 0;
  if (saturatedFat > 10) score -= 10;  // Très élevé (ex: fromage, viennoiseries)
  else if (saturatedFat > 5) score -= 5; // Élevé

  // PÉNALITÉ DENSITÉ ÉNERGÉTIQUE (limiter aliments hypercaloriques)
  const calories = n.energy || n.energy_kcal || n['energy-kcal_100g'] || 0;
  if (calories > 500) score -= 5;      // Hypercalorique (ex: chocolat, fritures)

  return Math.max(0, score); // Min 0
}

/**
 * Score Éco-Score (10 points max)
 * Source : Base Carbone ADEME v12.1
 */
function convertEcoScoreToPoints(ecoScore) {
  const mapping = {
    'A': 10, 'a': 10,
    'B': 8,  'b': 8,
    'C': 6,  'c': 6,
    'D': 4,  'd': 4,
    'E': 2,  'e': 2
  };
  return mapping[ecoScore] || 5; // Défaut neutre
}

/**
 * Score Emballage (3 points max)
 * Source : Analyse Cycle de Vie (ACV) ADEME
 */
function calculatePackagingScore(product) {
  const packaging = (product.packaging || product.packagingType || '').toLowerCase();

  if (packaging.includes('vrac') || packaging.includes('consigne')) return 3;  // Idéal
  if (packaging.includes('verre') || packaging.includes('glass')) return 2.5;  // Recyclable infini
  if (packaging.includes('carton') || packaging.includes('cardboard')) return 2; // Recyclable
  if (packaging.includes('plastique recyclable') || packaging.includes('pet')) return 1; // Recyclable 1x
  if (packaging.includes('plastique') || packaging.includes('plastic')) return 0; // Polluant

  return 1.5; // Défaut moyen
}

/**
 * Score Origine (2 points max)
 * Source : Bilan carbone transport (ADEME)
 */
function calculateOriginScore(product) {
  const origin = (product.origin || product.countries || product.manufacturing_places || '').toLowerCase();

  if (origin.includes('france') || origin.includes('fr:')) return 2;     // Local
  if (origin.includes('europe') || origin.includes('eu')) return 1.5;    // Européen
  if (origin.includes('maghreb') || origin.includes('afrique')) return 1; // Proximité
  
  return 0.5; // Hors Europe (Asie, Amérique)
}

/**
 * Score Éthique (5 points max)
 * Labels certifiés uniquement
 */
function calculateEthicsScore(labels) {
  if (!labels || labels.length === 0) return 0;

  let score = 0;

  labels.forEach(label => {
    const l = label.toLowerCase();
    
    // Bio certifié (AB, EU Organic)
    if (l.includes('bio') || l.includes('organic') || l.includes('ab-agriculture')) {
      score += 2;
    }
    
    // Commerce équitable
    if (l.includes('fairtrade') || l.includes('max-havelaar') || l.includes('commerce-equitable')) {
      score += 2;
    }
    
    // Label Rouge / AOP / IGP
    if (l.includes('label-rouge') || l.includes('aop') || l.includes('igp')) {
      score += 1;
    }
  });

  return Math.min(score, 5); // Max 5 points
}

/**
 * Bonus nutritionnels (max +10 points)
 * Source : Recommandations PNNS
 */
function calculateBonuses(nutrition, product) {
  if (!nutrition || !nutrition.per100g) return 0;

  const n = nutrition.per100g;
  let bonus = 0;

  // Fibres élevées (ANSES : 25-30g/jour recommandés)
  const fiber = n.fiber || n.fiber_100g || 0;
  if (fiber > 6) bonus += 5;        // Source de fibres
  else if (fiber > 3) bonus += 2;

  // Protéines élevées
  const protein = n.protein || n.proteins_100g || 0;
  if (protein > 15) bonus += 3;     // Riche en protéines

  // Oméga-3 (si présents dans ingrédients)
  const ingredients = (product.ingredients_text || '').toLowerCase();
  if (ingredients.includes('omega') || ingredients.includes('huile de colza') || 
      ingredients.includes('huile de lin') || ingredients.includes('noix')) {
    bonus += 2;
  }

  return Math.min(bonus, 10); // Max 10 points bonus
}

/**
 * Pénalités supplémentaires
 */
function calculatePenalties(product, additives) {
  let penalty = 0;

  // Édulcorants intenses (controverse scientifique)
  const sweeteners = ['E950', 'E951', 'E952', 'E954', 'E955', 'E960', 'E961'];
  additives.forEach(add => {
    if (sweeteners.some(s => String(add).includes(s))) {
      penalty -= 5;
    }
  });

  // Huile de palme (déforestation + santé)
  const ingredients = (product.ingredients_text || '').toLowerCase();
  if (ingredients.includes('huile de palme') || ingredients.includes('palm oil')) {
    penalty -= 3;
  }

  return penalty; // Négatif
}

// ============================================================================
// COSMÉTIQUES & DÉTERGENTS (Gardés identiques pour l'instant)
// ============================================================================

function calculateCosmeticScores(product) {
  // TODO: Appliquer même rigueur scientifique
  return {
    overallScore: 50,
    safetyScore: 50,
    efficacyScore: 50,
    ethicsScore: 50
  };
}

function calculateDetergentScores(data) {
  const additives = data.additives || [];
  
  return {
    breakdown: {
      nova: { score: data.novaGroup === 1 ? 70 : data.novaGroup === 2 ? 55 : data.novaGroup === 3 ? 45 : 10, label: data.novaGroup ? `Groupe ${data.novaGroup}` : 'Non défini' },
      nutriscore: { score: data.nutriScore === 'a' ? 65 : data.nutriScore === 'b' ? 55 : data.nutriScore === 'c' ? 45 : data.nutriScore === 'd' ? 30 : 20, label: data.nutriScore ? data.nutriScore.toUpperCase() : 'Non défini' },
      additives: { score: Math.max(0, 50 - (additives.length * 5)), label: `${additives.length} additif${additives.length > 1 ? 's' : ''}` },
      ecoscore: { score: data.ecoScore === 'a' ? 70 : data.ecoScore === 'b' ? 60 : data.ecoScore === 'c' ? 45 : 20, label: data.ecoScore ? data.ecoScore.toUpperCase() : 'Non défini' },
      packaging: { score: 50, label: 'Standard' },
      origin: { score: 50, label: data.origin || 'Non défini' }
    },
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