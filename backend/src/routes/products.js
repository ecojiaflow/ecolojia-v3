//// AUTO-PATCH ECOLOJIA – RECIPES INJECTION ////

const recipeAdapter = require('../services/recipeAdapter.service');

// --- PATCH INSERTION ---
async function __injectRecipesForProduct(product) {
    try {
        const recipes = await recipeAdapter.recommendRecipesForProduct(product, {
            limit: 3,
            minScore: 75
        });
        return recipes || [];
    } catch (err) {
        console.warn('[PATCH] Recipes error:', err.message);
        return [];
    }
}

//// END PATCH ////
// backend/src/routes/products.js
// ROUTES PRODUITS - unifiées + analyse IA harmonisée + normalisation catégorie
// Date: 2025-11-22 (révisé)

"use strict";

const express = require("express");
const router = express.Router();

const logger = require("../utils/logger");
const { authMiddleware } = require("../middleware/authMiddleware");

// Services & models
const aiEnrichment = require("../services/aiEnrichment.service");
const knowledgeService = require("../knowledge/knowledge.service"); // réservé pour usages futurs
const Analysis = require("../models/Analysis"); // réservé pour usages futurs
const Product = require("../models/Product");

// ========================================
// FONCTIONS UTILITAIRES : catégorie
// ========================================
function inferCategoryFromData(product = {}) {
  const base = product || {};
  const foodData = base.foodData || {};
  const cosmeticsData = base.cosmeticsData || {};
  const detergentsData = base.detergentsData || {};

  const hasFood =
    !!foodData.ingredients ||
    !!foodData.nutrition ||
    (Array.isArray(foodData.labels) && foodData.labels.length > 0);

  const hasCosmetic =
    (Array.isArray(cosmeticsData.ingredients) &&
      cosmeticsData.ingredients.length > 0) ||
    (Array.isArray(cosmeticsData.certifications) &&
      cosmeticsData.certifications.length > 0);

  const hasDetergent =
    (Array.isArray(detergentsData.composition) &&
      detergentsData.composition.length > 0) ||
    (Array.isArray(detergentsData.surfactants) &&
      detergentsData.surfactants.length > 0) ||
    (Array.isArray(detergentsData.ecoLabels) &&
      detergentsData.ecoLabels.length > 0);

  // Cas simple : une seule famille renseignée
  if (hasFood && !hasCosmetic && !hasDetergent) return "food";
  if (!hasFood && hasCosmetic && !hasDetergent) return "cosmetic";
  if (!hasFood && !hasCosmetic && hasDetergent) return "detergent";

  // Conflits : priorité à food > cosmetic > detergent
  if (hasFood) return "food";
  if (hasCosmetic) return "cosmetic";
  if (hasDetergent) return "detergent";

  return null;
}

function normalizeProductCategory(product = {}) {
  const isMongooseDoc = product && typeof product.toObject === "function";

  // On travaille sur un plain object
  let obj = isMongooseDoc ? product.toObject() : { ...product };

  const inferred = inferCategoryFromData(obj);
  const current = obj.categoryType || obj.category || null;

  const normalized =
    inferred ||
    (current ? String(current).toLowerCase() : null);

  obj.categoryNormalized = normalized;

  // On corrige uniquement l'objet en mémoire (pas d'écriture DB ici)
  if (normalized && current && normalized !== current) {
    obj.categoryType = normalized;
  } else if (!obj.categoryType && normalized) {
    obj.categoryType = normalized;
  }

  return obj;
}

// ========================================
// FONCTIONS UTILITAIRES : alternatives
// ========================================

/**
 * Mappe un document produit vers une structure d'alternative propre.
 */
function mapAlternativeProduct(p) {
  const normalized = normalizeProductCategory(p);

  const globalScore =
    typeof normalized.globalScore === "number"
      ? normalized.globalScore
      : normalized.scores && typeof normalized.scores.overallScore === "number"
      ? normalized.scores.overallScore
      : null;

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

/**
 * Récupère des alternatives en base dans la même catégorie que le produit donné.
 *
 * - Même categoryType / categoryNormalized
 * - Produit courant exclu
 * - Tri par score global décroissant
 */
async function findAlternativesForProduct(baseProduct, limit = 6) {
  if (!baseProduct) return [];

  const normalized = normalizeProductCategory(
    baseProduct.toObject ? baseProduct.toObject() : baseProduct
  );

  const category = normalized.categoryNormalized || normalized.categoryType;
  if (!category) {
    return [];
  }

  const filter = {
    categoryType: category,
  };

  if (normalized._id) {
    filter._id = { $ne: normalized._id };
  }

  // Si le produit a un score global, on peut filtrer un minimum
  const baseScore =
    typeof normalized.globalScore === "number"
      ? normalized.globalScore
      : normalized.scores && typeof normalized.scores.overallScore === "number"
      ? normalized.scores.overallScore
      : null;

  const query = Product.find(filter);

  if (baseScore !== null) {
    // On évite les produits beaucoup plus mauvais (baseScore - 25)
    query.where("scores.overallScore").gte(Math.max(0, baseScore - 25));
  }

  const results = await query
    .sort({ "scores.overallScore": -1 })
    .limit(limit)
    .lean()
    .exec();

  return results.map(mapAlternativeProduct);
}

// ========================================
// FONCTION UTILITAIRE : enrichProductResponse
// ========================================
async function enrichProductResponse(
  product,
  source = "DIRECT",
  cached = false,
  aiEnrichmentUsed = false,
  knowledgeData = null
) {
  if (!product) {
    return {
      success: false,
      error: "Product not found",
      product: null,
      knowledgeAnalysis: null,
      aiEnriched: false,
    };
  }

  // ✅ On normalise la catégorie AVANT de structurer la réponse
  const productObj = normalizeProductCategory(
    product.toObject ? product.toObject() : product
  );

  let aiData = {
    knowledgeAnalysis: null,
    aiEnriched: false,
    enrichmentConfidence: 0,
  };

  if (knowledgeData) {
    aiData = {
      knowledgeAnalysis: knowledgeData.knowledgeAnalysis || null,
      aiEnriched: knowledgeData.aiEnriched === true,
      enrichmentConfidence: knowledgeData.enrichmentConfidence || 0,
    };
  }

    const recipes = await __injectRecipesForProduct(productObj);

  return {
    success: true,
product: {
      ...productObj,
      globalScore: productObj.globalScore ?? null,
      scores:
        productObj.scores || {
          health: null,
          environment: null,
          overall: null,
        },
      completeness: productObj.completeness ?? 0,
      lastUpdated: productObj.lastUpdated || productObj.updatedAt || null,
    },
    metadata: {
      source,
      cached,
      aiEnrichmentUsed,
      retrievedAt: new Date().toISOString(),
    },
    knowledgeAnalysis: aiData.knowledgeAnalysis,
    aiEnriched: aiData.aiEnriched,
    enrichmentConfidence: aiData.enrichmentConfidence,
    recipes,
  };
}

// ========================================
// GET /api/products/analyze/:id  (Analyse IA approfondie)
// ⚠️ IMPORTANT : route spécifique AVANT "/:id"
// ========================================
router.get("/analyze/:id", async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`📊 GET /analyze/:id - Analyse produit: ${id}`);

    let product = null;
    const isObjectId =
      id && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);

    if (isObjectId) {
      product = await Product.findById(id).lean();
    }
    if (!product) {
      product = await Product.findOne({ barcode: id }).lean();
    }

    if (!product) {
      logger.warn(`❌ Produit non trouvé pour analyse: ${id}`);
      return res.status(404).json({
        success: false,
        error: "Produit non trouvé",
      });
    }

    // ✅ Normalisation catégorie AVANT IA (en mémoire)
    const normalized = normalizeProductCategory(product);
    const productForAI = {
      ...product,
      categoryType: normalized.categoryType,
      categoryNormalized: normalized.categoryNormalized,
    };

    let enriched = productForAI;
    try {
      enriched = await aiEnrichment.enrichProductWithAI(productForAI);
      logger.info(
        `✅ Enrichissement IA réussi pour analyse: ${product._id || id}`
      );
    } catch (aiError) {
      logger.warn(
        `⚠️ Enrichissement IA échoué (analyse): ${aiError.message}`
      );
      enriched = productForAI;
    }

    let knowledgeData = null;
    if (enriched && enriched.knowledgeAnalysis) {
      knowledgeData = {
        knowledgeAnalysis: enriched.knowledgeAnalysis,
        aiEnriched: enriched.aiEnriched === true,
        enrichmentConfidence: enriched.enrichmentConfidence || 0,
      };
    }

    const enrichedResponse = await enrichProductResponse(
      enriched,
      "ANALYZE",
      true,
      !!knowledgeData,
      knowledgeData
    );

    // 🔁 Alternatives pour l'analyse
    const alternatives = await findAlternativesForProduct(enriched);
    enrichedResponse.alternatives = alternatives;

    enrichedResponse.analysis = {
      analysisMode: "deep-analysis",
      completeness: enriched.completeness || null,
      scores: enriched.scores || {},
      aiInsights: enriched.aiInsights || null,
    };

    return res.status(200).json(enrichedResponse);
  } catch (error) {
    logger.error(`❌ Erreur GET /analyze/:id: ${error.message}`, error.stack);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors analyse",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ========================================
// GET /api/products/:id  (Récupération + enrichissement IA)
// ========================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`📦 GET /:id - Recherche produit: ${id}`);

    let product = null;
    const isObjectId =
      id && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);

    // Tentative 1 : MongoDB ObjectId
    if (isObjectId) {
      product = await Product.findById(id).lean();
    }

    if (product) {
      logger.info(`✅ Produit trouvé (MongoDB): ${product._id}`);

      const normalized = normalizeProductCategory(product);
      const productForAI = {
        ...product,
        categoryType: normalized.categoryType,
        categoryNormalized: normalized.categoryNormalized,
      };

      let enriched = productForAI;
      try {
        enriched = await aiEnrichment.enrichProductWithAI(productForAI);
        logger.info(`✅ Enrichissement IA réussi pour ${product._id}`);
      } catch (aiError) {
        logger.warn(`⚠️ Enrichissement IA échoué: ${aiError.message}`);
        enriched = productForAI;
      }

      let knowledgeData = null;
      if (enriched && enriched.knowledgeAnalysis) {
        knowledgeData = {
          knowledgeAnalysis: enriched.knowledgeAnalysis,
          aiEnriched: enriched.aiEnriched === true,
          enrichmentConfidence: enriched.enrichmentConfidence || 0,
        };
      }

      const enrichedResponse = await enrichProductResponse(
        enriched,
        "MONGODB_ID",
        false,
        knowledgeData !== null,
        knowledgeData
      );

      // 🔁 Alternatives dans la même catégorie
      const alternatives = await findAlternativesForProduct(enriched);
      enrichedResponse.alternatives = alternatives;

      return res.status(200).json(enrichedResponse);
    }

    // Tentative 2 : code-barres
    product = await Product.findOne({ barcode: id }).lean();
    if (product) {
      logger.info(`✅ Produit trouvé (Barcode): ${product.barcode}`);

      const normalized = normalizeProductCategory(product);
      const productForAI = {
        ...product,
        categoryType: normalized.categoryType,
        categoryNormalized: normalized.categoryNormalized,
      };

      let enriched = productForAI;
      try {
        enriched = await aiEnrichment.enrichProductWithAI(productForAI);
        logger.info(
          `✅ Enrichissement IA réussi (barcode): ${product.barcode}`
        );
      } catch (aiError) {
        logger.warn(`⚠️ Enrichissement IA échoué: ${aiError.message}`);
        enriched = productForAI;
      }

      let knowledgeData = null;
      if (enriched && enriched.knowledgeAnalysis) {
        knowledgeData = {
          knowledgeAnalysis: enriched.knowledgeAnalysis,
          aiEnriched: enriched.aiEnriched === true,
          enrichmentConfidence: enriched.enrichmentConfidence || 0,
        };
      }

      const enrichedResponse = await enrichProductResponse(
        enriched,
        "BARCODE",
        false,
        knowledgeData !== null,
        knowledgeData
      );

      // 🔁 Alternatives dans la même catégorie
      const alternatives = await findAlternativesForProduct(enriched);
      enrichedResponse.alternatives = alternatives;

      return res.status(200).json(enrichedResponse);
    }

    logger.warn(`❌ Produit non trouvé: ${id}`);
    return res.status(404).json({
      success: false,
      error: "Produit non trouvé",
      product: null,
      knowledgeAnalysis: null,
      aiEnriched: false,
    });
  } catch (error) {
    logger.error(`❌ Erreur GET /:id: ${error.message}`, error.stack);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ========================================
// POST /api/products (Créer un produit)
// ========================================
router.post("/", authMiddleware, async (req, res) => {
  try {
    logger.info("📝 POST / - Créer un produit");

    const { name, category_type, barcode, scores } = req.body;

    if (!name || !category_type) {
      return res.status(400).json({
        success: false,
        error: "Les champs name et category_type sont obligatoires",
      });
    }

    const newProduct = new Product({
      name,
      categoryType: category_type,
      barcode: barcode || null,
      scores: scores || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedProduct = await newProduct.save();
    logger.info(`✅ Produit créé: ${savedProduct._id}`);

    const response = await enrichProductResponse(
      savedProduct,
      "DIRECT",
      false,
      false,
      null
    );

    // 🔁 Alternatives pour un produit nouvellement créé (optionnel, peu utile au début)
    response.alternatives = await findAlternativesForProduct(savedProduct);

    return res.status(201).json(response);
  } catch (error) {
    logger.error(`❌ Erreur POST /: ${error.message}`, error.stack);
    return res.status(500).json({
      success: false,
      error: "Erreur création produit",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ========================================
// PUT /api/products/:id (Mettre à jour)
// ========================================
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    logger.info(`📝 PUT /:id - Mise à jour: ${id}`);

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      lean: true,
    });

    if (!updatedProduct) {
      logger.warn(`❌ Produit non trouvé: ${id}`);
      return res.status(404).json({
        success: false,
        error: "Produit non trouvé",
      });
    }

    logger.info(`✅ Produit mis à jour: ${id}`);

    const normalized = normalizeProductCategory(updatedProduct);
    const productForAI = {
      ...updatedProduct,
      categoryType: normalized.categoryType,
      categoryNormalized: normalized.categoryNormalized,
    };

    let enriched = productForAI;
    try {
      enriched = await aiEnrichment.enrichProductWithAI(productForAI);
      logger.info(`✅ Enrichissement IA réussi lors PUT: ${id}`);
    } catch (aiError) {
      logger.warn(
        `⚠️ Enrichissement IA échoué lors PUT: ${aiError.message}`
      );
      enriched = productForAI;
    }

    let knowledgeData = null;
    if (enriched && enriched.knowledgeAnalysis) {
      knowledgeData = {
        knowledgeAnalysis: enriched.knowledgeAnalysis,
        aiEnriched: enriched.aiEnriched === true,
        enrichmentConfidence: enriched.enrichmentConfidence || 0,
      };
    }

    const response = await enrichProductResponse(
      enriched,
      "MONGODB_ID",
      false,
      knowledgeData !== null,
      knowledgeData
    );

    // 🔁 Alternatives après mise à jour
    response.alternatives = await findAlternativesForProduct(enriched);

    return res.status(200).json(response);
  } catch (error) {
    logger.error(`❌ Erreur PUT /:id: ${error.message}`, error.stack);
    return res.status(500).json({
      success: false,
      error: "Erreur mise à jour produit",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ========================================
// DELETE /api/products/:id
// ========================================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`🗑️ DELETE /:id - Supprimer: ${id}`);

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      logger.warn(`❌ Produit non trouvé: ${id}`);
      return res.status(404).json({
        success: false,
        error: "Produit non trouvé",
      });
    }

    logger.info(`✅ Produit supprimé: ${id}`);
    return res.status(200).json({
      success: true,
      message: `Produit ${id} supprimé`,
    });
  } catch (error) {
    logger.error(`❌ Erreur DELETE /:id: ${error.message}`, error.stack);
    return res.status(500).json({
      success: false,
      error: "Erreur suppression produit",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ========================================
// GET /api/products (Lister avec pagination)
// ========================================
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    logger.info(`📋 GET / - Lister produits (page ${page})`);

    const products = await Product.find().skip(skip).limit(limit).lean();
    const total = await Product.countDocuments();

    const normalizedProducts = products.map((p) => normalizeProductCategory(p));

    logger.info(`✅ ${normalizedProducts.length} produits retournés`);

    return res.status(200).json({
      success: true,
      data: normalizedProducts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error(`❌ Erreur GET /: ${error.message}`, error.stack);
    return res.status(500).json({
      success: false,
      error: "Erreur récupération produits",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;






