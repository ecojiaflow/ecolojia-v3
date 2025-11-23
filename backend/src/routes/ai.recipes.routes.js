const express = require("express");
const router = express.Router();

const logger = require("../utils/logger");
const Product = require("../models/Product");
const recipeAdapter = require("../services/recipeAdapter.service");

/**
 * Normalisation légère de la catégorie, inspirée de products.js
 * On ne touche PAS à la base, c'est juste pour les services IA / recettes.
 */
function normalizeCategoryForRecipes(rawProduct = {}) {
  const product = { ...rawProduct };

  const hasFoodSignals =
    product.foodData &&
    (
      (typeof product.foodData.ingredients === "string" && product.foodData.ingredients.trim().length > 0) ||
      (Array.isArray(product.foodData.labels) && product.foodData.labels.length > 0)
    );

  const hasCosmeticSignals =
    product.cosmeticsData &&
    (
      (Array.isArray(product.cosmeticsData.ingredients) && product.cosmeticsData.ingredients.length > 0) ||
      (Array.isArray(product.cosmeticsData.certifications) && product.cosmeticsData.certifications.length > 0)
    );

  const hasDetergentSignals =
    product.detergentsData &&
    (
      (Array.isArray(product.detergentsData.composition) && product.detergentsData.composition.length > 0) ||
      (Array.isArray(product.detergentsData.surfactants) && product.detergentsData.surfactants.length > 0)
    );

  let inferred = product.categoryType || product.categoryNormalized || "unknown";

  if (hasFoodSignals) {
    inferred = "food";
  } else if (hasCosmeticSignals) {
    inferred = "cosmetic";
  } else if (hasDetergentSignals) {
    inferred = "detergent";
  }

  product.categoryType = inferred;
  product.categoryNormalized = inferred === "unknown" ? null : inferred;

  return product;
}

/**
 * @route   POST /api/ai/recipes/recommend
 * @desc    Recommande des recettes pour un produit + profil utilisateur optionnel
 * @body    {
 *            productId?: string,
 *            productBarcode?: string,
 *            userProfile?: {
 *              dietary?: "omnivore" | "vegetarian" | "vegan" | string,
 *              allergens?: string[],
 *              targetCalories?: number,
 *              preferences?: any
 *            },
 *            limit?: number,
 *            minScore?: number
 *          }
 */
router.post("/recommend", async (req, res) => {
  try {
    const {
      productId,
      productBarcode,
      userProfile = {},
      limit,
      minScore
    } = req.body || {};

    if (!productId && !productBarcode) {
      return res.status(400).json({
        success: false,
        error: "PRODUCT_IDENTIFIER_REQUIRED",
        message: "Merci de fournir 'productId' ou 'productBarcode'."
      });
    }

    // 1) Récupérer le produit en base
    let productDoc = null;

    if (productId) {
      productDoc = await Product.findById(productId).lean();
    } else if (productBarcode) {
      productDoc = await Product.findOne({ barcode: productBarcode }).lean();
    }

    if (!productDoc) {
      return res.status(404).json({
        success: false,
        error: "PRODUCT_NOT_FOUND",
        message: "Produit introuvable pour les paramètres fournis."
      });
    }

    // 2) Normaliser la catégorie comme dans products.js
    const normalizedProduct = normalizeCategoryForRecipes(productDoc);

    // 3) Options pour le RecipeAdapter
    const options = {
      limit: typeof limit === "number" && limit > 0 ? limit : 5,
      minScore: typeof minScore === "number" && minScore > 0 ? minScore : 70,
      userProfile: userProfile || {}
    };

    // 4) Appel au RecipeAdapter
    const recipes = await recipeAdapter.recommendRecipesForProduct(normalizedProduct, options);
    const safeRecipes = Array.isArray(recipes) ? recipes : [];

    return res.json({
      success: true,
      product: {
        _id: productDoc._id,
        barcode: productDoc.barcode,
        name:
          productDoc.product_name ||
          productDoc.name ||
          productDoc.title ||
          productDoc.generic_name ||
          "",
      },
      count: safeRecipes.length,
      recipes: safeRecipes,
      meta: {
        optionsUsed: {
          limit: options.limit,
          minScore: options.minScore
        },
        profile: userProfile
      }
    });
  } catch (err) {
    logger.error("[AI_RECIPES] Error in /api/ai/recipes/recommend", err);
    return res.status(500).json({
      success: false,
      error: "AI_RECIPES_INTERNAL_ERROR",
      message: err.message || "Erreur interne lors de la recommandation de recettes."
    });
  }
});

module.exports = router;
