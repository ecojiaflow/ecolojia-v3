// backend/src/services/vision/VisionService.js
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs').promises;

// Logger simple
const logger = {
  info: (...args) => console.log('[VisionService]', ...args),
  error: (...args) => console.error('[VisionService ERROR]', ...args),
  warn: (...args) => console.warn('[VisionService WARN]', ...args),
  debug: (...args) => console.log('[VisionService DEBUG]', ...args)
};

class VisionService {
  constructor() {
    this.tesseractWorker = null;
    this.initialized = false;
    
    // Patterns pour détecter les sections
    this.patterns = {
      ingredients: {
        fr: /(?:ingrédients?|composition|contient|ingredients?)\s*:?\s*/i,
        en: /(?:ingredients?|contains?|composition)\s*:?\s*/i
      },
      nutritional: {
        fr: /(?:valeurs? nutritionnelles?|nutrition|pour 100\s*g)/i,
        en: /(?:nutrition(?:al)? (?:facts?|values?)|per 100\s*g)/i
      },
      allergens: {
        fr: /(?:allergènes?|peut contenir|traces? de)/i,
        en: /(?:allergens?|may contain|traces? of)/i
      }
    };
  }

  async initialize() {
    try {
      if (this.initialized) return true;

      logger.info('Initializing VisionService...');
      
      // Initialiser Tesseract worker
      this.tesseractWorker = await Tesseract.createWorker({
        langPath: path.join(__dirname, '../../assets/tessdata'),
        logger: m => logger.debug(m)
      });

      await this.tesseractWorker.loadLanguage('fra+eng');
      await this.tesseractWorker.initialize('fra+eng');
      
      this.initialized = true;
      logger.info('✅ VisionService initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize VisionService:', error);
      throw error;
    }
  }

  async analyzeImage(imagePath, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.info('Analyzing image:', imagePath);

      // 1. Préprocessing de l'image
      const processedImagePath = await this.preprocessImage(imagePath, options);

      // 2. OCR avec Tesseract
      const ocrResult = await this.performOCR(processedImagePath);

      // 3. Extraction des informations
      const extractedData = this.extractProductInfo(ocrResult.data.text);

      // 4. Détection du type de produit
      const productType = this.detectProductType(ocrResult.data.text, extractedData);

      // 5. Calcul de la confiance
      const confidence = this.calculateConfidence(ocrResult, extractedData);

      // Nettoyer le fichier temporaire
      if (processedImagePath !== imagePath) {
        await fs.unlink(processedImagePath).catch(() => {});
      }

      const result = {
        success: true,
        data: {
          rawText: ocrResult.data.text,
          extractedData,
          productType,
          confidence,
          language: this.detectLanguage(ocrResult.data.text),
          timestamp: new Date()
        }
      };

      logger.info('Image analysis completed:', {
        productType,
        confidence: confidence.overall,
        hasIngredients: !!extractedData.ingredients
      });

      return result;
    } catch (error) {
      logger.error('Image analysis failed:', error);
      throw error;
    }
  }

  async preprocessImage(imagePath, options = {}) {
    try {
      const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');
      
      // Pipeline de prétraitement pour améliorer l'OCR
      await sharp(imagePath)
        .resize(2000, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .grayscale()
        .normalize()
        .sharpen()
        .threshold(options.threshold || 180)
        .toFile(outputPath);

      logger.debug('Image preprocessed:', outputPath);
      return outputPath;
    } catch (error) {
      logger.error('Image preprocessing failed:', error);
      return imagePath; // Fallback sur l'image originale
    }
  }

  async performOCR(imagePath) {
    try {
      const result = await this.tesseractWorker.recognize(imagePath);
      logger.debug('OCR completed, confidence:', result.data.confidence);
      return result;
    } catch (error) {
      logger.error('OCR failed:', error);
      throw error;
    }
  }

  extractProductInfo(text) {
    const extracted = {
      productName: null,
      brand: null,
      ingredients: null,
      nutritionalInfo: null,
      allergens: null,
      barcode: null,
      weight: null,
      expiryDate: null
    };

    if (!text) return extracted;

    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Extraction du nom du produit (généralement en début)
    if (lines.length > 0) {
      extracted.productName = this.cleanProductName(lines[0]);
      
      // La marque est souvent sur la 2e ligne ou en majuscules
      if (lines.length > 1) {
        const brandLine = lines.find(line => line === line.toUpperCase() && line.length > 2);
        if (brandLine) {
          extracted.brand = brandLine;
        }
      }
    }

    // Extraction des ingrédients
    const ingredientsMatch = this.findSection(text, this.patterns.ingredients);
    if (ingredientsMatch) {
      extracted.ingredients = this.cleanIngredients(ingredientsMatch);
    }

    // Extraction des informations nutritionnelles
    const nutritionalMatch = this.findSection(text, this.patterns.nutritional);
    if (nutritionalMatch) {
      extracted.nutritionalInfo = this.parseNutritionalInfo(nutritionalMatch);
    }

    // Extraction des allergènes
    const allergensMatch = this.findSection(text, this.patterns.allergens);
    if (allergensMatch) {
      extracted.allergens = this.parseAllergens(allergensMatch);
    }

    // Extraction du code-barres (pattern de chiffres)
    const barcodeMatch = text.match(/\b\d{8,13}\b/);
    if (barcodeMatch) {
      extracted.barcode = barcodeMatch[0];
    }

    // Extraction du poids
    const weightMatch = text.match(/\d+\s*(?:g|kg|ml|l|cl)\b/i);
    if (weightMatch) {
      extracted.weight = weightMatch[0];
    }

    // Extraction de la date de péremption
    const dateMatch = text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/);
    if (dateMatch) {
      extracted.expiryDate = dateMatch[0];
    }

    return extracted;
  }

  findSection(text, patterns) {
    for (const [lang, pattern] of Object.entries(patterns)) {
      const match = text.match(new RegExp(pattern.source + '([^]*?)(?=(?:' + 
        Object.values(this.patterns).map(p => p[lang].source).join('|') + ')|$)', 'i'));
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  cleanProductName(name) {
    return name
      .replace(/[®™©]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  cleanIngredients(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[_\-]{2,}/g, '')
      .replace(/\*/g, '')
      .trim();
  }

  parseNutritionalInfo(text) {
    const info = {};
    
    // Patterns pour extraire les valeurs nutritionnelles
    const patterns = {
      energy: /(?:énergie|energy|calories?)\s*:?\s*(\d+)\s*(?:kcal|kj)/i,
      fat: /(?:matières? grasses?|fat|lipides?)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      saturated: /(?:saturées?|saturated)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      carbs: /(?:glucides?|carbohydrates?|sucres? totaux)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      sugars: /(?:dont sucres?|sugars?)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      fiber: /(?:fibres?|fiber)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      protein: /(?:protéines?|protein)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      salt: /(?:sel|salt|sodium)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        info[key] = parseFloat(match[1].replace(',', '.'));
      }
    }

    return Object.keys(info).length > 0 ? info : null;
  }

  parseAllergens(text) {
    const commonAllergens = [
      'gluten', 'blé', 'wheat',
      'lait', 'milk', 'lactose',
      'œuf', 'egg', 'oeuf',
      'soja', 'soy',
      'fruits à coque', 'nuts', 'noix',
      'arachide', 'peanut',
      'poisson', 'fish',
      'crustacé', 'shellfish',
      'céleri', 'celery',
      'moutarde', 'mustard',
      'sésame', 'sesame',
      'sulfite', 'sulphite',
      'lupin',
      'mollusque', 'mollusk'
    ];

    const found = [];
    const lowerText = text.toLowerCase();

    for (const allergen of commonAllergens) {
      if (lowerText.includes(allergen)) {
        found.push(allergen);
      }
    }

    return found.length > 0 ? found : null;
  }

  detectProductType(text, extractedData) {
    const lowerText = text.toLowerCase();
    
    // Détection basée sur les mots-clés
    if (extractedData.nutritionalInfo || lowerText.includes('nutrition')) {
      return 'food';
    }
    
    if (lowerText.match(/(?:shampoo|crème|cream|lotion|sérum|gel|savon|soap)/i)) {
      return 'cosmetics';
    }
    
    if (lowerText.match(/(?:lessive|detergent|nettoyant|cleaner|javel|bleach)/i)) {
      return 'detergents';
    }

    // Détection basée sur les ingrédients
    if (extractedData.ingredients) {
      const ingredients = extractedData.ingredients.toLowerCase();
      
      if (ingredients.match(/(?:aqua|sodium laureth|paraben|glycerin)/i)) {
        return ingredients.match(/(?:sucre|sugar|sel|salt|farine|flour)/i) ? 'food' : 'cosmetics';
      }
      
      if (ingredients.match(/(?:enzyme|phosphate|surfactant|tensioactif)/i)) {
        return 'detergents';
      }
    }

    return 'unknown';
  }

  calculateConfidence(ocrResult, extractedData) {
    const confidence = {
      ocr: ocrResult.data.confidence || 0,
      extraction: 0,
      overall: 0
    };

    // Calcul de la confiance d'extraction
    let extractedFields = 0;
    let totalFields = 0;

    for (const [key, value] of Object.entries(extractedData)) {
      totalFields++;
      if (value !== null && value !== '') {
        extractedFields++;
      }
    }

    confidence.extraction = totalFields > 0 ? (extractedFields / totalFields) * 100 : 0;

    // Confiance globale (moyenne pondérée)
    confidence.overall = Math.round(
      (confidence.ocr * 0.4) + 
      (confidence.extraction * 0.6)
    );

    return confidence;
  }

  detectLanguage(text) {
    const frenchWords = /(?:ingrédients|contient|valeur|nutritionnelle|pour|avec|sans)/gi;
    const englishWords = /(?:ingredients|contains|nutritional|value|with|without)/gi;
    
    const frenchMatches = (text.match(frenchWords) || []).length;
    const englishMatches = (text.match(englishWords) || []).length;
    
    if (frenchMatches > englishMatches) return 'fr';
    if (englishMatches > frenchMatches) return 'en';
    return 'unknown';
  }

  async shutdown() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
      this.initialized = false;
      logger.info('VisionService shut down');
    }
  }
}

// Export singleton
module.exports = new VisionService();
