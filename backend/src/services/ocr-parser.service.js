const OpenAI = require('openai');

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

/**
 * Parse texte OCR brut en données structurées produit
 * @param {Object} ocrResults - Résultats Google Vision
 * @param {string} ocrResults.frontText - Texte face avant
 * @param {string} ocrResults.ingredientsText - Texte ingrédients
 * @param {string} ocrResults.barcodeText - Texte code-barres (optionnel)
 * @returns {Promise<Object>} - Données produit structurées
 */
async function parseOCRToProduct(ocrResults) {
  const { frontText, ingredientsText, barcodeText } = ocrResults;

  const prompt = `Tu es un expert en analyse d'étiquettes alimentaires. Extrais les informations suivantes du texte OCR.

TEXTE FACE AVANT:
${frontText}

TEXTE INGRÉDIENTS:
${ingredientsText}

${barcodeText ? `CODE-BARRES DÉTECTÉ:\n${barcodeText}\n` : ''}

INSTRUCTIONS:
1. Extrais le nom du produit (le plus visible/gros texte)
2. Extrais la marque (souvent en haut ou avec logo)
3. Extrais la liste complète des ingrédients
4. Détecte le code-barres (13 chiffres type EAN-13)
5. Déduis la catégorie (food/cosmetics/detergents)
6. Détecte les labels (bio, équitable, etc.)

RÉPONDS UNIQUEMENT EN JSON VALIDE (sans markdown):
{
  "name": "nom exact du produit",
  "brand": "marque ou null",
  "barcode": "code EAN-13 ou null",
  "category": "food/cosmetics/detergents",
  "ingredients": ["liste", "des", "ingrédients"],
  "labels": ["bio", "équitable", etc],
  "confidence": 0-100
}`;

  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant qui extrait des données structurées depuis du texte OCR. Tu réponds UNIQUEMENT en JSON valide, sans markdown ni explications.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    
    // Nettoyer markdown si présent
    let jsonText = response.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText);

    // Validation
    if (!parsed.name || parsed.name.length < 3) {
      throw new Error('Nom produit invalide ou trop court');
    }

    if (!['food', 'cosmetics', 'detergents'].includes(parsed.category)) {
      parsed.category = 'food'; // Défaut
    }

    console.log('✅ Parsing OCR réussi:', {
      name: parsed.name,
      confidence: parsed.confidence
    });

    return {
      ...parsed,
      source: 'ocr-deepseek',
      ocrRawText: {
        front: frontText.substring(0, 500),
        ingredients: ingredientsText.substring(0, 1000)
      }
    };

  } catch (error) {
    console.error('❌ Erreur parsing DeepSeek:', error);
    
    // Fallback: parsing basique
    return {
      name: extractNameFallback(frontText),
      brand: null,
      barcode: extractBarcodeFallback(barcodeText || frontText),
      category: 'food',
      ingredients: extractIngredientsFallback(ingredientsText),
      labels: [],
      confidence: 30,
      source: 'ocr-fallback',
      ocrRawText: {
        front: frontText.substring(0, 500),
        ingredients: ingredientsText.substring(0, 1000)
      }
    };
  }
}

/**
 * Fallback: extraction nom basique
 */
function extractNameFallback(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 3);
  // Prendre la ligne la plus longue (souvent le nom)
  return lines.reduce((a, b) => a.length > b.length ? a : b, 'Produit sans nom').trim();
}

/**
 * Fallback: extraction code-barres
 */
function extractBarcodeFallback(text) {
  const match = text.match(/\b\d{13}\b/);
  return match ? match[0] : null;
}

/**
 * Fallback: extraction ingrédients
 */
function extractIngredientsFallback(text) {
  // Chercher "Ingrédients:" puis extraire
  const match = text.match(/ingr[ée]dients?\s*:?\s*(.+)/i);
  if (match) {
    return match[1].split(/[,;]/).map(i => i.trim()).filter(i => i.length > 2);
  }
  return [];
}

module.exports = {
  parseOCRToProduct
};
