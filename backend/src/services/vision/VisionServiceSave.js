// backend/src/services/vision/VisionService.js
// Service OCR avec Google Vision API reel

const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const crypto = require('crypto');
const Redis = require('redis');
const { promisify } = require('util');

class VisionService {
  constructor() {
    // Initialiser Google Vision avec les credentials
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

    // Redis pour le cache
    this.redis = Redis.createClient({
      url: process.env.REDIS_URL,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined
    });
    
    this.redis.on('error', (err) => {
      console.log('Redis Client Error', err);
    });

    // Promisify Redis methods
    this.redisGet = promisify(this.redis.get).bind(this.redis);
    this.redisSet = promisify(this.redis.set).bind(this.redis);
    this.redisSetex = promisify(this.redis.setex).bind(this.redis);
  }

  /**
   * Analyse une image avec Google Vision API
   * @param {Buffer|String} image - Buffer de l'image ou chemin
   * @param {Object} options - Options d'analyse
   */
  async analyzeImage(image, options = {}) {
    try {
      const {
        detectText = true,
        detectLabels = true,
        detectLogos = true,
        detectProducts = false,
        language = 'fr'
      } = options;

      // Creer un hash pour le cache
      const imageHash = crypto.createHash('md5')
        .update(Buffer.isBuffer(image) ? image : image.toString())
        .digest('hex');
      
      const cacheKey = `vision:${imageHash}`;

      // Verifier le cache
      try {
        const cached = await this.redisGet(cacheKey);
        if (cached) {
          console.log('ðŸŽ¯ Vision result from cache');
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        console.warn('Cache error:', cacheError);
      }

      // Preparer l'image pour l'API
      const imageContent = Buffer.isBuffer(image) ? image : await this.loadImage(image);
      
      // Optimiser l'image si elle est trop grande
      const optimizedImage = await this.optimizeImage(imageContent);

      // Construire les features   detecter
      const features = [];
      if (detectText) features.push({ type: 'TEXT_DETECTION', maxResults: 1 });
      if (detectLabels) features.push({ type: 'LABEL_DETECTION', maxResults: 10 });
      if (detectLogos) features.push({ type: 'LOGO_DETECTION', maxResults: 5 });
      if (detectProducts) features.push({ type: 'PRODUCT_SEARCH', maxResults: 5 });

      // Appel   Google Vision API
      console.log('ðŸ” Calling Google Vision API...');
      const [result] = await this.client.annotateImage({
        image: {
          content: optimizedImage.toString('base64')
        },
        features,
        imageContext: {
          languageHints: [language]
        }
      });

      // Traiter les resultats
      const processedResult = {
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          text: this.processTextDetection(result),
          labels: this.processLabels(result),
          logos: this.processLogos(result),
          products: detectProducts ? this.processProducts(result) : null,
          extractedInfo: this.extractProductInfo(result)
        },
        confidence: this.calculateOverallConfidence(result)
      };

      // Mettre en cache pour 1 heure
      try {
        await this.redisSetex(cacheKey, 3600, JSON.stringify(processedResult));
      } catch (cacheError) {
        console.warn('Failed to cache result:', cacheError);
      }

      return processedResult;

    } catch (error) {
      console.error('âŒ Google Vision API error:', error);
      
      // Si l'API echoue, essayer avec Tesseract en fallback
      if (options.fallbackToTesseract !== false) {
        console.log('ðŸ”„ Falling back to Tesseract...');
        return this.analyzeWithTesseract(image);
      }
      
      throw error;
    }
  }

  /**
   * Optimise l'image avant l'envoi   l'API
   */
  async optimizeImage(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      // Si l'image est trop grande, la redimensionner
      if (metadata.width > 4096 || metadata.height > 4096) {
        return await sharp(imageBuffer)
          .resize(4096, 4096, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toBuffer();
      }
      
      // Ameliorer le contraste pour une meilleure OCR
      return await sharp(imageBuffer)
        .normalize()
        .sharpen()
        .jpeg({ quality: 90 })
        .toBuffer();
        
    } catch (error) {
      console.warn('Image optimization failed:', error);
      return imageBuffer;
    }
  }

  /**
   * Traite la detection de texte
   */
  processTextDetection(result) {
    const textAnnotation = result.fullTextAnnotation;
    
    if (!textAnnotation) {
      return {
        fullText: '',
        blocks: [],
        confidence: 0
      };
    }

    return {
      fullText: textAnnotation.text,
      blocks: textAnnotation.pages?.[0]?.blocks?.map(block => ({
        text: block.paragraphs?.map(p => 
          p.words?.map(w => 
            w.symbols?.map(s => s.text).join('')
          ).join(' ')
        ).join('\n'),
        confidence: block.confidence || 0,
        boundingBox: block.boundingBox
      })) || [],
      confidence: this.calculateTextConfidence(textAnnotation)
    };
  }

  /**
   * Traite les labels detectes
   */
  processLabels(result) {
    return (result.labelAnnotations || []).map(label => ({
      description: label.description,
      score: label.score,
      topicality: label.topicality
    }));
  }

  /**
   * Traite les logos detectes
   */
  processLogos(result) {
    return (result.logoAnnotations || []).map(logo => ({
      description: logo.description,
      score: logo.score,
      boundingBox: logo.boundingPoly
    }));
  }

  /**
   * Extrait les informations produit du texte
   */
  extractProductInfo(result) {
    const text = result.fullTextAnnotation?.text || '';
    
    if (!text) {
      return {
        name: null,
        brand: null,
        ingredients: null,
        nutritionalInfo: null,
        barcode: null,
        category: null
      };
    }

    return {
      name: this.extractProductName(text, result.logoAnnotations),
      brand: this.extractBrand(text, result.logoAnnotations),
      ingredients: this.extractIngredients(text),
      nutritionalInfo: this.extractNutritionalInfo(text),
      barcode: this.extractBarcode(text),
      category: this.detectCategory(text, result.labelAnnotations)
    };
  }

  /**
   * Extrait le nom du produit
   */
  extractProductName(text, logos) {
    // Patterns pour identifier le nom du produit
    const lines = text.split('\n').filter(line => line.trim());
    
    // Rechercher les lignes en majuscules ou avec une taille importante
    const candidateNames = lines.filter(line => {
      const upperRatio = (line.match(/[A-Z]/g) || []).length / line.length;
      return upperRatio > 0.5 && line.length > 3 && line.length < 50;
    });

    // Si on a des logos, privilegier les lignes proches
    if (logos && logos.length > 0 && candidateNames.length > 0) {
      return candidateNames[0];
    }

    // Sinon prendre la premiere ligne significative
    return candidateNames[0] || lines.find(l => l.length > 5 && l.length < 50) || null;
  }

  /**
   * Extrait la marque
   */
  extractBrand(text, logos) {
    // Si on a des logos detectes, les utiliser
    if (logos && logos.length > 0) {
      return logos[0].description;
    }

    // Sinon chercher des patterns de marques connues
    const brandPatterns = [
      /(?:marque|brand|fabrique par|produit par)[:\s]+([^\n]+)/i,
      /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)/m
    ];

    for (const pattern of brandPatterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }

    return null;
  }

  /**
   * Extrait les ingredients
   */
  extractIngredients(text) {
    // Patterns multilingues pour les ingredients
    const patterns = [
      /ingredients?\s*:?\s*([^.]+(?:\.[^.]+)*?)(?=\n|valeurs|nutritional|allergen)/i,
      /composition\s*:?\s*([^.]+(?:\.[^.]+)*?)(?=\n|valeurs|nutritional)/i,
      /ingredients?\s*:?\s*([^.]+(?:\.[^.]+)*?)(?=\n|nutrition|allergen)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Nettoyer et formater les ingredients
        return match[1]
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/\*/g, '')
          .replace(/\([^)]*\)/g, match => match.replace(/,/g, ';')); // Preserver les virgules dans les parentheses
      }
    }

    return null;
  }

  /**
   * Extrait les informations nutritionnelles
   */
  extractNutritionalInfo(text) {
    const nutritionalData = {};
    
    // Patterns pour les valeurs nutritionnelles
    const patterns = {
      energy: /(?:energie|energy|calories?)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:kcal|cal)/i,
      fat: /(?:matieres grasses|graisses?|fat|lipides?)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      saturatedFat: /(?:acides gras satures|saturated|satures)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /(?:glucides?|carbohydrates?|sucres totaux)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      sugars: /(?:dont sucres|sugars?|sucres)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /(?:fibres?|fiber)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      protein: /(?:proteines?|proteins?)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      salt: /(?:sel|salt|sodium)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        nutritionalData[key] = parseFloat(match[1].replace(',', '.'));
      }
    });

    return Object.keys(nutritionalData).length > 0 ? nutritionalData : null;
  }

  /**
   * Extrait le code-barres
   */
  extractBarcode(text) {
    // Patterns pour codes-barres EAN-13, EAN-8, UPC
    const barcodePatterns = [
      /\b(\d{13})\b/,  // EAN-13
      /\b(\d{12})\b/,  // UPC-A
      /\b(\d{8})\b/    // EAN-8
    ];

    for (const pattern of barcodePatterns) {
      const matches = text.match(new RegExp(pattern, 'g'));
      if (matches) {
        // Valider avec checksum si possible
        const validBarcode = matches.find(code => this.isValidBarcode(code));
        if (validBarcode) return validBarcode;
      }
    }

    return null;
  }

  /**
   * Valide un code-barres avec checksum
   */
  isValidBarcode(code) {
    if (code.length !== 8 && code.length !== 12 && code.length !== 13) {
      return false;
    }

    // Validation EAN/UPC checksum
    const digits = code.split('').map(Number);
    const checkDigit = digits.pop();
    
    let sum = 0;
    digits.forEach((digit, index) => {
      sum += digit * (index % 2 === 0 ? 1 : 3);
    });
    
    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }

  /**
   * Detecte la categorie du produit
   */
  detectCategory(text, labels) {
    const textLower = text.toLowerCase();
    
    // Score pour chaque categorie
    const categoryScores = {
      food: 0,
      cosmetic: 0,
      detergent: 0
    };

    // Analyse des labels
    if (labels) {
      labels.forEach(label => {
        const desc = label.description.toLowerCase();
        if (['food', 'aliment', 'nourriture', 'beverage', 'drink'].some(w => desc.includes(w))) {
          categoryScores.food += label.score * 10;
        }
        if (['cosmetic', 'beauty', 'skin', 'hair', 'makeup'].some(w => desc.includes(w))) {
          categoryScores.cosmetic += label.score * 10;
        }
        if (['cleaning', 'detergent', 'household'].some(w => desc.includes(w))) {
          categoryScores.detergent += label.score * 10;
        }
      });
    }

    // Analyse du texte
    const foodKeywords = ['ingredients', 'nutritionnel', 'kcal', 'proteines', 'glucides'];
    const cosmeticKeywords = ['aqua', 'parfum', 'inci', 'appliquer', 'peau', 'cheveux'];
    const detergentKeywords = ['tensioactif', 'lessive', 'nettoyer', 'detergent', 'usage domestique'];

    foodKeywords.forEach(kw => {
      if (textLower.includes(kw)) categoryScores.food += 5;
    });
    
    cosmeticKeywords.forEach(kw => {
      if (textLower.includes(kw)) categoryScores.cosmetic += 5;
    });
    
    detergentKeywords.forEach(kw => {
      if (textLower.includes(kw)) categoryScores.detergent += 5;
    });

    // Retourner la categorie avec le score le plus eleve
    const maxScore = Math.max(...Object.values(categoryScores));
    if (maxScore === 0) return null;

    return Object.entries(categoryScores)
      .find(([_, score]) => score === maxScore)[0];
  }

  /**
   * Calcule la confiance globale
   */
  calculateOverallConfidence(result) {
    const confidences = [];
    
    // Confiance du texte
    if (result.fullTextAnnotation) {
      const textConfidence = this.calculateTextConfidence(result.fullTextAnnotation);
      confidences.push(textConfidence);
    }
    
    // Confiance des labels
    if (result.labelAnnotations && result.labelAnnotations.length > 0) {
      const avgLabelScore = result.labelAnnotations
        .reduce((sum, label) => sum + label.score, 0) / result.labelAnnotations.length;
      confidences.push(avgLabelScore);
    }

    // Moyenne des confiances
    if (confidences.length === 0) return 0;
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  /**
   * Calcule la confiance du texte
   */
  calculateTextConfidence(textAnnotation) {
    if (!textAnnotation.pages || textAnnotation.pages.length === 0) {
      return 0;
    }

    const page = textAnnotation.pages[0];
    const confidences = [];

    // Collecter toutes les confiances des mots
    page.blocks?.forEach(block => {
      block.paragraphs?.forEach(paragraph => {
        paragraph.words?.forEach(word => {
          if (word.confidence !== undefined) {
            confidences.push(word.confidence);
          }
        });
      });
    });

    if (confidences.length === 0) return 0.5;
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  /**
   * Fallback avec Tesseract si Google Vision echoue
   */
  async analyzeWithTesseract(image) {
    try {
      const Tesseract = require('tesseract.js');
      
      console.log('ðŸ”„ Using Tesseract OCR...');
      
      const { data } = await Tesseract.recognize(
        image,
        'fra+eng',
        {
          logger: m => console.log(m)
        }
      );

      return {
        success: true,
        timestamp: new Date().toISOString(),
        fallback: true,
        data: {
          text: {
            fullText: data.text,
            blocks: data.blocks?.map(block => ({
              text: block.text,
              confidence: block.confidence / 100,
              boundingBox: block.bbox
            })) || [],
            confidence: data.confidence / 100
          },
          labels: [],
          logos: [],
          products: null,
          extractedInfo: this.extractProductInfo({
            fullTextAnnotation: { text: data.text }
          })
        },
        confidence: data.confidence / 100
      };

    } catch (error) {
      console.error('âŒ Tesseract error:', error);
      throw new Error('Analyse OCR echouee');
    }
  }

  /**
   * Charge une image depuis un chemin
   */
  async loadImage(imagePath) {
    const fs = require('fs').promises;
    return await fs.readFile(imagePath);
  }

  /**
   * Analyse une image uploadee via l'API
   */
  async analyzeUploadedImage(fileBuffer, mimetype) {
    // Verifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimetype)) {
      throw new Error('Format d\'image non supporte');
    }

    // Analyser avec les options par defaut
    return await this.analyzeImage(fileBuffer, {
      detectText: true,
      detectLabels: true,
      detectLogos: true,
      detectProducts: false, // Desactive par defaut (couteux)
      language: 'fr'
    });
  }

  /**
   * Extrait et structure toutes les donnees pour un produit
   */
  async extractProductData(imageBuffer, options = {}) {
    const analysis = await this.analyzeImage(imageBuffer, options);
    
    if (!analysis.success) {
      throw new Error('Analyse echouee');
    }

    const { extractedInfo } = analysis.data;
    
    return {
      confidence: analysis.confidence,
      data: {
        name: extractedInfo.name,
        brand: extractedInfo.brand,
        category: extractedInfo.category,
        barcode: extractedInfo.barcode,
        ingredients: extractedInfo.ingredients,
        nutritionalInfo: extractedInfo.nutritionalInfo,
        rawText: analysis.data.text.fullText
      },
      metadata: {
        timestamp: analysis.timestamp,
        method: analysis.fallback ? 'tesseract' : 'google-vision',
        labels: analysis.data.labels,
        logos: analysis.data.logos
      }
    };
  }
}

// Export singleton
module.exports = new VisionService();
