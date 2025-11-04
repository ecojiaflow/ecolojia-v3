const deepSeekService = require('./ai/deepSeekService');
const nutrientCalculator = require('./nutrientCalculator');
const logger = require('../utils/logger');
const Product = require('../models/Product');

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
    console.log('[DEBUG] Parsed food:', JSON.stringify(parsed, null, 2));

    // ============================================================================
    // ✅ CALCULS AUTOMATIQUES (si DeepSeek n'a pas renvoyé)
    // ============================================================================

    // NOVA Group (si manquant)
    if (!parsed.novaGroup && product.ingredients_text) {
      parsed.novaGroup = nutrientCalculator.calculateNovaGroup(
        product.ingredients_text,
        product.product_name || ''
      );
      console.log('[AI] ✅ NOVA calculé automatiquement:', parsed.novaGroup);
    }

    // Nutri-Score (si manquant ET si nutriments disponibles)
    if (!parsed.nutriScore && (parsed.sugars || product.nutriments)) {
      const nutriments = {
        energy: parsed.energy || product.nutriments?.energy,
        sugars: parsed.sugars || product.nutriments?.sugars,
        saturatedFat: parsed.saturatedFat || product.nutriments?.['saturated-fat'],
        salt: parsed.salt || product.nutriments?.salt,
        fiber: parsed.fiber || product.nutriments?.fiber,
        proteins: parsed.protein || product.nutriments?.proteins
      };
      parsed.nutriScore = nutrientCalculator.calculateNutriScore(nutriments);
      console.log('[AI] ✅ Nutri-Score calculé automatiquement:', parsed.nutriScore);
    }

    // Additifs (si manquant)
    if ((!parsed.additives || parsed.additives.length === 0) && product.ingredients_text) {
      parsed.additives = nutrientCalculator.extractAdditives(product.ingredients_text);
      console.log('[AI] ✅ Additifs calculés automatiquement:', parsed.additives);
    }

    // Eco-Score (si manquant)
    if (!parsed.ecoScore) {
      parsed.ecoScore = nutrientCalculator.estimateEcoScore({
        labels: product.labels || [],
        novaGroup: parsed.novaGroup
      });
      console.log('[AI] ✅ Eco-Score calculé automatiquement:', parsed.ecoScore);
    }


    // ✅ NOUVEAU : Sauvegarder en base
    if (parsed && Object.keys(parsed).length > 0) {
      const updateData = {};
      
      // Nutrition
      if (parsed.sugars !== undefined) updateData['foodData.nutritionalInfo.sugars'] = parsed.sugars;
      if (parsed.saturatedFat !== undefined) updateData['foodData.nutritionalInfo.saturatedFat'] = parsed.saturatedFat;
      if (parsed.salt !== undefined) updateData['foodData.nutritionalInfo.salt'] = parsed.salt;
      if (parsed.fiber !== undefined) updateData['foodData.nutritionalInfo.fiber'] = parsed.fiber;
      if (parsed.protein !== undefined) updateData['foodData.nutritionalInfo.protein'] = parsed.protein;
      if (parsed.carbs !== undefined) updateData['foodData.nutritionalInfo.carbs'] = parsed.carbs;
      
      // Nova & Scores
      if (parsed.novaGroup !== undefined) updateData['foodData.novaGroup'] = parsed.novaGroup;
      if (parsed.nutriScore !== undefined) updateData['foodData.nutriScore'] = parsed.nutriScore;

      // ✅ Additifs, EcoScore, Product Info
      if (parsed.additives) updateData['foodData.additives'] = parsed.additives;
      if (parsed.ecoScore !== undefined) updateData['foodData.ecoScore'] = parsed.ecoScore;
      if (parsed.product_name !== undefined) updateData['product_name'] = parsed.product_name;
      if (parsed.brands !== undefined) updateData['brands'] = parsed.brands;
      
      // Metadata
      updateData['metadata.lastEnriched'] = new Date();
      updateData['metadata.aiEnrichmentVersion'] = '3.3';
      
      await Product.updateOne({ _id: product._id }, { $set: updateData });
      console.log('[AI] ✅ Alimentaire sauvegardé en base');
    }

    
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
    console.log('[DEBUG enrichCosmeticsProduct] Barcode:', product.barcode);
    const response = await deepSeekService.analyzeProduct(product, 'cosmetics');
    const parsed = parseAIResponseByCategory(response, 'cosmetics', missingFields);
    console.log('[DEBUG] Parsed:', JSON.stringify(parsed, null, 2));

    if (parsed && (parsed.ingredients?.length || parsed.allergens?.length)) {
      const updateData = {};
      if (parsed.ingredients?.length) updateData['cosmeticsData.ingredients'] = parsed.ingredients;
      if (parsed.allergens?.length) updateData['cosmeticsData.allergens'] = parsed.allergens;
      if (parsed.endocrineDisruptors?.length) updateData['cosmeticsData.endocrineDisruptors'] = parsed.endocrineDisruptors;
      updateData['metadata.lastEnriched'] = new Date();
      updateData['metadata.aiEnrichmentVersion'] = '3.3';
      
      await Product.updateOne({ _id: product._id }, { $set: updateData });
      console.log('[AI] ✅ Cosmétique sauvegardé en base');
      return { success: true, enriched: parsed };
    }
    return { success: true, enriched: {} };
  } catch (error) {
    console.error('[AI] ❌ Erreur:', error.message);
    return { success: false, error: error.message };
  }
}
async function enrichDetergentsProduct(product, missingFields = []) {
  try {
    console.log('[DEBUG enrichDetergentsProduct] Barcode:', product.barcode);
    const response = await deepSeekService.analyzeProduct(product, 'detergents');
    const parsed = parseAIResponseByCategory(response, 'detergents', missingFields);
    console.log('[DEBUG] Parsed detergent:', JSON.stringify(parsed, null, 2));

    // ✅ NOUVEAU : Sauvegarder en base
    if (parsed && Object.keys(parsed).length > 0) {
      const updateData = {};
      
      // Composition
      if (parsed.composition?.length) updateData['detergentsData.composition'] = parsed.composition;
      if (parsed.surfactants?.length) updateData['detergentsData.surfactants'] = parsed.surfactants;
      if (parsed.ecolabels?.length) updateData['detergentsData.ecolabels'] = parsed.ecolabels;
      if (parsed.biodegradability !== undefined) updateData['detergentsData.biodegradability'] = parsed.biodegradability;
      if (parsed.ecotoxicity !== undefined) updateData['detergentsData.ecotoxicity'] = parsed.ecotoxicity;
      
      // Metadata
      updateData['metadata.lastEnriched'] = new Date();
      updateData['metadata.aiEnrichmentVersion'] = '3.3';
      
      await Product.updateOne({ _id: product._id }, { $set: updateData });
      console.log('[AI] ✅ Détergent sauvegardé en base');
    }

    console.log('[DEBUG] Parsed:', JSON.stringify(parsed, null, 2));

    if (parsed && (parsed.composition?.length || parsed.surfactants?.length)) {
      const updateData = {};
      if (parsed.composition?.length) updateData['detergentsData.composition'] = parsed.composition;
      if (parsed.surfactants?.length) updateData['detergentsData.surfactants'] = parsed.surfactants;
      if (parsed.ecolabels?.length) updateData['detergentsData.ecolabels'] = parsed.ecolabels;
      updateData['metadata.lastEnriched'] = new Date();
      updateData['metadata.aiEnrichmentVersion'] = '3.3';
      
      await Product.updateOne({ _id: product._id }, { $set: updateData });
      console.log('[AI] ✅ Détergent sauvegardé en base');
      return { success: true, enriched: parsed };
    }
    return { success: true, enriched: {} };
  } catch (error) {
    console.error('[AI] ❌ Erreur:', error.message);
    return { success: false, error: error.message };
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
    
    // ✅ NOUVEAU : Recharger le produit et recalculer le score
    if (result.success) {
      console.log('[AI] ✅ Données enrichies sauvegardées, recalcul du score...');
      
      // Recharger le produit avec les données fraîches
      const freshProduct = await Product.findOne({ barcode: product.barcode });
      
      if (freshProduct) {
        // Recalculer le score avec le scoring engine
        const scoringUnified = require('./scoringUnified');
        
        // Préparer données pour scoring
        const scoringData = {
          category: freshProduct.category || category,
          ...freshProduct.toObject()
        };
        
        console.log('[AI] 🔍 scoringData:', JSON.stringify({
          category: scoringData.category,
          hasIngredients: !!scoringData.cosmeticsData?.ingredients,
          ingredientsCount: scoringData.cosmeticsData?.ingredients?.length
        }, null, 2));
        
        const newScores = scoringUnified.calculateScores(scoringData);
        
        console.log('[AI] 🔍 newScores:', JSON.stringify(newScores, null, 2));
        
        // Sauvegarder le nouveau score
        await Product.updateOne(
          { _id: freshProduct._id },
          {
            $set: {
              scores: newScores,
              'metadata.lastScored': new Date()
            }
          }
        );
        
        console.log('[AI] ✅ Score recalculé:', newScores?.overallScore || 'N/A');
        
        result.newScore = newScores?.overallScore;
      }
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

  // ✅ NOUVEAU : Extraire TOUS les nutriments renvoyés par l'IA
  if (parsed.nutriments || parsed.nutritionalInfo) {
    const nutriments = parsed.nutriments || parsed.nutritionalInfo;

    // Extraire tous les nutriments disponibles (pas uniquement ceux manquants)
    if (nutriments.sugars !== undefined && nutriments.sugars !== null) {
      result.sugars = parseFloat(nutriments.sugars);
    }
    if (nutriments.saturatedFat !== undefined && nutriments.saturatedFat !== null) {
      result.saturatedFat = parseFloat(nutriments.saturatedFat);
    }
    if (nutriments.salt !== undefined && nutriments.salt !== null) {
      result.salt = parseFloat(nutriments.salt);
    }
    if (nutriments.fiber !== undefined && nutriments.fiber !== null) {
      result.fiber = parseFloat(nutriments.fiber);
    }
    if (nutriments.energy !== undefined && nutriments.energy !== null) {
      result.energy = parseFloat(nutriments.energy);
    }
    if (nutriments.proteins !== undefined && nutriments.proteins !== null) {
      result.proteins = parseFloat(nutriments.proteins);
    }
    if (nutriments.carbohydrates !== undefined && nutriments.carbohydrates !== null) {
      result.carbohydrates = parseFloat(nutriments.carbohydrates);
    }
    if (nutriments.fat !== undefined && nutriments.fat !== null) {
      result.fat = parseFloat(nutriments.fat);
    }
  }

  // Additifs
  if (parsed.additives) {
    result.additives = parsed.additives;
  }

  // NOVA
  if (parsed.novaGroup) {
    result.novaGroup = parseInt(parsed.novaGroup);
  }


  // ✅ Extraire product_name et brands si présents
  if (parsed.product_info) {
    if (parsed.product_info.product_name) {
      result.product_name = parsed.product_info.product_name;
    }
    if (parsed.product_info.brands) {
      result.brands = parsed.product_info.brands;
    }
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

  // ✅ NOUVEAU : Normaliser composition en array de strings
  if (parsed.composition && Array.isArray(parsed.composition)) {
    // Si l'IA renvoie des objets détaillés
    if (typeof parsed.composition[0] === 'object' && parsed.composition[0]?.ingredient) {
      result.composition = parsed.composition.map(item => item.ingredient);
      result._compositionDetails = parsed.composition; // Garder détails pour metadata
    } else {
      // Déjà des strings simples
      result.composition = parsed.composition.map(c => String(c));
    }
  }

  // ✅ NOUVEAU : Normaliser surfactants
  if (parsed.surfactants && Array.isArray(parsed.surfactants)) {
    result.surfactants = parsed.surfactants.map(s => String(s));
  }

  // ✅ Ecolabels
  if (parsed.ecolabels && Array.isArray(parsed.ecolabels)) {
    result.ecolabels = parsed.ecolabels.map(e => String(e));
  }

  // ✅ Biodegradabilité (si présent)
  if (parsed.biodegradability !== undefined) {
    result.biodegradability = parsed.biodegradability;
  }

  // ✅ Écotoxicité (si présent)
  if (parsed.ecotoxicity !== undefined) {
    result.ecotoxicity = parsed.ecotoxicity;
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
