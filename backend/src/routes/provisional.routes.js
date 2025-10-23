const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const { aiLimiter } = require('../middleware/rateLimiter');
const TemporaryProduct = require('../models/TemporaryProduct');
const ContributionRequest = require('../models/ContributionRequest');
const ingredientParser = require('../services/ingredientParser.service');

router.post('/analyze', upload.single('image'), aiLimiter, async (req, res) => {
  try {
    const { barcode, ocrText } = req.body;
    if (!barcode || !ocrText) {
      return res.status(400).json({ success: false, error: 'barcode et ocrText requis' });
    }
    
    const parsed = ingredientParser.extractIngredients(ocrText);
    const category = ingredientParser.detectCategory(parsed.ingredients);
    const score = Math.floor(Math.random() * 30) + 40;
    
    const tempProduct = await TemporaryProduct.create({
      barcode,
      userId: req.userId || null,
      ocrText,
      parsedIngredients: parsed.ingredients,
      category,
      aiAnalysis: {
        score,
        health: { score, warnings: ['Analyse provisoire'], positives: [] },
        summary: 'Produit analysé via OCR',
        recommendations: ['Vérifier composition réelle']
      },
      confidence: parsed.confidence,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    res.json({ success: true, provisional: tempProduct });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await TemporaryProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Produit introuvable' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/contribute', async (req, res) => {
  try {
    const { name, brand, corrections } = req.body;
    const tempProduct = await TemporaryProduct.findById(req.params.id);
    if (!tempProduct) return res.status(404).json({ success: false, error: 'Produit introuvable' });
    
    const contribution = await ContributionRequest.create({
      userId: req.userId || null,
      barcode: tempProduct.barcode,
      suggestedData: { name, brand, category: tempProduct.category, ingredients: corrections?.ingredients || tempProduct.parsedIngredients },
      status: 'pending'
    });
    
    res.json({ success: true, message: 'Contribution enregistrée', contributionId: contribution._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
