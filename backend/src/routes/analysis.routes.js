const express = require('express');
const router = express.Router();

let analyzeService;
try {
  analyzeService = require('../services/analyzeService');
  console.log('AnalyzeService loaded successfully');
} catch (err) {
  console.error('Failed to load analyzeService:', err.message);
}

router.post('/', async (req, res) => {
  try {
    const { barcode, name, category = 'food' } = req.body;
    console.log('Analysis requested:', { barcode, name, category });
    
    if (!analyzeService || !analyzeService.analyzeAutoSvc) {
      console.error('AnalyzeService not available');
      return res.json({
        product: { name: 'Service Error', barcode },
        scores: { health: 50, healthScore: 50, environmentScore: 50 },
        summary: 'Service temporairement indisponible',
        globalScore: 50
      });
    }
    
    const result = await analyzeService.analyzeAutoSvc({ barcode, name, category });
    console.log('Analysis result:', JSON.stringify(result, null, 2));
    
    // Vérification et extraction sécurisée des scores
    const scores = result.scores || {};
    const health = scores.health || 50;
    const eco = scores.eco || scores.environmentScore || 50;
    const global = scores.global || scores.globalScore || 50;
    
    res.json({
      product: result.product || { name: 'Produit', barcode },
      scores: {
        health: health,
        healthScore: health,
        environmentScore: eco
      },
      summary: Array.isArray(result.insights) ? result.insights.join('. ') : 'Analyse complète',
      globalScore: global,
      dataSource: result.dataSource || 'unknown',
      // Ajout des détails pour debug
      details: {
        nutriScore: result.product?.nutriScore,
        novaGroup: result.product?.novaGroup,
        ecoScore: result.product?.ecoScore
      }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse',
      message: error.message 
    });
  }
});

module.exports = router;
