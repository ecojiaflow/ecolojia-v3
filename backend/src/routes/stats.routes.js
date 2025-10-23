const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ category: 'food' });
    
    const stats = {
      totalProducts: products.length,
      nova: { 1: 0, 2: 0, 3: 0, 4: 0, unknown: 0 },
      additives: {
        total: 0,
        byRiskLevel: { LOW: 0, MEDIUM: 0, HIGH: 0, VERY_HIGH: 0 }
      },
      allergens: {
        total: 0,
        byRiskLevel: { LOW: 0, MEDIUM: 0, HIGH: 0, VERY_HIGH: 0 },
        topAllergens: {}
      },
      scores: {
        nutriScore: { A: 0, B: 0, C: 0, D: 0, E: 0, unknown: 0 },
        ecoScore: { A: 0, B: 0, C: 0, D: 0, E: 0, unknown: 0 }
      }
    };
    
    products.forEach(p => {
      // NOVA
      const nova = p.foodData.novaGroup;
      if (nova >= 1 && nova <= 4) {
        stats.nova[nova]++;
      } else {
        stats.nova.unknown++;
      }
      
      // Additifs
      p.foodData.additives?.forEach(a => {
        stats.additives.total++;
        stats.additives.byRiskLevel[a.riskLevel || 'LOW']++;
      });
      
      // Allergènes
      p.foodData.allergens?.forEach(a => {
        stats.allergens.total++;
        stats.allergens.byRiskLevel[a.riskLevel || 'MEDIUM']++;
        stats.allergens.topAllergens[a.name] = (stats.allergens.topAllergens[a.name] || 0) + 1;
      });
      
      // Scores
      const nutri = p.foodData.nutriScore;
      const eco = p.foodData.ecoScore;
      
      if (nutri && ['A', 'B', 'C', 'D', 'E'].includes(nutri)) {
        stats.scores.nutriScore[nutri]++;
      } else {
        stats.scores.nutriScore.unknown++;
      }
      
      if (eco && ['A', 'B', 'C', 'D', 'E'].includes(eco)) {
        stats.scores.ecoScore[eco]++;
      } else {
        stats.scores.ecoScore.unknown++;
      }
    });
    
    // Top 5 allergènes
    stats.allergens.topAllergens = Object.entries(stats.allergens.topAllergens)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
