/**
 * ============================================
 * AI ORCHESTRATOR SERVICE - ECOLOJIA V3.1
 * ============================================
 * 
 * Service central qui :
 * 1. Détecte l'intention utilisateur (5 types)
 * 2. Génère des filtres de recherche intelligents
 * 3. Enrichit avec le contexte utilisateur
 * 
 * Architecture : Intention → Filtres → Search (Algolia/Mongo)
 * 
 * Coût IA estimé : 0,0004€ par requête (prompt ultra-optimisé)
 */

// Import axios pour appels DeepSeek directs
const axios = require('axios');

// Configuration DeepSeek
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const USE_DEEPSEEK = !!DEEPSEEK_API_KEY;

if (USE_DEEPSEEK) {
  console.log('[AIOrchestrator] ✅ DeepSeek API configurée');
} else {
  console.warn('[AIOrchestrator] ⚠️ DEEPSEEK_API_KEY manquante - Détection keywords uniquement');
}

// ============================================
// CONSTANTES - INTENTIONS SUPPORTÉES
// ============================================

const INTENTS = {
  PRODUCT_SEARCH: 'product_search',        // Ex: "Nutella", "shampoing sans sulfate"
  ALTERNATIVE_REQUEST: 'alternative_request', // Ex: "Alternative plus saine au Coca"
  RECIPE_SEARCH: 'recipe_search',          // Ex: "Recette petit-déj IG bas"
  LIST_OPTIMIZATION: 'list_optimization',   // Ex: "Optimiser ma liste de courses"
  BUDGET_HELP: 'budget_help'               // Ex: "Réduire mon budget alimentaire"
};

// ============================================
// CLASSE PRINCIPALE
// ============================================

class AIOrchestrator {
  
  /**
   * Détecte l'intention d'une requête utilisateur
   * @param {string} query - Requête utilisateur (ex: "Trouve-moi un shampoing sans sulfate")
   * @param {object} userContext - Contexte utilisateur (profil, préférences, historique)
   * @returns {Promise<object>} { intent, confidence, extractedEntities }
   */
  async detectIntent(query, userContext = {}) {
    try {
      console.log('[AIOrchestrator] Détection intention...', { query });

      // Cas simple : détection par mots-clés (économise 80% des appels IA)
      const simpleIntent = this._detectIntentByKeywords(query);
      if (simpleIntent.confidence > 0.8) {
        console.log('[AIOrchestrator] Intention détectée par keywords', simpleIntent);
        return simpleIntent;
      }

      // Cas complexe : appel DeepSeek pour détection fine
      if (USE_DEEPSEEK) {
        try {
          const prompt = this._buildIntentDetectionPrompt(query, userContext);
          const aiResponse = await this._callDeepSeek(prompt);
          const result = this._parseIntentResponse(aiResponse);
          console.log('[AIOrchestrator] Intention détectée par DeepSeek', result);
          return result;
        } catch (aiError) {
          console.warn('[AIOrchestrator] Erreur DeepSeek, fallback keywords:', aiError.message);
          return simpleIntent;
        }
      }

      // Pas de DeepSeek disponible : utiliser keywords
      console.log('[AIOrchestrator] DeepSeek non disponible, utilisation keywords');
      return simpleIntent;

    } catch (error) {
      console.error('[AIOrchestrator] Erreur détection intention:', error);
      
      // Fallback : intention par défaut
      return {
        intent: INTENTS.PRODUCT_SEARCH,
        confidence: 0.5,
        extractedEntities: { query }
      };
    }
  }

  /**
   * Génère des filtres de recherche selon l'intention
   * @param {string} intent - Intention détectée
   * @param {string} query - Requête originale
   * @param {object} userContext - Contexte utilisateur
   * @returns {object} Filtres Algolia/Mongo
   */
  generateSearchFilters(intent, query, userContext = {}) {
    console.log('[AIOrchestrator] Génération filtres...', { intent, query });

    const baseFilters = this._getBaseFilters(userContext);

    switch (intent) {
      case INTENTS.PRODUCT_SEARCH:
        return this._generateProductSearchFilters(query, userContext, baseFilters);
      
      case INTENTS.ALTERNATIVE_REQUEST:
        return this._generateAlternativeFilters(query, userContext, baseFilters);
      
      case INTENTS.RECIPE_SEARCH:
        return this._generateRecipeFilters(query, userContext, baseFilters);
      
      case INTENTS.LIST_OPTIMIZATION:
        return this._generateListOptimizationFilters(userContext, baseFilters);
      
      case INTENTS.BUDGET_HELP:
        return this._generateBudgetFilters(userContext, baseFilters);
      
      default:
        return this._generateProductSearchFilters(query, userContext, baseFilters);
    }
  }

  /**
   * Enrichit une requête avec le contexte utilisateur
   * @param {string} query - Requête brute
   * @param {object} userProfile - Profil utilisateur (allergies, régime, budget...)
   * @returns {object} Requête enrichie
   */
  enrichWithContext(query, userProfile = {}) {
    console.log('[AIOrchestrator] Enrichissement contexte...', { query });

    const enriched = {
      originalQuery: query,
      constraints: [],
      preferences: [],
      warnings: []
    };

    // Allergies
    if (userProfile.allergens && userProfile.allergens.length > 0) {
      enriched.constraints.push({
        type: 'allergens',
        values: userProfile.allergens,
        filter: { allergens: { $nin: userProfile.allergens } }
      });
      enriched.warnings.push(`Exclusion allergènes : ${userProfile.allergens.join(', ')}`);
    }

    // Régime alimentaire
    if (userProfile.diet) {
      enriched.constraints.push({
        type: 'diet',
        value: userProfile.diet,
        filter: { compatibleDiets: userProfile.diet }
      });
      enriched.preferences.push(`Régime : ${userProfile.diet}`);
    }

    // Budget
    if (userProfile.maxBudget) {
      enriched.constraints.push({
        type: 'budget',
        value: userProfile.maxBudget,
        filter: { price: { $lte: userProfile.maxBudget } }
      });
      enriched.preferences.push(`Budget max : ${userProfile.maxBudget}€`);
    }

    // Labels préférés
    if (userProfile.preferredLabels && userProfile.preferredLabels.length > 0) {
      enriched.preferences.push({
        type: 'labels',
        values: userProfile.preferredLabels,
        boost: 1.5 // Boost score Algolia
      });
    }

    console.log('[AIOrchestrator] Contexte enrichi:', enriched);
    return enriched;
  }

  // ============================================
  // MÉTHODES PRIVÉES - DÉTECTION INTENTION
  // ============================================


  /**
   * Appelle DeepSeek API directement
   * @param {string} prompt - Prompt pour détection intention
   * @returns {Promise<string>} Réponse de DeepSeek
   * @private
   */
  async _callDeepSeek(prompt) {
    try {
      const response = await axios.post(DEEPSEEK_API_URL, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui détecte les intentions utilisateur pour une app santé/écologie. Réponds uniquement en JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      const aiResponse = response.data?.choices?.[0]?.message?.content || '';
      return aiResponse;

    } catch (error) {
      console.error('[AIOrchestrator] Erreur appel DeepSeek:', error.message);
      throw error;
    }
  }
  /**
   * Détection rapide par mots-clés (80% des cas)
   */
  _detectIntentByKeywords(query) {
    const lowerQuery = query.toLowerCase();

    // Product search (basique)
    const productKeywords = ['trouve', 'cherche', 'produit', 'acheter', 'marque'];
    if (productKeywords.some(kw => lowerQuery.includes(kw))) {
      return {
        intent: INTENTS.PRODUCT_SEARCH,
        confidence: 0.85,
        extractedEntities: { query }
      };
    }

    // Alternative request
    const alternativeKeywords = ['alternative', 'remplacer', 'au lieu de', 'meilleur que', 'équivalent'];
    if (alternativeKeywords.some(kw => lowerQuery.includes(kw))) {
      return {
        intent: INTENTS.ALTERNATIVE_REQUEST,
        confidence: 0.9,
        extractedEntities: { originalProduct: query }
      };
    }

    // Recipe search
    const recipeKeywords = ['recette', 'cuisiner', 'préparer', 'menu', 'repas', 'petit-déj', 'dîner'];
    if (recipeKeywords.some(kw => lowerQuery.includes(kw))) {
      return {
        intent: INTENTS.RECIPE_SEARCH,
        confidence: 0.9,
        extractedEntities: { query }
      };
    }

    // List optimization
    const listKeywords = ['liste', 'optimiser', 'améliorer', 'courses'];
    if (listKeywords.some(kw => lowerQuery.includes(kw))) {
      return {
        intent: INTENTS.LIST_OPTIMIZATION,
        confidence: 0.85,
        extractedEntities: {}
      };
    }

    // Budget help
    const budgetKeywords = ['budget', 'économiser', 'moins cher', 'réduire', 'dépense'];
    if (budgetKeywords.some(kw => lowerQuery.includes(kw))) {
      return {
        intent: INTENTS.BUDGET_HELP,
        confidence: 0.85,
        extractedEntities: {}
      };
    }

    // Par défaut : product search avec faible confiance
    return {
      intent: INTENTS.PRODUCT_SEARCH,
      confidence: 0.6,
      extractedEntities: { query }
    };
  }

  /**
   * Construit le prompt IA pour détection d'intention
   */
  _buildIntentDetectionPrompt(query, userContext) {
    return `Tu es un assistant qui détecte l'intention d'une requête utilisateur.

REQUÊTE UTILISATEUR : "${query}"

INTENTIONS POSSIBLES :
- product_search : Recherche d'un produit spécifique
- alternative_request : Demande d'alternative à un produit
- recipe_search : Recherche de recette
- list_optimization : Optimisation de liste de courses
- budget_help : Aide pour réduire le budget

CONTEXTE UTILISATEUR :
${JSON.stringify(userContext, null, 2)}

RÉPONDS UNIQUEMENT EN JSON :
{
  "intent": "...",
  "confidence": 0.95,
  "extractedEntities": {
    "productName": "...",
    "constraints": ["bio", "sans gluten"],
    "goal": "santé"
  }
}`;
  }

  /**
   * Parse la réponse IA
   */
  _parseIntentResponse(aiResponse) {
    try {
      // Nettoyer la réponse (enlever markdown si présent)
      let cleaned = aiResponse.trim();
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const parsed = JSON.parse(cleaned);
      
      return {
        intent: parsed.intent || INTENTS.PRODUCT_SEARCH,
        confidence: parsed.confidence || 0.7,
        extractedEntities: parsed.extractedEntities || {}
      };
    } catch (error) {
      console.error('[AIOrchestrator] Erreur parsing réponse IA:', error);
      return {
        intent: INTENTS.PRODUCT_SEARCH,
        confidence: 0.5,
        extractedEntities: {}
      };
    }
  }

  // ============================================
  // MÉTHODES PRIVÉES - GÉNÉRATION FILTRES
  // ============================================

  /**
   * Filtres de base (contexte utilisateur)
   */
  _getBaseFilters(userContext) {
    const filters = {};

    // Allergies
    if (userContext.allergens && userContext.allergens.length > 0) {
      filters.allergens = { $nin: userContext.allergens };
    }

    // Régime
    if (userContext.diet) {
      filters.compatibleDiets = userContext.diet;
    }

    // Budget max
    if (userContext.maxBudget) {
      filters.price = { $lte: userContext.maxBudget };
    }

    return filters;
  }

  /**
   * Filtres pour recherche produit
   */
  _generateProductSearchFilters(query, userContext, baseFilters) {
    return {
      type: 'product',
      query: query,
      filters: {
        ...baseFilters
      },
      sort: [
        { field: 'scores.overallScore', order: 'desc' },
        { field: 'popularity', order: 'desc' }
      ],
      facetFilters: this._generateFacetFilters(userContext),
      hitsPerPage: 20
    };
  }

  /**
   * Filtres pour recherche d'alternative
   */
  _generateAlternativeFilters(query, userContext, baseFilters) {
    return {
      type: 'alternative',
      query: query,
      filters: {
        ...baseFilters,
        'scores.overallScore': { $gte: 70 } // Alternatives ≥ 70/100
      },
      sort: [
        { field: 'scores.overallScore', order: 'desc' }
      ],
      facetFilters: this._generateFacetFilters(userContext),
      hitsPerPage: 5 // Top 5 alternatives
    };
  }

  /**
   * Filtres pour recherche recette
   */
  _generateRecipeFilters(query, userContext, baseFilters) {
    return {
      type: 'recipe',
      query: query,
      filters: {
        ...baseFilters,
        categoryType: 'recipe'
      },
      sort: [
        { field: 'scores.overallScore', order: 'desc' },
        { field: 'prepTime', order: 'asc' } // Recettes rapides en premier
      ],
      facetFilters: this._generateFacetFilters(userContext),
      hitsPerPage: 10
    };
  }

  /**
   * Filtres pour optimisation liste
   */
  _generateListOptimizationFilters(userContext, baseFilters) {
    return {
      type: 'list_optimization',
      filters: {
        ...baseFilters,
        'scores.overallScore': { $gte: 75 } // Produits bien notés
      },
      sort: [
        { field: 'scores.overallScore', order: 'desc' },
        { field: 'price', order: 'asc' } // Meilleur rapport qualité/prix
      ],
      facetFilters: this._generateFacetFilters(userContext),
      hitsPerPage: 50
    };
  }

  /**
   * Filtres pour aide budget
   */
  _generateBudgetFilters(userContext, baseFilters) {
    return {
      type: 'budget',
      filters: {
        ...baseFilters,
        'scores.overallScore': { $gte: 65 } // Minimum qualité
      },
      sort: [
        { field: 'price', order: 'asc' }, // Prix croissant
        { field: 'scores.overallScore', order: 'desc' }
      ],
      facetFilters: this._generateFacetFilters(userContext),
      hitsPerPage: 30
    };
  }

  /**
   * Génère les facet filters Algolia
   */
  _generateFacetFilters(userContext) {
    const facets = [];

    // Labels préférés
    if (userContext.preferredLabels && userContext.preferredLabels.length > 0) {
      userContext.preferredLabels.forEach(label => {
        facets.push(`labels:${label}`);
      });
    }

    // Catégorie
    if (userContext.category) {
      facets.push(`categoryType:${userContext.category}`);
    }

    return facets;
  }
}

// ============================================
// EXPORT
// ============================================

module.exports = new AIOrchestrator();

// ============================================
// TESTS UNITAIRES (À EXÉCUTER SI NODE_ENV=test)
// ============================================

if (process.env.NODE_ENV === 'test') {
  const orchestrator = module.exports;

  console.log('\n========================================');
  console.log('TESTS UNITAIRES - AI ORCHESTRATOR');
  console.log('========================================\n');

  // Test 1 : Détection intention par keywords
  const test1 = orchestrator._detectIntentByKeywords('Trouve-moi un shampoing sans sulfate');
  console.log('Test 1 - Product search:', test1.intent === INTENTS.PRODUCT_SEARCH ? '✅' : '❌');

  // Test 2 : Alternative request
  const test2 = orchestrator._detectIntentByKeywords('Alternative plus saine au Coca-Cola');
  console.log('Test 2 - Alternative:', test2.intent === INTENTS.ALTERNATIVE_REQUEST ? '✅' : '❌');

  // Test 3 : Recipe search
  const test3 = orchestrator._detectIntentByKeywords('Recette petit-déjeuner IG bas');
  console.log('Test 3 - Recipe:', test3.intent === INTENTS.RECIPE_SEARCH ? '✅' : '❌');

  // Test 4 : Génération filtres produit
  const filters = orchestrator.generateSearchFilters(
    INTENTS.PRODUCT_SEARCH,
    'shampoing bio',
    { allergens: ['gluten'], maxBudget: 15 }
  );
  console.log('Test 4 - Filtres produit:', filters.type === 'product' ? '✅' : '❌');

  // Test 5 : Enrichissement contexte
  const enriched = orchestrator.enrichWithContext('shampoing', {
    allergens: ['parfum'],
    diet: 'vegan',
    maxBudget: 20
  });
  console.log('Test 5 - Contexte enrichi:', enriched.constraints.length >= 2 ? '✅' : '❌');

  console.log('\n========================================\n');
}