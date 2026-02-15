const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const ScanHistory = require('../models/ScanHistory');
const Product = require('../models/Product');
const logger = require('../utils/logger');

function apiLevelToStatus(level, nova) {
  if (level === 1) return 'base';
  if (level === 2) return nova === 4 ? 'limit' : 'regular';
  if (level === 3) return nova === 4 ? 'limit' : 'occasional';
  return 'unknown';
}

// POST /api/scans — Enregistrer un scan
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { barcode } = req.body;
    if (!barcode) return res.status(400).json({ error: 'barcode requis' });

    const userId = req.user.id || req.user.userId;
    if (!userId) return res.status(401).json({ error: 'userId manquant' });

    // Trouver le produit
    const product = await Product.findOne({ barcode }).lean();
    if (!product) return res.status(404).json({ error: 'Produit non trouve' });

    // Extraire donnees
    const level = product.constitution?.healthReflex?.level || null;
    const nova = product.nova_group || product.foodData?.novaGroup || null;
    const status = apiLevelToStatus(level, nova);
    const nutrition = product.foodData?.nutritionalInfo || product.nutrition || {};
    const additives = product.additives_tags || product.additives_extracted || [];
    const flags = product.constitution?.healthReflex?.flags || [];

    // Creer le scan
    const scan = await ScanHistory.create({
      userId,
      barcode,
      productId: product._id,
      snapshot: {
        name: product.name || 'Produit',
        brand: product.brand || '',
        imageUrl: product.imageUrl || product.images?.front || '',
        subcategory: product.subcategory || 'other',
        level,
        nova,
        status,
        hasSugarFlag: flags.includes('sucre_eleve') || flags.includes('high_sugar') || (nutrition.sugars > 12.5),
        hasSaltFlag: flags.includes('sel_eleve') || flags.includes('high_salt') || (nutrition.salt > 1.5),
        hasAdditives: additives.length > 3,
        isNova4: nova === 4
      }
    });

    logger.info('[SCAN] ' + product.name + ' scanne par user ' + userId);
    res.status(201).json({ success: true, scanId: scan._id });
  } catch (err) {
    logger.error('[SCAN] Erreur:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
