// backend/src/services/ScoringEngineV3.js
/**
 * Moteur de scoring scientifique ECOLOJIA V3
 * PRINCIPE : Calculer uniquement sur données disponibles
 * Pondération dynamique selon disponibilité
 */

/**
 * Configuration des composantes et leurs poids
 */
const COMPONENTS_CONFIG = {
  food: {
    nova: { weight: 0.15, name: 'NOVA' },
    nutriScore: { weight: 0.20, name: 'Nutri-Score' },
    additives: { weight: 0.15, name: 'Additifs' },
    sugars: { weight: 0.10, name: 'Sucres' },
    saturatedFat: { weight: 0.10, name: 'Graisses saturées' },
    salt: { weight: 0.10, name: 'Sel' },
    ecoScore: { weight: 0.15, name: 'Eco-Score' },
    labels: { weight: 0.05, name: 'Labels' }
  },
  cosmetics: {
    ingredients: { weight: 0.40, name: 'Ingrédients' },
    allergens: { weight: 0.20, name: 'Allergènes' },
    endocrineDisruptors: { weight: 0.25, name: 'Perturbateurs endocriniens' },
    certifications: { weight: 0.15, name: 'Certifications' }
  },
  detergents: {
    composition: { weight: 0.35, name: 'Composition' },
    surfactants: { weight: 0.30, name: 'Tensioactifs' },
    ecoLabels: { weight: 0.25, name: 'Labels écologiques' },
    packaging: { weight: 0.10, name: 'Emballage' }
  }
};

/**
 * Calcule le score d'un produit (toutes catégories)
 * @param {Object} normalizedProduct - Produit normalisé par DataNormalizer
 * @returns {Object} Scores avec métadonnées complètes
 */
function calculateScore(normalizedProduct) {
  const category = normalizedProduct.category || 'food';
  const config = COMPONENTS_CONFIG[category];
  
  if (!config) {
    throw new Error(`Catégorie non supportée: ${category}`);
  }
  
  // Calculer chaque composante
  const components = {};
  const availableComponents = [];
  const missingComponents = [];
  let totalAvailableWeight = 0;
  
  for (const [key, componentConfig] of Object.entries(config)) {
    const result = calculateComponent(key, normalizedProduct, category);
    
    components[key] = result;
    
    if (result.available) {
      availableComponents.push(key);
      totalAvailableWeight += componentConfig.weight;
    } else {
      missingComponents.push(key);
    }
  }
  
  // Vérifier si on peut calculer un score
  if (availableComponents.length === 0) {
    return {
      canScore: false,
      reason: 'Aucune donnée disponible pour calculer un score',
      overallScore: null,
      confidence: 0,
      breakdown: components,
      missingComponents: missingComponents,
      availableComponents: []
    };
  }
  
  // Recalculer les poids proportionnellement
  const adjustedComponents = {};
  let weightedSum = 0;
  
  for (const [key, component] of Object.entries(components)) {
    if (component.available) {
      const originalWeight = config[key].weight;
      const adjustedWeight = originalWeight / totalAvailableWeight; // Normaliser sur 100%
      
      adjustedComponents[key] = {
        ...component,
        originalWeight: originalWeight,
        adjustedWeight: adjustedWeight,
        contribution: component.score * adjustedWeight
      };
      
      weightedSum += component.score * adjustedWeight;
    } else {
      adjustedComponents[key] = {
        ...component,
        originalWeight: config[key].weight,
        adjustedWeight: 0,
        contribution: 0
      };
    }
  }
  
  // Score final
  const overallScore = Math.round(weightedSum);
  
  // Confiance = % de poids original disponible (0-1)
  const confidence = totalAvailableWeight; // Déjà entre 0 et 1
  
  // Niveau de complétude (convertir 0-1 en 0-100 pour comparaison)
  const confidencePercent = confidence * 100;
  let completenessLevel;
  if (confidencePercent >= 90) completenessLevel = 'EXCELLENT';
  else if (confidencePercent >= 70) completenessLevel = 'BON';
  else if (confidencePercent >= 50) completenessLevel = 'MOYEN';
  else completenessLevel = 'FAIBLE';
  
  return {
    canScore: true,
    overallScore: overallScore,
    confidence: confidence,
    completenessLevel: completenessLevel,
    breakdown: adjustedComponents,
    availableComponents: availableComponents,
    missingComponents: missingComponents,
    metadata: {
      category: category,
      totalComponents: Object.keys(config).length,
      availableCount: availableComponents.length,
      missingCount: missingComponents.length,
      calculatedAt: new Date(),
      scoringVersion: '3.1.0-scientific'
    }
  };
}

/**
 * Calcule une composante individuelle
 * @returns {Object} { available: boolean, score: number|null, details: {...} }
 */
function calculateComponent(componentKey, product, category) {
  if (category === 'food') {
    return calculateFoodComponent(componentKey, product);
  } else if (category === 'cosmetics') {
    return calculateCosmeticComponent(componentKey, product);
  } else if (category === 'detergents') {
    return calculateDetergentComponent(componentKey, product);
  }
  
  return { available: false, score: null, reason: 'Catégorie non supportée' };
}

/**
 * Calcule composante alimentaire
 */
function calculateFoodComponent(key, product) {
  const foodData = product.foodData || {};
  const nutrition = foodData.nutritionalInfo || {};
  
  switch (key) {
    case 'nova':
      if (foodData.novaGroup && [1,2,3,4].includes(foodData.novaGroup)) {
        const scores = { 1: 100, 2: 75, 3: 50, 4: 25 };
        return {
          available: true,
          score: scores[foodData.novaGroup],
          value: foodData.novaGroup,
          label: `Groupe ${foodData.novaGroup}`,
          explanation: getNovaExplanation(foodData.novaGroup)
        };
      }
      return { available: false, score: null, reason: 'NOVA non renseigné' };
      
    case 'nutriScore':
      if (foodData.nutriScore && ['A','B','C','D','E'].includes(foodData.nutriScore)) {
        const scores = { A: 100, B: 75, C: 50, D: 30, E: 15 };
        return {
          available: true,
          score: scores[foodData.nutriScore],
          value: foodData.nutriScore,
          label: `Nutri-Score ${foodData.nutriScore}`,
          explanation: getNutriScoreExplanation(foodData.nutriScore)
        };
      }
      return { available: false, score: null, reason: 'Nutri-Score non calculé' };
      
    case 'additives':
      if (foodData.additives && Array.isArray(foodData.additives)) {
        const count = foodData.additives.length;
        const dangerous = foodData.additives.filter(a => 
          a.riskLevel === 'HIGH' || a.riskLevel === 'MEDIUM'
        ).length;
        
        let score;
        if (count === 0) score = 100;
        else if (dangerous > 0) score = 30;
        else if (count <= 3) score = 70;
        else score = 50;
        
        return {
          available: true,
          score: score,
          count: count,
          dangerous: dangerous,
          label: `${count} additif(s)`,
          explanation: getAdditivesExplanation(count, dangerous)
        };
      }
      return { available: false, score: null, reason: 'Liste additifs inconnue' };
      
    case 'sugars':
      if (nutrition.sugars !== null && nutrition.sugars !== undefined) {
        const sugars = nutrition.sugars;
        let score;
        if (sugars < 5) score = 100;
        else if (sugars < 10) score = 75;
        else if (sugars < 15) score = 50;
        else if (sugars < 25) score = 30;
        else score = 15;
        
        const morceaux = Math.round(sugars / 5);
        
        return {
          available: true,
          score: score,
          value: sugars,
          unit: 'g/100g',
          label: `${sugars}g/100g`,
          equivalent: `${morceaux} morceau${morceaux > 1 ? 'x' : ''} de sucre`,
          explanation: getSugarsExplanation(sugars)
        };
      }
      return { available: false, score: null, reason: 'Teneur en sucres non renseignée' };
      
    case 'saturatedFat':
      if (nutrition.saturatedFat !== null && nutrition.saturatedFat !== undefined) {
        const fat = nutrition.saturatedFat;
        let score;
        if (fat < 1) score = 100;
        else if (fat < 3) score = 75;
        else if (fat < 5) score = 50;
        else if (fat < 10) score = 30;
        else score = 15;
        
        const cuilleres = Math.round(fat / 5);
        
        return {
          available: true,
          score: score,
          value: fat,
          unit: 'g/100g',
          label: `${fat}g/100g`,
          equivalent: `${cuilleres} cuillère${cuilleres > 1 ? 's' : ''} à café de beurre`,
          explanation: getFatExplanation(fat)
        };
      }
      return { available: false, score: null, reason: 'Teneur en graisses saturées non renseignée' };
      
    case 'salt':
      if (nutrition.salt !== null && nutrition.salt !== undefined) {
        const salt = nutrition.salt;
        let score;
        if (salt < 0.3) score = 100;
        else if (salt < 0.6) score = 75;
        else if (salt < 1.0) score = 50;
        else if (salt < 1.5) score = 30;
        else score = 15;
        
        const pincees = Math.round(salt / 0.5);
        
        return {
          available: true,
          score: score,
          value: salt,
          unit: 'g/100g',
          label: `${salt}g/100g`,
          equivalent: `${pincees} pincée${pincees > 1 ? 's' : ''} de sel`,
          explanation: getSaltExplanation(salt)
        };
      }
      return { available: false, score: null, reason: 'Teneur en sel non renseignée' };
      
    case 'ecoScore':
      if (foodData.ecoScore && ['A','B','C','D','E'].includes(foodData.ecoScore)) {
        const scores = { A: 100, B: 75, C: 50, D: 30, E: 15 };
        return {
          available: true,
          score: scores[foodData.ecoScore],
          value: foodData.ecoScore,
          label: `Eco-Score ${foodData.ecoScore}`,
          explanation: getEcoScoreExplanation(foodData.ecoScore)
        };
      }
      return { available: false, score: null, reason: 'Eco-Score non calculé' };
      
    case 'labels':
      if (foodData.labels && Array.isArray(foodData.labels)) {
        const isBio = foodData.labels.some(l => 
          l.includes('bio') || l.includes('organic')
        );
        const score = isBio ? 100 : 50;
        
        return {
          available: true,
          score: score,
          list: foodData.labels,
          isBio: isBio,
          label: isBio ? 'Bio certifié' : 'Aucun label significatif',
          explanation: isBio ? 'Produit certifié agriculture biologique' : 'Pas de certification bio'
        };
      }
      return { available: false, score: null, reason: 'Labels non renseignés' };
      
    default:
      return { available: false, score: null, reason: 'Composante inconnue' };
  }
}

/**
 * Calcule composante cosmétique (à implémenter)
 */
function calculateCosmeticComponent(key, product) {
  // TODO: Implémenter scoring cosmétiques
  return { available: false, score: null, reason: 'Non implémenté' };
}

/**
 * Calcule composante détergent (à implémenter)
 */
function calculateDetergentComponent(key, product) {
  // TODO: Implémenter scoring détergents
  return { available: false, score: null, reason: 'Non implémenté' };
}

// Fonctions d'explication (inchangées)
function getNovaExplanation(group) {
  const explanations = {
    1: 'Aliments non transformés ou minimalement transformés',
    2: 'Ingrédients culinaires transformés',
    3: 'Aliments transformés',
    4: 'Aliments ultra-transformés - À limiter'
  };
  return explanations[group] || '';
}

function getNutriScoreExplanation(grade) {
  const explanations = {
    A: 'Excellente qualité nutritionnelle',
    B: 'Bonne qualité nutritionnelle',
    C: 'Qualité nutritionnelle moyenne',
    D: 'Qualité nutritionnelle faible',
    E: 'Qualité nutritionnelle très faible'
  };
  return explanations[grade] || '';
}

function getAdditivesExplanation(count, dangerous) {
  if (count === 0) return 'Aucun additif détecté';
  if (dangerous > 0) return `${dangerous} additif(s) à risque détecté(s)`;
  return `${count} additif(s) jugé(s) acceptables`;
}

function getSugarsExplanation(sugars) {
  if (sugars < 5) return 'Faible teneur en sucres';
  if (sugars < 15) return 'Teneur modérée en sucres';
  if (sugars < 25) return 'Teneur élevée en sucres';
  return 'Teneur très élevée en sucres - OMS recommande max 25g/jour';
}

function getFatExplanation(fat) {
  if (fat < 3) return 'Faible teneur en graisses saturées';
  if (fat < 10) return 'Teneur modérée en graisses saturées';
  return 'Teneur élevée en graisses saturées - À limiter';
}

function getSaltExplanation(salt) {
  if (salt < 0.3) return 'Faible teneur en sel';
  if (salt < 1.0) return 'Teneur modérée en sel';
  return 'Teneur élevée en sel - OMS recommande max 5g/jour';
}

function getEcoScoreExplanation(grade) {
  const explanations = {
    A: 'Impact environnemental très faible',
    B: 'Impact environnemental faible',
    C: 'Impact environnemental modéré',
    D: 'Impact environnemental élevé',
    E: 'Impact environnemental très élevé'
  };
  return explanations[grade] || '';
}

module.exports = {
  calculateScore,
  COMPONENTS_CONFIG
};