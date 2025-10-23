const vision = require('@google-cloud/vision');

// Le client Vision lit automatiquement GOOGLE_APPLICATION_CREDENTIALS
const client = new vision.ImageAnnotatorClient();

/**
 * Analyse une image avec OCR + analyse intelligente
 */
async function analyzeImageOCR(base64Image) {
  try {
    console.log('Ã°Å¸â€Â Demarrage analyse OCR Google Vision...');
    
    const [result] = await client.documentTextDetection({
      image: { content: base64Image },
    });

    const text = result.fullTextAnnotation?.text || '';
    
    if (!text || text.trim().length < 10) {
      return {
        success: false,
        error: 'Texte insuffisant detecte sur l\'image'
      };
    }

    console.log('Ã°Å¸â€œÂ Texte brut detecte:', text.substring(0, 200) + '...');
    
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Analyse intelligente du contenu
    const analysis = analyzeProductText(text, lines);
    
    console.log('Ã¢Å“â€¦ Analyse terminee:', {
      name: analysis.name,
      brand: analysis.brand,
      category: analysis.category,
      confidence: analysis.confidence
    });

    return {
      success: true,
      name: analysis.name,
      brand: analysis.brand,
      category: analysis.category,
      rawText: text,
      lines: lines,
      confidence: analysis.confidence,
      ingredients: analysis.ingredients,
      nutritionalInfo: analysis.nutritionalInfo,
      certifications: analysis.certifications
    };
    
  } catch (error) {
    console.error('Ã¢ÂÅ’ Vision OCR failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      fallback: true
    };
  }
}

/**
 * Analyse multi-photos : front + ingredients + nutrition
 */
async function analyzeMultipleImages(photos) {
  try {
    console.log('Ã°Å¸â€œÂ¸ Analyse multi-photos:', Object.keys(photos));
    
    const results = {};
    
    // Analyser chaque photo
    for (const [type, base64] of Object.entries(photos)) {
      if (!base64) continue;
      
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
      console.log(`Ã°Å¸â€Â Analyse photo ${type}...`);
      
      const analysis = await analyzeImageOCR(cleanBase64);
      results[type] = analysis;
    }
    
    // Fusionner les resultats intelligemment
    const combinedAnalysis = combinePhotoAnalyses(results);
    
    console.log('Ã°Å¸Å½Â¯ Analyse combinee:', {
      name: combinedAnalysis.name,
      brand: combinedAnalysis.brand,
      ingredients_count: combinedAnalysis.ingredients.length
    });
    
    return combinedAnalysis;
    
  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur analyse multi-photos:', error);
    throw error;
  }
}

/**
 * Analyse intelligente du texte detecte
 */
function analyzeProductText(text, lines) {
  const textLower = text.toLowerCase();
  
  // 1. EXTRACTION NOM PRODUIT (amelioree)
  const name = extractProductName(lines, textLower);
  
  // 2. EXTRACTION MARQUE (amelioree)
  const brand = extractBrandIntelligent(lines, textLower);
  
  // 3. EXTRACTION CATâ€°GORIE (amelioree)
  const category = extractCategoryIntelligent(textLower);
  
  // 4. EXTRACTION INGRâ€°DIENTS
  const ingredients = extractIngredients(textLower);
  
  // 5. EXTRACTION INFOS NUTRITIONNELLES
  const nutritionalInfo = extractNutritionalInfo(textLower);
  
  // 6. Dâ€°TECTION CERTIFICATIONS
  const certifications = extractCertifications(textLower);
  
  // 7. CALCUL CONFIANCE
  const confidence = calculateExtractionConfidence({
    name, brand, category, ingredients, certifications, textLength: text.length
  });
  
  return {
    name,
    brand,
    category,
    ingredients,
    nutritionalInfo,
    certifications,
    confidence
  };
}

/**
 * Extraction nom produit amelioree
 */
function extractProductName(lines, textLower) {
  // Chercher dans les premieres lignes (nom souvent en haut)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    
    // â€°viter les marques connues, codes-barres, etc.
    if (line.length > 3 && line.length < 50 && 
        !isBarcode(line) && 
        !isKnownBrand(line.toLowerCase()) &&
        !isNutritionalValue(line)) {
      
      return capitalizeFirst(line);
    }
  }
  
  // Fallback : utiliser patterns pour detecter noms produits
  const productPatterns = [
    /(\w+\s+bio)/gi,
    /(\w+\s+naturel)/gi,
    /(biscuits?\s+\w+)/gi,
    /(yaourt\s+\w+)/gi,
    /(lait\s+\w+)/gi,
    /(eau\s+\w+)/gi
  ];
  
  for (const pattern of productPatterns) {
    const match = textLower.match(pattern);
    if (match) return capitalizeFirst(match[0]);
  }
  
  return lines[0] || 'Produit alimentaire';
}

/**
 * Extraction marque intelligente
 */
function extractBrandIntelligent(lines, textLower) {
  // Marques etendues (base de donnees plus large)
  const knownBrands = [
    'bjorg', 'evian', 'barilla', 'danone', 'carrefour', 'monoprix',
    'bio village', 'naturalia', 'la vie claire', 'lea nature',
    'nestle', 'unilever', 'lactalis', 'sodiaal', 'yoplait',
    'president', 'elle & vire', 'candia', 'lactel', 'bridel',
    'bonduelle', 'cassegrain', 'marie', 'bonne maman', 'st michel',
    'lu', 'oreo', 'belvita', 'gerble', 'bjorg', 'jardin bio',
    'biocoop', 'greenweez', 'natureo', 'casino bio', 'monoprix bio'
  ];
  
  // Chercher marque dans le texte
  for (const brand of knownBrands) {
    if (textLower.includes(brand)) {
      return capitalizeFirst(brand);
    }
  }
  
  // Chercher dans les premieres lignes (marque souvent en haut)
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].toLowerCase();
    if (line.length > 2 && line.length < 20 && !isBarcode(line)) {
      // Verifier si c'est probablement une marque
      if (isLikelyBrand(line)) {
        return capitalizeFirst(lines[i]);
      }
    }
  }
  
  return 'Marque non identifiee';
}

/**
 * Extraction categorie intelligente
 */
function extractCategoryIntelligent(textLower) {
  const categories = {
    'yaourt': ['yaourt', 'yogurt', 'fromage blanc', 'dessert lacte'],
    'eau': ['eau', 'water', 'source', 'minerale'],
    'biscuits': ['biscuit', 'cookie', 'gateau', 'cake', 'sable'],
    'pates': ['pates', 'pasta', 'spaghetti', 'macaroni', 'linguine'],
    'boisson': ['jus', 'juice', 'boisson', 'drink', 'soda', 'the', 'cafe'],
    'lait': ['lait', 'milk', 'creme', 'beurre'],
    'cereales': ['cereales', 'muesli', 'granola', 'flocons'],
    'snack': ['chips', 'crackers', 'aperitif', 'snack'],
    'hygiene': ['shampooing', 'savon', 'dentifrice', 'gel douche'],
    'cosmetique': ['creme', 'lotion', 'serum', 'masque']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'alimentaire';
}

/**
 * Extraction ingredients
 */
function extractIngredients(textLower) {
  const ingredients = [];
  
  // Chercher section ingredients
  const ingredientSection = extractSection(textLower, ['ingredients', 'ingredients']);
  
  if (ingredientSection) {
    // Parser la liste d'ingredients
    const rawIngredients = ingredientSection
      .split(/[,;]/)
      .map(i => i.trim())
      .filter(i => i.length > 2 && i.length < 30);
    
    ingredients.push(...rawIngredients);
  }
  
  return ingredients;
}

/**
 * Extraction informations nutritionnelles
 */
function extractNutritionalInfo(textLower) {
  const nutritionalInfo = {};
  
  // Patterns pour valeurs nutritionnelles
  const patterns = {
    energy: /(\d+)\s*(kj|kcal)/gi,
    proteins: /proteines?\s*:?\s*(\d+(?:,\d+)?)\s*g/gi,
    carbs: /glucides?\s*:?\s*(\d+(?:,\d+)?)\s*g/gi,
    fats: /lipides?\s*:?\s*(\d+(?:,\d+)?)\s*g/gi,
    sugar: /sucres?\s*:?\s*(\d+(?:,\d+)?)\s*g/gi
  };
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = textLower.match(pattern);
    if (match) {
      nutritionalInfo[key] = match[1];
    }
  }
  
  return nutritionalInfo;
}

/**
 * Extraction certifications
 */
function extractCertifications(textLower) {
  const certifications = [];
  
  const certificationKeywords = [
    'bio', 'ab', 'ecocert', 'fair trade', 'commerce equitable',
    'label rouge', 'aoc', 'igp', 'fsc', 'rainforest alliance',
    'max havelaar', 'demeter', 'nature & progres'
  ];
  
  for (const cert of certificationKeywords) {
    if (textLower.includes(cert)) {
      certifications.push(cert);
    }
  }
  
  return [...new Set(certifications)]; // Enlever doublons
}

/**
 * Combiner analyses de plusieurs photos
 */
function combinePhotoAnalyses(results) {
  const front = results.front?.success ? results.front : null;
  const ingredients = results.ingredients?.success ? results.ingredients : null;
  const nutrition = results.nutrition?.success ? results.nutrition : null;
  
  // Prioriser front pour nom/marque, ingredients pour ingredients
  return {
    success: true,
    name: front?.name || ingredients?.name || 'Produit analyse',
    brand: front?.brand || ingredients?.brand || 'Marque inconnue',
    category: front?.category || ingredients?.category || 'alimentaire',
    ingredients: [
      ...(front?.ingredients || []),
      ...(ingredients?.ingredients || [])
    ],
    nutritionalInfo: nutrition?.nutritionalInfo || ingredients?.nutritionalInfo || {},
    certifications: [
      ...(front?.certifications || []),
      ...(ingredients?.certifications || [])
    ],
    confidence: Math.max(
      front?.confidence || 0,
      ingredients?.confidence || 0,
      nutrition?.confidence || 0
    ),
    rawTexts: {
      front: front?.rawText,
      ingredients: ingredients?.rawText,
      nutrition: nutrition?.rawText
    }
  };
}

/**
 * Fonctions utilitaires
 */
function isBarcode(text) {
  return /^\d{8,}$/.test(text.replace(/\s/g, ''));
}

function isKnownBrand(text) {
  const brands = ['bjorg', 'evian', 'danone', 'carrefour'];
  return brands.some(brand => text.includes(brand));
}

function isNutritionalValue(text) {
  return /\d+\s*(g|ml|kcal|kj)/i.test(text);
}

function isLikelyBrand(text) {
  // Heuristiques pour detecter une marque
  return text.length < 15 && 
         !text.includes(' ') && 
         !/\d/.test(text) &&
         text !== text.toLowerCase();
}

function extractSection(text, keywords) {
  for (const keyword of keywords) {
    const index = text.indexOf(keyword);
    if (index !== -1) {
      // Extraire 200 caracteres apres le mot-cle
      return text.substring(index, index + 200);
    }
  }
  return null;
}

function calculateExtractionConfidence(data) {
  let confidence = 0.3; // Base
  
  if (data.name && data.name !== 'Produit alimentaire') confidence += 0.2;
  if (data.brand && data.brand !== 'Marque non identifiee') confidence += 0.15;
  if (data.category && data.category !== 'alimentaire') confidence += 0.1;
  if (data.ingredients && data.ingredients.length > 0) confidence += 0.15;
  if (data.certifications && data.certifications.length > 0) confidence += 0.1;
  if (data.textLength > 100) confidence += 0.05;
  
  return Math.min(0.95, confidence);
}

function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

module.exports = { 
  analyzeImageOCR,
  analyzeMultipleImages
};
