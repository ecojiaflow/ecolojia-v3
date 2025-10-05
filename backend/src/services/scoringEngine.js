// ============================================================================
// ECOLOJIA SCORING ENGINE v3.0 - Approche Scientifique Multi-Critères
// ============================================================================
// Différenciation vs Yuka :
// - 3 catégories au lieu de 2 (food + cosmetics + detergents)
// - 4 dimensions par catégorie (santé, environnement, éthique, efficacité)
// - Pondérations basées sur études scientifiques
// ============================================================================

// ============================================================================
// 1. ALIMENTAIRE - 4 critères pondérés
// ============================================================================

function calculateFoodScores(product) {
  const { novaGroup, nutriScore, ecoScore, additives = [], allergens = [], labels = [] } = product;

  // SANTÉ (60% du score global)
  const novaScore = novaToHealthScore(novaGroup);           // 40%
  const nutriScoreValue = nutriToHealthScore(nutriScore);   // 40% 
  const additivePenalty = calculateAdditivePenalty(additives); // 20%
  
  const healthScore = Math.round(
    novaScore * 0.4 + 
    nutriScoreValue * 0.4 + 
    (100 - additivePenalty) * 0.2
  );

  // ENVIRONNEMENT (30% du score global)
  const ecoScoreValue = ecoToEnvironmentScore(ecoScore);    // 60%
  const packagingImpact = calculatePackagingScore(product); // 25%
  const originImpact = calculateOriginScore(product);       // 15%

  const environmentScore = Math.round(
    ecoScoreValue * 0.6 + 
    packagingImpact * 0.25 + 
    originImpact * 0.15
  );

  // ÉTHIQUE (10% du score global)
  const ethicsScore = calculateEthicsScore(labels);

  // Score global pondéré
  const overallScore = Math.round(
    healthScore * 0.6 + 
    environmentScore * 0.3 + 
    ethicsScore * 0.1
  );

  return {
    healthScore,
    environmentScore,
    ethicsScore,
    overallScore,
    breakdown: {
      nova: { score: novaScore, weight: 24 }, // 40% de 60%
      nutriscore: { score: nutriScoreValue, weight: 24 },
      additives: { score: 100 - additivePenalty, weight: 12 },
      ecoscore: { score: ecoScoreValue, weight: 18 },
      packaging: { score: packagingImpact, weight: 7.5 },
      origin: { score: originImpact, weight: 4.5 },
      ethics: { score: ethicsScore, weight: 10 }
    }
  };
}

// ============================================================================
// 2. COSMÉTIQUE - Approche EWG + INCI
// ============================================================================

function calculateCosmeticScores(product) {
  const { ingredients = [], endocrineDisruptors = [], allergens = [], certifications = [] } = product;

  // SÉCURITÉ (50%)
  const inciScore = calculateINCI_Score(ingredients);              // 50%
  const endoPenalty = endocrineDisruptors.length * 15;            // -15 par perturbateur
  const allergenPenalty = allergens.length * 10;                  // -10 par allergène

  const safetyScore = Math.max(0, Math.round(
    inciScore * 0.5 - endoPenalty - allergenPenalty
  ));

  // EFFICACITÉ (30%) - Basé sur actifs prouvés
  const efficacyScore = calculateEfficacyScore(ingredients);

  // ÉTHIQUE (20%)
  const ethicsScore = calculateCosmeticEthics(certifications, product);

  const overallScore = Math.round(
    safetyScore * 0.5 + 
    efficacyScore * 0.3 + 
    ethicsScore * 0.2
  );

  return {
    safetyScore,
    efficacyScore,
    ethicsScore,
    overallScore,
    breakdown: {
      inci: { score: inciScore, weight: 25 },
      endocrine: { penalty: endoPenalty, weight: 25 },
      allergens: { penalty: allergenPenalty, weight: 0 },
      actives: { score: efficacyScore, weight: 30 },
      certifications: { score: ethicsScore, weight: 20 }
    }
  };
}

// ============================================================================
// 3. DÉTERGENT - Impact aquatique + biodégradabilité
// ============================================================================

function calculateDetergentScores(product) {
  const { surfactants = [], composition = [], ecoLabels = [], phosphates = false } = product;

  // ENVIRONNEMENT (60%)
  const biodegScore = calculateBiodegradability(surfactants);     // 50%
  const aquaticImpact = calculateAquaticImpact(composition);      // 30%
  const phosphatePenalty = phosphates ? 30 : 0;                   // -30 si présents
  
  const environmentScore = Math.max(0, Math.round(
    biodegScore * 0.5 + 
    aquaticImpact * 0.3 + 
    (100 - phosphatePenalty) * 0.2
  ));

  // EFFICACITÉ (25%)
  const cleaningScore = calculateCleaningPower(surfactants, composition);

  // SÉCURITÉ (15%)
  const skinSafetyScore = calculateSkinSafety(composition);

  const overallScore = Math.round(
    environmentScore * 0.6 + 
    cleaningScore * 0.25 + 
    skinSafetyScore * 0.15
  );

  return {
    environmentScore,
    cleaningScore,
    skinSafetyScore,
    overallScore,
    breakdown: {
      biodegradability: { score: biodegScore, weight: 30 },
      aquatic: { score: aquaticImpact, weight: 18 },
      phosphates: { penalty: phosphatePenalty, weight: 12 },
      cleaning: { score: cleaningScore, weight: 25 },
      skin: { score: skinSafetyScore, weight: 15 }
    }
  };
}

// ============================================================================
// FONCTIONS UTILITAIRES - ALIMENTAIRE
// ============================================================================

function novaToHealthScore(nova) {
  const mapping = {
    1: 100, // Non transformé
    2: 75,  // Ingrédients culinaires
    3: 50,  // Transformé
    4: 25   // Ultra-transformé
  };
  return mapping[nova] || 50;
}

function nutriToHealthScore(nutri) {
  const mapping = {
    'A': 100, 'a': 100,
    'B': 80,  'b': 80,
    'C': 60,  'c': 60,
    'D': 40,  'd': 40,
    'E': 20,  'e': 20
  };
  return mapping[nutri] || 50;
}

function ecoToEnvironmentScore(eco) {
  const mapping = {
    'A': 100, 'a': 100,
    'B': 80,  'b': 80,
    'C': 60,  'c': 60,
    'D': 40,  'd': 40,
    'E': 20,  'e': 20
  };
  return mapping[eco] || 50;
}

function calculateAdditivePenalty(additives) {
  const redList = [
    'E150c', 'E150d', // Caramels sulfite
    'E621', 'E622', 'E623', // Glutamates
    'E250', 'E251', 'E252', // Nitrites/Nitrates
    'E320', 'E321', // BHA/BHT
    'E951', // Aspartame
    'E104', 'E110', 'E122', 'E124', 'E129' // Colorants azoïques
  ];

  const orangeList = ['E330', 'E202', 'E211', 'E212'];

  let penalty = 0;
  additives.forEach(add => {
    if (redList.includes(add)) penalty += 15;
    else if (orangeList.includes(add)) penalty += 5;
  });

  return Math.min(penalty, 100);
}

function calculatePackagingScore(product) {
  const packaging = product.packaging || product.packagingType || '';
  
  if (packaging.includes('vrac') || packaging.includes('consigne')) return 100;
  if (packaging.includes('verre') || packaging.includes('glass')) return 80;
  if (packaging.includes('carton') || packaging.includes('cardboard')) return 70;
  if (packaging.includes('plastique recyclable')) return 50;
  if (packaging.includes('plastique')) return 30;
  
  return 50; // Défaut
}

function calculateOriginScore(product) {
  const origin = product.origin || product.countries || '';
  
  if (origin.includes('France') || origin.includes('fr:')) return 100;
  if (origin.includes('Europe') || origin.includes('EU')) return 80;
  if (origin.includes('Afrique') || origin.includes('Maghreb')) return 70;
  if (origin.includes('Asie') || origin.includes('Amérique')) return 40;
  
  return 60;
}

function calculateEthicsScore(labels) {
  let score = 50; // Base
  
  const ethicalLabels = ['bio', 'organic', 'fairtrade', 'commerce-equitable', 'rainforest', 'max-havelaar'];
  
  labels.forEach(label => {
    const l = label.toLowerCase();
    if (ethicalLabels.some(el => l.includes(el))) score += 10;
  });

  return Math.min(score, 100);
}

// ============================================================================
// FONCTIONS UTILITAIRES - COSMÉTIQUE
// ============================================================================

function calculateINCI_Score(ingredients) {
  // Score basé EWG (Environmental Working Group)
  const greenList = ['aqua', 'glycerin', 'aloe', 'shea butter', 'argan oil'];
  const yellowList = ['alcohol', 'fragrance', 'parfum'];
  const redList = ['paraben', 'sulfate', 'peg-', 'phenoxyethanol', 'triclosan'];

  let score = 100;
  let greenCount = 0;

  ingredients.forEach(ing => {
    // Support both string and object format
    const ingredient = typeof ing === 'string' ? ing : (ing.inci || ing.name || '');
    const i = ingredient.toLowerCase();
    if (greenList.some(g => i.includes(g))) greenCount++;
    if (yellowList.some(y => i.includes(y))) score -= 5;
    if (redList.some(r => i.includes(r))) score -= 15;
  });

  score += greenCount * 2; // Bonus ingrédients naturels
  return Math.max(0, Math.min(100, score));
}

function calculateEfficacyScore(ingredients) {
  const activesList = [
    'retinol', 'vitamin c', 'niacinamide', 'hyaluronic acid',
    'salicylic acid', 'glycolic acid', 'peptides', 'ceramides'
  ];

  let score = 40; // Base faible
  
  ingredients.forEach(ing => {
    // Support both string and object format
    const ingredient = typeof ing === 'string' ? ing : (ing.inci || ing.name || '');
    const i = ingredient.toLowerCase();
    if (activesList.some(a => i.includes(a))) score += 15;
  });

  return Math.min(score, 100);
}

function calculateCosmeticEthics(certifications, product) {
  let score = 50;

  const ethicalCerts = ['cruelty-free', 'vegan', 'ecocert', 'cosmebio', 'natrue', 'usda organic'];
  
  certifications.forEach(cert => {
    const c = cert.toLowerCase();
    if (ethicalCerts.some(ec => c.includes(ec))) score += 12;
  });

  if (product.testedOnAnimals === false) score += 15;
  
  return Math.min(score, 100);
}

// ============================================================================
// FONCTIONS UTILITAIRES - DÉTERGENT
// ============================================================================

function calculateBiodegradability(surfactants) {
  const biodegradable = ['coco glucoside', 'decyl glucoside', 'lauryl glucoside', 'soap'];
  const partial = ['sls', 'sles', 'sodium lauryl sulfate'];
  const poor = ['alkylbenzene', 'nonylphenol'];

  let score = 50;

  surfactants.forEach(surf => {
    const s = surf.toLowerCase();
    if (biodegradable.some(b => s.includes(b))) score += 15;
    else if (partial.some(p => s.includes(p))) score += 5;
    else if (poor.some(p => s.includes(p))) score -= 20;
  });

  return Math.max(0, Math.min(100, score));
}

function calculateAquaticImpact(composition) {
  const toxic = ['phosphate', 'chlorine', 'ammonia', 'edta'];
  const moderate = ['citric acid', 'sodium carbonate'];
  const safe = ['enzyme', 'oxygen', 'plant-based'];

  let score = 60;

  composition.forEach(comp => {
    const c = comp.toLowerCase();
    if (toxic.some(t => c.includes(t))) score -= 25;
    else if (safe.some(s => c.includes(s))) score += 10;
    else if (moderate.some(m => c.includes(m))) score += 5;
  });

  return Math.max(0, Math.min(100, score));
}

function calculateCleaningPower(surfactants, composition) {
  // Tensioactifs efficaces
  const powerful = ['sls', 'sles', 'alkyl polyglucoside'];
  const moderate = ['soap', 'coco glucoside'];

  let score = 40;

  surfactants.forEach(surf => {
    const s = surf.toLowerCase();
    if (powerful.some(p => s.includes(p))) score += 20;
    else if (moderate.some(m => s.includes(m))) score += 10;
  });

  // Enzymes = boost
  composition.forEach(comp => {
    if (comp.toLowerCase().includes('enzyme')) score += 15;
  });

  return Math.min(score, 100);
}

function calculateSkinSafety(composition) {
  const irritant = ['chlorine', 'ammonia', 'phenol', 'formaldehyde'];
  const safe = ['hypoallergenic', 'dermatologically tested', 'ph neutral'];

  let score = 70;

  composition.forEach(comp => {
    const c = comp.toLowerCase();
    if (irritant.some(i => c.includes(i))) score -= 20;
    if (safe.some(s => c.includes(s))) score += 10;
  });

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// EXPORT
// ============================================================================

module.exports = {
  calculateFoodScores,
  calculateCosmeticScores,
  calculateDetergentScores
};
