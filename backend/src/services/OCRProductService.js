const vision = require('@google-cloud/vision');
const deepSeekService = require('./ai/deepSeekService');

class OCRProductService {
  constructor() {
    // Initialiser client Google Vision (si configuré)
    this.visionClient = null;
    
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || 
        (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_PRIVATE_KEY)) {
      try {
        this.visionClient = new vision.ImageAnnotatorClient({
          projectId: process.env.GOOGLE_PROJECT_ID,
          credentials: process.env.GOOGLE_PRIVATE_KEY ? {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
          } : undefined
        });
        console.log('✓ Google Vision client initialisé');
      } catch (error) {
        console.warn('⚠️ Google Vision non disponible:', error.message);
      }
    } else {
      console.warn('⚠️ Google Vision non configuré - Mode simulation');
    }
  }

  /**
   * Extrait le texte de 2 photos avec Google Vision OCR
   * @param {Buffer} frontPhotoBuffer - Buffer de la photo face avant
   * @param {Buffer} ingredientsPhotoBuffer - Buffer de la photo ingrédients
   * @returns {Promise<{frontText: string, ingredientsText: string}>}
   */
  async extractTextFromPhotos(frontPhotoBuffer, ingredientsPhotoBuffer) {
    try {
      console.log('[OCR] Extraction texte avec Google Vision...');

      if (!this.visionClient) {
        // Mode simulation si Google Vision non configuré
        console.warn('[OCR] Mode simulation - Google Vision non disponible');
        return {
          frontText: this._simulateFrontText(),
          ingredientsText: this._simulateIngredientsText()
        };
      }

      // OCR photo face avant
      console.log('[OCR] Analyse photo 1/2 (face avant)...');
      const [frontResult] = await this.visionClient.textDetection({
        image: { content: frontPhotoBuffer }
      });
      const frontText = frontResult.fullTextAnnotation?.text || '';
      console.log(`[OCR] ✓ Face avant: ${frontText.length} caractères extraits`);

      // OCR photo ingrédients
      console.log('[OCR] Analyse photo 2/2 (ingrédients)...');
      const [ingredientsResult] = await this.visionClient.textDetection({
        image: { content: ingredientsPhotoBuffer }
      });
      const ingredientsText = ingredientsResult.fullTextAnnotation?.text || '';
      console.log(`[OCR] ✓ Ingrédients: ${ingredientsText.length} caractères extraits`);

      return {
        frontText: frontText.trim(),
        ingredientsText: ingredientsText.trim()
      };

    } catch (error) {
      console.error('[OCR] Erreur extraction texte:', error);
      throw new Error(`Échec extraction OCR: ${error.message}`);
    }
  }

  /**
   * Parse les textes OCR avec DeepSeek IA pour structurer les données
   * @param {string} frontText - Texte de la face avant
   * @param {string} ingredientsText - Texte des ingrédients
   * @param {string} barcode - Code-barre du produit
   * @returns {Promise<Object>}
   */
  async parseWithAI(frontText, ingredientsText, barcode) {
    try {
      console.log('[OCR] Parsing intelligent avec DeepSeek IA...');

      const prompt = `Tu es un expert en analyse de produits alimentaires. Analyse ces textes extraits par OCR et structure les données.

**TEXTE FACE AVANT:**
${frontText}

**TEXTE INGRÉDIENTS:**
${ingredientsText}

**CODE-BARRE:** ${barcode}

**INSTRUCTIONS:**
1. Identifie le nom du produit, la marque et la quantité depuis le texte face avant
2. Extrais la liste des ingrédients (séparés par des virgules)
3. Identifie les allergènes courants (gluten, lait, œufs, soja, fruits à coque, etc.)
4. Extrais les valeurs nutritionnelles si présentes (énergie, lipides, glucides, protéines, sel)
5. Sois tolérant aux fautes OCR (ex: "ingrédi3nts" → "ingrédients")

**RÉPONDS UNIQUEMENT EN JSON (sans markdown, sans explication):**
{
  "productName": "nom exact du produit",
  "brand": "marque du produit",
  "quantity": "quantité (ex: 400g)",
  "ingredients": ["ingrédient1", "ingrédient2", ...],
  "allergens": ["allergène1", "allergène2", ...],
  "nutritionalValues": {
    "energy_100g": 2250,
    "fat_100g": 30.9,
    "carbohydrates_100g": 57.5,
    "sugars_100g": 56.3,
    "proteins_100g": 6.3,
    "salt_100g": 0.107
  },
  "confidence": 0.75,
  "aiReasoning": "Courte explication de l'analyse"
}`;

      // Appel DeepSeek avec systemPrompt pour meilleur parsing
      const systemPrompt = 'Tu es un expert en analyse de produits alimentaires. Extrais et structure les données de manière précise depuis le texte OCR fourni. Réponds uniquement en JSON valide.';
      const response = await deepSeekService.analyze(prompt, systemPrompt);

      console.log('[OCR] Réponse brute DeepSeek:', JSON.stringify(response).substring(0, 500));
      
      if (!response) {
        console.error('[OCR] Response est null/undefined');
        throw new Error('Réponse IA vide');
      }
      
      // DeepSeek peut retourner directement une string ou un objet
      const content = typeof response === 'string' ? response : response.content;
      
      if (!content) {
        console.error('[OCR] Content vide. Response type:', typeof response);
        console.error('[OCR] Response keys:', Object.keys(response || {}));
        throw new Error('Réponse IA vide');
      }

      // Parser la réponse JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[OCR] Réponse IA non-JSON:', response.content);
        throw new Error('Format de réponse IA invalide');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log(`[OCR] ✓ Données parsées: "${parsedData.productName}"`);

      return parsedData;

    } catch (error) {
      console.error('[OCR] Erreur parsing IA:', error);
      
      // Fallback : parsing basique sans IA
      console.warn('[OCR] Fallback sur parsing basique...');
      return this._basicParsing(frontText, ingredientsText, barcode);
    }
  }

  /**
   * Calcule la confiance globale de l'analyse OCR
   * @param {Object} parsedData - Données parsées par l'IA
   * @param {Object} ocrTexts - Textes bruts OCR
   * @returns {number} - Confiance entre 0 et 1
   */
  calculateConfidence(parsedData, ocrTexts) {
    let confidence = 0;
    let weights = 0;

    // Critère 1 : Longueur du texte OCR (20%)
    const frontTextQuality = Math.min(ocrTexts.frontText.length / 100, 1);
    const ingredientsTextQuality = Math.min(ocrTexts.ingredientsText.length / 200, 1);
    confidence += (frontTextQuality + ingredientsTextQuality) / 2 * 0.2;
    weights += 0.2;

    // Critère 2 : Présence du nom produit (25%)
    if (parsedData.productName && parsedData.productName.length > 3) {
      confidence += 0.25;
    }
    weights += 0.25;

    // Critère 3 : Présence des ingrédients (30%)
    if (parsedData.ingredients && parsedData.ingredients.length > 0) {
      const ingredientsScore = Math.min(parsedData.ingredients.length / 10, 1);
      confidence += ingredientsScore * 0.3;
    }
    weights += 0.3;

    // Critère 4 : Présence de données nutritionnelles (15%)
    if (parsedData.nutritionalValues) {
      const nutritionFields = Object.keys(parsedData.nutritionalValues).length;
      const nutritionScore = Math.min(nutritionFields / 6, 1);
      confidence += nutritionScore * 0.15;
    }
    weights += 0.15;

    // Critère 5 : Confiance IA (10%)
    if (parsedData.confidence) {
      confidence += parsedData.confidence * 0.1;
    }
    weights += 0.1;

    // Normaliser sur les poids utilisés
    const finalConfidence = weights > 0 ? confidence / weights : 0.5;

    console.log(`[OCR] Confiance calculée: ${(finalConfidence * 100).toFixed(1)}%`);
    return Math.max(0.4, Math.min(finalConfidence, 0.95)); // Entre 40% et 95%
  }

  /**
   * Parsing basique sans IA (fallback)
   */
  _basicParsing(frontText, ingredientsText, barcode) {
    console.log('[OCR] Parsing basique (sans IA)...');

    // Extraire nom produit (première ligne significative)
    const frontLines = frontText.split('\n').filter(l => l.trim().length > 3);
    const productName = frontLines[0] || 'Produit inconnu';

    // Extraire ingrédients (chercher "ingrédients:" puis splitter)
    const ingredientsMatch = ingredientsText.match(/ingr[ée]dients?\s*:?\s*([^.]+)/i);
    const ingredientsRaw = ingredientsMatch ? ingredientsMatch[1] : ingredientsText;
    const ingredients = ingredientsRaw
      .split(/,|;/)
      .map(i => i.trim())
      .filter(i => i.length > 2)
      .slice(0, 20); // Max 20 ingrédients

    return {
      productName,
      brand: '',
      quantity: '',
      ingredients,
      allergens: [],
      nutritionalValues: {},
      confidence: 0.5,
      aiReasoning: 'Parsing basique sans IA'
    };
  }

  /**
   * Simulations pour tests sans Google Vision
   */
  _simulateFrontText() {
    return `NUTELLA
Ferrero
400g
Pâte à tartiner aux noisettes et au cacao`;
  }

  _simulateIngredientsText() {
    return `INGRÉDIENTS: Sucre, huile de palme, NOISETTES 13%, cacao maigre 7.4%, LAIT écrémé en poudre 6.6%, lactosérum en poudre (LAIT), émulsifiants: lécithines (SOJA), vanilline.

VALEURS NUTRITIONNELLES pour 100g:
Énergie: 2252 kJ / 539 kcal
Matières grasses: 30.9g
  dont acides gras saturés: 10.6g
Glucides: 57.5g
  dont sucres: 56.3g
Protéines: 6.3g
Sel: 0.107g`;
  }
}

module.exports = new OCRProductService();
