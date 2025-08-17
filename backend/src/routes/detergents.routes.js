const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'detergents', timestamp: new Date().toISOString() });
});

// Route d'analyse
router.post('/analyze', (req, res) => {
  console.log('Detergents analyze endpoint hit!');
  res.json({
    success: true,
    data: {
      category: 'detergent',
      product: { name: req.body.name || 'Test detergent' },
      score: { value: 65, label: 'C' },
      composition: req.body.composition,
      message: 'Detergents analysis working!'
    }
  });
});

module.exports = router;
