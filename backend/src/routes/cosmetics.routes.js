const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'cosmetics', timestamp: new Date().toISOString() });
});

// Liste produits cosmétiques
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ category: 'cosmetics' }).limit(20);
    res.json({ success: true, products, count: products.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route d'analyse
router.post('/analyze', async (req, res) => {
  console.log('Cosmetics analyze endpoint hit!');
  const { barcode } = req.body;
  res.json({
    success: true,
    data: { category: 'cosmetic', product: { barcode }, message: 'Analysis working!' }
  });
});

module.exports = router;
