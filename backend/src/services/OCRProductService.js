const vision = require('@google-cloud/vision');
const deepSeekService = require('./ai/deepSeekService');

class OCRProductService {
  constructor() {
    // Initialiser client Google Vision (si configur�)
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
        console.log('? Google Vision client initialis�');
      } catch (error) {
        console.warn('?? Google Vision non disponible:', error.message);
      }
    } else {
      console.warn('?? Google Vision non configur� - Mode simulation');
    }
  }

  /**
   * Extrait le texte de 2 photos avec Google Vision OCR
   * @param {Buffer} frontPhotoBuffer - Buffer de la photo face avant
   * @param {Buffer} ingredientsPhotoBuffer - Buffer de la photo ingr�dients
   * @returns {Promise<{frontText: string, ingredientsText: string}>}
   */
  async extractTextFromPhotos(frontPhotoBuffer, ingredientsPhotoBuffer) {
    try {
      console.log('[OCR] Extraction texte avec Google Vision...');

      if (!this.visionClient) {
        // Mode simulation si Google Vision non configur�
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
      console.log(`[OCR] ? Face avant: ${frontText.length} caract�res extraits`);

      // OCR photo ingr�dients
      console.log('[OCR] Analyse photo 2/2 (ingr�dients)...');
      const [ingredientsResult] = await this.visionClient.textDetection({
        image: { content: ingredientsPhotoBuffer }
      });
      const ingredientsText = ingredientsResult.fullTextAnnotation?.text || '';
      console.log(`[OCR] ? Ingr�dients: ${ingredientsText.length} caract�res extraits`);

      // D�tecter cat�gorie depuis le texte face avant
      const textLower = frontText.toLowerCase();
      let detectedCategory = 'food'; // Par d�faut
      
      if (textLower.includes('lessive') || textLower.includes('d�tergent') || 
          textLower.includes('savon') || textLower.includes('lavage')) {
        detectedCategory = 'detergents';
      } else if (textLower.includes('cr�me') || textLower.includes('lotion') || 
                 textLower.includes('shampooing') || textLower.includes('gel douche')) {
        detectedCategory = 'cosmetics';
      }

      return {
        frontText: frontText.trim(),
        ingredientsText: ingredientsText.trim(),
        detectedCategory: detectedCategory
      };

    } catch (error) {
      console.error('[OCR] Erreur extraction texte:', error);
      throw new Error(`�chec extraction OCR: ${error.message}`);
    }
  }


  /**
   * Extrait texte d'UNE SEULE photo (pour analyse rapide)
   * @param {Buffer} photoBuffer - Buffer de la photo
   * @returns {Promise<{success: boolean, text: string, barcode: string|null, name: string|null, brand: string|null, ingredients: string|null, confidence: number}>}
   */
  async extractTextFromSinglePhoto(photoBuffer) {
    try {
      console.log('[OCR] Extraction texte photo unique avec Google Vision...');

      if (!this.visionClient) {
        console.warn('[OCR] Google Vision non disponible - Fallback simulation');
        return {
          success: false,
          text: '',
          barcode: null,
          name: null,
          brand: null,
          ingredients: null,
          confidence: 0
        };
      }

      // OCR avec Google Vision
      const [result] = await this.visionClient.textDetection({
        image: { content: photoBuffer }
      });

      const fullText = result.fullTextAnnotation?.text || '';
      console.log(`[OCR] ✅ ${fullText.length} caractères extraits`);

      if (fullText.length === 0) {
        return {
          success: false,
          text: '',
          barcode: null,
          name: null,
          brand: null,
          ingredients: null,
          confidence: 0
        };
      }

      // Parser basique
      const lines = fullText.split('\n').filter(l => l.trim().length > 2);
      
      // Détecter code-barre (13 chiffres)
      const barcodeMatch = fullText.match(/\b\d{13}\b/);
      const barcode = barcodeMatch ? barcodeMatch[0] : null;

      // Nom produit = première ligne significative
      const name = lines[0] || null;

      // Marque = deuxième ligne si courte (< 30 chars)
      const brand = (lines[1] && lines[1].length < 30) ? lines[1] : null;

      // Ingrédients = chercher "ingrédients:" ou "ingredients:"
      const ingredientsMatch = fullText.match(/ingr[ée]dients?\s*:?\s*([^\n]{20,})/i);
      const ingredients = ingredientsMatch ? ingredientsMatch[1].trim() : null;

      // Confiance basée sur longueur texte
      const confidence = Math.min(Math.max(fullText.length / 200, 0.4), 0.9) * 100;

      return {
        success: true,
        text: fullText,
        barcode,
        name,
        brand,
        ingredients,
        confidence: Math.round(confidence)
      };

    } catch (error) {
      console.error('[OCR] Erreur extraction texte:', error);
      return {
        success: false,
        text: '',
        barcode: null,
        name: null,
        brand: null,
        ingredients: null,
        confidence: 0
      };
    }
  }
  /**
   * Parse les textes OCR avec DeepSeek IA pour structurer les donn�es
   * @param {string} frontText - Texte de la face avant
   * @param {string} ingredientsText - Texte des ingr�dients
   * @param {string} barcode - Code-barre du produit
   * @returns {Promise<Object>}
   */
  async parseWithAI(frontText, ingredientsText, barcode) {
    try {
      console.log('[OCR] Parsing intelligent avec DeepSeek IA...');

      const prompt = `Tu es un expert en analyse de produits alimentaires. Analyse ces textes extraits par OCR et structure les donn�es.

**TEXTE FACE AVANT:**
${frontText}

**TEXTE INGR�DIENTS:**
${ingredientsText}

**CODE-BARRE:** ${barcode}

**INSTRUCTIONS:**
1. Identifie le nom du produit, la marque et la quantit� depuis le texte face avant
2. Extrais la liste des ingr�dients (s�par�s par des virgules)
3. Identifie les allerg�nes courants (gluten, lait, �ufs, soja, fruits � coque, etc.)
4. Extrais les valeurs nutritionnelles si pr�sentes (�nergie, lipides, glucides, prot�ines, sel)
5. Sois tol�rant aux fautes OCR (ex: "ingr�di3nts" ? "ingr�dients")

**R�PONDS UNIQUEMENT EN JSON (sans markdown, sans explication):**
{
  "productName": "nom exact du produit",
  "brand": "marque du produit",
  "quantity": "quantit� (ex: 400g)",
  "ingredients": ["ingr�dient1", "ingr�dient2", ...],
  "allergens": ["allerg�ne1", "allerg�ne2", ...],
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
      const systemPrompt = 'Tu es un expert en analyse de produits alimentaires. Extrais et structure les donn�es de mani�re pr�cise depuis le texte OCR fourni. R�ponds uniquement en JSON valide.';
      const response = await deepSeekService.analyze(prompt, systemPrompt);

      console.log('[OCR] R�ponse brute DeepSeek:', JSON.stringify(response).substring(0, 500));
      
      if (!response) {
        console.error('[OCR] Response est null/undefined');
        throw new Error('R�ponse IA vide');
      }
      
      // DeepSeek peut retourner directement une string ou un objet
      const content = typeof response === 'string' ? response : response.content;
      
      if (!content) {
        console.error('[OCR] Content vide. Response type:', typeof response);
        console.error('[OCR] Response keys:', Object.keys(response || {}));
        throw new Error('R�ponse IA vide');
      }

      // Parser la r�ponse JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[OCR] R�ponse IA non-JSON:', response.content);
        throw new Error('Format de r�ponse IA invalide');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log(`[OCR] ? Donn�es pars�es: "${parsedData.productName}"`);

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
   * @param {Object} parsedData - Donn�es pars�es par l'IA
   * @param {Object} ocrTexts - Textes bruts OCR
   * @returns {number} - Confiance entre 0 et 1
   */
  calculateConfidence(parsedData, ocrTexts) {
    let confidence = 0;
    let weights = 0;

    // Crit�re 1 : Longueur du texte OCR (20%)
    const frontTextQuality = Math.min(ocrTexts.frontText.length / 100, 1);
    const ingredientsTextQuality = Math.min(ocrTexts.ingredientsText.length / 200, 1);
    confidence += (frontTextQuality + ingredientsTextQuality) / 2 * 0.2;
    weights += 0.2;

    // Crit�re 2 : Pr�sence du nom produit (25%)
    if (parsedData.productName && parsedData.productName.length > 3) {
      confidence += 0.25;
    }
    weights += 0.25;

    // Crit�re 3 : Pr�sence des ingr�dients (30%)
    if (parsedData.ingredients && parsedData.ingredients.length > 0) {
      const ingredientsScore = Math.min(parsedData.ingredients.length / 10, 1);
      confidence += ingredientsScore * 0.3;
    }
    weights += 0.3;

    // Crit�re 4 : Pr�sence de donn�es nutritionnelles (15%)
    if (parsedData.nutritionalValues) {
      const nutritionFields = Object.keys(parsedData.nutritionalValues).length;
      const nutritionScore = Math.min(nutritionFields / 6, 1);
      confidence += nutritionScore * 0.15;
    }
    weights += 0.15;

    // Crit�re 5 : Confiance IA (10%)
    if (parsedData.confidence) {
      confidence += parsedData.confidence * 0.1;
    }
    weights += 0.1;

    // Normaliser sur les poids utilis�s
    const finalConfidence = weights > 0 ? confidence / weights : 0.5;

    console.log(`[OCR] Confiance calcul�e: ${(finalConfidence * 100).toFixed(1)}%`);
    return Math.max(0.4, Math.min(finalConfidence, 0.95)); // Entre 40% et 95%
  }

  /**
   * Parsing basique sans IA (fallback)
   */
  _basicParsing(frontText, ingredientsText, barcode) {
    console.log('[OCR] Parsing basique (sans IA)...');

    // Extraire nom produit (premi�re ligne significative)
    const frontLines = frontText.split('\n').filter(l => l.trim().length > 3);
    const productName = frontLines[0] || 'Produit inconnu';

    // Extraire ingr�dients (chercher "ingr�dients:" puis splitter)
    const ingredientsMatch = ingredientsText.match(/ingr[�e]dients?\s*:?\s*([^.]+)/i);
    const ingredientsRaw = ingredientsMatch ? ingredientsMatch[1] : ingredientsText;
    const ingredients = ingredientsRaw
      .split(/,|;/)
      .map(i => i.trim())
      .filter(i => i.length > 2)
      .slice(0, 20); // Max 20 ingr�dients

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
P�te � tartiner aux noisettes et au cacao`;
  }

  _simulateIngredientsText() {
    return `INGR�DIENTS: Sucre, huile de palme, NOISETTES 13%, cacao maigre 7.4%, LAIT �cr�m� en poudre 6.6%, lactos�rum en poudre (LAIT), �mulsifiants: l�cithines (SOJA), vanilline.

VALEURS NUTRITIONNELLES pour 100g:
�nergie: 2252 kJ / 539 kcal
Mati�res grasses: 30.9g
  dont acides gras satur�s: 10.6g
Glucides: 57.5g
  dont sucres: 56.3g
Prot�ines: 6.3g
Sel: 0.107g`;
  }
  /**
   * Valide la coh�rence entre cat�gorie d�tect�e et ingr�dients
   */
  validateCoherence(detectedCategory, ingredientsText, parsedData) {
    console.log('[OCR] Validation coh�rence cat�gorie...');
    
    const foodKeywords = ['sucre', 'huile', 'lait', 'farine', 'sel', 'cacao', 'vanille'];
    const detergentKeywords = ['lessive', 'd�tergent', 'savon', 'tensioactif', 'lavage'];
    const cosmeticKeywords = ['cr�me', 'lotion', 'shampooing', 'gel douche'];

    const textLower = ingredientsText.toLowerCase();
    const foodCount = foodKeywords.filter(k => textLower.includes(k)).length;
    const detergentCount = detergentKeywords.filter(k => textLower.includes(k)).length;
    const cosmeticCount = cosmeticKeywords.filter(k => textLower.includes(k)).length;

    let probableCategory = 'food';
    if (detergentCount > foodCount && detergentCount > cosmeticCount) {
      probableCategory = 'detergents';
    } else if (cosmeticCount > foodCount && cosmeticCount > detergentCount) {
      probableCategory = 'cosmetics';
    }

    const isCoherent = detectedCategory === probableCategory;
    
    let incoherenceScore = 0;
    if (!isCoherent) {
      if ((detectedCategory === 'food' && probableCategory === 'detergents') ||
          (detectedCategory === 'detergents' && probableCategory === 'food')) {
        incoherenceScore = 75;
      } else {
        incoherenceScore = 40;
      }
    }

    return {
      isCoherent,
      canProceed: incoherenceScore < 50,
      incoherenceScore,
      detectedCategory,
      probableCategory,
      reason: !isCoherent ? 'Incoh�rence d�tect�e' : 'Coh�rent'
    };
  }
}

module.exports = new OCRProductService();

