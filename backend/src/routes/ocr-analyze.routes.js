const express = require('express');
const router = express.Router();
const visionService = require('../services/vision.service');
const { parseOCRToProduct } = require('../services/ocr-parser.service');
const { calculateProductScores } = require('../services/scoring.service');
const Product = require('../models/product.model');

/**
 * POST /api/ocr/analyze
 * Analyse 3 photos → Parsing IA → Score → Save DB
 */
router.post('/analyze', async (req, res) => {
  try {
    const { frontImage, ingredientsImage, barcodeImage } = req.body;

    if (!frontImage || !ingredientsImage) {
      return res.status(400).json({
        error: 'Photos face avant et ingrédients requises'
      });
    }

    console.log('🔍 Analyse OCR démarrée...');

    // 1. Google Vision OCR
    const [frontResult, ingredientsResult, barcodeResult] = await Promise.all([
      visionService.extractText(frontImage),
      visionService.extractText(ingredientsImage),
      barcodeImage ? visionService.extractText(barcodeImage) : Promise.resolve({ text: '' })
    ]);

    console.log('✅ OCR terminé');

    // 2. Parsing DeepSeek
    const productData = await parseOCRToProduct({
      frontText: frontResult.text,
      ingredientsText: ingredientsResult.text,
      barcodeText: barcodeResult.text
    });

    console.log('✅ Parsing terminé:', productData.name);

    // 3. Vérifier si produit existe déjà (par barcode)
    let product;
    if (productData.barcode) {
      product = await Product.findOne({ barcode: productData.barcode });
    }

    if (!product) {
      // 4. Créer nouveau produit
      product = new Product({
        name: productData.name,
        brand: productData.brand,
        barcode: productData.barcode || `OCR-${Date.now()}`,
        category: productData.category,
        foodData: {
          ingredients: productData.ingredients.join(', '),
          novaGroup: null, // Sera calculé par IA si possible
          additives: productData.ingredients.filter(i => i.match(/^E\d+/i))
        },
        labels_tags: productData.labels,
        source: productData.source,
        ocrMetadata: {
          confidence: productData.confidence,
          rawText: productData.ocrRawText,
          createdAt: new Date()
        }
      });

      // 5. Calculer scores
      product.scores = calculateProductScores(product);

      // 6. Sauvegarder
      await product.save();

      console.log('✅ Nouveau produit créé:', product._id);
    } else {
      console.log('✅ Produit existant trouvé:', product._id);
    }

    // 7. Retourner résultat
    res.json({
      success: true,
      product: {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        barcode: product.barcode,
        category: product.category,
        scores: product.scores,
        confidence: productData.confidence,
        isNew: !product.createdAt || product.source === productData.source
      }
    });

  } catch (error) {
    console.error('❌ Erreur analyse OCR:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse OCR',
      details: error.message
    });
  }
});

module.exports = router;
