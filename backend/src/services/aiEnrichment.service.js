const deepSeekService = require('./ai/deepSeekService');
const logger = require('../utils/logger');

/**
 * ✅ ECOLOJIA V3 - AI Enrichment Service
 * Enrichit les produits avec données manquantes via DeepSeek AI
 */

// Listes des additifs par risque
const ADDITIVES_LISTS = {
  SAFE: ['E300', 'E330', 'E440', 'E500', 'E322'],
  MODERATE: ['E250', 'E251', 'E338'],
  DANGEROUS: ['E102', 'E110', 'E123', 'E129', 'E951']
};

/**
 * Enrichir produit alimentaire avec IA
 */
async function enrichFoodProduct(product, missingFields = []) {
  try {
    console.log(`[AI] Requesting new estimations for ${product.barcode} category: food`);
    
    const response = await deepSeekService.analyzeProduct(product, 'food');
    
    // ✅ FIX: Sécuriser l'affichage de la réponse
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

    const parsed = parseAIResponseByCategory(response, 'food', missingFields);
    
    return {
      success: true,
      estimations: parsed,
      aiEnriched: true
    };
  } catch (error) {
    console.error('[AI] enrichFoodProduct failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Estimer valeurs nutritionnelles manquantes
 */
async function estimateMissingData(product, category = 'food', missingFields = []) {
  try {
    console.log(`[AI] Estimating ${missingFields.join(', ')} for category: ${category}`);
    
    const response = await deepSeekService.analyzeProduct(product, category);
    
    const parsed = parseAIResponseByCategory(response, category, missingFields);
    
    if (!parsed) {
      console.log('[AI] Parsed estimations: NULL');
      return null;
    }
    
    console.log('[AI] Parsed estimations:', JSON.stringify(parsed).substring(0, 200));
    
    return {
      estimations: parsed,
      estimatedAt: new Date(),
      estimatedBy: 'deepseek-v3',
      confidence: 0.75
    };
  } catch (error) {
    console.error('[AI] estimateMissingData failed:', error.message);
    return null;
  }
}

/**
 * Enrichir avec résumé textuel IA
 */
async function enrichWithAISummary(product, category = 'food') {
  try {
    const response = await deepSeekService.analyzeProduct(product, category);
    
    return {
      success: true,
      data: {
        summary: response,
        generatedAt: new Date()
      }
    };
  } catch (error) {
    console.error('[AI] enrichWithAISummary failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Enrichir produit cosmétique
 */
async function enrichCosmeticsProduct(product, missingFields = []) {
  try {
    const response = await deepSeekService.analyzeProduct(product, 'cosmetics');
    const parsed = parseAIResponseByCategory(response, 'cosmetics', missingFields);
    
    let enriched = {
      cosmeticsData: {
        ingredients: product.cosmeticsData?.ingredients || [],
        allergens: product.cosmeticsData?.allergens || [],
        endocrineDisruptors: product.cosmeticsData?.endocrineDisruptors || [],
        certifications: product.cosmeticsData?.certifications || []
      }
    };
    
    if (parsed) {
      if (parsed.ingredients?.length) {
        enriched.cosmeticsData.ingredients = parsed.ingredients;
      }
      if (parsed.allergens?.length) {
        enriched.cosmeticsData.allergens = parsed.allergens;
      }
      if (parsed.endocrineDisruptors?.length) {
        enriched.cosmeticsData.endocrineDisruptors = parsed.endocrineDisruptors;
      }
    }
    
    return {
      success: true,
      enriched,
      aiEnriched: true
    };
  } catch (error) {
    console.error('[AI] enrichCosmeticsProduct failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Enrichir produit détergent
 */
async function enrichDetergentsProduct(product, missingFields = []) {
  try {
    const response = await deepSeekService.analyzeProduct(product, 'detergents');
    const parsed = parseAIResponseByCategory(response, 'detergents', missingFields);
    
    let enriched = {
      detergentsData: {
        composition: product.detergentsData?.composition || [],
        surfactants: product.detergentsData?.surfactants || [],
        ecolabels: product.detergentsData?.ecolabels || []
      }
    };
    
    if (parsed) {
      if (parsed.composition?.length) {
        enriched.detergentsData.composition = parsed.composition;
      }
      if (parsed.surfactants?.detected) {
        enriched.detergentsData.surfactants = parsed.surfactants.detected;
      }
      if (parsed.ecolabels?.detected) {
        enriched.detergentsData.ecolabels = parsed.ecolabels.detected;
      }
    }
    
    return {
      success: true,
      enriched,
      aiEnriched: true
    };
  } catch (error) {
    console.error('[AI] enrichDetergentsProduct failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Enrichir produit avec IA selon catégorie
 */
async function enrichProductWithAI(product, category = 'food', options = {}) {
  const { force = false } = options;
  try {
    if (!product || !product.barcode) {
      throw new Error('Produit invalide ou barcode manquant');
    }
    
    const missingFields = identifyMissingFields(product, category);
    
    if (missingFields.length === 0 && !force) {
      return {
        success: true,
        message: 'Produit déjà complet - Utilisez force:true pour enrichir quand même',
        aiEnriched: false
      };
    }
    
    // Si force=true, on enrichit même sans champs manquants
    if (force && missingFields.length === 0) {
      console.log('[AI] Enrichissement forcé demandé - recalcul avec IA pour améliorer précision');
    }
    
    let result;
    switch(category) {
      case 'food':
        result = await enrichFoodProduct(product, missingFields);
        break;
      case 'cosmetics':
        result = await enrichCosmeticsProduct(product, missingFields);
        break;
      case 'detergents':
        result = await enrichDetergentsProduct(product, missingFields);
        break;
      default:
        throw new Error(`Catégorie non supportée: ${category}`);
    }
    
    return result;
  } catch (error) {
    console.error('[AI] Enrichment failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Identifier champs manquants
 */
function identifyMissingFields(product, category) {
  const missing = [];
  
  if (category === 'food') {
    const nutriments = product.foodData?.nutritionalInfo || product.nutriments || {};
    
    if (!nutriments.sugars && nutriments.sugars !== 0) missing.push('sugars');
    if (!nutriments.saturatedFat && nutriments.saturatedFat !== 0) missing.push('saturatedFat');
    if (!nutriments.salt && nutriments.salt !== 0) missing.push('salt');
    if (!nutriments.fiber && nutriments.fiber !== 0) missing.push('fiber');
  }
  
  return missing;
}

/**
 * ✅ CORRECTION COMPLÈTE: Parser réponse IA selon catégorie
 */
function parseAIResponseByCategory(response, category, missingFields) {
  try {
    // ✅ FIX: Gérer response objet OU string
    let parsed;
    
    if (typeof response === 'object' && response !== null) {
      // DeepSeek retourne déjà un objet parsé
      parsed = response;
      console.log('[AI] Response is already an object');
    } else if (typeof response === 'string') {
      // Extraire JSON de la string
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[AI] No JSON found in response string');
        return null;
      }
      parsed = JSON.parse(jsonMatch[0]);
      console.log('[AI] Parsed JSON from string');
    } else {
      console.error('[AI] Invalid response type:', typeof response);
      return null;
    }
    
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

/**
 * Parser réponse alimentaire
 */
function parseFoodResponse(parsed, missingFields) {
  const result = {};
  
  if (parsed.nutriments || parsed.nutritionalInfo) {
    const nutriments = parsed.nutriments || parsed.nutritionalInfo;
    
    if (missingFields.includes('sugars') && nutriments.sugars !== undefined && nutriments.sugars !== null) {
      result.sugars = parseFloat(nutriments.sugars);
    }
    if (missingFields.includes('saturatedFat') && nutriments.saturatedFat !== undefined && nutriments.saturatedFat !== null) {
      result.saturatedFat = parseFloat(nutriments.saturatedFat);
    }
    if (missingFields.includes('salt') && nutriments.salt !== undefined && nutriments.salt !== null) {
      result.salt = parseFloat(nutriments.salt);
    }
    if (missingFields.includes('fiber') && nutriments.fiber !== undefined && nutriments.fiber !== null) {
      result.fiber = parseFloat(nutriments.fiber);
    }
  }
  
  if (parsed.additives) {
    result.additives = parsed.additives;
  }
  
  if (parsed.novaGroup) {
    result.novaGroup = parseInt(parsed.novaGroup);
  }
  
  return result;
}

/**
 * Parser réponse cosmétique
 */
function parseCosmeticsResponse(parsed, missingFields) {
  const result = {};
  
  if (parsed.ingredients) {
    result.ingredients = parsed.ingredients;
  }
  
  if (parsed.allergens) {
    result.allergens = parsed.allergens;
  }
  
  if (parsed.endocrineDisruptors) {
    result.endocrineDisruptors = parsed.endocrineDisruptors;
  }
  
  return result;
}

/**
 * Parser réponse détergent
 */
function parseDetergentsResponse(parsed, missingFields) {
  const result = {};
  
  if (parsed.composition) {
    result.composition = parsed.composition;
  }
  
  if (parsed.surfactants) {
    result.surfactants = parsed.surfactants;
  }
  
  if (parsed.ecolabels) {
    result.ecolabels = parsed.ecolabels;
  }
  
  return result;
}

/**
 * Générer alternatives via IA
 */
async function generateAlternatives(product, category = 'food', count = 3) {
  try {
    const messages = [
      {
        role: 'system',
        content: `Tu es un expert en nutrition. Suggère ${count} alternatives plus saines au produit donné. Réponds en JSON avec: { "alternatives": [{ "name": "...", "reason": "..." }] }`
      },
      {
        role: 'user',
        content: `Produit: ${product.name || product.product_name}\nMarque: ${product.brand || product.brands}\nCatégorie: ${category}`
      }
    ];
    
    const response = await deepSeekService.chat(messages);
    
    try {
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanResponse);
      return parsed.alternatives || [];
    } catch (parseError) {
      throw new Error('IA response not valid JSON');
    }
  } catch (error) {
    console.error('[AI] generateAlternatives failed:', error.message);
    return [];
  }
}

module.exports = {
  enrichProductWithAI,
  enrichFoodProduct,
  enrichCosmeticsProduct,
  enrichDetergentsProduct,
  estimateMissingData,
  enrichWithAISummary,
  generateAlternatives,
  identifyMissingFields
};
