/**
 * learn.routes.js — API Micro-fiches Educatives Ecolojia
 * Version: 1.0.0
 * 
 * Routes:
 * - GET /api/learn — Liste toutes les fiches (resume)
 * - GET /api/learn/:id — Fiche complete par ID
 * - GET /api/learn/suggest/:barcode — Suggestions pour un produit
 */

const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");
const { getAllCards, getFullCard, getSuggestedCardIds } = require("../knowledge/learningCards");
const { generateProductContext } = require("../services/productContext.service");
const Product = require("../models/Product");

/**
 * GET /api/learn
 * Liste toutes les fiches educatives (resume)
 */
router.get("/", async (req, res) => {
  try {
    logger.info("[Learn] GET / - Liste des fiches");
    
    const cards = getAllCards();
    const summaries = cards.map(card => ({
      id: card.id,
      title: card.title,
      subtitle: card.subtitle,
      readTime: card.readTime,
      icon: card.icon,
      color: card.color,
      sectionsCount: card.sections?.length || 0,
      rulesCount: card.rules?.length || 0,
      mythsCount: card.myths?.length || 0
    }));
    
    return res.status(200).json({
      success: true,
      count: summaries.length,
      cards: summaries
    });
  } catch (error) {
    logger.error("[Learn] Erreur GET /: " + error.message);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

/**
 * GET /api/learn/suggest/:barcode
 * Suggestions de fiches pour un produit (par barcode)
 */
router.get("/suggest/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;
    logger.info("[Learn] GET /suggest/" + barcode);
    
    // Trouver le produit
    const product = await Product.findOne({ barcode }).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Produit non trouve",
        suggestions: []
      });
    }
    
    // Generer le contexte produit
    const productContext = generateProductContext(product);
    
    // Obtenir les suggestions de fiches
    const suggestions = getSuggestedCardIds(productContext);
    
    logger.info("[Learn] " + suggestions.length + " fiches suggerees pour " + product.name);
    
    return res.status(200).json({
      success: true,
      product: {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand
      },
      context: {
        sugarLevel: productContext.sugarLevel,
        satFatLevel: productContext.satFatLevel,
        saltLevel: productContext.saltLevel,
        processingLevel: productContext.processingLevel,
        additivesLevel: productContext.additivesLevel
      },
      suggestions
    });
  } catch (error) {
    logger.error("[Learn] Erreur GET /suggest: " + error.message);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

/**
 * GET /api/learn/:id
 * Fiche complete par ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    logger.info("[Learn] GET /" + id);
    
    const card = getFullCard(id);
    if (!card) {
      return res.status(404).json({
        success: false,
        error: "Fiche non trouvee",
        availableCards: getAllCards().map(c => c.id)
      });
    }
    
    return res.status(200).json({
      success: true,
      card
    });
  } catch (error) {
    logger.error("[Learn] Erreur GET /:id: " + error.message);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

module.exports = router;
