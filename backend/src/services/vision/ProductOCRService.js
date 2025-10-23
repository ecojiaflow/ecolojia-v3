// backend/src/services/vision/ProductOCRService.js
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');

class ProductOCRService {
  constructor() {
    this.tesseractWorker = null;
    this.initialized = false;
    
    // Configuration des services
    this.config = {
      tesseract: {
        enabled: true,
        languages: ['fra', 'eng'],
        confidence_threshold: 0.65
      },
      ocrSpace: {
        enabled: !!process.env.OCR_SPACE_API_KEY,
        apiKey: process.env.OCR_SPACE_API_KEY,
        endpoint: 'https://api.ocr.space/parse/image',
        monthlyQuota: 25000,
        confidence_threshold: 0.70
      },
      googleVision: {
        enabled: !!process.env.GOOGLE_CLOUD_KEYFILE,
        confidence_threshold: 0.75
      }
    };

    // Statistiques pour monitoring
    this.stats = {
      tesseract: { attempts: 0, successes: 0, avgTime: 0 },
      ocrSpace: { attempts: 0, successes: 0, avgTime: 0, quotaUsed: 0 },
      googleVision: { attempts: 0, successes: 0, avgTime: 0 }
    };

    // Cache intelligent avec TTL
    this.cache = new Map();
    this.cacheConfig = {
      ttl: 3600000, // 1 heure
      maxSize: 100
    };

    // Patterns optimisÃ©s pour produits
    this.productPatterns = {
      ingredients: {
        fr: [
          /(?:ingrÃ©dients?\s*:?\s*)([\s\S]+?)(?=valeurs?\s+nutritionnelles?|allergÃ¨nes?|conservation|Ã  conserver|$)/i,
          /(?:composition\s*:?\s*)([\s\S]+?)(?=valeurs?\s+nutritionnelles?|allergÃ¨nes?|$)/i,
          /(?:contient\s*:?\s*)([\s\S]+?)(?=peut contenir|traces?|allergÃ¨nes?|$)/i
        ],
        en: [
          /(?:ingredients?\s*:?\s*)([\s\S]+?)(?=nutrition|allergens?|storage|$)/i
        ]
      },
      brand: [
        /^([A-Z][A-Z\s&\-']{2,30})$/m,
        /(?:marque|brand)\s*:?\s*([A-Za-z\s&\-']+)/i
      ],
      productName: [
        /^([A-Z][a-zÃ€-Ã¿]+(?:\s+[A-Za-zÃ€-Ã¿]+){0,5})$/m,
        /(?:produit|product)\s*:?\s*([^\n]+)/i
      ],
      weight: [
        /(\d+(?:[,\.]\d+)?)\s*(kg|g|mg|l|ml|cl)\b/i,
        /(?:poids net|net weight)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*(kg|g|mg|l|ml|cl)/i
      ],
      barcode: [
        /\b(3\d{12})\b/,  // EAN-13 France
        /\b(\d{8})\b/,    // EAN-8
        /\b(\d{12})\b/    // UPC
      ]
    };
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialiser Tesseract avec configuration optimisÃ©e
      this.tesseractWorker = await Tesseract.createWorker({
        logger: null, // DÃ©sactivÃ© pour Ã©viter DataCloneError
        errorHandler: err => console.error('[Tesseract Error]', err)
      });

      await this.tesseractWorker.loadLanguage(['fra', 'eng']);
      await this.tesseractWorker.initialize('fra+eng');
      
      // Configuration optimisÃ©e pour produits
      await this.tesseractWorker.setParameters({
        tessedit_ocr_engine_mode: 2, // LSTM neural net mode
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÃ€Ã‚Ã„Ã‡ÃˆÃ‰ÃŠÃ‹ÃŽÃÃ”Ã™Ã›ÃœÃ Ã¢Ã¤Ã§Ã¨Ã©ÃªÃ«Ã®Ã¯Ã´Ã¹Ã»Ã¼0123456789-.,;:!?%()[] ',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0'
      });

      this.initialized = true;
      console.log('? ProductOCRService initialized');
    } catch (error) {
      console.error('? Failed to initialize ProductOCRService:', error);
      throw error;
    }
  }

  /**
   * Analyse une image de produit avec stratÃ©gie multi-couches
   */
  async analyzeProduct(imagePath, options = {}) {
    const {
      category = 'auto', // 'food', 'cosmetic', 'detergent', 'auto'
      userTier = 'free', // 'free', 'premium'
      forceService = null, // 'tesseract', 'ocrspace', 'googlevision'
      useCache = true
    } = options;

    // VÃ©rifier le cache
    const cacheKey = `${imagePath}-${category}`;
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheConfig.ttl) {
        console.log('?? Returning cached OCR result');
        return cached.data;
      }
    }

    const startTime = Date.now();
    let result = null;
    let serviceUsed = null;

    try {
      // 1. PrÃ©traitement de l'image
      const processedImage = await this.preprocessImage(imagePath, category);

      // 2. StratÃ©gie de sÃ©lection du service
      if (forceService) {
        result = await this.runService(forceService, processedImage, options);
        serviceUsed = forceService;
      } else {
        // Logique intelligente basÃ©e sur le tier et la disponibilitÃ©
        const services = this.getServiceOrder(userTier);
        
        for (const service of services) {
          try {
            const serviceResult = await this.runService(service, processedImage, options);
            
            if (serviceResult && serviceResult.confidence >= this.config[service].confidence_threshold) {
              result = serviceResult;
              serviceUsed = service;
              break;
            }
          } catch (error) {
            console.warn(`[${service}] Failed:`, error.message);
            continue;
          }
        }
      }

      if (!result) {
        throw new Error('Tous les services OCR ont Ã©chouÃ©');
      }

      // 3. Post-traitement et enrichissement
      const enrichedResult = await this.enrichResult(result, category);

      // 4. Mise en cache
      if (useCache) {
        this.addToCache(cacheKey, enrichedResult);
      }

      // 5. Statistiques
      const elapsed = Date.now() - startTime;
      this.updateStats(serviceUsed, true, elapsed);

      // 6. Nettoyage
      if (processedImage !== imagePath) {
        await fs.unlink(processedImage).catch(() => {});
      }

      return {
        success: true,
        service: serviceUsed,
        processingTime: elapsed,
        data: enrichedResult,
        confidence: result.confidence
      };

    } catch (error) {
      console.error('? OCR Analysis failed:', error);
      this.updateStats(serviceUsed || 'unknown', false, Date.now() - startTime);
      
      return {
        success: false,
        error: error.message,
        service: serviceUsed,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * ExÃ©cute un service OCR spÃ©cifique
   */
  async runService(serviceName, imagePath, options) {
    switch (serviceName) {
      case 'tesseract':
        return await this.runTesseract(imagePath, options);
      
      case 'ocrspace':
        return await this.runOCRSpace(imagePath, options);
      
      case 'googlevision':
        return await this.runGoogleVision(imagePath, options);
      
      default:
        throw new Error(`Service inconnu: ${serviceName}`);
    }
  }

  /**
   * OCR avec Tesseract optimisÃ©
   */
  async runTesseract(imagePath, options) {
    await this.initialize();

    const result = await this.tesseractWorker.recognize(imagePath, {
      rotateAuto: true,
      rotateRadians: 0
    });

    const text = result.data.text;
    const confidence = result.data.confidence / 100;

    // Extraction structurÃ©e
    const extracted = this.extractProductData(text, 'fr');

    return {
      method: 'tesseract',
      confidence,
      text,
      ...extracted
    };
  }

  /**
   * OCR avec OCR.space (meilleur pour produits)
   */
  async runOCRSpace(imagePath, options) {
    if (!this.config.ocrSpace.apiKey) {
      throw new Error('OCR.space API key not configured');
    }

    // VÃ©rifier le quota
    if (this.stats.ocrSpace.quotaUsed >= this.config.ocrSpace.monthlyQuota) {
      throw new Error('OCR.space monthly quota exceeded');
    }

    const formData = new FormData();
    formData.append('file', await fs.readFile(imagePath), path.basename(imagePath));
    formData.append('language', 'fre');
    formData.append('isOverlayRequired', 'true');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('isTable', 'true');
    formData.append('OCREngine', '2'); // Engine 2 meilleur pour produits

    try {
      const response = await axios.post(this.config.ocrSpace.endpoint, formData, {
        headers: {
          'apikey': this.config.ocrSpace.apiKey,
          ...formData.getHeaders()
        },
        timeout: 30000
      });

      if (!response.data.ParsedResults || response.data.ParsedResults.length === 0) {
        throw new Error('OCR.space returned no results');
      }

      const result = response.data.ParsedResults[0];
      
      if (result.ErrorMessage) {
        throw new Error(result.ErrorMessage);
      }

      const text = result.ParsedText || '';
      const confidence = this.calculateOCRSpaceConfidence(result);

      // IncrÃ©menter le quota
      this.stats.ocrSpace.quotaUsed++;

      // Extraction structurÃ©e
      const extracted = this.extractProductData(text, 'fr');

      // Utiliser les overlays pour amÃ©liorer l'extraction
      if (result.TextOverlay && result.TextOverlay.Lines) {
        const enhanced = this.enhanceWithOverlay(extracted, result.TextOverlay);
        return {
          method: 'ocrspace',
          confidence,
          text,
          ...enhanced
        };
      }

      return {
        method: 'ocrspace',
        confidence,
        text,
        ...extracted
      };

    } catch (error) {
      console.error('[OCR.space Error]', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fallback Google Vision (pour premium)
   */
  async runGoogleVision(imagePath, options) {
    // Utiliser le VisionService existant
    const VisionService = require('./VisionService');
    const result = await VisionService.analyzeWithGoogleVision(imagePath, 'fr');
    
    return {
      method: 'googlevision',
      confidence: result.confidence,
      text: result.text,
      ...result.extractedData
    };
  }

  /**
   * PrÃ©traitement optimisÃ© pour produits
   */
  async preprocessImage(imagePath, category = 'auto') {
    const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.jpg');
    
    // ParamÃ¨tres de preprocessing selon la catÃ©gorie
    const presets = {
      food: {
        modulate: { brightness: 1.2, saturation: 0.8 },
        sharpen: { sigma: 1.5 },
        threshold: 180
      },
      cosmetic: {
        modulate: { brightness: 1.1, saturation: 0.9 },
        sharpen: { sigma: 1.2 },
        threshold: 200
      },
      detergent: {
        modulate: { brightness: 1.3, saturation: 0.7 },
        sharpen: { sigma: 1.8 },
        threshold: 170
      }
    };

    const preset = presets[category] || presets.food;

    try {
      // ChaÃ®ne de traitement optimisÃ©e
      await sharp(imagePath)
        // 1. Redimensionner pour OCR optimal
        .resize(2400, 2400, { 
          fit: 'inside',
          withoutEnlargement: false // Agrandir si nÃ©cessaire
        })
        // 2. AmÃ©liorer le contraste
        .normalize()
        .linear(1.2, -(255 * 0.1)) // Augmenter le contraste
        // 3. Ajuster luminositÃ© et saturation
        .modulate(preset.modulate)
        // 4. NettetÃ© adaptative
        .sharpen(preset.sharpen)
        // 5. Conversion en niveaux de gris pour texte
        .greyscale()
        // 6. Seuillage adaptatif pour texte noir sur blanc
        .threshold(preset.threshold)
        // 7. DÃ©bruitage
        .median(3)
        // 8. Format de sortie optimisÃ©
        .jpeg({ 
          quality: 100,
          chromaSubsampling: '4:4:4'
        })
        .toFile(outputPath);

      console.log('? Image preprocessed:', outputPath);
      return outputPath;

    } catch (error) {
      console.error('? Preprocessing failed:', error);
      return imagePath; // Fallback sur l'original
    }
  }

  /**
   * Extraction de donnÃ©es structurÃ©es
   */
  extractProductData(text, language = 'fr') {
    const data = {
      productName: null,
      brand: null,
      ingredients: null,
      barcode: null,
      weight: null,
      category: null,
      nutritionalInfo: null,
      allergens: null
    };

    if (!text || text.length < 10) return data;

    // Nettoyer le texte
    const cleanText = text
      .replace(/[^\S\r\n]+/g, ' ') // Normaliser les espaces
      .replace(/\n{3,}/g, '\n\n')  // Limiter les sauts de ligne
      .trim();

    // 1. Extraction du nom du produit
    const lines = cleanText.split('\n').filter(l => l.trim().length > 2);
    if (lines.length > 0) {
      // Le nom est souvent sur les premiÃ¨res lignes
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length > 4 && line.length < 50 && !line.match(/^[0-9\s]+$/)) {
          data.productName = this.cleanProductName(line);
          break;
        }
      }
    }

    // 2. Extraction de la marque
    for (const pattern of this.productPatterns.brand) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        data.brand = match[1].trim();
        break;
      }
    }

    // 3. Extraction des ingrÃ©dients
    const ingredientPatterns = this.productPatterns.ingredients[language] || this.productPatterns.ingredients.fr;
    for (const pattern of ingredientPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        data.ingredients = this.cleanIngredients(match[1]);
        break;
      }
    }

    // 4. Extraction du code-barres
    for (const pattern of this.productPatterns.barcode) {
      const matches = cleanText.matchAll(new RegExp(pattern, 'g'));
      for (const match of matches) {
        if (this.validateBarcode(match[1])) {
          data.barcode = match[1];
          break;
        }
      }
      if (data.barcode) break;
    }

    // 5. Extraction du poids
    for (const pattern of this.productPatterns.weight) {
      const match = cleanText.match(pattern);
      if (match) {
        data.weight = `${match[1]}${match[2]}`.toLowerCase();
        break;
      }
    }

    // 6. DÃ©tection de la catÃ©gorie
    data.category = this.detectProductCategory(cleanText, data);

    // 7. Informations nutritionnelles
    if (cleanText.match(/(?:valeurs?\s+nutritionnelles?|nutrition)/i)) {
      data.nutritionalInfo = this.extractNutritionalInfo(cleanText);
    }

    // 8. AllergÃ¨nes
    data.allergens = this.extractAllergens(cleanText);

    return data;
  }

  /**
   * AmÃ©lioration avec les overlays OCR.space
   */
  enhanceWithOverlay(data, overlay) {
    if (!overlay || !overlay.Lines) return data;

    // Analyser la structure du document via les overlays
    const lines = overlay.Lines;
    
    // DÃ©tecter les zones par position et taille de police
    const zones = {
      title: [],      // Haut, grande police
      ingredients: [], // Milieu, petite police dense
      nutrition: [],   // Tableau structurÃ©
      barcode: []      // Chiffres isolÃ©s
    };

    lines.forEach((line, index) => {
      const avgHeight = line.Words.reduce((sum, w) => sum + w.Height, 0) / line.Words.length;
      const text = line.Words.map(w => w.WordText).join(' ');
      
      // Zone titre (premiÃ¨res lignes, grande police)
      if (index < 5 && avgHeight > 30) {
        zones.title.push(text);
      }
      
      // Zone ingrÃ©dients (texte dense)
      if (text.match(/ingrÃ©dients?|composition/i) || 
          (line.Words.length > 10 && avgHeight < 20)) {
        zones.ingredients.push(text);
      }
      
      // Zone code-barres (chiffres uniquement)
      if (text.match(/^\d{8,13}$/)) {
        zones.barcode.push(text);
      }
    });

    // AmÃ©liorer les donnÃ©es extraites
    if (!data.productName && zones.title.length > 0) {
      data.productName = this.cleanProductName(zones.title[0]);
    }

    if (!data.brand && zones.title.length > 1) {
      data.brand = zones.title[1];
    }

    if (zones.barcode.length > 0) {
      data.barcode = zones.barcode[0];
    }

    return data;
  }

  /**
   * DÃ©tection intelligente de catÃ©gorie
   */
  detectProductCategory(text, extractedData) {
    const lowerText = text.toLowerCase();
    
    const categoryKeywords = {
      food: {
        keywords: ['nutritionnel', 'kcal', 'glucides', 'protÃ©ines', 'lipides', 'sucres', 'fibres', 'sodium', 'ingredients', 'conservation', 'consommer'],
        weight: 3
      },
      cosmetic: {
        keywords: ['aqua', 'parfum', 'paraben', 'glycerin', 'sodium laureth', 'peau', 'cheveux', 'visage', 'corps', 'crÃ¨me', 'gel', 'lotion'],
        weight: 2
      },
      detergent: {
        keywords: ['tensioactif', 'surfactant', 'enzyme', 'phosphate', 'lessive', 'nettoyant', 'dÃ©tergent', 'javel', 'dÃ©sinfectant'],
        weight: 2
      }
    };

    const scores = { food: 0, cosmetic: 0, detergent: 0 };

    // Calcul des scores
    Object.entries(categoryKeywords).forEach(([category, config]) => {
      config.keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          scores[category] += config.weight;
        }
      });
    });

    // Bonus basÃ© sur les donnÃ©es extraites
    if (extractedData.nutritionalInfo) scores.food += 5;
    if (extractedData.ingredients?.includes('aqua')) scores.cosmetic += 3;

    // Retourner la catÃ©gorie avec le score le plus Ã©levÃ©
    const maxScore = Math.max(...Object.values(scores));
    return maxScore > 0 
      ? Object.entries(scores).find(([_, score]) => score === maxScore)[0]
      : 'food'; // DÃ©faut
  }

  /**
   * Nettoyage des donnÃ©es extraites
   */
  cleanProductName(name) {
    return name
      .replace(/[Â®â„¢Â©]/g, '')
      .replace(/^\W+|\W+$/g, '') // Trim caractÃ¨res spÃ©ciaux
      .replace(/\s+/g, ' ')
      .trim();
  }

  cleanIngredients(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[_\-]{2,}/g, ', ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\*/g, '')
      .replace(/\s*\.\s*$/, '')
      .trim();
  }

  /**
   * Extraction des informations nutritionnelles
   */
  extractNutritionalInfo(text) {
    const info = {};
    
    const patterns = {
      energy: /(?:Ã©nergie|energy|calories?)\s*:?\s*(\d+)\s*(?:kcal|kj)/i,
      proteins: /(?:protÃ©ines?|proteins?)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      carbs: /(?:glucides?|carbohydrates?)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      sugars: /(?:dont sucres?|of which sugars?)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      fat: /(?:matiÃ¨res? grasses?|fat|lipides?)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      saturated: /(?:acides? gras saturÃ©s?|saturated)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      fiber: /(?:fibres?|fiber)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      salt: /(?:sel|salt)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*g/i,
      sodium: /(?:sodium)\s*:?\s*(\d+(?:[,\.]\d+)?)\s*(?:g|mg)/i
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        info[key] = parseFloat(match[1].replace(',', '.'));
      }
    });

    return Object.keys(info).length > 0 ? info : null;
  }

  /**
   * Extraction des allergÃ¨nes
   */
  extractAllergens(text) {
    const allergenKeywords = {
      fr: ['gluten', 'blÃ©', 'seigle', 'orge', 'avoine', 'lait', 'lactose', 'Å“uf', 'oeuf', 
           'poisson', 'crustacÃ©', 'mollusque', 'soja', 'fruits Ã  coque', 'noix', 'amande',
           'noisette', 'arachide', 'cacahuÃ¨te', 'cÃ©leri', 'moutarde', 'sÃ©same', 'lupin',
           'sulfite', 'anhydride sulfureux'],
      en: ['gluten', 'wheat', 'milk', 'egg', 'fish', 'shellfish', 'soy', 'nuts', 'peanut',
           'celery', 'mustard', 'sesame', 'sulphite', 'lupin']
    };

    const found = new Set();
    const lowerText = text.toLowerCase();

    // Recherche dans toutes les langues
    Object.values(allergenKeywords).flat().forEach(allergen => {
      if (lowerText.includes(allergen)) {
        found.add(allergen);
      }
    });

    return found.size > 0 ? Array.from(found) : null;
  }

  /**
   * Validation du code-barres
   */
  validateBarcode(code) {
    if (!code || !/^\d{8,13}$/.test(code)) return false;
    
    // Validation checksum EAN-13
    if (code.length === 13) {
      const digits = code.split('').map(Number);
      let sum = 0;
      
      for (let i = 0; i < 12; i++) {
        sum += digits[i] * (i % 2 === 0 ? 1 : 3);
      }
      
      const checksum = (10 - (sum % 10)) % 10;
      return checksum === digits[12];
    }
    
    return true; // Accepter les autres formats pour l'instant
  }

  /**
   * Calcul de confiance OCR.space
   */
  calculateOCRSpaceConfidence(result) {
    let confidence = 0.5; // Base
    
    // Facteurs de confiance
    if (result.ParsedText && result.ParsedText.length > 50) confidence += 0.1;
    if (result.ParsedText && result.ParsedText.length > 200) confidence += 0.1;
    if (!result.IsErroredOnProcessing) confidence += 0.1;
    if (result.TextOverlay && result.TextOverlay.Lines) {
      const lineCount = result.TextOverlay.Lines.length;
      if (lineCount > 10) confidence += 0.1;
      if (lineCount > 20) confidence += 0.1;
    }
    
    return Math.min(0.95, confidence);
  }

  /**
   * Enrichissement du rÃ©sultat final
   */
  async enrichResult(result, category) {
    const enriched = { ...result };

    // Ajouter des mÃ©tadonnÃ©es
    enriched.metadata = {
      extractedAt: new Date().toISOString(),
      category: result.category || category,
      dataCompleteness: this.calculateCompleteness(result),
      reliability: this.calculateReliability(result)
    };

    // Suggestions d'amÃ©lioration
    if (enriched.metadata.dataCompleteness < 0.7) {
      enriched.suggestions = this.generateSuggestions(result);
    }

    return enriched;
  }

  /**
   * Calcul du taux de complÃ©tude
   */
  calculateCompleteness(data) {
    const fields = ['productName', 'brand', 'ingredients', 'barcode', 'weight', 'category'];
    const filledFields = fields.filter(field => data[field] !== null && data[field] !== undefined);
    return filledFields.length / fields.length;
  }

  /**
   * Calcul de la fiabilitÃ©
   */
  calculateReliability(data) {
    let score = data.confidence || 0.5;
    
    // Bonus pour donnÃ©es cohÃ©rentes
    if (data.productName && data.productName.length > 3) score += 0.1;
    if (data.ingredients && data.ingredients.length > 20) score += 0.1;
    if (data.barcode && this.validateBarcode(data.barcode)) score += 0.1;
    
    return Math.min(1, score);
  }

  /**
   * GÃ©nÃ©ration de suggestions
   */
  generateSuggestions(data) {
    const suggestions = [];
    
    if (!data.productName) {
      suggestions.push("Prenez une photo plus nette de la face avant du produit");
    }
    if (!data.ingredients) {
      suggestions.push("Assurez-vous que la liste d'ingrÃ©dients est visible et lisible");
    }
    if (!data.barcode) {
      suggestions.push("Incluez le code-barres dans la photo si possible");
    }
    
    return suggestions;
  }

  /**
   * Gestion du cache
   */
  addToCache(key, data) {
    // Limiter la taille du cache
    if (this.cache.size >= this.cacheConfig.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Ordre des services selon le tier utilisateur
   */
  getServiceOrder(userTier) {
    if (userTier === 'premium') {
      // Premium : Essayer d'abord les services payants plus fiables
      return ['ocrspace', 'googlevision', 'tesseract'];
    } else {
      // Free : Commencer par le gratuit
      return ['tesseract', 'ocrspace'];
    }
  }

  /**
   * Mise Ã  jour des statistiques
   */
  updateStats(service, success, time) {
    if (!this.stats[service]) return;
    
    const stat = this.stats[service];
    stat.attempts++;
    if (success) stat.successes++;
    
    // Moyenne glissante du temps
    stat.avgTime = stat.avgTime 
      ? (stat.avgTime * 0.9 + time * 0.1) 
      : time;
  }

  /**
   * Monitoring et mÃ©triques
   */
  getStats() {
    const stats = { ...this.stats };
    
    // Calculer les taux de succÃ¨s
    Object.keys(stats).forEach(service => {
      const stat = stats[service];
      stat.successRate = stat.attempts > 0 
        ? (stat.successes / stat.attempts * 100).toFixed(2) + '%'
        : 'N/A';
    });
    
    return stats;
  }

  /**
   * Nettoyage et arrÃªt
   */
  async shutdown() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
      this.initialized = false;
    }
    
    this.cache.clear();
    console.log('? ProductOCRService shut down');
  }
}

// Export singleton
module.exports = new ProductOCRService();
