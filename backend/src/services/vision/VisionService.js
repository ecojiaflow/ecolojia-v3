// PATH: backend\src\services\vision\VisionService.js
const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class VisionService {
  constructor() {
    this.googleVisionClient = null;
    this.tesseractWorker = null;
    this.initializeClients();
  }

  async initializeClients() {
    try {
      // Google Vision
      if (process.env.GOOGLE_CLOUD_KEYFILE) {
        this.googleVisionClient = new vision.ImageAnnotatorClient({
          keyFilename: process.env.GOOGLE_CLOUD_KEYFILE
        });
        console.log('✅ Google Vision client initialisé');
      } else {
        console.warn('⚠️ GOOGLE_CLOUD_KEYFILE non configuré - fallback Tesseract uniquement');
      }
    } catch (error) {
      console.error('❌ Erreur init Google Vision:', error.message);
    }
  }

  async initializeTesseract() {
    if (!this.tesseractWorker) {
      try {
        const Tesseract = await import('tesseract.js');
        const { createWorker } = Tesseract.default || Tesseract;
        
        this.tesseractWorker = await createWorker('fra+eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`[Tesseract] Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        console.log('✅ Tesseract worker initialisé');
      } catch (error) {
        console.error('❌ Erreur init Tesseract:', error.message);
        throw error;
      }
    }
    return this.tesseractWorker;
  }

  /**
   * Amélioration d'image pour OCR
   */
  async enhanceImage(imagePath) {
    const outputPath = imagePath.replace(/\.[^.]+$/, '_enhanced.jpg');
    
    try {
      await sharp(imagePath)
        .resize(2000, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .normalize()
        .sharpen()
        .modulate({
          brightness: 1.1,
          contrast: 1.2
        })
        .greyscale()
        .jpeg({ quality: 95 })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Erreur enhancement:', error);
      return imagePath; // Fallback image originale
    }
  }

  /**
   * Analyse avec Google Vision
   */
  async analyzeWithGoogleVision(imagePath, language = 'fr') {
    if (!this.googleVisionClient) {
      return null;
    }

    try {
      const [result] = await this.googleVisionClient.textDetection({
        image: { source: { filename: imagePath } },
        imageContext: {
          languageHints: [language, 'en']
        }
      });

      const fullText = result.fullTextAnnotation?.text || '';
      const confidence = this.calculateGoogleConfidence(result);

      return {
        text: fullText,
        confidence,
        blocks: result.textAnnotations || [],
        service: 'google_vision'
      };
    } catch (error) {
      console.error('Erreur Google Vision:', error.message);
      return null;
    }
  }

  /**
   * Analyse avec Tesseract
   */
  async analyzeWithTesseract(imagePath, language = 'fra') {
    try {
      const worker = await this.initializeTesseract();
      
      // Améliorer l'image avant OCR
      const enhancedPath = await this.enhanceImage(imagePath);
      
      const { data } = await worker.recognize(enhancedPath);
      
      // Nettoyer l'image améliorée
      if (enhancedPath !== imagePath) {
        await fs.unlink(enhancedPath).catch(() => {});
      }

      return {
        text: data.text,
        confidence: data.confidence / 100,
        blocks: data.words || [],
        service: 'tesseract'
      };
    } catch (error) {
      console.error('Erreur Tesseract:', error.message);
      return null;
    }
  }

  /**
   * Fusion des résultats Google Vision et Tesseract
   */
  mergeResults(googleResult, tesseractResult) {
    // Si un seul résultat disponible
    if (!googleResult) return tesseractResult;
    if (!tesseractResult) return googleResult;

    // Prioriser Google Vision si confiance > 0.7
    if (googleResult.confidence > 0.7) {
      return {
        ...googleResult,
        alternativeText: tesseractResult.text,
        mergedConfidence: (googleResult.confidence + tesseractResult.confidence) / 2
      };
    }

    // Sinon, utiliser le plus confiant
    const bestResult = googleResult.confidence > tesseractResult.confidence 
      ? googleResult 
      : tesseractResult;

    const alternativeResult = googleResult.confidence > tesseractResult.confidence 
      ? tesseractResult 
      : googleResult;

    return {
      ...bestResult,
      alternativeText: alternativeResult.text,
      mergedConfidence: (googleResult.confidence + tesseractResult.confidence) / 2,
      usedFallback: true
    };
  }

  /**
   * Extraction de données structurées
   */
  extractStructuredData(visionResult) {
    if (!visionResult || !visionResult.text) {
      return {
        name: null,
        brand: null,
        ingredients: null,
        barcode: null,
        category: null,
        hasNutritionalInfo: false
      };
    }

    const text = visionResult.text;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Extraction du nom (premières lignes, souvent plus grosses)
    const name = this.extractProductName(lines);

    // Extraction de la marque
    const brand = this.extractBrand(lines, text);

    // Extraction des ingrédients
    const ingredients = this.extractIngredients(text);

    // Extraction du code-barres
    const barcode = this.extractBarcode(text);

    // Détection de la catégorie
    const category = this.detectCategory(text, ingredients);

    // Détection infos nutritionnelles
    const hasNutritionalInfo = this.hasNutritionalInfo(text);

    return {
      name,
      brand,
      ingredients,
      barcode,
      category,
      hasNutritionalInfo,
      confidence: visionResult.confidence || 0
    };
  }

  extractProductName(lines) {
    // Prendre les 2-3 premières lignes significatives
    const candidates = lines.slice(0, 5).filter(line => 
      line.length > 3 && 
      !line.match(/^(ingredients|ingrédients|composition)/i) &&
      !line.match(/^\d+\s*[gml]/i)
    );

    return candidates[0] || null;
  }

  extractBrand(lines, fullText) {
    // Patterns de marques connues (à enrichir)
    const brandPatterns = [
      /\b(Nestlé|Danone|Unilever|L'Oréal|Garnier|Nivea|Dove|Ariel|Skip)\b/i,
      /\bmarque\s*:\s*([^\n]+)/i,
      /\bbrand\s*:\s*([^\n]+)/i
    ];

    for (const pattern of brandPatterns) {
      const match = fullText.match(pattern);
      if (match) return match[1].trim();
    }

    // Heuristique: souvent en majuscules dans les premières lignes
    const upperCaseLines = lines.slice(0, 3).filter(line => 
      line === line.toUpperCase() && line.length > 2
    );
    
    return upperCaseLines[0] || null;
  }

  extractIngredients(text) {
    // Patterns multilingues pour ingrédients
    const patterns = [
      /ingrédients\s*:?\s*([^.]+(?:\.[^.]+)*?)(?=\n\n|\n[A-Z]|valeurs|nutrition|$)/is,
      /ingredients\s*:?\s*([^.]+(?:\.[^.]+)*?)(?=\n\n|\n[A-Z]|values|nutrition|$)/is,
      /composition\s*:?\s*([^.]+(?:\.[^.]+)*?)(?=\n\n|\n[A-Z]|$)/is
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const ingredients = match[1]
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (ingredients.length > 10) {
          return ingredients;
        }
      }
    }

    return null;
  }

  extractBarcode(text) {
    // EAN-13 ou EAN-8
    const barcodePattern = /\b(\d{8}|\d{13})\b/g;
    const matches = text.match(barcodePattern);
    
    if (matches) {
      // Vérifier la validité EAN
      for (const match of matches) {
        if (this.isValidEAN(match)) {
          return match;
        }
      }
    }
    
    return null;
  }

  isValidEAN(code) {
    if (code.length !== 8 && code.length !== 13) return false;
    
    let sum = 0;
    for (let i = 0; i < code.length - 1; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(code[code.length - 1]);
  }

  detectCategory(text, ingredients) {
    const lowerText = text.toLowerCase();
    
    // Détection alimentaire
    if (ingredients && ingredients.match(/sucre|sel|farine|lait|œuf|huile/i)) {
      return 'food';
    }
    
    // Détection cosmétique
    if (lowerText.match(/aqua|glycerin|parfum|paraben|sodium|lotion|crème|cream|shampoo/)) {
      return 'cosmetics';
    }
    
    // Détection détergent
    if (lowerText.match(/tensioactif|surfactant|lessive|detergent|nettoyant|javel|savon/)) {
      return 'detergents';
    }
    
    // Fallback basé sur certains mots-clés
    if (lowerText.match(/nutrition|kcal|calories|glucides|protéines/)) {
      return 'food';
    }
    
    return null;
  }

  hasNutritionalInfo(text) {
    const nutritionPatterns = [
      /valeurs? nutrition/i,
      /nutrition(al)? (facts|information|values)/i,
      /\b(kcal|calories|glucides|lipides|protéines|proteins|carbs|sugars)\b/i,
      /pour\s+100\s*g/i,
      /per\s+100\s*g/i
    ];

    return nutritionPatterns.some(pattern => pattern.test(text));
  }

  calculateGoogleConfidence(result) {
    if (!result.fullTextAnnotation) return 0;
    
    // Calculer la confiance basée sur la qualité de détection
    const blocks = result.fullTextAnnotation.pages?.[0]?.blocks || [];
    if (blocks.length === 0) return 0;
    
    let totalConfidence = 0;
    let count = 0;
    
    blocks.forEach(block => {
      if (block.confidence) {
        totalConfidence += block.confidence;
        count++;
      }
    });
    
    return count > 0 ? totalConfidence / count : 0.5;
  }

  /**
   * Méthode principale d'analyse
   */
  async analyzeImage(imagePath, options = {}) {
    const startTime = Date.now();
    const jobId = options.jobId || uuidv4();
    
    try {
      console.log(`[Vision] Début analyse ${jobId}`);
      
      // Essayer Google Vision d'abord
      const googleResult = await this.analyzeWithGoogleVision(imagePath, options.language);
      
      let finalResult;
      
      // Si Google Vision échoue ou confiance faible, utiliser Tesseract
      if (!googleResult || googleResult.confidence < 0.7) {
        console.log(`[Vision] Confiance Google faible (${googleResult?.confidence || 0}), utilisation Tesseract`);
        const tesseractResult = await this.analyzeWithTesseract(imagePath, options.language);
        
        finalResult = this.mergeResults(googleResult, tesseractResult);
      } else {
        finalResult = googleResult;
      }
      
      // Extraction des données structurées
      const extractedData = this.extractStructuredData(finalResult);
      
      const duration = Date.now() - startTime;
      console.log(`[Vision] Analyse terminée en ${duration}ms - Service: ${finalResult.service}`);
      
      return {
        jobId,
        status: 'completed',
        result: {
          text: finalResult.text,
          extractedData,
          confidence: finalResult.confidence || 0,
          service: finalResult.service,
          usedFallback: finalResult.usedFallback || false,
          duration
        }
      };
    } catch (error) {
      console.error(`[Vision] Erreur analyse ${jobId}:`, error);
      return {
        jobId,
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Nettoyage des ressources
   */
  async cleanup() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }
}

module.exports = new VisionService();