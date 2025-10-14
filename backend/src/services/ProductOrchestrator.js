// backend/src/services/ProductOrchestrator.js
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

  // 3. Calculer scores
  const scoringData = prepareScoringData(product);
  const scores = scoringUnified.calculateFoodScores(scoringData);

  // 4. Enrichir avec IA si données manquantes
  const enrichedScores = await aiEnrichment.enrichProductWithAI(product, scores);

  // 5. Sauvegarder en base
  const savedProduct = await saveProduct({
    ...product,
    scores: enrichedScores
  });

  return {
    product: savedProduct,
    source: product._id ? 'DATABASE_UPDATED' : 'OFF_NEW',
    cached: false,
    aiEnrichmentUsed: enrichedScores.aiEnrichmentUsed || false
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
  const nutriments = product.nutriments || {};
  
  return {
    novaGroup: product.nova_group || product.foodData?.novaGroup,
    nutriScore: product.nutriscore_grade || product.foodData?.nutriScore,
    ecoScore: product.ecoscore_grade || product.foodData?.ecoScore,
    additives: product.additives_tags || product.foodData?.additives || [],
    labels: product.labels_tags || product.foodData?.labels || [],
    packaging: product.packaging || '',
    origin: product.origins || '',
    ingredients: product.ingredients_text || '',
    nutriments: {
      sugars_100g: nutriments.sugars_100g || nutriments.sugars,
      'saturated-fat_100g': nutriments['saturated-fat_100g'] || nutriments.saturated_fat,
      salt_100g: nutriments.salt_100g || nutriments.salt
    }
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
