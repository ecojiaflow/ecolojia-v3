/**
 * ECOLOJIA — Product Context Service
 * Version: 2.0.0 | Date: 11 janvier 2026
 * Solution ROBUSTE basée sur les vraies subcategories en base
 */

'use strict';

// =============================================================================
// SEUILS NUTRITIONNELS (OMS/ANSES)
// =============================================================================

const NUTRITION_THRESHOLDS = {
  sugar: { low: 5, medium: 12.5 },
  salt: { low: 0.3, medium: 1.5 },
  saturatedFat: { low: 1.5, medium: 5 }
};

const ADDITIVES_PATTERN = /\b[eE]\d{3}[a-z]?\b/gi;

// =============================================================================
// MAPPINGS ROBUSTES BASÉS SUR LA BASE RÉELLE
// =============================================================================

// Labels bio reconnus
const ORGANIC_LABELS = ['bio', 'biologique', 'organic', 'ab', 'agriculture-biologique', 'eu-organic', 'demeter', 'nature-et-progres'];

// Produits agricoles bruts (NOVA 1)
const RAW_CATEGORIES = ['fruit', 'fruits', 'legume', 'legumes', 'vegetable', 'vegetables', 'oeuf', 'oeufs', 'egg', 'eggs', 'poisson-frais', 'viande-fraiche', 'dried-fruit'];

// Catégories ultra-transformées (NOVA 4)
const ULTRA_PROCESSED_CATEGORIES = ['biscuit', 'snack', 'chocolate-bar', 'chocolate-spread', 'spread', 'snack-salty', 'snack-sweet', 'snack_bar', 'chips', 'candy', 'ready-meal', 'cake', 'cracker', 'beverage', 'soda'];

// Catégories à usage fréquent (≥3x/semaine)
const FREQUENT_USE_CATEGORIES = ['biscuit', 'cereal', 'spread', 'chocolate-spread', 'nut-butter', 'jam', 'dairy', 'beverage', 'bread', 'pasta', 'rice', 'snack', 'breakfast', 'yogurt', 'milk', 'cheese'];

// Catégories à usage occasionnel
const OCCASIONAL_CATEGORIES = ['cake', 'dessert', 'chocolate-bar', 'candy', 'chips', 'ready-meal', 'alcohol'];

// =============================================================================
// MAPPING PACKAGING PAR CATÉGORIE (ROBUSTE)
// =============================================================================

const PACKAGING_MAP = {
  // VERRE - Pots, bocaux
  'spread': 'glass',
  'chocolate-spread': 'glass',
  'nut-butter': 'glass',
  'jam': 'glass',
  'honey': 'glass',
  'sauce': 'glass',
  'canned-vegetables': 'metal', // conserves
  
  // MÉTAL - Conserves, canettes
  'seafood': 'metal',
  'soup': 'metal',
  
  // PLASTIQUE - Bouteilles, sachets souples
  'beverage': 'plastic',
  'soda': 'plastic',
  'water': 'plastic',
  'dairy': 'plastic', // yaourts
  'yogurt': 'plastic',
  
  // CARTON - Boîtes
  'cereal': 'cardboard',
  'biscuit': 'cardboard',
  'pasta': 'cardboard',
  'rice': 'cardboard',
  'breakfast': 'cardboard',
  'cracker': 'cardboard',
  
  // COMPOSITE - Tetra pak
  'milk': 'composite',
  
  // EMBALLAGE MIXTE - Variable selon produit
  'chocolate': 'composite',
  'chocolate-bar': 'composite',
  'snack': 'plastic',
  'snack-salty': 'plastic',
  'snack-sweet': 'plastic',
  'snack_bar': 'plastic',
  'chips': 'plastic',
  'candy': 'plastic',
  'bread': 'plastic',
  'cake': 'cardboard',
  'dessert': 'plastic',
  'ready-meal': 'plastic',
  'legumes': 'cardboard',
  'cheese': 'plastic',
  'plant-based': 'plastic',
  
  // COSMÉTIQUES - Plastique par défaut
  'haircare': 'plastic',
  'bodycare': 'plastic',
  'skincare': 'plastic',
  
  // MÉNAGER
  'laundry': 'plastic',
  'dishwashing': 'plastic',
  
  // AUTRES
  'other': 'unknown',
  'spice': 'glass',
  'dried-fruit': 'plastic'
};

// =============================================================================
// CONFIANCE PACKAGING
// =============================================================================

const PACKAGING_CONFIDENCE = {
  // Haute confiance - standard industriel clair
  'spread': 'high',
  'chocolate-spread': 'high',
  'nut-butter': 'high',
  'jam': 'high',
  'canned-vegetables': 'high',
  'seafood': 'high',
  'soup': 'high',
  'cereal': 'high',
  'pasta': 'high',
  'rice': 'high',
  
  // Confiance moyenne - généralement vrai mais exceptions possibles
  'beverage': 'medium',
  'dairy': 'medium',
  'biscuit': 'medium',
  'snack': 'medium',
  'chocolate-bar': 'medium',
  
  // Basse confiance - très variable
  'other': 'low',
  'dessert': 'low',
  'ready-meal': 'low'
};

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_\s]+/g, '-').trim();
}

function isValidNumber(value) {
  return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
}

function extractNumber(value) {
  if (isValidNumber(value)) return Number(value);
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.'));
    return isValidNumber(parsed) ? parsed : null;
  }
  return null;
}

function getNutrition(product, field) {
  return extractNumber(
    product.foodData?.nutritionalInfo?.[field] ??
    product.nutrition?.[field] ??
    product.nutriments?.[field]
  );
}

// =============================================================================
// FONCTIONS DE DÉTECTION
// =============================================================================

function detectProcessingLevel(product) {
  const nova = product.foodData?.novaGroup || product.nova_group || product.novaGroup;
  if (isValidNumber(nova)) {
    switch (Number(nova)) {
      case 1: return 'raw';
      case 2: return 'minimally_processed';
      case 3: return 'processed';
      case 4: return 'ultra_processed';
    }
  }
  
  const flags = product.constitution?.healthReflex?.flags || [];
  if (flags.includes('ultra_transforme')) return 'ultra_processed';
  if (flags.includes('transformation_elevee')) return 'processed';
  
  const subcategory = normalizeString(product.subcategory || '');
  if (ULTRA_PROCESSED_CATEGORIES.some(cat => subcategory.includes(cat))) return 'ultra_processed';
  if (RAW_CATEGORIES.some(cat => subcategory.includes(cat))) return 'raw';
  
  return 'processed';
}

function detectSugarLevel(product) {
  const sugars = getNutrition(product, 'sugars');
  if (sugars === null) return 'unknown';
  if (sugars <= NUTRITION_THRESHOLDS.sugar.low) return 'low';
  if (sugars <= NUTRITION_THRESHOLDS.sugar.medium) return 'medium';
  return 'high';
}

function detectSaltLevel(product) {
  const salt = getNutrition(product, 'salt');
  if (salt === null) return 'unknown';
  if (salt <= NUTRITION_THRESHOLDS.salt.low) return 'low';
  if (salt <= NUTRITION_THRESHOLDS.salt.medium) return 'medium';
  return 'high';
}

function detectSatFatLevel(product) {
  const satFat = getNutrition(product, 'saturatedFat');
  if (satFat === null) return 'unknown';
  if (satFat <= NUTRITION_THRESHOLDS.saturatedFat.low) return 'low';
  if (satFat <= NUTRITION_THRESHOLDS.saturatedFat.medium) return 'medium';
  return 'high';
}

function detectAdditivesLevel(product) {
  const additivesTags = product.additives_tags || product.foodData?.additives || [];
  if (additivesTags.length > 0) {
    if (additivesTags.length <= 2) return 'low';
    if (additivesTags.length <= 5) return 'moderate';
    return 'high';
  }
  
  const ingredientsText = product.ingredients_text || '';
  if (!ingredientsText) {
    const flags = product.constitution?.healthReflex?.flags || [];
    if (flags.includes('additifs_multiples')) return 'high';
    if (flags.includes('additifs_presents')) return 'moderate';
    return 'unknown';
  }
  
  const matches = ingredientsText.match(ADDITIVES_PATTERN) || [];
  const count = [...new Set(matches.map(m => m.toLowerCase()))].length;
  if (count === 0) return 'none';
  if (count <= 2) return 'low';
  if (count <= 5) return 'moderate';
  return 'high';
}

function detectPackagingType(product) {
  const subcategory = normalizeString(product.subcategory || '');
  
  // Lookup direct dans le mapping
  if (PACKAGING_MAP[subcategory]) {
    return PACKAGING_MAP[subcategory];
  }
  
  // Recherche partielle
  for (const [cat, packaging] of Object.entries(PACKAGING_MAP)) {
    if (subcategory.includes(cat)) {
      return packaging;
    }
  }
  
  return 'unknown';
}

function detectPackagingConfidence(product) {
  const subcategory = normalizeString(product.subcategory || '');
  
  if (PACKAGING_CONFIDENCE[subcategory]) {
    return PACKAGING_CONFIDENCE[subcategory];
  }
  
  for (const [cat, confidence] of Object.entries(PACKAGING_CONFIDENCE)) {
    if (subcategory.includes(cat)) {
      return confidence;
    }
  }
  
  return 'low';
}

function detectIsOrganic(product) {
  const labels = [...(product.labels || []), ...(product.foodData?.labels || [])];
  const allLabels = [...labels, product.name || ''].map(l => normalizeString(l));
  return ORGANIC_LABELS.some(org => allLabels.some(label => label.includes(org)));
}

function detectIsRawAgricultural(product) {
  const processingLevel = detectProcessingLevel(product);
  if (processingLevel === 'raw') return true;
  
  const subcategory = normalizeString(product.subcategory || '');
  return RAW_CATEGORIES.some(cat => subcategory.includes(cat));
}

function detectSurfaceConsumed(product) {
  if (!detectIsRawAgricultural(product)) return 'not_applicable';
  
  const subcategory = normalizeString(product.subcategory || '');
  const name = normalizeString(product.name || '');
  
  // Surface consommée (à laver)
  const surfaceConsumed = ['pomme', 'poire', 'peche', 'raisin', 'fraise', 'framboise', 'cerise', 'tomate', 'concombre', 'courgette', 'aubergine', 'poivron', 'salade', 'laitue', 'epinard', 'chou', 'brocoli', 'radis', 'carotte', 'celeri', 'champignon'];
  
  // Surface non consommée (épluchée)
  const surfaceNotConsumed = ['banane', 'orange', 'citron', 'pamplemousse', 'clementine', 'ananas', 'melon', 'pasteque', 'kiwi', 'mangue', 'avocat', 'oignon', 'ail', 'patate', 'pomme-de-terre'];
  
  const combined = subcategory + ' ' + name;
  if (surfaceConsumed.some(item => combined.includes(item))) return true;
  if (surfaceNotConsumed.some(item => combined.includes(item))) return false;
  
  return 'unknown';
}

function detectUsageFrequency(product) {
  const subcategory = normalizeString(product.subcategory || '');
  
  if (FREQUENT_USE_CATEGORIES.some(cat => subcategory.includes(cat))) return 'frequent';
  if (OCCASIONAL_CATEGORIES.some(cat => subcategory.includes(cat))) return 'occasional';
  
  return 'regular';
}

function calculateRiskProfiles(context) {
  const risks = [];
  
  // Variation glycémique
  if (context.sugarLevel === 'high') {
    risks.push('glycemic_variation');
  }
  
  // Palatabilité (hyper-appétence)
  if (context.processingLevel === 'ultra_processed') {
    risks.push('palatability');
  }
  if (context.sugarLevel === 'high' && context.satFatLevel === 'high') {
    risks.push('palatability');
  }
  
  // Exposition répétée aux additifs
  if (context.usageFrequency === 'frequent' && (context.additivesLevel === 'moderate' || context.additivesLevel === 'high')) {
    risks.push('repetition_exposure');
  }
  
  // Migration packaging - SEULEMENT si confiance haute et plastique
  if (context.packagingType === 'plastic' && context.usageFrequency === 'frequent' && context.packagingConfidence !== 'low') {
    risks.push('packaging_migration');
  }
  
  // Pesticides
  if (context.isRawAgricultural === true && context.isOrganic === false) {
    risks.push('pesticide_exposure');
  }
  
  // Déséquilibre nutritionnel
  if (context.saltLevel === 'high' || context.satFatLevel === 'high') {
    risks.push('nutritional_imbalance');
  }
  
  return [...new Set(risks)];
}

function calculateConfidence(product, context) {
  let score = 0;
  
  if (context.sugarLevel !== 'unknown') score += 1;
  if (context.saltLevel !== 'unknown') score += 1;
  if (context.satFatLevel !== 'unknown') score += 1;
  if (product.foodData?.novaGroup) score += 2;
  if (context.additivesLevel !== 'unknown') score += 1;
  if (context.packagingType !== 'unknown' && context.packagingConfidence !== 'low') score += 1;
  
  const ratio = score / 7;
  if (ratio >= 0.8) return 'high';
  if (ratio >= 0.5) return 'medium';
  return 'low';
}

// =============================================================================
// FONCTION PRINCIPALE
// =============================================================================

function generateProductContext(product) {
  if (!product) {
    return {
      processingLevel: 'unknown',
      sugarLevel: 'unknown',
      saltLevel: 'unknown',
      satFatLevel: 'unknown',
      additivesLevel: 'unknown',
      packagingType: 'unknown',
      packagingConfidence: 'low',
      isOrganic: false,
      isRawAgricultural: false,
      surfaceConsumed: 'unknown',
      usageFrequency: 'regular',
      riskProfiles: [],
      contextConfidence: 'low'
    };
  }
  
  const packagingType = detectPackagingType(product);
  const packagingConfidence = detectPackagingConfidence(product);
  
  const context = {
    processingLevel: detectProcessingLevel(product),
    sugarLevel: detectSugarLevel(product),
    saltLevel: detectSaltLevel(product),
    satFatLevel: detectSatFatLevel(product),
    additivesLevel: detectAdditivesLevel(product),
    packagingType: packagingType,
    packagingConfidence: packagingConfidence,
    isOrganic: detectIsOrganic(product),
    isRawAgricultural: detectIsRawAgricultural(product),
    surfaceConsumed: 'not_applicable',
    usageFrequency: detectUsageFrequency(product),
    riskProfiles: [],
    contextConfidence: 'medium'
  };
  
  if (context.isRawAgricultural) {
    context.surfaceConsumed = detectSurfaceConsumed(product);
  }
  
  context.riskProfiles = calculateRiskProfiles(context);
  context.contextConfidence = calculateConfidence(product, context);
  
  return context;
}

module.exports = { generateProductContext };
