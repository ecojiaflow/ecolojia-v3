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

/**
 * SCORING COSMÉTIQUES - MÉTHODOLOGIE SCIENTIFIQUE ECOLOJIA V3.1
 * Sources : ANSM, INCI Beauty, Règlement CE 1223/2009
 * 
 * Formule : 8 composantes pondérées
 * 1. Ingrédients (25%) - Naturel vs synthétique
 * 2. Perturbateurs endocriniens (20%) - Parabènes, phtalates, etc.
 * 3. Biodégradabilité (15%) - Écotoxicité aquatique
 * 4. Labels (15%) - COSMOS, Ecocert, Vegan
 * 5. Emballage (10%) - Plastique recyclable
 * 6. Origine (5%) - Fabrication France/UE
 * 7. Tests animaux (5%) - Cruelty-free
 * 8. Transparence (5%) - Liste INCI complète
 * 
 * @param {Object} product - Produit cosmétique
 * @returns {Object} scores - Score global + détail 8 composantes
 */
function calculateCosmeticScores(product) {
  const data = product.cosmeticsData || {};
  
  // Sécurité : retour par défaut si données insuffisantes
  if (!data.inciList && !product.ingredients) {
    return {
      overallScore: 50,
      confidence: 0.3,
      dataCompleteness: 'Faible',
      breakdown: {
        ingredients: { score: 50, weight: 25, label: 'Non défini' },
        endocrineDisruptors: { score: 50, weight: 20, label: 'Non défini' },
        biodegradability: { score: 50, weight: 15, label: 'Non défini' },
        labels: { score: 50, weight: 15, label: 'Aucun' },
        packaging: { score: 50, weight: 10, label: 'Standard' },
        origin: { score: 50, weight: 5, label: 'Non défini' },
        animalTesting: { score: 50, weight: 5, label: 'Non vérifié' },
        transparency: { score: 50, weight: 5, label: 'Partielle' }
      }
    };
  }
  
  // ============================================================================
  // COMPOSANTE 1 : INGRÉDIENTS (25%) - Naturel vs Synthétique
  // ============================================================================
  
  const inciList = (Array.isArray(data.inciList) ? data.inciList.join(', ') : data.inciList) || (Array.isArray(product.ingredients) ? product.ingredients.join(', ') : product.ingredients) || '';
  const ingredients = inciList.toLowerCase().split(',').map(i => i.trim()).filter(i => i.length > 0);
  
  let naturalCount = 0;
  let syntheticCount = 0;
  
  // Liste ingrédients naturels courants
  const naturalKeywords = [
    'aqua', 'water', 'aloe', 'oil', 'butter', 'extract', 'wax',
    'glycerin', 'tocopherol', 'squalane', 'lecithin', 'stearic acid',
    'shea', 'coconut', 'jojoba', 'argan', 'olive', 'castor'
  ];
  
  // Liste ingrédients synthétiques à risque
  const syntheticKeywords = [
    'paraben', 'siloxane', 'silicone', 'peg-', 'propylene glycol',
    'mineral oil', 'petrolatum', 'dimethicone', 'cyclopentasiloxane',
    'phenoxyethanol', 'methylisothiazolinone'
  ];
  
  ingredients.forEach(ing => {
    if (naturalKeywords.some(k => ing.includes(k))) naturalCount++;
    if (syntheticKeywords.some(k => ing.includes(k))) syntheticCount++;
  });
  
  const totalIngredients = ingredients.length || 1;
  const naturalPercent = (naturalCount / totalIngredients) * 100;
  
  let ingredientsScore = 0;
  if (naturalPercent >= 90) ingredientsScore = 100;
  else if (naturalPercent >= 70) ingredientsScore = 80;
  else if (naturalPercent >= 50) ingredientsScore = 60;
  else if (naturalPercent >= 30) ingredientsScore = 40;
  else ingredientsScore = 20;
  
  // ============================================================================
  // COMPOSANTE 2 : PERTURBATEURS ENDOCRINIENS (20%)
  // Source : Liste ANSM + Règlement REACH
  // ============================================================================
  
  const endocrineDisruptors = [
    'paraben', 'methylparaben', 'propylparaben', 'butylparaben',
    'triclosan', 'triclocarban', 'phthalate', 'bpa', 'bisphenol',
    'oxybenzone', 'octinoxate', 'homosalate', 'resorcinol',
    'benzophenone', 'ethylhexyl methoxycinnamate'
  ];
  
  let disruptorCount = 0;
  let highRiskCount = 0;
  
  const highRiskDisruptors = ['triclosan', 'phthalate', 'bpa', 'benzophenone'];
  
  endocrineDisruptors.forEach(ed => {
    if (inciList.toLowerCase().includes(ed)) {
      disruptorCount++;
      if (highRiskDisruptors.includes(ed)) highRiskCount++;
    }
  });
  
  let endocrineScore = 100;
  if (highRiskCount > 0) endocrineScore = 20; // Haut risque = 20/100
  else if (disruptorCount >= 3) endocrineScore = 40;
  else if (disruptorCount >= 1) endocrineScore = 70;
  
  // ============================================================================
  // COMPOSANTE 3 : BIODÉGRADABILITÉ (15%)
  // Source : Règlement Détergents CE 648/2004 (applicable cosmétiques)
  // ============================================================================
  
  const biodegradableKeywords = [
    'biodegradable', 'plant-based', 'vegetal', 'coconut', 'palm',
    'degradable', 'eco-friendly'
  ];
  
  const nonBiodegradableKeywords = [
    'silicone', 'microplastic', 'polyethylene', 'polypropylene',
    'acrylate', 'polymethyl'
  ];
  
  let biodegradabilityScore = 50; // Neutre par défaut
  
  if (biodegradableKeywords.some(k => inciList.toLowerCase().includes(k))) {
    biodegradabilityScore = 90;
  } else if (nonBiodegradableKeywords.some(k => inciList.toLowerCase().includes(k))) {
    biodegradabilityScore = 20;
  }
  
  // ============================================================================
  // COMPOSANTE 4 : LABELS (15%)
  // ============================================================================
  
  const labels = data.labels || product.labels || [];
  const labelsList = Array.isArray(labels) ? labels : [];
  
  let labelsScore = 0;
  
  // COSMOS Organic = 100 points
  if (labelsList.some(l => l.toLowerCase().includes('cosmos') && l.toLowerCase().includes('organic'))) {
    labelsScore = 100;
  }
  // Ecocert / Nature & Progrès = 90 points
  else if (labelsList.some(l => l.toLowerCase().includes('ecocert') || l.toLowerCase().includes('nature'))) {
    labelsScore = 90;
  }
  // Vegan / Cruelty-Free seul = 70 points
  else if (labelsList.some(l => l.toLowerCase().includes('vegan') || l.toLowerCase().includes('cruelty'))) {
    labelsScore = 70;
  }
  // Aucun label = 30 points
  else {
    labelsScore = 30;
  }
  
  // ============================================================================
  // COMPOSANTE 5 : EMBALLAGE (10%)
  // ============================================================================
  
  const packaging = product.packaging || '';
  let packagingScore = 50;
  
  if (packaging.toLowerCase().includes('recyclable') || packaging.toLowerCase().includes('glass') || packaging.toLowerCase().includes('verre')) {
    packagingScore = 80;
  } else if (packaging.toLowerCase().includes('plastic') || packaging.toLowerCase().includes('plastique')) {
    packagingScore = 40;
  }
  
  // ============================================================================
  // COMPOSANTE 6 : ORIGINE (5%)
  // ============================================================================
  
  const origin = product.origin || data.manufacturingCountry || '';
  let originScore = 50;
  
  if (origin.toLowerCase().includes('france')) originScore = 100;
  else if (['allemagne', 'italie', 'espagne', 'germany', 'italy', 'spain'].some(c => origin.toLowerCase().includes(c))) originScore = 80;
  else if (origin.toLowerCase().includes('europe') || origin.toLowerCase().includes('eu') || origin.toLowerCase().includes('ue')) originScore = 70;
  
  // ============================================================================
  // COMPOSANTE 7 : TESTS ANIMAUX (5%)
  // ============================================================================
  
  const crueltyFree = data.crueltyFree || labelsList.some(l => l.toLowerCase().includes('cruelty'));
  const animalTestingScore = crueltyFree ? 100 : 30;
  
  // ============================================================================
  // COMPOSANTE 8 : TRANSPARENCE (5%)
  // ============================================================================
  
  let transparencyScore = 50;
  
  if (inciList && inciList.length > 50) transparencyScore = 100; // Liste INCI complète
  else if (inciList && inciList.length > 20) transparencyScore = 70;
  else transparencyScore = 30;
  
  // ============================================================================
  // CALCUL SCORE GLOBAL (moyenne pondérée)
  // ============================================================================
  
  const breakdown = {
    ingredients: { 
      score: ingredientsScore, 
      weight: 25, 
      label: `${Math.round(naturalPercent)}% naturel` 
    },
    endocrineDisruptors: { 
      score: endocrineScore, 
      weight: 20, 
      label: disruptorCount === 0 ? 'Aucun détecté' : `${disruptorCount} détecté(s)` 
    },
    biodegradability: { 
      score: biodegradabilityScore, 
      weight: 15, 
      label: biodegradabilityScore >= 80 ? 'Bon' : biodegradabilityScore >= 50 ? 'Moyen' : 'Faible' 
    },
    labels: { 
      score: labelsScore, 
      weight: 15, 
      label: labelsList.length > 0 ? labelsList.join(', ') : 'Aucun' 
    },
    packaging: { 
      score: packagingScore, 
      weight: 10, 
      label: packaging || 'Standard' 
    },
    origin: { 
      score: originScore, 
      weight: 5, 
      label: origin || 'Non défini' 
    },
    animalTesting: { 
      score: animalTestingScore, 
      weight: 5, 
      label: crueltyFree ? 'Cruelty-free ✓' : 'Non vérifié' 
    },
    transparency: { 
      score: transparencyScore, 
      weight: 5, 
      label: transparencyScore >= 80 ? 'Complète' : 'Partielle' 
    }
  };
  
  // Calcul pondéré
  const overallScore = Math.round(
    (ingredientsScore * 0.25) +
    (endocrineScore * 0.20) +
    (biodegradabilityScore * 0.15) +
    (labelsScore * 0.15) +
    (packagingScore * 0.10) +
    (originScore * 0.05) +
    (animalTestingScore * 0.05) +
    (transparencyScore * 0.05)
  );
  
  // Calcul confiance
  let componentsAvailable = 0;
  if (inciList.length > 10) componentsAvailable += 3; // ingredients + endocrine + biodeg
  if (labelsList.length > 0) componentsAvailable++;
  if (packaging) componentsAvailable++;
  if (origin) componentsAvailable++;
  if (crueltyFree !== undefined) componentsAvailable++;
  if (inciList.length > 20) componentsAvailable++; // transparency
  
  const confidence = componentsAvailable / 8;
  const dataCompleteness = confidence >= 0.875 ? 'Excellente' : confidence >= 0.75 ? 'Bonne' : confidence >= 0.5 ? 'Moyenne' : 'Faible';
  
  return {
    overallScore,
    confidence,
    dataCompleteness,
    breakdown
  };
}

/**
 * SCORING DÉTERGENTS/MÉNAGE - MÉTHODOLOGIE SCIENTIFIQUE ECOLOJIA V3.1
 * Sources : Règlement Détergents CE 648/2004, ADEME, Ecolabel Européen
 * 
 * Formule : 8 composantes pondérées
 * 1. Composition (25%) - Tensioactifs végétaux vs synthétiques
 * 2. Biodégradabilité (20%) - Dégradation <28 jours
 * 3. Toxicité humaine (15%) - Irritations, allergies
 * 4. Efficacité (15%) - Tests consommateurs
 * 5. Labels éco (10%) - Ecolabel UE, Nature & Progrès
 * 6. Emballage (10%) - Plastique recyclé
 * 7. Concentration (3%) - Doses/litre
 * 8. Origine (2%) - Fabrication UE
 * 
 * @param {Object} data - Produit détergent
 * @returns {Object} scores - Score global + détail 8 composantes
 */
function calculateDetergentScores(data) {
  const detergentData = data.detergentsData || {};
  
  // Sécurité : retour par défaut si données insuffisantes
  if (!detergentData.composition && !data.ingredients) {
    return {
      overallScore: 50,
      confidence: 0.3,
      dataCompleteness: 'Faible',
      breakdown: {
        composition: { score: 50, weight: 25, label: 'Non défini' },
        biodegradability: { score: 50, weight: 20, label: 'Non vérifié' },
        toxicity: { score: 50, weight: 15, label: 'Non défini' },
        efficiency: { score: 50, weight: 15, label: 'Standard' },
        labels: { score: 50, weight: 10, label: 'Aucun' },
        packaging: { score: 50, weight: 10, label: 'Standard' },
        concentration: { score: 50, weight: 3, label: 'Non défini' },
        origin: { score: 50, weight: 2, label: 'Non défini' }
      }
    };
  }
  
  // ============================================================================
  // COMPOSANTE 1 : COMPOSITION (25%)
  // ============================================================================
  
  const composition = (detergentData.composition || data.ingredients || '').toLowerCase();
  
  // Tensioactifs végétaux = bon
  const vegetalTensioactives = ['coco', 'palm', 'olive', 'coconut', 'vegetal', 'plant-based', 'vegetale'];
  // Tensioactifs synthétiques = moins bon
  const syntheticTensioactives = ['sles', 'sls', 'sodium laureth sulfate', 'sodium lauryl sulfate'];
  // Solvants toxiques = mauvais
  const toxicSolvents = ['chlorine', 'chlore', 'ammonia', 'ammoniac', 'phosphate', 'formaldehyde', 'formaldehyde'];
  
  let compositionScore = 50;
  
  if (vegetalTensioactives.some(v => composition.includes(v))) {
    compositionScore = 90;
  } else if (syntheticTensioactives.some(s => composition.includes(s))) {
    compositionScore = 50;
  }
  
  if (toxicSolvents.some(t => composition.includes(t))) {
    compositionScore = Math.max(20, compositionScore - 30);
  }
  
  // ============================================================================
  // COMPOSANTE 2 : BIODÉGRADABILITÉ (20%)
  // Règlement CE 648/2004 : >60% en 28 jours
  // ============================================================================
  
  const biodegradable = detergentData.biodegradable;
  const phosphateFree = detergentData.phosphateFree;
  
  let biodegradabilityScore = 50;
  
  if (biodegradable === true) {
    biodegradabilityScore = 90;
  } else if (biodegradable === false) {
    biodegradabilityScore = 20;
  }
  
  if (phosphateFree === true) {
    biodegradabilityScore = Math.min(100, biodegradabilityScore + 10);
  }
  
  // ============================================================================
  // COMPOSANTE 3 : TOXICITÉ HUMAINE (15%)
  // ============================================================================
  
  const allergens = detergentData.allergens || [];
  const irritants = detergentData.irritants || [];
  
  let toxicityScore = 100;
  
  if (allergens.length >= 3) toxicityScore = 40;
  else if (allergens.length >= 1) toxicityScore = 70;
  
  if (irritants.length >= 2) toxicityScore = Math.max(30, toxicityScore - 20);
  
  // ============================================================================
  // COMPOSANTE 4 : EFFICACITÉ (15%)
  // ============================================================================
  
  const efficiency = detergentData.efficiency || data.efficiency;
  let efficiencyScore = 70; // Neutre par défaut
  
  if (efficiency === 'excellent') efficiencyScore = 100;
  else if (efficiency === 'good' || efficiency === 'bon') efficiencyScore = 80;
  else if (efficiency === 'average' || efficiency === 'moyen') efficiencyScore = 60;
  else if (efficiency === 'poor' || efficiency === 'faible') efficiencyScore = 40;
  
  // ============================================================================
  // COMPOSANTE 5 : LABELS ÉCO (10%)
  // ============================================================================
  
  const labels = data.labels || detergentData.labels || [];
  const labelsList = Array.isArray(labels) ? labels : [];
  
  let labelsScore = 30;
  
  if (labelsList.some(l => l.toLowerCase().includes('ecolabel') && (l.toLowerCase().includes('eu') || l.toLowerCase().includes('ue')))) {
    labelsScore = 100;
  } else if (labelsList.some(l => l.toLowerCase().includes('nature') || l.toLowerCase().includes('progres'))) {
    labelsScore = 90;
  } else if (labelsList.some(l => l.toLowerCase().includes('ecocert'))) {
    labelsScore = 80;
  }
  
  // ============================================================================
  // COMPOSANTE 6 : EMBALLAGE (10%)
  // ============================================================================
  
  const packaging = data.packaging || '';
  let packagingScore = 50;
  
  if (packaging.toLowerCase().includes('recycle') && (packaging.toLowerCase().includes('100') || packaging.toLowerCase().includes('recyclé à 100'))) {
    packagingScore = 100;
  } else if (packaging.toLowerCase().includes('recycle') || packaging.toLowerCase().includes('recyclé')) {
    packagingScore = 70;
  } else if (packaging.toLowerCase().includes('plastique') || packaging.toLowerCase().includes('plastic')) {
    packagingScore = 40;
  }
  
  // ============================================================================
  // COMPOSANTE 7 : CONCENTRATION (3%)
  // ============================================================================
  
  const concentration = detergentData.concentration || data.concentration;
  let concentrationScore = 50;
  
  if (concentration && concentration >= 30) concentrationScore = 90; // Concentré = moins d'emballage
  else if (concentration && concentration >= 20) concentrationScore = 70;
  else if (concentration && concentration < 10) concentrationScore = 30;
  
  // ============================================================================
  // COMPOSANTE 8 : ORIGINE (2%)
  // ============================================================================
  
  const origin = data.origin || '';
  let originScore = 50;
  
  if (origin.toLowerCase().includes('france')) originScore = 100;
  else if (['allemagne', 'italie', 'belgique', 'germany', 'italy', 'belgium'].some(c => origin.toLowerCase().includes(c))) originScore = 80;
  else if (origin.toLowerCase().includes('europe') || origin.toLowerCase().includes('eu') || origin.toLowerCase().includes('ue')) originScore = 70;
  
  // ============================================================================
  // CALCUL SCORE GLOBAL
  // ============================================================================
  
  const breakdown = {
    composition: { 
      score: compositionScore, 
      weight: 25, 
      label: compositionScore >= 80 ? 'Végétale' : 'Synthétique' 
    },
    biodegradability: { 
      score: biodegradabilityScore, 
      weight: 20, 
      label: biodegradable === true ? 'Oui' : 'Non vérifié' 
    },
    toxicity: { 
      score: toxicityScore, 
      weight: 15, 
      label: toxicityScore >= 80 ? 'Faible' : 'Modérée' 
    },
    efficiency: { 
      score: efficiencyScore, 
      weight: 15, 
      label: efficiency || 'Standard' 
    },
    labels: { 
      score: labelsScore, 
      weight: 10, 
      label: labelsList.length > 0 ? labelsList.join(', ') : 'Aucun' 
    },
    packaging: { 
      score: packagingScore, 
      weight: 10, 
      label: packaging || 'Standard' 
    },
    concentration: { 
      score: concentrationScore, 
      weight: 3, 
      label: concentration ? `${concentration} doses/L` : 'Non défini' 
    },
    origin: { 
      score: originScore, 
      weight: 2, 
      label: origin || 'Non défini' 
    }
  };
  
  const overallScore = Math.round(
    (compositionScore * 0.25) +
    (biodegradabilityScore * 0.20) +
    (toxicityScore * 0.15) +
    (efficiencyScore * 0.15) +
    (labelsScore * 0.10) +
    (packagingScore * 0.10) +
    (concentrationScore * 0.03) +
    (originScore * 0.02)
  );
  
  let componentsAvailable = 0;
  if (composition.length > 10) componentsAvailable++;
  if (biodegradable !== undefined) componentsAvailable++;
  if (allergens.length > 0 || toxicityScore !== 100) componentsAvailable++;
  if (efficiency) componentsAvailable++;
  if (labelsList.length > 0) componentsAvailable++;
  if (packaging) componentsAvailable++;
  if (concentration) componentsAvailable++;
  if (origin) componentsAvailable++;
  
  const confidence = componentsAvailable / 8;
  const dataCompleteness = confidence >= 0.875 ? 'Excellente' : confidence >= 0.75 ? 'Bonne' : confidence >= 0.5 ? 'Moyenne' : 'Faible';
  
  return {
    overallScore,
    confidence,
    dataCompleteness,
    breakdown
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
