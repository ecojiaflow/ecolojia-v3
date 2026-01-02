/**
 * stats.routes.js — Stats publiques Ecolojia
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/stats — Stats publiques
router.get('/', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const withNova = await Product.countDocuments({ 
      'scores.breakdown.nova.group': { $exists: true, $ne: null } 
    });
    
    const l1 = await Product.countDocuments({ 'constitution.healthReflex.level': 1 });
    const l2 = await Product.countDocuments({ 'constitution.healthReflex.level': 2 });
    const l3 = await Product.countDocuments({ 'constitution.healthReflex.level': 3 });

    res.json({
      success: true,
      stats: {
        totalProducts,
        enrichedProducts: withNova,
        enrichmentRate: Math.round((withNova / totalProducts) * 100),
        distribution: { level1: l1, level2: l2, level3: l3 },
        habitsCount: 20,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Stats] Error:', error.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
