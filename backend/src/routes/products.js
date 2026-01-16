//// AUTO-PATCH ECOLOJIA – RECIPES INJECTION ////
const recipeAdapter = require('../services/recipeAdapter.service');
async function __injectRecipesForProduct(product) {
    try {
        const recipes = await recipeAdapter.recommendRecipesForProduct(product, { limit: 3, minScore: 75 });
        return recipes || [];
    } catch (err) {
        console.warn('[PATCH] Recipes error:', err.message);
        return [];
    }
}
//// END PATCH ////

"use strict";
const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");
const { authMiddleware } = require("../middleware/authMiddleware");
const aiEnrichment = require("../services/aiEnrichment.service");
const knowledgeService = require("../knowledge/knowledge.service");
const Analysis = require("../models/Analysis");
const Product = require("../models/Product");
const { generateConstitution, regenerateRulesOnly } = require("../services/constitution.service");
const { resolveRules } = require("../services/RuleResolver.service");
const { generateProductContext } = require("../services/productContext.service");
const { calculateNutritionContext } = require("../knowledge/nutritionReferences");
const { generateMicroInsights } = require("../services/microInsights.service");
const { calculateDailyBalance } = require("../services/dailyBalance.service");

function inferCategoryFromData(product = {}) {
  const base = product || {};
  const foodData = base.foodData || {};
  const cosmeticsData = base.cosmeticsData || {};
  const detergentsData = base.detergentsData || {};
  const hasFood = !!foodData.ingredients || !!foodData.nutrition || (Array.isArray(foodData.labels) && foodData.labels.length > 0);
  const hasCosmetic = (Array.isArray(cosmeticsData.ingredients) && cosmeticsData.ingredients.length > 0) || (Array.isArray(cosmeticsData.certifications) && cosmeticsData.certifications.length > 0);
  const hasDetergent = (Array.isArray(detergentsData.composition) && detergentsData.composition.length > 0) || (Array.isArray(detergentsData.surfactants) && detergentsData.surfactants.length > 0) || (Array.isArray(detergentsData.ecoLabels) && detergentsData.ecoLabels.length > 0);
  if (hasFood && !hasCosmetic && !hasDetergent) return "food";
  if (!hasFood && hasCosmetic && !hasDetergent) return "cosmetic";
  if (!hasFood && !hasCosmetic && hasDetergent) return "detergent";
  if (hasFood) return "food";
  if (hasCosmetic) return "cosmetic";
  if (hasDetergent) return "detergent";
  return null;
}

function shouldEnrichProduct(product) {
  if (!product) return false;
  if (product.aiEnriched === true) return false;
  if (!product.scores || !product.scores.overallScore) return true;
  return false;
}

function normalizeProductCategory(product = {}) {
  const isMongooseDoc = product && typeof product.toObject === "function";
  let obj = isMongooseDoc ? product.toObject() : { ...product };
  const inferred = inferCategoryFromData(obj);
  const current = obj.categoryType || obj.category || null;
  const normalized = inferred || (current ? String(current).toLowerCase() : null);
  obj.categoryNormalized = normalized;
  if (normalized && current && normalized !== current) {
    obj.categoryType = normalized;
  } else if (!obj.categoryType && normalized) {
    obj.categoryType = normalized;
  }
  return obj;
}

function mapAlternativeProduct(p) {
  const normalized = normalizeProductCategory(p);
  const globalScore = typeof normalized.globalScore === "number" ? normalized.globalScore : normalized.scores && typeof normalized.scores.overallScore === "number" ? normalized.scores.overallScore : null;
  return {
    _id: normalized._id,
    barcode: normalized.barcode,
    name: normalized.name,
    brand: normalized.brand,
    categoryType: normalized.categoryType,
    categoryNormalized: normalized.categoryNormalized,
    imageUrl: normalized.imageUrl,
    scores: normalized.scores || null,
    globalScore,
    aiEnriched: normalized.aiEnriched === true,
  };
}

// ========================================
// ALTERNATIVES V2 — INTELLIGENTES ET COHÉRENTES
// ========================================

const SUBCATEGORY_REGEX = {
  'spread': /tartiner|pâte.*chocolat|spread.*chocolat|chocolate.*spread/i,
  'chocolate-spread': /tartiner|pâte.*chocolat|spread.*chocolat|chocolate.*spread|nutella/i,
  'nut-butter': /beurre.*(cacahu|amande|noisette)|purée.*(cacahu|amande|noisette|noix)|peanut.*butter|almond.*butter|100%.*cacahu|cacahu.*100%/i,
  'snack': /chips|biscuit|crackers|gâteau|cookie|gaufrette|galette/i,
  'beverage': /jus|boisson|soda|sirop|nectar|smoothie/i,
  'chocolate-bar': /tablette.*chocolat|chocolat.*noir|chocolat.*lait|chocolat.*blanc/i,
  'dessert': /dessert|mousse|flan|pudding|crème.*dessert/i,
  'breakfast': /céréales|muesli|granola|flocons.*avoine/i,
  'haircare': /shampoo|shampooing|après-shampoo|conditioner/i,
  'skincare': /crème.*visage|sérum|hydratant.*visage/i,
  'bodycare': /lait.*corps|lotion.*corps|gel.*douche/i
};

const SUBCATEGORY_KEYWORDS = {
  'spread': ['tartiner'],
  'chocolate-spread': ['tartiner'],
  'nut-butter': ['beurre', 'purée', 'butter', 'cacahu', 'amande', 'peanut', 'almond'],
  'snack': ['chips', 'biscuit', 'crackers', 'snack', 'gâteau', 'cookie', 'gaufrette'],
  'beverage': ['jus', 'boisson', 'soda', 'eau', 'thé', 'café', 'drink', 'juice'],
  'chocolate-bar': ['chocolat', 'cacao', 'tablette', 'noir', 'lait', 'blanc'],
  'dessert': ['dessert', 'crème', 'mousse', 'yaourt', 'flan', 'pudding'],
  'breakfast': ['céréales', 'muesli', 'granola', 'flocons', 'petit-déjeuner'],
  'haircare': ['shampo', 'après-shampo', 'cheveux', 'hair', 'capillaire'],
  'skincare': ['crème', 'visage', 'peau', 'skin', 'hydratant', 'sérum'],
  'bodycare': ['corps', 'body', 'lotion', 'lait', 'douche', 'savon']
};

const SUBCATEGORY_GROUPS = {
  'spread': ['spread', 'chocolate-spread', 'hazelnut-spread'],
  'chocolate-spread': ['spread', 'chocolate-spread', 'hazelnut-spread'],
  'hazelnut-spread': ['spread', 'chocolate-spread', 'hazelnut-spread'],
  'nut-butter': ['nut-butter', 'peanut-butter', 'almond-butter'],
  'snack': ['snack', 'chips', 'biscuit', 'cookie', 'cracker'],
  'beverage': ['beverage', 'juice', 'soda', 'drink'],
  'chocolate-bar': ['chocolate-bar', 'chocolate', 'dark-chocolate', 'milk-chocolate'],
  'breakfast': ['breakfast', 'cereal', 'muesli', 'granola'],
  'haircare': ['haircare', 'shampoo', 'conditioner'],
  'skincare': ['skincare', 'face-cream', 'moisturizer'],
  'bodycare': ['bodycare', 'body-lotion', 'shower-gel']
};

async function findAlternativesForProduct(baseProduct, limit = 5) {
  if (!baseProduct) return [];

  const productObj = baseProduct.toObject ? baseProduct.toObject() : baseProduct;
  const subcategory = productObj.subcategory || null;
  const categoryType = productObj.categoryType || productObj.category || 'food';
  const productName = (productObj.name || '').toLowerCase();

  const baseScore = typeof productObj.globalScore === "number"
    ? productObj.globalScore
    : productObj.scores?.overallScore || 0;

  if (!subcategory) {
    logger.warn('[Alternatives] Pas de subcategory pour: ' + productObj.name);
    return [];
  }

  const subcategoryGroup = SUBCATEGORY_GROUPS[subcategory] || [subcategory];
  const keywords = SUBCATEGORY_KEYWORDS[subcategory] || [];

  logger.info('[Alternatives] Recherche pour: ' + productObj.name + ' | subcategory: ' + subcategory + ' | score: ' + baseScore);

  const query = {
    subcategory: { $in: subcategoryGroup },
    categoryType: categoryType,
    _id: { $ne: productObj._id },
    'scores.overallScore': { $gt: baseScore }
  };

  if (keywords.length > 0) {
    const keywordRegex = new RegExp(keywords.join('|'), 'i');
    query.name = { $regex: keywordRegex };
  }

  try {
    const results = await Product.find(query)
      .select('_id barcode name brand subcategory categoryType imageUrl scores globalScore')
      .sort({ 'scores.overallScore': -1 })
      .limit(limit)
      .lean()
      .exec();

    logger.info('[Alternatives] Trouvé ' + results.length + ' alternatives pour ' + productObj.name);

    return results.map(p => ({
      _id: p._id,
      barcode: p.barcode,
      name: p.name,
      brand: p.brand,
      subcategory: p.subcategory,
      categoryType: p.categoryType,
      imageUrl: p.imageUrl,
      scores: p.scores || null,
      globalScore: p.scores?.overallScore || p.globalScore || null,
      scoreDiff: (p.scores?.overallScore || 0) - baseScore
    }));

  } catch (error) {
    logger.error('[Alternatives] Erreur: ' + error.message);
    return [];
  }
}

function ensureConstitutionWithDynamicRules(productObj) {
  let constitution = productObj.constitution;
  if (!constitution || !constitution.cards) {
    logger.info('[Constitution] Génération complète pour: ' + (productObj.name || productObj._id));
    constitution = generateConstitution(productObj);
  } else {
    const rulesResult = resolveRules({
      name: productObj.name,
      categoryType: productObj.categoryType || productObj.category || 'food',
      subcategory: productObj.subcategory || null,
      constitution: { healthReflex: constitution.healthReflex }
    });
    constitution = {
      ...constitution,
      rules: {
        reflexHero: rulesResult.reflexHero,
        rulesHits: rulesResult.rulesHits,
        actions: rulesResult.actions
      }
    };
    logger.debug('[Constitution] Rules régénérées pour: ' + (productObj.name || productObj._id) + ', subcategory: ' + (productObj.subcategory || 'none'));
  }
  return constitution;
}

async function enrichProductResponse(product, source = "DIRECT", cached = false, aiEnrichmentUsed = false, knowledgeData = null) {
  if (!product) {
    return { success: false, error: "Product not found", product: null, knowledgeAnalysis: null, aiEnriched: false, productContext: null };
  }
  const productObj = normalizeProductCategory(product.toObject ? product.toObject() : product);
  let aiData = { knowledgeAnalysis: null, aiEnriched: false, enrichmentConfidence: 0 };
  if (knowledgeData) {
    aiData = { knowledgeAnalysis: knowledgeData.knowledgeAnalysis || null, aiEnriched: knowledgeData.aiEnriched === true, enrichmentConfidence: knowledgeData.enrichmentConfidence || 0 };
  }
  const recipes = await __injectRecipesForProduct(productObj);
  const constitution = ensureConstitutionWithDynamicRules(productObj);
  
  // NOUVEAU: Générer le productContext
  const productContext = generateProductContext(productObj);
  logger.debug('[ProductContext] Généré pour: ' + productObj.name + ' | packaging: ' + productContext.packagingType + ' [' + productContext.packagingConfidence + ']');

  // NOUVEAU: Générer le nutritionContext (repères OMS/ANSES/EFSA)
  const nutritionContext = calculateNutritionContext(productObj);
  logger.debug('[NutritionContext] Genere pour: ' + productObj.name + ' | confidence: ' + nutritionContext.confidence);

  // NOUVEAU: Generer les microInsights (En bref + Equilibrer)
  const microInsights = generateMicroInsights(productObj);
  logger.debug('[MicroInsights] Généré pour: ' + productObj.name + ' | confidence: ' + nutritionContext.confidence);
  
  return {
    success: true,
    product: {
      ...productObj,
      globalScore: productObj.globalScore ?? null,
      scores: productObj.scores || { health: null, environment: null, overall: null },
      completeness: productObj.completeness ?? 0,
      lastUpdated: productObj.lastUpdated || productObj.updatedAt || null,
      constitution: constitution,
    },
    productContext: productContext,
    nutritionContext: nutritionContext,
    microInsights: microInsights,
    metadata: { source, cached, aiEnrichmentUsed, rulesVersion: '2.1.0', productContextVersion: '2.0.0', retrievedAt: new Date().toISOString() },
    knowledgeAnalysis: aiData.knowledgeAnalysis,
    aiEnriched: aiData.aiEnriched,
    enrichmentConfidence: aiData.enrichmentConfidence,
    recipes,
  };
}

router.get("/scan/:barcode", async (req, res) => {
  const startTime = Date.now();
  const { barcode } = req.params;
  try {
    logger.info('⚡ SCAN RAPIDE: ' + barcode);
    const product = await Product.findOne({ barcode }).select('name brand categoryType subcategory scores constitution alternatives foodData nutrition nutriments ingredients_text additives_tags additives_extracted dataQuality labels').lean();
    if (!product) return res.status(404).json({ success: false, error: 'Produit non trouvé', barcode });
    if (!product.constitution) {
      return res.json({ success: true, product, status: 'pending_enrichment', message: 'Produit en cours d enrichissement', responseTime: Date.now() - startTime });
    }
    const constitution = ensureConstitutionWithDynamicRules(product);
    const productContext = generateProductContext(product);
    const nutritionContext = calculateNutritionContext(product);
    const microInsights = generateMicroInsights(product);
    const responseTime = Date.now() - startTime;
    logger.info('✅ SCAN ' + barcode + ': ' + responseTime + 'ms');
    // Calculer l'équilibre journalier
    const dailyBalance = calculateDailyBalance(product);
    
    return res.json({ success: true, product: { ...product, constitution }, productContext, nutritionContext, microInsights, dailyBalance, cached: true, responseTime });
  } catch (error) {
    logger.error('❌ Erreur scan ' + barcode + ':', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

router.get("/analyze/:id", async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('📊 GET /analyze/:id - Analyse produit: ' + id);
    let product = null;
    const isObjectId = id && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);
    if (isObjectId) product = await Product.findById(id).lean();
    if (!product) product = await Product.findOne({ barcode: id }).lean();
    if (!product) {
      logger.warn('❌ Produit non trouvé pour analyse: ' + id);
      return res.status(404).json({ success: false, error: "Produit non trouvé" });
    }
    const normalized = normalizeProductCategory(product);
    const productForAI = { ...product, categoryType: normalized.categoryType, categoryNormalized: normalized.categoryNormalized };
    let enriched = productForAI;
    let knowledgeData = null;
    if (enriched && enriched.knowledgeAnalysis) {
      knowledgeData = { knowledgeAnalysis: enriched.knowledgeAnalysis, aiEnriched: enriched.aiEnriched === true, enrichmentConfidence: enriched.enrichmentConfidence || 0 };
    }
    const enrichedResponse = await enrichProductResponse(enriched, "ANALYZE", true, !!knowledgeData, knowledgeData);
    const alternatives = await findAlternativesForProduct(enriched);
    enrichedResponse.alternatives = alternatives;
    enrichedResponse.analysis = { analysisMode: "deep-analysis", completeness: enriched.completeness || null, scores: enriched.scores || {}, aiInsights: enriched.aiInsights || null };
    return res.status(200).json(enrichedResponse);
  } catch (error) {
    logger.error('❌ Erreur GET /analyze/:id: ' + error.message, error.stack);
    return res.status(500).json({ success: false, error: "Erreur serveur lors analyse", details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('📦 GET /:id - Recherche produit: ' + id);
    let product = null;
    const isObjectId = id && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);
    if (isObjectId) product = await Product.findById(id).lean();
    if (product) {
      logger.info('✅ Produit trouvé (MongoDB): ' + product._id);
      const normalized = normalizeProductCategory(product);
      const productForAI = { ...product, categoryType: normalized.categoryType, categoryNormalized: normalized.categoryNormalized };
      let enriched = productForAI;
      let knowledgeData = null;
      if (enriched && enriched.knowledgeAnalysis) {
        knowledgeData = { knowledgeAnalysis: enriched.knowledgeAnalysis, aiEnriched: enriched.aiEnriched === true, enrichmentConfidence: enriched.enrichmentConfidence || 0 };
      }
      const enrichedResponse = await enrichProductResponse(enriched, "MONGODB_ID", false, knowledgeData !== null, knowledgeData);
      const alternatives = await findAlternativesForProduct(enriched);
      enrichedResponse.alternatives = alternatives;
      enrichedResponse.dailyBalance = calculateDailyBalance(enriched);
      return res.status(200).json(enrichedResponse);
    }
    product = await Product.findOne({ barcode: id }).lean();
    if (product) {
      logger.info('✅ Produit trouvé (Barcode): ' + product.barcode);
      const normalized = normalizeProductCategory(product);
      const productForAI = { ...product, categoryType: normalized.categoryType, categoryNormalized: normalized.categoryNormalized };
      let enriched = productForAI;
      let knowledgeData = null;
      if (enriched && enriched.knowledgeAnalysis) {
        knowledgeData = { knowledgeAnalysis: enriched.knowledgeAnalysis, aiEnriched: enriched.aiEnriched === true, enrichmentConfidence: enriched.enrichmentConfidence || 0 };
      }
      const enrichedResponse = await enrichProductResponse(enriched, "BARCODE", false, knowledgeData !== null, knowledgeData);
      const alternatives = await findAlternativesForProduct(enriched);
      enrichedResponse.alternatives = alternatives;
      enrichedResponse.dailyBalance = calculateDailyBalance(enriched);
      return res.status(200).json(enrichedResponse);
    }
    logger.warn('❌ Produit non trouvé: ' + id);
    return res.status(404).json({ success: false, error: "Produit non trouvé", product: null, knowledgeAnalysis: null, aiEnriched: false, productContext: null, nutritionContext: null });
  } catch (error) {
    logger.error('❌ Erreur GET /:id: ' + error.message, error.stack);
    return res.status(500).json({ success: false, error: "Erreur serveur", details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    logger.info("📝 POST / - Créer un produit");
    const { name, category_type, barcode, scores } = req.body;
    if (!name || !category_type) return res.status(400).json({ success: false, error: "Les champs name et category_type sont obligatoires" });
    const newProduct = new Product({ name, categoryType: category_type, barcode: barcode || null, scores: scores || {}, createdAt: new Date(), updatedAt: new Date() });
    const savedProduct = await newProduct.save();
    logger.info('✅ Produit créé: ' + savedProduct._id);
    const response = await enrichProductResponse(savedProduct, "DIRECT", false, false, null);
    response.alternatives = await findAlternativesForProduct(savedProduct);
    return res.status(201).json(response);
  } catch (error) {
    logger.error('❌ Erreur POST /: ' + error.message, error.stack);
    return res.status(500).json({ success: false, error: "Erreur création produit", details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    logger.info('📝 PUT /:id - Mise à jour: ' + id);
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true, lean: true });
    if (!updatedProduct) {
      logger.warn('❌ Produit non trouvé: ' + id);
      return res.status(404).json({ success: false, error: "Produit non trouvé" });
    }
    logger.info('✅ Produit mis à jour: ' + id);
    const normalized = normalizeProductCategory(updatedProduct);
    const productForAI = { ...updatedProduct, categoryType: normalized.categoryType, categoryNormalized: normalized.categoryNormalized };
    let enriched = productForAI;
    let knowledgeData = null;
    if (enriched && enriched.knowledgeAnalysis) {
      knowledgeData = { knowledgeAnalysis: enriched.knowledgeAnalysis, aiEnriched: enriched.aiEnriched === true, enrichmentConfidence: enriched.enrichmentConfidence || 0 };
    }
    const response = await enrichProductResponse(enriched, "MONGODB_ID", false, knowledgeData !== null, knowledgeData);
    response.alternatives = await findAlternativesForProduct(enriched);
    return res.status(200).json(response);
  } catch (error) {
    logger.error('❌ Erreur PUT /:id: ' + error.message, error.stack);
    return res.status(500).json({ success: false, error: "Erreur mise à jour produit", details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('🗑️ DELETE /:id - Supprimer: ' + id);
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      logger.warn('❌ Produit non trouvé: ' + id);
      return res.status(404).json({ success: false, error: "Produit non trouvé" });
    }
    logger.info('✅ Produit supprimé: ' + id);
    return res.status(200).json({ success: true, message: 'Produit ' + id + ' supprimé' });
  } catch (error) {
    logger.error('❌ Erreur DELETE /:id: ' + error.message, error.stack);
    return res.status(500).json({ success: false, error: "Erreur suppression produit", details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    logger.info('📋 GET / - Lister produits (page ' + page + ')');
    const products = await Product.find().skip(skip).limit(limit).lean();
    const total = await Product.countDocuments();
    const normalizedProducts = products.map((p) => normalizeProductCategory(p));
    logger.info('✅ ' + normalizedProducts.length + ' produits retournés');
    return res.status(200).json({ success: true, data: normalizedProducts, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error('❌ Erreur GET /: ' + error.message, error.stack);
    return res.status(500).json({ success: false, error: "Erreur récupération produits", details: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
});

module.exports = router;








