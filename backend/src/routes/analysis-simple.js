const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Analysis routes active',
    version: '1.0.0'
  });
});

router.post('/barcode', (req, res) => {
  const { barcode } = req.body;
  res.json({
    success: true,
    message: `Analyse du code-barres ${barcode}`,
    data: { barcode, status: 'pending' }
  });
});

router.post('/manual', (req, res) => {
  const { name, ingredients } = req.body;
  res.json({
    success: true,
    message: 'Analyse manuelle',
    data: { name, ingredients, status: 'pending' }
  });
});

module.exports = router;
