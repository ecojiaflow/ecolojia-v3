/**
 * Middleware d'enrichissement produits avec métadonnées qualité
 * AJOUTE dataCompleteness, scores.confidence, scores.warnings
 * SANS modifier les données existantes
 */

const dataCompletenessService = require('../services/dataCompleteness.service');

async function enrichProduct(req, res, next) {
  console.log('[ENRICH] 🔧 Middleware enrichProduct appelé pour:', req.path);
  
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    console.log('[ENRICH] 📦 Traitement données, type:', typeof data);
    
    if (data.product) {
      console.log('[ENRICH] 🎯 Produit unique détecté:', data.product.barcode);
      data.product = addMetadata(data.product);
      console.log('[ENRICH] ✅ Métadonnées ajoutées - Complétude:', data.product.dataCompleteness);
    } else if (data.products && Array.isArray(data.products)) {
      console.log('[ENRICH] 🎯 Liste produits détectée:', data.products.length);
      data.products = data.products.map(addMetadata);
    } else {
      console.log('[ENRICH] ⚠️ Structure non reconnue');
    }
    
    return originalJson(data);
  };
  
  next();
}

function addMetadata(product) {
  if (!product) {
    console.log('[ENRICH] ⚠️ Produit null/undefined');
    return product;
  }
  
  console.log('[ENRICH] 🔍 Calcul métadonnées pour:', product.barcode);
  
  // AJOUTER dataCompleteness si absent
  if (product.dataCompleteness === undefined) {
    product.dataCompleteness = dataCompletenessService.calculateCompleteness(product);
    console.log('[ENRICH]   → dataCompleteness:', product.dataCompleteness);
  }
  
  // ENRICHIR scores existants (ne pas recréer)
  if (product.scores) {
    if (product.scores.confidence === undefined) {
      product.scores.confidence = dataCompletenessService.calculateScoreConfidence(product);
      console.log('[ENRICH]   → scores.confidence:', product.scores.confidence);
    }
    if (!product.scores.warnings) {
      product.scores.warnings = dataCompletenessService.generateWarnings(product);
      console.log('[ENRICH]   → scores.warnings:', product.scores.warnings);
    }
  } else {
    console.log('[ENRICH] ⚠️ Pas de scores existants');
  }
  
  // Indicateur OCR nécessaire
  if (product.dataCompleteness < 50 && !product.ocrData) {
    product.needsOCR = true;
    console.log('[ENRICH]   → needsOCR: true');
  }
  
  return product;
}

module.exports = enrichProduct;
