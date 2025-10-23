const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'detergents', timestamp: new Date().toISOString() });
});

// Liste produits détergents
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ category: 'detergents' }).limit(20);
    res.json({ success: true, products, count: products.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route d'analyse
router.post('/analyze', (req, res) => {
  console.log('Detergents analyze endpoint hit!');
  res.json({
    success: true,
    data: { category: 'detergent', product: req.body, message: 'Analysis working!' }
  });
});

module.exports = router;
