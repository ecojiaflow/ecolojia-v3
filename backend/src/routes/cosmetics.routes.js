const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'cosmetics', timestamp: new Date().toISOString() });
});

// Route d'analyse simplifiée
router.post('/analyze', async (req, res) => {
  console.log('Cosmetics analyze endpoint hit!');
  
  const { barcode } = req.body;
  
  // Mock temporaire - scoring basique
  res.json({
    success: true,
    data: {
      category: 'cosmetic',
      product: { 
        name: 'Test Cosmetic Product',
        barcode: barcode 
      },
      score: { 
        value: 70, 
        label: 'B' 
      },
      risk_analysis: {
        endocrine_disruptors: [],
        irritants: [],
        controversial: []
      },
      message: 'Cosmetics analysis working! (mock mode)'
    }
  });
});

// Status
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    service: 'cosmetics',
    mode: 'mock',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
