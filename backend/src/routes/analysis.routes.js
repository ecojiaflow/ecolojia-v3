const express = require('express');
const router = express.Router();

// Test si notre service existe
let analyzeAutoSvc;
try {
  const analyzeService = require('../services/analyzeService');
  analyzeAutoSvc = analyzeService.analyzeAutoSvc;
  console.log('Service analyzeAutoSvc charge');
} catch (err) {
  console.error('Erreur chargement analyzeService:', err.message);
  // Fallback simple
  analyzeAutoSvc = async (input) => ({
    product: { name: 'Fallback', barcode: input.barcode },
    scores: { health: 50, eco: 50, global: 50 },
    insights: ['Service non disponible'],
    dataSource: 'fallback'
  });
}

router.post('/', async (req, res) => {
  try {
    const { barcode, name, category = 'food' } = req.body;
    console.log('Analyse demandee:', { barcode, name, category });
    
    const result = await analyzeAutoSvc({ barcode, name, category });
    
    res.json({
      product: result.product,
      scores: {
        health: result.scores.health,
        healthScore: result.scores.health,
        environmentScore: result.scores.eco
      },
      summary: result.insights ? result.insights.join(' ') : 'Analyse complete',
      globalScore: result.scores.global
    });
  } catch (error) {
    console.error('Erreur analyse:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
