﻿// backend/src/services/ProductOrchestrator.js
/**
 * Orchestrateur central pour récupération/création produits
 * Gère enrichissement automatique et cache IA
 */

const Product = require('../models/Product');
const offClient = require('./offClient');
const scoringUnified = require('./scoringUnified');
const aiEnrichment = require('./aiEnrichment.service');
/**
 * Détecte si un code-barre correspond à une catégorie valide
 * @param {string} barcode - Code-barre du produit
 * @returns {Object} { isValid, reason, detectedType }
 */
function detectProductCategory(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return { isValid: false, reason: 'Barcode invalide', detectedType: 'INVALID' };
  }

  // Livres (ISBN-13)
  if (barcode.startsWith('978') || barcode.startsWith('979')) {
    return { 
      isValid: false, 
      reason: 'Code-barre de livre (ISBN) détecté', 
      detectedType: 'BOOK' 
    };
  }

  // Médicaments France (codes CIP)
  if (barcode.startsWith('3400') || barcode.startsWith('3401')) {
    return { 
      isValid: false, 
      reason: 'Code-barre de médicament détecté', 
      detectedType: 'MEDICINE' 
    };
  }

  // Médicaments internationaux (codes spécifiques)
  if (barcode.length === 13 && barcode.startsWith('34')) {
    return { 
      isValid: false, 
      reason: 'Code-barre pharmaceutique détecté', 
      detectedType: 'MEDICINE' 
    };
  }

  // Codes-barres valides pour nos catégories
  return { isValid: true, detectedType: 'VALID' };
}

/**
 * Point d'entrée unique pour obtenir un produit (avec enrichissement auto)
 * @param {Object} input - { barcode, source }
 * @returns {Promise<Object>} Produit enrichi
 */
async function getOrCreateProduct(input) {
  const { barcode, source = 'OFF' } = input;
  
  if (!barcode) {
    throw new Error('Barcode requis');
  }

  // 0. Vérifier catégorie valide (filtrage médicaments/livres)
  const categoryCheck = detectProductCategory(barcode);
  if (!categoryCheck.isValid) {
    console.log('[Orchestrator] Invalid category detected:', categoryCheck);
    return {
      product: null,
      source: 'INVALID_CATEGORY',
      error: categoryCheck.reason,
      detectedType: categoryCheck.detectedType,
      suggestion: 'Ce type de produit n\'est pas analysable par ECOLOJIA'
    };
  }

  // 1. Chercher en base
  let product = await Product.findOne({ barcode }).lean();
  
  if (product && product.scores?.overallScore && isScoreRecent(product.scores)) {
    console.log('[Orchestrator] Product found in DB with recent score:', barcode);
    return {
      product,
      source: 'DATABASE',
      cached: true
    };
  }

  // 2. Récupérer depuis OpenFoodFacts si pas en base
  if (!product) {
    console.log('[Orchestrator] Fetching from OFF:', barcode);
    const offData = await offClient.fetchFromOpenFoodFacts(barcode);
    
    if (!offData) {
      return {
        product: null,
        source: 'NOT_FOUND',
        error: 'Produit non trouvé sur OpenFoodFacts'
      };
    }
    
    // Mapper données OFF ? format ECOLOJIA
    product = mapOFFToProduct(offData);
  }

  // 3. Calculer scores selon catégorie du produit
  const scoringData = prepareScoringData(product);
  console.log('📊 [ProductOrchestrator] 📊 [ProductOrchestrator] scoringData préparé:', JSON.stringify(scoringData, null, 2));
  
  let scores;
  
  // Logique conditionnelle selon catégorie
  if (product.category === 'cosmetics') {
    scores = scoringUnified.calculateCosmeticsScores(scoringData);
    console.log('💄 [ProductOrchestrator] 💄 [ProductOrchestrator] Scores COSMÉTIQUES calculés');
  } 
  else if (product.category === 'detergents') {
    scores = scoringUnified.calculateDetergentsScores(scoringData);
    console.log('🧽 [ProductOrchestrator] 🧽 [ProductOrchestrator] Scores DÉTERGENTS calculés');
  }
  else {
    // Par défaut : food (ou si category manquante/undefined)
    scores = scoringUnified.calculateFoodScores(scoringData);
    console.log('🍎 [ProductOrchestrator] 🍎 [ProductOrchestrator] Scores ALIMENTAIRES calculés');
  }
  
  console.log('✅ [ProductOrchest✅ [ProductOrchestrator] Résumé scores:', JSON.stringify({ 
    category: product.category || 'undefined',
    canScore: scores.dataQuality?.canScore, 
    confidence: scores.dataQuality?.confidence 
  }, null, 2));

  // 4. Enrichir avec IA UNIQUEMENT si données insuffisantes
  let finalScores = scores;
  let aiUsed = false;
  
  // Vérifier si le scoring a besoin d'enrichissement
  if (scores.dataQuality && !scores.dataQuality.canScore) {
    console.log('?? Données insuffisantes - Enrichissement IA nécessaire');
    finalScores = await aiEnrichment.enrichProductWithAI(product, scores);
    aiUsed = true;
  } else if (scores.dataQuality && scores.dataQuality.confidence < 70) {
    console.log('?? Confiance faible - Enrichissement IA optionnel');
    finalScores = await aiEnrichment.enrichProductWithAI(product, scores);
    aiUsed = true;
  } else {
    console.log('? Données suffisantes - Pas d\'enrichissement IA nécessaire');
  }

  // 5. Sauvegarder en base
  const productData = product.toObject ? product.toObject() : product;
  const savedProduct = await saveProduct({
    ...productData,
    scores: finalScores
  });

  return {
    product: savedProduct,
    source: product._id ? 'DATABASE_UPDATED' : 'OFF_NEW',
    cached: false,
    aiEnrichmentUsed: aiUsed
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function isScoreRecent(scores) {
  if (!scores.calculatedAt) return false;
  
  const calculatedAt = new Date(scores.calculatedAt);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return calculatedAt > sevenDaysAgo;
}

function mapOFFToProduct(offData) {
  return {
    barcode: offData.code,
    name: offData.product_name || offData.generic_name,
    brand: offData.brands,
    category: 'food',
    image_url: offData.image_url,
    
    // Données food
    nova_group: offData.nova_group,
    nutriscore_grade: offData.nutriscore_grade,
    ecoscore_grade: offData.ecoscore_grade,
    additives_tags: offData.additives_tags || [],
    labels_tags: offData.labels_tags || [],
    ingredients_text: offData.ingredients_text,
    packaging: offData.packaging,
    origins: offData.origins,
    
    // Nutriments
    nutriments: offData.nutriments || {},
    
    // Metadata
    source: 'openfoodfacts',
    lastSync: new Date()
  };
}

function prepareScoringData(product) {
  // Structure flexible qui supporte produits OFF bruts ET produits MongoDB
  
  // 1. Identifier la source des données
  const isMongoProduct = product.foodData !== undefined;
  
  // 2. Extraire les nutriments selon la source
  let nutriments = {};
  if (isMongoProduct) {
    // Produit MongoDB : chercher dans foodData
    const nutrition = product.foodData?.nutrition?.per100g || {};
    const nutritionalInfo = product.foodData?.nutritionalInfo || {};
    nutriments = {
      sugars_100g: nutrition.sugars || nutritionalInfo.sugars,
      sugars: nutrition.sugars || nutritionalInfo.sugars,
      'saturated-fat_100g': nutrition.saturatedFat || nutritionalInfo.saturatedFat,
      saturated_fat: nutrition.saturatedFat || nutritionalInfo.saturatedFat,
      salt_100g: nutrition.salt || nutritionalInfo.salt,
      salt: nutrition.salt || nutritionalInfo.salt
    };
  } else {
    // Produit OFF brut : utiliser nutriments directement
    const rawNutriments = product.nutriments || {};
    nutriments = {
      sugars_100g: rawNutriments.sugars_100g || rawNutriments.sugars,
      sugars: rawNutriments.sugars_100g || rawNutriments.sugars,
      'saturated-fat_100g': rawNutriments['saturated-fat_100g'] || rawNutriments.saturated_fat,
      saturated_fat: rawNutriments['saturated-fat_100g'] || rawNutriments.saturated_fat,
      salt_100g: rawNutriments.salt_100g || rawNutriments.salt,
      salt: rawNutriments.salt_100g || rawNutriments.salt
    };
  }
  
  // 3. Construire l'objet de scoring unifié
  return {
    // Champs requis pour calculateDataConfidence
    product_name: product.product_name || product.name || '',
    brands: product.brands || product.brand || '',
    ingredients_text: product.ingredients_text || product.foodData?.ingredients || '',
    
    // Scores et labels
    novaGroup: product.nova_group || product.foodData?.novaGroup,
    nutriScore: product.nutriscore_grade || product.foodData?.nutriScore,
    ecoScore: product.ecoscore_grade || product.foodData?.ecoScore,
    
    // Additifs (extraire les codes si objets)
    additives: isMongoProduct 
      ? (product.foodData?.additives?.map(a => a.code || a) || [])
      : (product.additives_tags || []),
    
    // Labels
    labels: product.labels_tags || product.foodData?.labels || [],
    
    // Catégories et packaging
    categories: product.categories_tags || [],
    packaging: product.packaging || '',
    
    // Nutriments unifiés
    nutriments
  };
}

async function saveProduct(productData) {
  const { barcode } = productData;
  
  // Update ou insert
  const updated = await Product.findOneAndUpdate(
    { barcode },
    { $set: productData },
    { upsert: true, new: true }
  );
  
  return updated;
}

module.exports = {
  getOrCreateProduct
};

