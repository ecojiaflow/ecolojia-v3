// backend/src/services/aiEnrichment.service.js
/**
 * Service d'enrichissement IA pour produits avec donn�es manquantes
 * Utilise DeepSeek pour estimer valeurs nutritionnelles
 */

const deepSeekService = require('./ai/deepSeekService');

/**
 * Estime les donn�es manquantes d'un produit via IA
 * @param {Object} product - Produit avec donn�es potentiellement incompl�tes
 * @param {Object} scores - Scores calcul�s avec donn�es manquantes d�tect�es
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

  // V�rifier si estimations r�centes existent d�j�
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
 * Estime donn�es manquantes via DeepSeek
 * @param {Object} product - Produit
 * @param {Array} missingFields - Liste champs manquants
 * @returns {Promise<Object>} Estimations structur�es
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
 * Analyse qualitative pour produits tr�s incomplets
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
  const ingredients = product.ingredients_text || product.foodData?.ingredients || 'Non sp�cifi�';
  
  return `
Analyse ce produit alimentaire et estime les valeurs nutritionnelles manquantes.

PRODUIT :
- Nom : ${name}
- Marque : ${brand}
- Cat�gorie : ${product.category || 'food'}
- Ingr�dients : ${ingredients}

DONNEES MANQUANTES A ESTIMER : ${missingFields.join(', ')}

POUR CHAQUE COMPOSANTE :
- nova : Groupe 1-4 selon transformation (1=brut, 4=ultra-transforme)
- nutriScore : Grade A-E selon algorithme ANSES
- sugars : g/100g
- saturatedFat : g/100g
- salt : g/100g

T�CHE :
Pour chaque donn�e manquante, fournis :
1. Valeur estim�e (g/100g)
2. Fourchette min-max
3. Niveau de confiance (0-1)
4. Raisonnement (bas� sur ingr�dients)

IMPORTANT :
- Base-toi sur l'ORDRE des ingr�dients (les premiers = plus abondants)
- Compare avec des produits similaires
- Sois conservateur dans tes estimations

R�PONDS AU FORMAT JSON STRICT :
{
  "nova": { "value": 1-4, "confidence": 0.X, "reasoning": "..." },
  "nutriScore": { "value": "A-E", "confidence": 0.X, "reasoning": "..." },
  "sugars": { "min": X, "max": Y, "confidence": 0.X, "reasoning": "..." },
  "saturatedFat": { "min": X, "max": Y, "confidence": 0.X, "reasoning": "..." },
  "salt": { "min": X, "max": Y, "confidence": 0.X, "reasoning": "..." }
}
`;
}

function buildQualitativePrompt(product) {
  const name = product.name || product.product_name || 'Produit inconnu';
  const ingredients = product.ingredients_text || product.foodData?.ingredients || 'Non sp�cifi�';
  const additives = product.additives_tags || product.foodData?.additives || [];
  
  return `
Analyse qualitative de ce produit alimentaire (donn�es nutritionnelles manquantes).

PRODUIT : ${name}
INGR�DIENTS : ${ingredients}
ADDITIFS : ${additives.join(', ')}

T�CHE :
1. Identifier le niveau de transformation (NOVA 1-4)
2. D�tecter ingr�dients pr�occupants
3. Donner une recommandation globale

Sois factuel, bienveillant, et rappelle que tu n'es pas m�decin.
Limite � 200 mots.
`;
}

function getSystemPrompt() {
  return `Tu es un expert nutritionniste IA pour ECOLOJIA.

R�GLES STRICTES :
1. Tu n'es PAS m�decin - toujours le rappeler
2. Estimations bas�es sur science (CIQUAL, USDA, �tudes)
3. Sois conservateur dans tes estimations
4. Explique ton raisonnement
5. Indique toujours niveau de confiance

SOURCES :
- Base CIQUAL (ANSES)
- USDA FoodData Central
- Comparaison produits similaires
- Ordre ingr�dients (r�glementation UE)`;
}

function parseAIResponse(response) {
  try {
    // Extraire JSON de la r�ponse
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
