/**
 * ECOLOJIA — Product Context Service
 * Version: 1.1.0 | Date: 11 janvier 2026
 */

'use strict';

const NUTRITION_THRESHOLDS = {
  sugar: { low: 5, medium: 12.5, high: 12.5 },
  salt: { low: 0.3, medium: 1.5, high: 1.5 },
  saturatedFat: { low: 1.5, medium: 5, high: 5 }
};

const ADDITIVES_PATTERN = /\b[eE]\d{3}[a-z]?\b/gi;

const ORGANIC_LABELS = ['bio', 'biologique', 'organic', 'ab', 'agriculture-biologique', 'eu-organic', 'demeter'];

const RAW_AGRICULTURAL_SUBCATEGORIES = ['fruit', 'fruits', 'legume', 'legumes', 'vegetable', 'vegetables', 'pomme', 'poire', 'orange', 'banane', 'fraise', 'tomate', 'carotte', 'courgette', 'aubergine', 'poivron', 'concombre', 'salade', 'laitue', 'epinard', 'chou', 'brocoli', 'haricot-vert', 'petit-pois', 'pomme-de-terre', 'oignon', 'ail', 'champignon', 'legumineuse', 'lentille', 'pois-chiche', 'oeuf', 'oeufs'];

const FREQUENT_USE_CATEGORIES = ['cereale', 'cereales', 'petit-dejeuner', 'spread', 'confiture', 'miel', 'pate-a-tartiner', 'biscuit', 'biscuits', 'cookie', 'yaourt', 'yogurt', 'fromage-blanc', 'lait', 'milk', 'fromage', 'cheese', 'beurre', 'butter', 'boisson', 'drink', 'jus', 'juice', 'soda', 'pain', 'bread', 'pate', 'pasta', 'riz', 'rice', 'snack', 'chips', 'barre', 'compote', 'sauce', 'ketchup', 'mayonnaise', 'huile', 'oil'];

const SURFACE_CONSUMED = ['pomme', 'poire', 'peche', 'prune', 'raisin', 'fraise', 'framboise', 'cerise', 'tomate', 'concombre', 'courgette', 'aubergine', 'poivron', 'salade', 'laitue', 'epinard', 'chou', 'brocoli', 'radis', 'carotte', 'celeri', 'champignon'];

const SURFACE_NOT_CONSUMED = ['banane', 'orange', 'citron', 'pamplemousse', 'clementine', 'ananas', 'melon', 'pasteque', 'kiwi', 'mangue', 'avocat', 'oignon', 'ail', 'patate', 'pomme-de-terre'];

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
  const ultraProcessed = ['soda', 'chips', 'biscuit', 'cookie', 'bonbon', 'candy', 'nugget', 'plat-prepare', 'pizza-surgelee', 'pate-a-tartiner', 'spread'];
  if (ultraProcessed.some(cat => subcategory.includes(cat))) return 'ultra_processed';
  if (RAW_AGRICULTURAL_SUBCATEGORIES.some(cat => subcategory.includes(normalizeString(cat)))) return 'raw';
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
  const ingredientsText = product.ingredients_text || '';
  const additivesTags = product.additives_tags || product.foodData?.additives || [];
  if (additivesTags.length > 0) {
    if (additivesTags.length <= 2) return 'low';
    if (additivesTags.length <= 5) return 'moderate';
    return 'high';
  }
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
  const name = normalizeString(product.name || '');
  if (subcategory.includes('conserve') || name.includes('conserve')) return 'metal';
  if (subcategory.includes('confiture') || subcategory.includes('miel')) return 'glass';
  if (subcategory.includes('soda') || subcategory.includes('jus') || subcategory.includes('boisson')) return 'plastic';
  if (subcategory.includes('lait') || subcategory.includes('creme')) return 'composite';
  if (subcategory.includes('cereale') || subcategory.includes('biscuit')) return 'cardboard';
  if (subcategory.includes('spread') || subcategory.includes('pate-a-tartiner')) return 'plastic';
  return 'unknown';
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
  return RAW_AGRICULTURAL_SUBCATEGORIES.some(cat => subcategory.includes(normalizeString(cat)));
}

function detectSurfaceConsumed(product) {
  if (!detectIsRawAgricultural(product)) return 'not_applicable';
  const combined = normalizeString((product.subcategory || '') + ' ' + (product.name || ''));
  if (SURFACE_CONSUMED.some(item => combined.includes(item))) return true;
  if (SURFACE_NOT_CONSUMED.some(item => combined.includes(item))) return false;
  return 'unknown';
}

function detectUsageFrequency(product) {
  const subcategory = normalizeString(product.subcategory || '');
  const tags = (product.tags || []).map(t => normalizeString(t));
  if (FREQUENT_USE_CATEGORIES.some(cat => subcategory.includes(cat) || tags.some(tag => tag.includes(cat)))) return 'frequent';
  const occasional = ['gateau', 'patisserie', 'glace', 'alcool', 'vin', 'biere'];
  if (occasional.some(cat => subcategory.includes(cat))) return 'occasional';
  return 'regular';
}

function calculateRiskProfiles(context) {
  const risks = [];
  if (context.sugarLevel === 'high') risks.push('glycemic_variation');
  if (context.processingLevel === 'ultra_processed') risks.push('palatability');
  if (context.sugarLevel === 'high' && context.satFatLevel === 'high') risks.push('palatability');
  if (context.usageFrequency === 'frequent' && (context.additivesLevel === 'moderate' || context.additivesLevel === 'high')) risks.push('repetition_exposure');
  if (context.packagingType === 'plastic' && context.usageFrequency === 'frequent') risks.push('packaging_migration');
  if (context.isRawAgricultural === true && context.isOrganic === false) risks.push('pesticide_exposure');
  if (context.saltLevel === 'high' || context.satFatLevel === 'high') risks.push('nutritional_imbalance');
  return [...new Set(risks)];
}

function calculateConfidence(product, context) {
  let score = 0;
  if (context.sugarLevel !== 'unknown') score += 1;
  if (context.saltLevel !== 'unknown') score += 1;
  if (context.satFatLevel !== 'unknown') score += 1;
  if (product.foodData?.novaGroup) score += 2;
  if (context.additivesLevel !== 'unknown') score += 1;
  if (context.packagingType !== 'unknown') score += 1;
  const ratio = score / 7;
  if (ratio >= 0.8) return 'high';
  if (ratio >= 0.5) return 'medium';
  return 'low';
}

function generateProductContext(product) {
  if (!product) {
    return { processingLevel: 'unknown', sugarLevel: 'unknown', saltLevel: 'unknown', satFatLevel: 'unknown', additivesLevel: 'unknown', packagingType: 'unknown', isOrganic: false, isRawAgricultural: false, surfaceConsumed: 'unknown', usageFrequency: 'regular', riskProfiles: [], contextConfidence: 'low' };
  }
  const context = {
    processingLevel: detectProcessingLevel(product),
    sugarLevel: detectSugarLevel(product),
    saltLevel: detectSaltLevel(product),
    satFatLevel: detectSatFatLevel(product),
    additivesLevel: detectAdditivesLevel(product),
    packagingType: detectPackagingType(product),
    isOrganic: detectIsOrganic(product),
    isRawAgricultural: detectIsRawAgricultural(product),
    surfaceConsumed: 'not_applicable',
    usageFrequency: detectUsageFrequency(product),
    riskProfiles: [],
    contextConfidence: 'medium'
  };
  if (context.isRawAgricultural) context.surfaceConsumed = detectSurfaceConsumed(product);
  context.riskProfiles = calculateRiskProfiles(context);
  context.contextConfidence = calculateConfidence(product, context);
  return context;
}

module.exports = { generateProductContext };
