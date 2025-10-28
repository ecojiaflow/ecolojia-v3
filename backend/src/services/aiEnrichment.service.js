// backend/src/services/aiEnrichment.service.js
/**
 * Service enrichissement IA multi-categories (Food/Cosmetics/Detergents)
 * Utilise deepSeekService.analyzeProduct() avec routing automatique
 */

const deepSeekService = require('./ai/deepSeekService');
const { calculateScores } = require('./scoringUnified');

/**
 * Enrichit un produit avec IA si confiance < 70%
 * @param {Object} product - Produit a enrichir
 * @param {Object} scores - Scores calcules
 * @returns {Promise<Object>} Scores enrichis
 */
async function enrichProductWithAI(product, scores) {
  // Si confiance >= 70%, pas besoin enrichissement
  if (scores.confidence >= 0.7) {
    return {
      ...scores,
      aiEnrichmentUsed: false
    };
  }

  // Verifier si estimations recentes existent deja
  const existingEstimations = product.scores?.aiEstimations;
  if (existingEstimations && isEstimationRecent(existingEstimations)) {
    console.log('[AI] Using cached estimations for', product.barcode);
    return {
      ...scores,
      aiEstimations: existingEstimations,
      aiEnrichmentUsed: true,
      aiEnrichmentSource: 'CACHED'
    };
  }

  // Appeler IA pour nouvelles estimations
  console.log('[AI] Requesting new estimations for', product.barcode, 'category:', product.category);

  try {
    const estimations = await estimateMissingData(product, scores.missingData);

    // Merger estimations dans le produit
    const enrichedProduct = mergeEstimations(product, estimations);

    // Recalculer scores avec donnees enrichies
    const recalculatedScores = calculateScores(enrichedProduct);

    return {
      ...recalculatedScores,
      aiEstimations: {
        ...estimations,
        estimatedAt: new Date(),
        estimatedBy: 'deepseek-v3'
      },
      aiEnrichmentUsed: true,
      aiEnrichmentSource: 'FRESH'
    };
  } catch (error) {
    console.error('[AI] Enrichment failed:', error.message);
    return {
      ...scores,
      aiEnrichmentUsed: false,
      aiEnrichmentError: error.message
    };
  }
}

/**
 * Estime donnees manquantes via IA (multi-categories)
 * @param {Object} product - Produit
 * @param {Array} missingFields - Champs manquants
 * @returns {Promise<Object>} Estimations IA
 */
async function estimateMissingData(product, missingFields = []) {
  if (missingFields.length === 0) {
    return null;
  }

  const category = product.category || 'food';
  
  console.log(`[AI] Estimating ${missingFields.join(', ')} for category: ${category}`);

  try {
    // Utiliser analyzeProduct() qui route automatiquement par categorie
    const response = await deepSeekService.analyzeProduct(product, category);
        // ? FIX: S�curiser l'affichage de la r�ponse
    const displayResponse = () => {
      if (!response) return "Response is null/undefined";
      if (typeof response === "string") return response.substring(0, 200) + "...";
      try {
        const jsonStr = JSON.stringify(response);
        return jsonStr ? jsonStr.substring(0, 200) + "..." : "Cannot stringify response";
      } catch (e) {
        return "Response not serializable";
      }
    };
    console.log("[AI] Raw response:", displayResponse());

    // Parser selon categorie
    const parsed = parseAIResponseByCategory(response, category, missingFields);
    console.log("[AI] Parsed estimations:", parsed ? Object.keys(parsed) : "NULL");

    return parsed;
  } catch (error) {
    console.error('[AI] estimateMissingData failed:', error.message);
    throw error;
  }
}

/**
 * Analyse qualitative pour produits tres incomplets
 * @param {Object} product - Produit
 * @returns {Promise<Object>} Analyse qualitative
 */
async function qualitativeAnalysis(product) {
  const category = product.category || 'food';
  
  try {
    const response = await deepSeekService.analyzeProduct(product, category);

    return {
      qualitativeAnalysis: {
        summary: response,
        category: category,
        analyzedAt: new Date()
      }
    };
  } catch (error) {
    console.error('[AI] qualitativeAnalysis failed:', error.message);
    throw error;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifie si estimations sont recentes (< 30 jours)
 */
function isEstimationRecent(estimations) {
  if (!estimations.estimatedAt && !estimations.qualitativeAnalysis?.analyzedAt) {
    return false;
  }

  const estimatedAt = new Date(
    estimations.estimatedAt || estimations.qualitativeAnalysis.analyzedAt
  );
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return estimatedAt > thirtyDaysAgo;
}

/**
 * Merge estimations IA dans le produit
 */
function mergeEstimations(product, estimations) {
  if (!estimations) return product;

  const enriched = { ...product };
  const category = product.category || 'food';

  switch(category) {
    case 'food':
      return mergeFoodEstimations(enriched, estimations);
    case 'cosmetics':
      return mergeCosmeticsEstimations(enriched, estimations);
    case 'detergents':
      return mergeDetergentsEstimations(enriched, estimations);
    default:
      return enriched;
  }
}

function mergeFoodEstimations(product, estimations) {
  const enriched = { ...product };
  
  if (estimations.nova?.value) {
    enriched.novaGroup = estimations.nova.value;
  }
  
  if (estimations.nutriScore?.value) {
    enriched.nutriScore = estimations.nutriScore.value;
  }
  
  if (estimations.ecoScore?.value) {
    enriched.ecoScore = estimations.ecoScore.value;
  }

  // Nutriments
  if (!enriched.nutriments) enriched.nutriments = {};
  
  if (estimations.sugars?.estimated) {
    enriched.nutriments.sugars_100g = estimations.sugars.estimated;
  }
  
  if (estimations.saturatedFat?.estimated) {
    enriched.nutriments['saturated-fat_100g'] = estimations.saturatedFat.estimated;
  }
  
  if (estimations.salt?.estimated) {
    enriched.nutriments.salt_100g = estimations.salt.estimated;
  }

  return enriched;
}

function mergeCosmeticsEstimations(product, estimations) {
  const enriched = { ...product };
  
  if (!enriched.cosmeticsData) enriched.cosmeticsData = {};
  
  if (estimations.endocrineDisruptors?.detected) {
    enriched.cosmeticsData.endocrineDisruptors = estimations.endocrineDisruptors.detected;
  }
  
  if (estimations.allergens?.detected) {
    enriched.cosmeticsData.allergens = estimations.allergens.detected;
  }
  
  if (estimations.cmrSubstances?.detected) {
    enriched.cosmeticsData.cmrSubstances = estimations.cmrSubstances.detected;
  }
  
  if (estimations.certifications?.detected) {
    enriched.cosmeticsData.certifications = estimations.certifications.detected;
  }

  return enriched;
}

function mergeDetergentsEstimations(product, estimations) {
  const enriched = { ...product };
  
  if (!enriched.detergentsData) enriched.detergentsData = {};
  
  if (estimations.biodegradability?.score !== undefined) {
    enriched.detergentsData.biodegradable = estimations.biodegradability.score > 60;
  }
  
  if (estimations.aquaticToxicity?.clpCodes) {
    enriched.detergentsData.aquaticToxicity = estimations.aquaticToxicity.clpCodes;
  }
  
  if (estimations.phosphates?.detected !== undefined) {
    enriched.detergentsData.phosphates = estimations.phosphates.detected;
  }
  
  if (estimations.ecolabels?.detected) {
    enriched.detergentsData.ecolabels = estimations.ecolabels.detected;
  }

  return enriched;
}

/**
 * Parse reponse IA selon categorie
 */
function parseAIResponseByCategory(response, category, missingFields) {
  try {
    // Extraire JSON de la reponse
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[AI] No JSON found in response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    switch(category) {
      case 'food':
        return parseFoodResponse(parsed, missingFields);
      case 'cosmetics':
        return parseCosmeticsResponse(parsed, missingFields);
      case 'detergents':
        return parseDetergentsResponse(parsed, missingFields);
      default:
        return parsed;
    }
  } catch (error) {
    console.error('[AI] Parse error:', error.message);
    return null;
  }
}

function parseFoodResponse(parsed, missingFields) {
  const result = {};

  if (missingFields.includes('nova') && parsed.nova) {
    result.nova = {
      value: parsed.nova.value || parsed.nova,
      confidence: parsed.nova.confidence || 0.7,
      reasoning: parsed.nova.reasoning || ''
    };
  }

  if (missingFields.includes('nutriScore') && parsed.nutriScore) {
    result.nutriScore = {
      value: parsed.nutriScore.value || parsed.nutriScore,
      confidence: parsed.nutriScore.confidence || 0.7,
      reasoning: parsed.nutriScore.reasoning || ''
    };
  }

  if (missingFields.includes('ecoScore') && parsed.ecoScore) {
    result.ecoScore = {
      value: parsed.ecoScore.value || parsed.ecoScore,
      confidence: parsed.ecoScore.confidence || 0.6,
      reasoning: parsed.ecoScore.reasoning || ''
    };
  }

  if (missingFields.includes('sugars') && parsed.sugars) {
    result.sugars = {
      estimated: parsed.sugars.estimated || parsed.sugars.value || 0,
      min: parsed.sugars.min || 0,
      max: parsed.sugars.max || 0,
      confidence: parsed.sugars.confidence || 0.6,
      reasoning: parsed.sugars.reasoning || ''
    };
  }

  if (missingFields.includes('saturatedFat') && parsed.saturatedFat) {
    result.saturatedFat = {
      estimated: parsed.saturatedFat.estimated || parsed.saturatedFat.value || 0,
      min: parsed.saturatedFat.min || 0,
      max: parsed.saturatedFat.max || 0,
      confidence: parsed.saturatedFat.confidence || 0.6,
      reasoning: parsed.saturatedFat.reasoning || ''
    };
  }

  if (missingFields.includes('salt') && parsed.salt) {
    result.salt = {
      estimated: parsed.salt.estimated || parsed.salt.value || 0,
      min: parsed.salt.min || 0,
      max: parsed.salt.max || 0,
      confidence: parsed.salt.confidence || 0.6,
      reasoning: parsed.salt.reasoning || ''
    };
  }

  return result;
}

function parseCosmeticsResponse(parsed, missingFields) {
  const result = {};

  if (parsed.endocrineDisruptors) {
    result.endocrineDisruptors = {
      detected: parsed.endocrineDisruptors.detected || [],
      count: parsed.endocrineDisruptors.count || 0,
      severity: parsed.endocrineDisruptors.severity || 'NONE',
      score: parsed.endocrineDisruptors.score || 100,
      confidence: parsed.endocrineDisruptors.confidence || 0.7,
      reasoning: parsed.endocrineDisruptors.reasoning || ''
    };
  }

  if (parsed.allergens) {
    result.allergens = {
      detected: parsed.allergens.detected || [],
      count: parsed.allergens.count || 0,
      euMandatory: parsed.allergens.euMandatory || false,
      score: parsed.allergens.score || 100,
      confidence: parsed.allergens.confidence || 0.8,
      reasoning: parsed.allergens.reasoning || ''
    };
  }

  if (parsed.cmrSubstances) {
    result.cmrSubstances = {
      detected: parsed.cmrSubstances.detected || [],
      count: parsed.cmrSubstances.count || 0,
      categoryECHA: parsed.cmrSubstances.categoryECHA || 'None',
      score: parsed.cmrSubstances.score || 100,
      confidence: parsed.cmrSubstances.confidence || 0.9,
      reasoning: parsed.cmrSubstances.reasoning || ''
    };
  }

  if (parsed.certifications) {
    result.certifications = {
      detected: parsed.certifications.detected || [],
      verified: parsed.certifications.verified || false,
      score: parsed.certifications.score || 50,
      confidence: parsed.certifications.confidence || 0.6,
      reasoning: parsed.certifications.reasoning || ''
    };
  }

  return result;
}

function parseDetergentsResponse(parsed, missingFields) {
  const result = {};

  if (parsed.biodegradability) {
    result.biodegradability = {
      score: parsed.biodegradability.score || 50,
      surfactantsType: parsed.biodegradability.surfactantsType || 'unknown',
      biodegradablePercent: parsed.biodegradability.biodegradablePercent || 0,
      standard: parsed.biodegradability.standard || 'Unknown',
      confidence: parsed.biodegradability.confidence || 0.6,
      reasoning: parsed.biodegradability.reasoning || ''
    };
  }

  if (parsed.aquaticToxicity) {
    result.aquaticToxicity = {
      clpCodes: parsed.aquaticToxicity.clpCodes || [],
      severity: parsed.aquaticToxicity.severity || 'NONE',
      score: parsed.aquaticToxicity.score || 100,
      confidence: parsed.aquaticToxicity.confidence || 0.7,
      reasoning: parsed.aquaticToxicity.reasoning || ''
    };
  }

  if (parsed.phosphates) {
    result.phosphates = {
      detected: parsed.phosphates.detected || false,
      estimatedContent: parsed.phosphates.estimatedContent || '0g',
      compliantEU: parsed.phosphates.compliantEU !== false,
      score: parsed.phosphates.score || 100,
      confidence: parsed.phosphates.confidence || 0.7,
      reasoning: parsed.phosphates.reasoning || ''
    };
  }

  if (parsed.ecolabels) {
    result.ecolabels = {
      detected: parsed.ecolabels.detected || [],
      verified: parsed.ecolabels.verified || false,
      score: parsed.ecolabels.score || 50,
      confidence: parsed.ecolabels.confidence || 0.6,
      reasoning: parsed.ecolabels.reasoning || ''
    };
  }

  return result;
}


/**
 * Parse un produit depuis texte OCR avec DeepSeek IA
 * @param {string} ocrText - Texte extrait par OCR
 * @param {string} barcode - Code-barre du produit
 * @returns {Promise<Object>} Produit parsé
 */
async function parseProductFromOCR(ocrText, barcode) {
  try {
    console.log('[AI Enrichment] Parsing OCR text with DeepSeek...');
    
    const prompt = `Tu es un expert en analyse d'étiquettes de produits (alimentaires, cosmétiques, détergents).

TÂCHE : Extraire les informations structurées depuis le texte OCR d'une étiquette produit.

TEXTE OCR (peut contenir erreurs) :
"""
${ocrText}
"""

CODE-BARRE : ${barcode}

INSTRUCTIONS :
1. Identifier le NOM du produit (le plus mis en valeur)
2. Identifier la MARQUE
3. Déterminer la CATÉGORIE : "food" | "cosmetics" | "detergents"
4. Extraire la LISTE D'INGRÉDIENTS complète
5. Extraire les VALEURS NUTRITIONNELLES (si food) pour 100g/100ml
6. Identifier les ADDITIFS alimentaires (codes E suivi de chiffres)
7. Identifier les LABELS (Bio, Vegan, Ecocert, etc.)
8. Évaluer la CONFIANCE de l'extraction (0-1)

FORMAT RÉPONSE (JSON strict) :
{
  "name": "Nom du produit",
  "brand": "Marque",
  "category": "food|cosmetics|detergents",
  "ingredients_text": "Liste complète des ingrédients",
  "nutriments": {
    "energy": 500,
    "proteins": 10,
    "carbohydrates": 60,
    "sugars": 25,
    "fat": 15,
    "saturated_fat": 5,
    "salt": 0.5,
    "fiber": 3
  },
  "additives": ["E150d", "E322"],
  "labels": ["Bio", "Vegan"],
  "novaGroup": 4,
  "nutriScore": "d",
  "inci": ["Aqua", "Glycerin"],
  "confidence": 0.85
}

RÈGLES IMPORTANTES :
- Si catégorie = "cosmetics", remplir "inci" au lieu de "ingredients_text"
- Si catégorie = "detergents", indiquer ingrédients chimiques
- Si données manquantes, mettre null
- Confiance élevée si texte clair, faible si OCR dégradé

RÉPONDS UNIQUEMENT AVEC LE JSON, PAS DE TEXTE AVANT/APRÈS.`;

    // Appeler DeepSeek
    const response = await deepSeekService.chat([
      { role: 'user', content: prompt }
    ], {
      temperature: 0.1, // Précision maximale
      max_tokens: 2000
    });
    
    // Parser réponse JSON
    let parsed;
    try {
      // Nettoyer la réponse (enlever markdown si présent)
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('[AI Enrichment] JSON parse error:', parseError);
      throw new Error('IA response not valid JSON');
    }
    
    // Valider données minimales
    if (!parsed.name) {
      throw new Error('Product name not found in OCR');
    }
    
    console.log('[AI Enrichment] ? Product parsed:', parsed.name);
    
    return {
      barcode: barcode,
      name: parsed.name,
      brand: parsed.brand || 'Marque inconnue',
      category: parsed.category || 'food',
      
      // Food data
      ingredients_text: parsed.ingredients_text,
      nutriments: parsed.nutriments || {},
      additives: parsed.additives || [],
      labels: parsed.labels || [],
      novaGroup: parsed.novaGroup,
      nutriScore: parsed.nutriScore,
      
      // Cosmetics data
      inci: parsed.inci || [],
      
      // Detergents data
      ingredients: parsed.ingredients || [],
      
      // Confidence
      confidence: parsed.confidence || 0.5
    };
    
  } catch (error) {
    console.error('[AI Enrichment] ? Error parsing OCR:', error);
    throw error;
  }
}

module.exports = {
  enrichProductWithAI,
  estimateMissingData,
  qualitativeAnalysis,
  parseProductFromOCR
};

