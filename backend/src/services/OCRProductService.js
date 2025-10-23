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
        console.log('? Google Vision client initialisé');
      } catch (error) {
        console.warn('?? Google Vision non disponible:', error.message);
      }
    } else {
      console.warn('?? Google Vision non configuré - Mode simulation');
    }
  }

  /**
   * Extrait le texte de 2 photos avec Google Vision OCR
   * @param {Buffer} frontPhotoBuffer - Buffer de la photo face avant
   * @param {Buffer} ingredientsPhotoBuffer - Buffer de la photo ingrédients
   * @returns {Promise<{frontText: string, ingredientsText: string, detectedCategory: string}>}
   */
  async extractTextFromPhotos(frontPhotoBuffer, ingredientsPhotoBuffer) {
    try {
      console.log('[OCR] Extraction texte avec Google Vision...');

      if (!this.visionClient) {
        // Mode simulation si Google Vision non configuré
        console.warn('[OCR] Mode simulation - Google Vision non disponible');
        const frontText = this._simulateFrontText();
        const detectedCategory = this.detectCategory(frontText);
        return {
          frontText,
          ingredientsText: this._simulateIngredientsText(),
          detectedCategory
        };
      }

      // OCR photo face avant
      console.log('[OCR] Analyse photo 1/2 (face avant)...');
      const [frontResult] = await this.visionClient.textDetection({
        image: { content: frontPhotoBuffer }
      });
      const frontText = frontResult.fullTextAnnotation?.text || '';
      console.log(`[OCR] ? Face avant: ${frontText.length} caractères extraits`);

      // OCR photo ingrédients
      console.log('[OCR] Analyse photo 2/2 (ingrédients)...');
      const [ingredientsResult] = await this.visionClient.textDetection({
        image: { content: ingredientsPhotoBuffer }
      });
      const ingredientsText = ingredientsResult.fullTextAnnotation?.text || '';
      console.log(`[OCR] ? Ingrédients: ${ingredientsText.length} caractères extraits`);

      const detectedCategory = this.detectCategory(frontText);
      console.log(`[OCR] Catégorie détectée: ${detectedCategory}`);

      return {
        frontText: frontText.trim(),
        ingredientsText: ingredientsText.trim(),
        detectedCategory
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
   * @param {string} detectedCategory - Catégorie détectée ('food' | 'cosmetic' | 'detergent')
   * @returns {Promise<Object>}
   */
  async parseWithAI(frontText, ingredientsText, barcode, detectedCategory = 'food') {
    try {
      console.log('[OCR] Parsing intelligent avec DeepSeek IA...');
      console.log(`[OCR] Catégorie pour parsing: ${detectedCategory}`);

      // Adapter les instructions selon la catégorie
      let categoryInstructions = '';
      let jsonSchema = '';
      
      if (detectedCategory === 'food') {
        categoryInstructions = `Ce produit est ALIMENTAIRE. Analyse les informations nutritionnelles et les ingrédients alimentaires.`;
        jsonSchema = `{
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
  "aiReasoning": "Courte explication"
}`;
      } else if (detectedCategory === 'cosmetic') {
        categoryInstructions = `Ce produit est COSMÉTIQUE. Extrais la liste INCI (composition cosmétique), les parfums, les conservateurs.`;
        jsonSchema = `{
  "productName": "nom exact du produit",
  "brand": "marque du produit",
  "quantity": "quantité (ex: 50ml)",
  "ingredients": ["ingrédient INCI 1", "ingrédient INCI 2", ...],
  "allergens": [],
  "nutritionalValues": {},
  "confidence": 0.75,
  "aiReasoning": "Courte explication"
}`;
      } else if (detectedCategory === 'detergent') {
        categoryInstructions = `Ce produit est un DÉTERGENT. Extrais les tensioactifs, parfums, conservateurs, pictogrammes de danger.`;
        jsonSchema = `{
  "productName": "nom exact du produit",
  "brand": "marque du produit",
  "quantity": "quantité (ex: 1L)",
  "ingredients": ["tensioactif 1", "composant chimique 2", ...],
  "allergens": [],
  "nutritionalValues": {},
  "confidence": 0.75,
  "aiReasoning": "Courte explication"
}`;
      }

      const prompt = `Tu es un expert en analyse de produits. ${categoryInstructions}

**TEXTE FACE AVANT:**
${frontText}

**TEXTE INGRÉDIENTS/COMPOSITION:**
${ingredientsText}

**CODE-BARRE:** ${barcode}

**INSTRUCTIONS:**
1. Identifie le nom du produit, la marque et la quantité depuis le texte face avant
2. Extrais la liste des ingrédients/composants (séparés par des virgules)
3. Pour les produits alimentaires: identifie les allergènes et valeurs nutritionnelles
4. Sois tolérant aux fautes OCR (ex: "ingrédi3nts" ? "ingrédients")
5. Si des informations manquent, laisse les champs vides ou tableaux vides

**RÉPONDS UNIQUEMENT EN JSON (sans markdown, sans explication):**
${jsonSchema}`;

      // Appel DeepSeek avec systemPrompt adapté
      const systemPrompt = `Tu es un expert en analyse de produits ${detectedCategory === 'food' ? 'alimentaires' : detectedCategory === 'cosmetic' ? 'cosmétiques' : 'détergents'}. Extrais et structure les données de manière précise depuis le texte OCR fourni. Réponds uniquement en JSON valide.`;
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
      console.log(`[OCR] ? Données parsées: "${parsedData.productName}"`);

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
   * Détecte la catégorie depuis le texte de la face avant
   * @param {string} frontText - Texte OCR face avant
   * @returns {string} - 'food' | 'cosmetic' | 'detergent'
   */
  detectCategory(frontText) {
    const text = frontText.toLowerCase();
    
    // Détergents (priorité haute car keywords spécifiques)
    const detergentKeywords = ['lessive', 'détergent', 'nettoyant', 'vaisselle', 'sol', 'javel', 'désinfectant', 'lave-glace'];
    const detergentScore = detergentKeywords.filter(k => text.includes(k)).length;
    
    // Cosmétiques
    const cosmeticKeywords = ['crème', 'shampooing', 'gel douche', 'parfum', 'lotion', 'masque', 'sérum', 'baume', 'eau micellaire'];
    const cosmeticScore = cosmeticKeywords.filter(k => text.includes(k)).length;
    
    // Alimentaires
    const foodKeywords = ['pâte à tartiner', 'biscuit', 'chocolat', 'yaourt', 'fromage', 'jus', 'sauce', 'confiture'];
    const foodScore = foodKeywords.filter(k => text.includes(k)).length;
    
    console.log('[OCR] Scores catégories - Food:', foodScore, 'Cosmetic:', cosmeticScore, 'Detergent:', detergentScore);
    
    if (detergentScore > 0 && detergentScore >= cosmeticScore && detergentScore >= foodScore) {
      return 'detergent';
    }
    if (cosmeticScore > 0 && cosmeticScore >= foodScore) {
      return 'cosmetic';
    }
    return 'food'; // Par défaut
  }

  /**
   * Valide la cohérence entre catégorie détectée et ingrédients
   * @param {string} detectedCategory - Catégorie détectée
   * @param {string} ingredientsText - Texte ingrédients
   * @param {Object} parsedData - Données parsées par IA
   * @returns {Object} - {isCoherent, incoherenceScore, coherenceScore, issues, reasons, canProceed}
   */
  validateCoherence(detectedCategory, ingredientsText, parsedData) {
    const text = ingredientsText.toLowerCase();
    let incoherenceScore = 0;
    let issues = [];
    
    console.log('[OCR] Validation cohérence - Catégorie:', detectedCategory);
    
    if (detectedCategory === 'detergent') {
      // Keywords détergent attendus
      const detergentWords = ['tensioactif', 'parfum', 'conservateur', 'sodium', 'chlorure', 'glycol', 'sulfate'];
      const hasDetergentWords = detergentWords.some(k => text.includes(k));
      
      // Keywords alimentaires (incohérence)
      const foodWords = ['kcal', 'protéines', 'glucides', 'lipides', 'sucre', 'sel', 'énergie'];
      const hasFoodWords = foodWords.some(k => text.includes(k));
      
      if (hasFoodWords) {
        incoherenceScore += 50;
        issues.push('? Valeurs nutritionnelles détectées (produit alimentaire) alors que la face avant indique un détergent');
      }
      
      if (!hasDetergentWords && text.length > 50) {
        incoherenceScore += 25;
        issues.push('?? Composition chimique typique détergent non détectée');
      }
    }
    
    if (detectedCategory === 'food') {
      // Keywords alimentaires attendus
      const foodWords = ['sucre', 'sel', 'huile', 'farine', 'lait', 'œuf', 'beurre', 'cacao', 'vanille'];
      const hasFoodWords = foodWords.some(k => text.includes(k));
      
      // Keywords détergent (incohérence)
      const detergentWords = ['tensioactif', 'parfum synthétique', 'sodium laureth', 'chlorure'];
      const hasDetergentWords = detergentWords.some(k => text.includes(k));
      
      if (hasDetergentWords) {
        incoherenceScore += 50;
        issues.push('? Composition chimique détergent détectée alors que la face avant indique un produit alimentaire');
      }
      
      if (!hasFoodWords && text.length > 50) {
        incoherenceScore += 20;
        issues.push('?? Ingrédients alimentaires typiques non détectés');
      }
    }
    
    if (detectedCategory === 'cosmetic') {
      // Keywords cosmétiques attendus (INCI)
      const cosmeticWords = ['aqua', 'parfum', 'glycerin', 'ci ', 'sodium lauryl', 'paraben'];
      const hasCosmeticWords = cosmeticWords.some(k => text.includes(k));
      
      if (!hasCosmeticWords && text.length > 50) {
        incoherenceScore += 30;
        issues.push('?? Liste INCI typique cosmétique non détectée');
      }
    }
    
    const result = {
      isCoherent: incoherenceScore < 40,
      incoherenceScore,
      coherenceScore: (100 - incoherenceScore) / 100, // ? AJOUT pour frontend (0-1)
      issues,
      reasons: issues, // ? Alias pour frontend
      canProceed: incoherenceScore < 60
    };
    
    console.log('[OCR] Résultat cohérence:', result);
    return result;
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