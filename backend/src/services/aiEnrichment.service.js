// backend/src/services/aiEnrichment.service.js
/**
 * Service d'enrichissement IA pour produits avec données manquantes
 * Utilise DeepSeek pour estimer valeurs nutritionnelles
 */

const deepSeekService = require('./ai/deepSeekService');

/**
 * Estime les données manquantes d'un produit via IA
 * @param {Object} product - Produit avec données potentiellement incomplètes
 * @param {Object} scores - Scores calculés avec données manquantes détectées
 * @returns {Promise<Object>} Scores enrichis avec estimations IA
 */
async function enrichProductWithAI(product, scores) {
  // Si confiance >= 70%, pas besoin d'enrichissement
  if (scores.confidence >= 0.7) {
    return {
      ...scores,
      aiEnrichmentUsed: false
    };
  }

  // Vérifier si estimations récentes existent déjà
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
  console.log('[AI] Requesting new estimations for', product.barcode);
  
  try {
    const estimations = await estimateMissingData(product, scores.missingData);
    
    return {
      ...scores,
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
 * Estime données manquantes via DeepSeek
 * @param {Object} product - Produit
 * @param {Array} missingFields - Liste champs manquants
 * @returns {Promise<Object>} Estimations structurées
 */
async function estimateMissingData(product, missingFields = []) {
  if (missingFields.length === 0) {
    return null;
  }

  const prompt = buildEstimationPrompt(product, missingFields);
  
  const response = await deepSeekService.analyze(prompt, getSystemPrompt());
  console.log("[AI] Raw response:", response.substring(0, 200) + "...");
  
  const parsed = parseAIResponse(response);
  console.log("[AI] Parsed estimations:", parsed ? Object.keys(parsed) : "NULL");
  
  return parsed;
}

/**
 * Analyse qualitative pour produits très incomplets
 * @param {Object} product - Produit
 * @returns {Promise<Object>} Analyse qualitative
 */
async function qualitativeAnalysis(product) {
  const prompt = buildQualitativePrompt(product);
  
  const response = await deepSeekService.analyze(prompt, getSystemPrompt());

  return {
    qualitativeAnalysis: {
      summary: response,
      analyzedAt: new Date()
    }
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function isEstimationRecent(estimations) {
  if (!estimations.sugars?.estimatedAt && !estimations.qualitativeAnalysis?.analyzedAt) {
    return false;
  }
  
  const estimatedAt = new Date(
    estimations.sugars?.estimatedAt || estimations.qualitativeAnalysis.analyzedAt
  );
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return estimatedAt > thirtyDaysAgo;
}

function buildEstimationPrompt(product, missingFields) {
  const name = product.name || product.product_name || 'Produit inconnu';
  const brand = product.brand || product.brands || 'Marque inconnue';
  const ingredients = product.ingredients_text || product.foodData?.ingredients || 'Non spécifié';
  
  return `
Analyse ce produit alimentaire et estime les valeurs nutritionnelles manquantes.

PRODUIT :
- Nom : ${name}
- Marque : ${brand}
- Catégorie : ${product.category || 'food'}
- Ingrédients : ${ingredients}

DONNÉES MANQUANTES À ESTIMER : ${missingFields.join(', ')}

TÂCHE :
Pour chaque donnée manquante, fournis :
1. Valeur estimée (g/100g)
2. Fourchette min-max
3. Niveau de confiance (0-1)
4. Raisonnement (basé sur ingrédients)

IMPORTANT :
- Base-toi sur l'ORDRE des ingrédients (les premiers = plus abondants)
- Compare avec des produits similaires
- Sois conservateur dans tes estimations

RÉPONDS AU FORMAT JSON STRICT :
{
  "sugars": { "min": X, "max": Y, "confidence": 0.X, "reasoning": "..." },
  "saturatedFat": { "min": X, "max": Y, "confidence": 0.X, "reasoning": "..." },
  "salt": { "min": X, "max": Y, "confidence": 0.X, "reasoning": "..." }
}
`;
}

function buildQualitativePrompt(product) {
  const name = product.name || product.product_name || 'Produit inconnu';
  const ingredients = product.ingredients_text || product.foodData?.ingredients || 'Non spécifié';
  const additives = product.additives_tags || product.foodData?.additives || [];
  
  return `
Analyse qualitative de ce produit alimentaire (données nutritionnelles manquantes).

PRODUIT : ${name}
INGRÉDIENTS : ${ingredients}
ADDITIFS : ${additives.join(', ')}

TÂCHE :
1. Identifier le niveau de transformation (NOVA 1-4)
2. Détecter ingrédients préoccupants
3. Donner une recommandation globale

Sois factuel, bienveillant, et rappelle que tu n'es pas médecin.
Limite à 200 mots.
`;
}

function getSystemPrompt() {
  return `Tu es un expert nutritionniste IA pour ECOLOJIA.

RÈGLES STRICTES :
1. Tu n'es PAS médecin - toujours le rappeler
2. Estimations basées sur science (CIQUAL, USDA, études)
3. Sois conservateur dans tes estimations
4. Explique ton raisonnement
5. Indique toujours niveau de confiance

SOURCES :
- Base CIQUAL (ANSES)
- USDA FoodData Central
- Comparaison produits similaires
- Ordre ingrédients (réglementation UE)`;
}

function parseAIResponse(response) {
  try {
    // Extraire JSON de la réponse
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const estimations = JSON.parse(jsonMatch[0]);
    
    // Transformer en format attendu
    const result = {};
    
    for (const [key, value] of Object.entries(estimations)) {
      if (value && typeof value === 'object' && value.min !== undefined) {
        result[key] = {
          estimatedValue: (value.min + value.max) / 2,
          range: [value.min, value.max],
          confidence: value.confidence || 0.5,
          reasoning: value.reasoning || ''
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error('[AI] Failed to parse response:', error);
    return null;
  }
}

module.exports = {
  enrichProductWithAI,
  estimateMissingData,
  qualitativeAnalysis
};
