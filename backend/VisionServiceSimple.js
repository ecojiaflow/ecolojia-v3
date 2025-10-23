// VisionServiceSimple.js - Version simplifiée pour tests
const vision = require('@google-cloud/vision');

class VisionServiceSimple {
  constructor() {
    this.googleVisionClient = new vision.ImageAnnotatorClient({
      keyFilename: './google-vision-key.json'
    });
  }

  async analyzeImage(imagePath) {
    console.log('Analyse de:', imagePath);
    
    try {
      // Analyses Google Vision
      const [textResult] = await this.googleVisionClient.textDetection(imagePath);
      const [labelResult] = await this.googleVisionClient.labelDetection(imagePath);
      const [logoResult] = await this.googleVisionClient.logoDetection(imagePath);
      
      // Extraire le texte complet
      const fullText = textResult.textAnnotations?.[0]?.description || '';
      
      // Extraire les données
      const extractedData = this.extractProductData(fullText);
      
      // Déterminer la catégorie
      const category = this.detectCategory(labelResult.labelAnnotations || []);
      
      return {
        success: true,
        method: 'google_vision',
        data: {
          rawText: fullText,
          extractedData: extractedData,
          productType: category,
          confidence: fullText.length > 50 ? 0.8 : 0.5,
          labels: labelResult.labelAnnotations?.map(l => ({
            name: l.description,
            score: l.score
          })) || [],
          logos: logoResult.logoAnnotations?.map(l => ({
            name: l.description,
            score: l.score
          })) || []
        }
      };
      
    } catch (error) {
      console.error('Erreur analyse:', error.message);
      throw error;
    }
  }
  
  extractProductData(text) {
    const data = {
      productName: null,
      brand: null,
      barcode: null,
      ingredients: null,
      category: null
    };
    
    if (!text) return data;
    
    // Chercher le code-barres
    const barcodeMatch = text.match(/\b(\d{13})\b/);
    if (barcodeMatch) {
      data.barcode = barcodeMatch[1];
    }
    
    // Chercher la marque (Nutella, Ferrero, etc.)
    const brandMatch = text.match(/NUTELLA|Ferrero|FERRERO/i);
    if (brandMatch) {
      data.brand = brandMatch[0];
    }
    
    // Chercher le nom du produit (première ligne majuscule)
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      data.productName = lines[0].trim();
    }
    
    // Chercher les ingrédients
    const ingredientsMatch = text.match(/ingrédients?\s*:?\s*([^\n]+)/i);
    if (ingredientsMatch) {
      data.ingredients = ingredientsMatch[1].trim();
    }
    
    return data;
  }
  
  detectCategory(labels) {
    const foodKeywords = ['food', 'snack', 'chocolate', 'spread', 'ingredient'];
    const cosmeticKeywords = ['cosmetics', 'shampoo', 'lotion', 'beauty'];
    const detergentKeywords = ['detergent', 'cleaner', 'cleaning'];
    
    for (const label of labels) {
      const name = label.description.toLowerCase();
      
      if (foodKeywords.some(k => name.includes(k))) return 'food';
      if (cosmeticKeywords.some(k => name.includes(k))) return 'cosmetic';
      if (detergentKeywords.some(k => name.includes(k))) return 'detergent';
    }
    
    return 'food'; // Par défaut
  }
}

module.exports = new VisionServiceSimple();
