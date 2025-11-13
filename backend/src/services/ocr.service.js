/**
 * =====================================================
 * ECOLOJIA - SERVICE OCR PRODUCTION-COMPLETE
 * =====================================================
 * 
 * Responsabilités :
 *  1. Extraction texte depuis image (Google Vision API)
 *  2. Parsing intelligent (ingrédients + nutrition)
 *  3. Classification catégorie (food/cosmetic/detergent)
 *  4. Cache Redis (économie coûts API)
 *  5. Validation robuste
 *  6. Logs structurés
 * 
 * Flow complet :
 *  Image base64 → Validation → Cache check → OCR Google 
 *  → Parsing → Classification IA → Cache save → Return
 */

const vision = require('@google-cloud/vision');
const crypto = require('crypto');

// Services externes
let redisClient = null;
try {
  redisClient = require('../config/redis');
  console.log('[OCRService] ✅ Redis disponible');
} catch (err) {
  console.warn('[OCRService] ⚠️  Redis non disponible, cache désactivé');
}
// DeepSeek import avec fallback propre
let deepSeekService = null;
try {
  deepSeekService = require('./ai/deepSeekService');
  console.log('[OCRService] ✅ DeepSeek disponible');
} catch (err) {
  console.warn('[OCRService] ⚠️  DeepSeek non disponible, classification désactivée');
}

// Configuration
const ENABLE_OCR = process.env.ENABLE_OCR === '1';
const MAX_IMAGE_SIZE_MB = 5;
const CACHE_TTL_SECONDS = 86400; // 24h

class OCRService {
  constructor() {
    if (ENABLE_OCR) {
      try {
        this.client = new vision.ImageAnnotatorClient();
        console.log('[OCRService] ✅ Google Vision client initialisé');
      } catch (err) {
        console.error('[OCRService] ❌ Erreur init Google Vision:', err.message);
        this.client = null;
      }
    } else {
      this.client = null;
      console.log('[OCRService] ⚠️  Mode stub (ENABLE_OCR != "1")');
    }
  }

  // =====================================================
  // MÉTHODE PRINCIPALE : Extraction depuis image
  // =====================================================
  
  /**
   * Extrait et parse le contenu d'une image produit
   * @param {string} imageBase64 - Image en base64 (sans prefix data:image/...)
   * @returns {Promise<Object>} { ingredients, nutrition, category, rawText, confidence }
   */
  async extractFromImage(imageBase64) {
    const startTime = Date.now();
    
    try {
      // 1. VALIDATION
      this._validateImage(imageBase64);
      
      // 2. CACHE CHECK
      const imageHash = this._hashImage(imageBase64);
      const cached = await this._checkCache(imageHash);
      if (cached) {
        console.log(`[OCRService] ✅ Cache hit (${imageHash.substring(0, 8)})`);
        return cached;
      }
      
      // 3. EXTRACTION TEXTE (Google Vision ou stub)
      const rawText = await this._extractText(imageBase64);
      
      // 4. PARSING INTELLIGENT
      const parsed = await this._parseRawText(rawText);
      
      // 5. CLASSIFICATION CATÉGORIE (IA)
      const category = await this._classifyCategory(parsed.ingredients, rawText);
      
      // 6. RÉSULTAT FINAL
      const result = {
        ingredients: parsed.ingredients,
        nutrition: parsed.nutrition,
        category: category,
        rawText: rawText,
        confidence: parsed.confidence,
        processingTime: Date.now() - startTime
      };
      
      // 7. CACHE SAVE
      await this._saveCache(imageHash, result);
      
      console.log(`[OCRService] ✅ Extraction réussie (${result.processingTime}ms, ${result.ingredients.length} ingrédients)`);
      
      return result;
      
    } catch (error) {
      console.error('[OCRService] ❌ Erreur extraction:', error.message);
      throw error;
    }
  }

  // =====================================================
  // VALIDATION
  // =====================================================
  
  _validateImage(imageBase64) {
    // Type check
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error('imageBase64 requis (string)');
    }
    
    // Format base64 check
    if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
      throw new Error('Format base64 invalide');
    }
    
    // Taille check (max 5 MB)
    const sizeKB = (imageBase64.length * 3) / 4 / 1024;
    if (sizeKB > MAX_IMAGE_SIZE_MB * 1024) {
      throw new Error(`Image trop lourde (${Math.round(sizeKB / 1024)} MB, max ${MAX_IMAGE_SIZE_MB} MB)`);
    }
  }

  // =====================================================
  // CACHE (Redis)
  // =====================================================
  
  _hashImage(imageBase64) {
    return crypto
      .createHash('md5')
      .update(imageBase64)
      .digest('hex');
  }
  
  async _checkCache(imageHash) {
    try {
      const cached = await redisClient.get(`ocr:${imageHash}`);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn('[OCRService] ⚠️  Cache read error:', err.message);
      return null;
    }
  }
  
  async _saveCache(imageHash, result) {
    try {
      await redisClient.setex(
        `ocr:${imageHash}`,
        CACHE_TTL_SECONDS,
        JSON.stringify(result)
      );
    } catch (err) {
      console.warn('[OCRService] ⚠️  Cache save error:', err.message);
    }
  }

  // =====================================================
  // EXTRACTION TEXTE (Google Vision)
  // =====================================================
  
  async _extractText(imageBase64) {
    // MODE STUB : pas d'OCR réel
    if (!this.client) {
      console.log('[OCRService] ⚠️  Mode stub : retour texte vide');
      return '';
    }
    
    try {
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      
      const [result] = await this.client.textDetection({
        image: { content: imageBuffer }
      });
      
      const fullText = result?.fullTextAnnotation?.text || '';
      
      if (!fullText) {
        console.warn('[OCRService] ⚠️  Aucun texte détecté dans l\'image');
      }
      
      return fullText;
      
    } catch (error) {
      console.error('[OCRService] ❌ Erreur Google Vision:', error.message);
      throw new Error('Échec extraction texte : ' + error.message);
    }
  }

  // =====================================================
  // PARSING INTELLIGENT
  // =====================================================
  
  /**
   * Parse le texte brut pour extraire ingrédients + nutrition
   */
  async _parseRawText(rawText) {
    if (!rawText) {
      return {
        ingredients: [],
        nutrition: {},
        confidence: 0
      };
    }
    
    // 1. EXTRACTION INGRÉDIENTS
    const ingredients = this._extractIngredients(rawText);
    
    // 2. EXTRACTION NUTRITION
    const nutrition = this._extractNutrition(rawText);
    
    // 3. CONFIANCE (basée sur la quantité de data extraite)
    const confidence = this._calculateConfidence(ingredients, nutrition);
    
    return {
      ingredients,
      nutrition,
      confidence
    };
  }
  
  /**
   * Extrait la liste d'ingrédients depuis le texte OCR
   */
  _extractIngredients(text) {
    const ingredients = [];
    
    // Pattern 1 : "Ingrédients : farine, sucre, sel"
    const pattern1 = /ingr[eé]dients?\s*:?\s*([^.]+)/i;
    const match1 = text.match(pattern1);
    
    if (match1) {
      const ingredientText = match1[1];
      // Split par virgules/points-virgules
      const parts = ingredientText.split(/[,;]+/);
      
      parts.forEach(part => {
        const cleaned = part.trim();
        if (cleaned.length > 2 && cleaned.length < 100) {
          ingredients.push(cleaned);
        }
      });
    }
    
    // Pattern 2 : "Composition : ..." (cosmétiques)
    if (ingredients.length === 0) {
      const pattern2 = /composition\s*:?\s*([^.]+)/i;
      const match2 = text.match(pattern2);
      
      if (match2) {
        const parts = match2[1].split(/[,;]+/);
        parts.forEach(part => {
          const cleaned = part.trim();
          if (cleaned.length > 2 && cleaned.length < 100) {
            ingredients.push(cleaned);
          }
        });
      }
    }
    
    return ingredients;
  }
  
  /**
   * Extrait les valeurs nutritionnelles depuis le texte OCR
   */
  _extractNutrition(text) {
    const nutrition = {};
    
    // Pattern énergie : "Énergie 350 kcal" ou "350 kJ"
    const energyMatch = text.match(/[eé]nergie.*?(\d+)\s*(kcal|kj)/i);
    if (energyMatch) {
      const value = parseInt(energyMatch[1]);
      const unit = energyMatch[2].toLowerCase();
      nutrition.energy = unit === 'kcal' ? value : Math.round(value / 4.184);
    }
    
    // Pattern protéines : "Protéines 8g" ou "8 g"
    const proteinMatch = text.match(/prot[eé]ines?.*?(\d+(?:\.\d+)?)\s*g/i);
    if (proteinMatch) {
      nutrition.protein = parseFloat(proteinMatch[1]);
    }
    
    // Pattern glucides : "Glucides 50g"
    const carbsMatch = text.match(/glucides?.*?(\d+(?:\.\d+)?)\s*g/i);
    if (carbsMatch) {
      nutrition.carbs = parseFloat(carbsMatch[1]);
    }
    
    // Pattern sucres : "dont sucres 20g"
    const sugarsMatch = text.match(/sucres?.*?(\d+(?:\.\d+)?)\s*g/i);
    if (sugarsMatch) {
      nutrition.sugars = parseFloat(sugarsMatch[1]);
    }
    
    // Pattern lipides : "Lipides 10g"
    const fatMatch = text.match(/lipides?.*?(\d+(?:\.\d+)?)\s*g/i);
    if (fatMatch) {
      nutrition.fat = parseFloat(fatMatch[1]);
    }
    
    // Pattern sel : "Sel 0.5g"
    const saltMatch = text.match(/sel.*?(\d+(?:\.\d+)?)\s*g/i);
    if (saltMatch) {
      nutrition.salt = parseFloat(saltMatch[1]);
    }
    
    return nutrition;
  }
  
  /**
   * Calcule un score de confiance (0-100) basé sur la quantité de data extraite
   */
  _calculateConfidence(ingredients, nutrition) {
    let score = 0;
    
    // +40 points si ingrédients trouvés
    if (ingredients.length > 0) {
      score += 40;
      // Bonus si >5 ingrédients
      if (ingredients.length >= 5) score += 10;
    }
    
    // +50 points pour nutrition
    const nutritionKeys = Object.keys(nutrition);
    if (nutritionKeys.length > 0) {
      score += 30;
      // Bonus si >3 valeurs nutritionnelles
      if (nutritionKeys.length >= 3) score += 20;
    }
    
    return Math.min(score, 100);
  }

  // =====================================================
  // CLASSIFICATION CATÉGORIE (IA DeepSeek)
  // =====================================================
  
  /**
   * Classifie la catégorie du produit (food/cosmetic/detergent)
   * via IA si ambiguïté, sinon règles simples
   */
  async _classifyCategory(ingredients, rawText) {
    const text = rawText.toLowerCase();
    
    // RÈGLE 1 : Mots-clés détergent
    const detergentKeywords = ['lessive', 'nettoyant', 'détergent', 'javel', 'soude'];
    if (detergentKeywords.some(kw => text.includes(kw))) {
      return 'detergent';
    }
    
    // RÈGLE 2 : Mots-clés cosmétique
    const cosmeticKeywords = ['crème', 'shampoing', 'gel douche', 'savon', 'lotion', 'parfum'];
    if (cosmeticKeywords.some(kw => text.includes(kw))) {
      return 'cosmetic';
    }
    
    // RÈGLE 3 : Si nutrition présente → probablement alimentaire
    if (text.includes('kcal') || text.includes('glucides') || text.includes('protéines')) {
      return 'food';
    }
    
    // RÈGLE 4 : Si >3 ingrédients alimentaires courants → food
    const foodIngredients = ['farine', 'sucre', 'sel', 'lait', 'oeuf', 'beurre', 'huile'];
    const foodCount = ingredients.filter(ing => 
      foodIngredients.some(f => ing.toLowerCase().includes(f))
    ).length;
    
    if (foodCount >= 2) {
      return 'food';
    }
    
    // RÈGLE 5 : Si aucun match clair → demander à l'IA
    try {
      console.log('[OCRService] 🤖 Classification IA (ambiguïté)');
      
      const prompt = `Classifie ce produit en "food", "cosmetic" ou "detergent".
Ingrédients : ${ingredients.join(', ')}
Texte : ${rawText.substring(0, 200)}

Réponds UNIQUEMENT par un seul mot : food, cosmetic ou detergent.`;
      
      const aiResponse = await deepSeekService.query(prompt);
      const category = aiResponse.trim().toLowerCase();
      
      if (['food', 'cosmetic', 'detergent'].includes(category)) {
        return category;
      }
      
    } catch (error) {
      console.warn('[OCRService] ⚠️  Erreur classification IA:', error.message);
    }
    
    // DÉFAUT : Alimentaire (catégorie la plus fréquente)
    return 'food';
  }
}

// =====================================================
// EXPORT SINGLETON
// =====================================================
module.exports = new OCRService();