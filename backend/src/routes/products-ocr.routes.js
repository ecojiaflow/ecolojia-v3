const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware');
const OCRProductService = require('../services/OCRProductService');
const ProductOrchestrator = require('../services/ProductOrchestrator');

// Configuration Multer pour upload photos (mémoire temporaire)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont acceptées'), false);
    }
    cb(null, true);
  }
});

/**
 * POST /api/products/create-from-ocr
 * Analyse 2 photos avec OCR + IA pour créer un produit
 */
router.post('/create-from-ocr', 
  authenticateToken, 
  upload.fields([
    { name: 'frontPhoto', maxCount: 1 },
    { name: 'ingredientsPhoto', maxCount: 1 }
  ]),
  async (req, res) => {
    const startTime = Date.now();

    try {
      const { barcode } = req.body;
      const frontPhoto = req.files?.frontPhoto?.[0];
      const ingredientsPhoto = req.files?.ingredientsPhoto?.[0];

      // Validation
      if (!barcode) {
        return res.status(400).json({
          success: false,
          message: 'Code-barre requis'
        });
      }

      if (!frontPhoto || !ingredientsPhoto) {
        return res.status(400).json({
          success: false,
          message: 'Les 2 photos sont requises (face avant + ingrédients)'
        });
      }

      console.log(`[OCR] Démarrage analyse pour barcode: ${barcode}`);
      console.log(`[OCR] Photo face avant: ${(frontPhoto.size / 1024).toFixed(2)} KB`);
      console.log(`[OCR] Photo ingrédients: ${(ingredientsPhoto.size / 1024).toFixed(2)} KB`);

      // Étape 1 : OCR Google Vision sur les 2 photos
      console.log('[OCR] Étape 1/4 : Extraction texte (Google Vision)...');
      const ocrTexts = await OCRProductService.extractTextFromPhotos(
        frontPhoto.buffer,
        ingredientsPhoto.buffer
      );

      if (!ocrTexts.frontText || !ocrTexts.ingredientsText) {
        return res.status(400).json({
          success: false,
          message: 'Impossible d\'extraire le texte des photos',
          debug: { ocrTexts }
        });
      }

      console.log(`[OCR] ? Texte extrait - Face: ${ocrTexts.frontText.length} chars, Ingrédients: ${ocrTexts.ingredientsText.length} chars`);
      
      const detectedCategory = ocrTexts.detectedCategory;
      console.log(`[OCR] Catégorie détectée: ${detectedCategory}`);

      // Étape 2 : Parsing intelligent avec DeepSeek IA
      console.log('[OCR] Étape 2/4 : Analyse IA (DeepSeek)...');
      const parsedData = await OCRProductService.parseWithAI(
        ocrTexts.frontText,
        ocrTexts.ingredientsText,
        barcode,
        detectedCategory
      );

      if (!parsedData) {
        return res.status(500).json({
          success: false,
          message: 'Échec du parsing IA',
          rawTexts: ocrTexts
        });
      }

      console.log(`[OCR] ? Données parsées - Produit: "${parsedData.productName}", Ingrédients: ${parsedData.ingredients.length}`);

      // Étape 3 : Calcul confiance
      console.log('[OCR] Étape 3/4 : Calcul confiance...');
      const confidence = OCRProductService.calculateConfidence(parsedData, ocrTexts);
      console.log(`[OCR] ? Confiance calculée: ${(confidence * 100).toFixed(1)}%`);

      // Étape 4 : Validation cohérence catégorie
      console.log('[OCR] Étape 4/4 : Validation cohérence...');
      const coherenceCheck = OCRProductService.validateCoherence(
        detectedCategory,
        ocrTexts.ingredientsText,
        parsedData
      );
      
      // ? NOUVEAU : Log mais NE PAS bloquer - Laisser le frontend gérer
      if (!coherenceCheck.canProceed) {
        console.log('[OCR] ?? Incohérence majeure détectée - Frontend gérera le blocage');
      } else {
        console.log(`[OCR] ? Cohérence validée: ${coherenceCheck.isCoherent ? 'OK' : 'ATTENTION'} (score: ${coherenceCheck.incoherenceScore}%)`);
      }

      // Construire résultat structuré (même en cas d'incohérence)
      const ocrResult = {
        frontData: {
          productName: parsedData.productName || 'Produit inconnu',
          brand: parsedData.brand || '',
          quantity: parsedData.quantity || '',
          barcode: barcode
        },
        ingredientsData: {
          ingredients: parsedData.ingredients || [],
          nutritionalValues: parsedData.nutritionalValues || {},
          allergens: parsedData.allergens || []
        },
        rawTexts: {
          front: ocrTexts.frontText,
          ingredients: ocrTexts.ingredientsText
        },
        confidence: confidence,
        aiAnalysis: parsedData.aiReasoning || 'Analyse automatique',
        detectedCategory,
        coherenceCheck
      };

      const processingTime = Date.now() - startTime;
      console.log(`[OCR] ? Analyse terminée en ${processingTime}ms`);

      const finalResponse = {
        success: true,
        ocrResult,
        processingTime,
        message: `Analyse réussie avec ${(confidence * 100).toFixed(0)}% de confiance`
      };
      
      console.log('[OCR] Réponse envoyée au frontend:', JSON.stringify(finalResponse).substring(0, 300));
      res.json(finalResponse);

    } catch (error) {
      console.error('[OCR] Erreur analyse:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'analyse OCR',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * POST /api/products/save-ocr-product
 * Sauvegarde un produit créé depuis OCR
 */
router.post('/save-ocr-product', authenticateToken, async (req, res) => {
  try {
    const {
      barcode,
      product_name,
      brands,
      quantity,
      ingredients_text,
      confidence,
      ocrMetadata
    } = req.body;

    // Validation
    if (!barcode || !product_name || !ingredients_text) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes (barcode, nom, ingrédients requis)'
      });
    }

    console.log(`[OCR] Sauvegarde produit OCR: ${barcode} - "${product_name}"`);

    // Utiliser ProductOrchestrator pour créer le produit avec scoring
    const product = await ProductOrchestrator.createFromOCR({
      code: barcode,
      product_name,
      brands,
      quantity,
      ingredients_text,
      categories_tags: ['en:food'], // Par défaut alimentaire
      source: 'ocr',
      confidence: confidence || 0.7,
      ocrMetadata: ocrMetadata || {}
    });

    if (!product) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la création du produit'
      });
    }

    console.log(`[OCR] ? Produit sauvegardé: ${product._id}`);

    res.json({
      success: true,
      product,
      message: 'Produit créé avec succès'
    });

  } catch (error) {
    console.error('[OCR] Erreur sauvegarde:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la sauvegarde',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;