// VisionServiceFixed.js - Version corrigée du VisionService
const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

class VisionServiceFixed {
  constructor() {
    this.googleVisionClient = null;
    this.initialized = false;
    
    // Patterns de détection améliorés
    this.patterns = {
      barcode: /\b(\d{8,13})\b/g,
      ingredients: {
        fr: /(?:ingrédients?|composition)\s*:?\s*([^.]+(?:\.[^.]+)*)/i,
        en: /(?:ingredients?|contains?)\s*:?\s*([^.]+(?:\.[^.]+)*)/i
      },
      brand: /(?:marque|brand|produit de|product of)\s*:?\s*([^\n]+)/i,
      weight: /(\d+)\s*(g|kg|ml|l|cl)\b/i
    };
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      this.googleVisionClient = new vision.ImageAnnotatorClient({
        keyFilename: './google-vision-key.json'
      });
      this.initialized = true;
      console.log('✅ VisionService initialisé avec Google Vision');
    } catch (error) {
      console.error('❌ Erreur initialisation:', error.message);
      throw error;
    }
  }

  async analyzeImage(imagePath, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('🔍 Analyse de:', imagePath);
      
      // Lire l'image
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Faire une analyse complète
      const [result] = await this.googleVisionClient.annotateImage({
        image: { content: imageBuffer },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 50 },
          { type: 'DOCUMENT_TEXT_DETECTION' },
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'LOGO_DETECTION', maxResults: 10 }
        ]
      });

      // Extraire le texte complet
      const fullText = result.fullTextAnnotation?.text || 
                      result.textAnnotations?.[0]?.description || 
                      '';

      // Extraire les données structurées
      const extractedData = this.extractProductInfo(fullText, result);
      
      // Déterminer le type de produit
      const productType = this.detectProductType(result.labelAnnotations || [], fullText);

      return {
        success: true,
        method: 'google_vision',
        data: {
          rawText: fullText,
          extractedData,
          productType,
          confidence: this.calculateConfidence(fullText, extractedData),
          labels: (result.labelAnnotations || []).map(l => ({
            name: l.description,
            score: l.score
          })),
          logos: (result.logoAnnotations || []).map(l => ({
            name: l.description,
            score: l.score
          })),
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Erreur analyse:', error.message);
      throw new Error('Analyse échouée: ' + error.message);
    }
  }

  extractProductInfo(text, visionResult) {
    const extracted = {
      productName: null,
      brand: null,
      barcode: null,
      ingredients: null,
      weight: null,
      category: null
    };

    if (!text) return extracted;

    // Nettoyer le texte
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // 1. Nom du produit (souvent en premier ou en gros)
    if (lines.length > 0) {
      // Chercher NUTELLA, COCA-COLA, etc.
      const productNameMatch = text.match(/(?:NUTELLA|COCA[\s-]?COLA|PRINGLES|NESTLE|DANONE|LU)\b/i);
      if (productNameMatch) {
        extracted.productName = productNameMatch[0];
      } else {
        // Prendre la première ligne non vide comme nom
        extracted.productName = lines[0];
      }
    }

    // 2. Code-barres
    const barcodeMatches = [...text.matchAll(this.patterns.barcode)];
    for (const match of barcodeMatches) {
      if (this.isValidBarcode(match[1])) {
        extracted.barcode = match[1];
        break;
      }
    }

    // 3. Marque (depuis les logos ou le texte)
    if (visionResult.logoAnnotations && visionResult.logoAnnotations.length > 0) {
      extracted.brand = visionResult.logoAnnotations[0].description;
    } else {
      const brandMatch = text.match(this.patterns.brand);
      if (brandMatch) {
        extracted.brand = brandMatch[1].trim();
      }
    }

    // 4. Ingrédients
    for (const [lang, pattern] of Object.entries(this.patterns.ingredients)) {
      const match = text.match(pattern);
      if (match) {
        extracted.ingredients = match[1].trim();
        break;
      }
    }

    // 5. Poids
    const weightMatch = text.match(this.patterns.weight);
    if (weightMatch) {
      extracted.weight = weightMatch[0];
    }

    // 6. Catégorie (basée sur les labels)
    const labels = visionResult.labelAnnotations || [];
    extracted.category = this.detectProductType(labels, text);

    return extracted;
  }

  detectProductType(labels, text = '') {
    const labelNames = labels.map(l => l.description.toLowerCase());
    const textLower = text.toLowerCase();

    // Vérifier par mots-clés
    if (labelNames.some(l => ['food', 'snack', 'beverage', 'chocolate', 'spread'].includes(l)) ||
        textLower.includes('nutrition') || textLower.includes('ingredients')) {
      return 'food';
    }

    if (labelNames.some(l => ['cosmetics', 'shampoo', 'cream', 'lotion', 'beauty'].includes(l)) ||
        textLower.includes('cosmetic') || textLower.includes('shampoo')) {
      return 'cosmetic';
    }

    if (labelNames.some(l => ['detergent', 'cleaner', 'cleaning', 'laundry'].includes(l)) ||
        textLower.includes('detergent') || textLower.includes('lessive')) {
      return 'detergent';
    }

    return 'food'; // Par défaut
  }

  isValidBarcode(code) {
    if (!code || !/^\d{8,13}$/.test(code)) return false;
    
    // Validation basique des codes EAN-13
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

  calculateConfidence(text, extractedData) {
    let confidence = 0.5; // Base

    // Plus de texte = plus de confiance
    if (text.length > 100) confidence += 0.2;
    if (text.length > 500) confidence += 0.1;

    // Données extraites = plus de confiance
    if (extractedData.barcode) confidence += 0.1;
    if (extractedData.ingredients) confidence += 0.1;
    if (extractedData.brand) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  async cleanup() {
    this.initialized = false;
    console.log('✅ VisionService nettoyé');
  }
}

module.exports = new VisionServiceFixed();
