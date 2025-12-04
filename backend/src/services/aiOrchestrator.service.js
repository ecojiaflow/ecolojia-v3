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

const axios = require('axios');
const logger = require('../config/logger');

// Configuration DeepSeek
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const USE_DEEPSEEK = !!DEEPSEEK_API_KEY;

// Configuration timeouts et retry
const DEEPSEEK_TIMEOUT = parseInt(process.env.DEEPSEEK_TIMEOUT || '8000', 10);
const DEEPSEEK_MAX_RETRIES = parseInt(process.env.DEEPSEEK_MAX_RETRIES || '2', 10);

// Coût estimé DeepSeek (en $ pour 1M tokens)
const DEEPSEEK_COST_PER_1M_INPUT = 0.14;
const DEEPSEEK_COST_PER_1M_OUTPUT = 0.28;

// Log configuration au démarrage
if (USE_DEEPSEEK) {
  logger.info('[AIOrchestrator] DeepSeek API configurée', {
    hasApiKey: true,
    apiUrl: DEEPSEEK_API_URL,
    timeout: DEEPSEEK_TIMEOUT,
    maxRetries: DEEPSEEK_MAX_RETRIES,
    mode: 'hybrid'
  });
} else {
  logger.warn('[AIOrchestrator] DeepSeek API non configurée', {
    hasApiKey: false,
    mode: 'keywords-only',
    limitation: 'Détection intention limitée aux mots-clés'
  });
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
    const startTime = Date.now();
    
    try {
      // Validation paramètres
      if (!query || typeof query !== 'string') {
        logger.warn('[AIOrchestrator] Tentative détection intention sans query valide', {
          query: typeof query
        });
        throw new Error('Query invalide ou manquante');
      }

      if (query.trim().length === 0) {
        logger.warn('[AIOrchestrator] Query vide', { query });
        throw new Error('Query vide');
      }

      logger.info('[AIOrchestrator] Démarrage détection intention', {
        query,
        queryLength: query.length,
        hasUserContext: !!userContext,
        contextKeys: Object.keys(userContext)
      });

      // Cas simple : détection par mots-clés (économise 80% des appels IA)
      const simpleIntent = this._detectIntentByKeywords(query);
      
      if (simpleIntent.confidence > 0.8) {
        const processingTime = Date.now() - startTime;
        
        logger.info('[AIOrchestrator] Intention détectée par keywords', {
          intent: simpleIntent.intent,
          confidence: simpleIntent.confidence,
          method: 'keywords',
          processingTimeMs: processingTime,
          costEur: 0 // Gratuit
        });
        
        return {
          ...simpleIntent,
          metadata: {
            method: 'keywords',
            processingTimeMs: processingTime,
            costEur: 0
          }
        };
      }

      // Cas complexe : appel DeepSeek pour détection fine
      if (USE_DEEPSEEK) {
        try {
          const prompt = this._buildIntentDetectionPrompt(query, userContext);
          const aiResponse = await this._callDeepSeekWithRetry(prompt);
          const result = this._parseIntentResponse(aiResponse.content);
          
          const processingTime = Date.now() - startTime;
          const costEur = this._calculateCost(
            aiResponse.tokensUsed.input,
            aiResponse.tokensUsed.output
          );

          logger.info('[AIOrchestrator] Intention détectée par DeepSeek', {
            intent: result.intent,
            confidence: result.confidence,
            method: 'deepseek',
            processingTimeMs: processingTime,
            tokensInput: aiResponse.tokensUsed.input,
            tokensOutput: aiResponse.tokensUsed.output,
            tokensTotal: aiResponse.tokensUsed.total,
            costEur
          });
          
          return {
            ...result,
            metadata: {
              method: 'deepseek',
              processingTimeMs: processingTime,
              tokensUsed: aiResponse.tokensUsed,
              costEur
            }
          };
        } catch (aiError) {
          const processingTime = Date.now() - startTime;
          
          logger.warn('[AIOrchestrator] Erreur DeepSeek, fallback keywords', {
            error: aiError.message,
            fallbackIntent: simpleIntent.intent,
            processingTimeMs: processingTime
          });
          
          return {
            ...simpleIntent,
            metadata: {
              method: 'keywords-fallback',
              processingTimeMs: processingTime,
              costEur: 0,
              error: aiError.message
            }
          };
        }
      }

      // Pas de DeepSeek disponible : utiliser keywords
      const processingTime = Date.now() - startTime;
      
      logger.info('[AIOrchestrator] DeepSeek non disponible, utilisation keywords', {
        intent: simpleIntent.intent,
        confidence: simpleIntent.confidence,
        processingTimeMs: processingTime
      });
      
      return {
        ...simpleIntent,
        metadata: {
          method: 'keywords',
          processingTimeMs: processingTime,
          costEur: 0
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('[AIOrchestrator] Erreur détection intention', {
        error: error.message,
        stack: error.stack,
        query,
        processingTimeMs: processingTime
      });

      // Fallback : intention par défaut
      return {
        intent: INTENTS.PRODUCT_SEARCH,
        confidence: 0.5,
        extractedEntities: { query },
        metadata: {
          method: 'error-fallback',
          processingTimeMs: processingTime,
          error: error.message
        }
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
    try {
      // Validation paramètres
      if (!intent || typeof intent !== 'string') {
        logger.warn('[AIOrchestrator] Intent invalide pour génération filtres', {
          intent: typeof intent
        });
        intent = INTENTS.PRODUCT_SEARCH; // Fallback
      }

      if (!query || typeof query !== 'string') {
        logger.warn('[AIOrchestrator] Query invalide pour génération filtres', {
          query: typeof query
        });
        query = ''; // Fallback
      }

      logger.info('[AIOrchestrator] Génération filtres recherche', {
        intent,
        query,
        queryLength: query.length,
        hasUserContext: !!userContext,
        contextKeys: Object.keys(userContext)
      });

      const baseFilters = this._getBaseFilters(userContext);

      let filters;
      switch (intent) {
        case INTENTS.PRODUCT_SEARCH:
          filters = this._generateProductSearchFilters(query, userContext, baseFilters);
          break;

        case INTENTS.ALTERNATIVE_REQUEST:
          filters = this._generateAlternativeFilters(query, userContext, baseFilters);
          break;

        case INTENTS.RECIPE_SEARCH:
          filters = this._generateRecipeFilters(query, userContext, baseFilters);
          break;

        case INTENTS.LIST_OPTIMIZATION:
          filters = this._generateListOptimizationFilters(userContext, baseFilters);
          break;

        case INTENTS.BUDGET_HELP:
          filters = this._generateBudgetFilters(userContext, baseFilters);
          break;

        default:
          logger.warn('[AIOrchestrator] Intent non reconnu, fallback product_search', {
            intent
          });
          filters = this._generateProductSearchFilters(query, userContext, baseFilters);
      }

      logger.debug('[AIOrchestrator] Filtres générés', {
        intent,
        filterType: filters.type,
        hasSort: !!filters.sort,
        filtersCount: Object.keys(filters.filters || {}).length,
        hitsPerPage: filters.hitsPerPage
      });

      return filters;

    } catch (error) {
      logger.error('[AIOrchestrator] Erreur génération filtres', {
        error: error.message,
        stack: error.stack,
        intent,
        query
      });

      // Fallback : filtres basiques
      return this._generateProductSearchFilters(query || '', userContext, {});
    }
  }

  /**
   * Enrichit une requête avec le contexte utilisateur
   * @param {string} query - Requête brute
   * @param {object} userProfile - Profil utilisateur (allergies, régime, budget...)
   * @returns {object} Requête enrichie
   */
  enrichWithContext(query, userProfile = {}) {
    try {
      logger.info('[AIOrchestrator] Enrichissement contexte', {
        query,
        hasUserProfile: !!userProfile,
        profileKeys: Object.keys(userProfile)
      });

      const enriched = {
        originalQuery: query,
        constraints: [],
        preferences: [],
        warnings: []
      };

      // Allergies
      if (userProfile.allergens && Array.isArray(userProfile.allergens) && userProfile.allergens.length > 0) {
        enriched.constraints.push({
          type: 'allergens',
          values: userProfile.allergens,
          filter: { allergens: { $nin: userProfile.allergens } }
        });
        enriched.warnings.push(`Exclusion allergènes : ${userProfile.allergens.join(', ')}`);
      }

      // Régime alimentaire
      if (userProfile.diet && typeof userProfile.diet === 'string') {
        enriched.constraints.push({
          type: 'diet',
          value: userProfile.diet,
          filter: { compatibleDiets: userProfile.diet }
        });
        enriched.preferences.push(`Régime : ${userProfile.diet}`);
      }

      // Budget
      if (userProfile.maxBudget && typeof userProfile.maxBudget === 'number') {
        enriched.constraints.push({
          type: 'budget',
          value: userProfile.maxBudget,
          filter: { price: { $lte: userProfile.maxBudget } }
        });
        enriched.preferences.push(`Budget max : ${userProfile.maxBudget}€`);
      }

      // Labels préférés
      if (userProfile.preferredLabels && Array.isArray(userProfile.preferredLabels) && userProfile.preferredLabels.length > 0) {
        enriched.preferences.push({
          type: 'labels',
          values: userProfile.preferredLabels,
          boost: 1.5 // Boost score Algolia
        });
      }

      logger.debug('[AIOrchestrator] Contexte enrichi généré', {
        constraintsCount: enriched.constraints.length,
        preferencesCount: enriched.preferences.length,
        warningsCount: enriched.warnings.length
      });

      return enriched;

    } catch (error) {
      logger.error('[AIOrchestrator] Erreur enrichissement contexte', {
        error: error.message,
        stack: error.stack,
        query
      });

      // Fallback : contexte vide
      return {
        originalQuery: query,
        constraints: [],
        preferences: [],
        warnings: []
      };
    }
  }

  // ============================================
  // MÉTHODES PRIVÉES - DÉTECTION INTENTION
  // ============================================

  /**
   * Appelle DeepSeek API avec retry automatique
   * @param {string} prompt - Prompt pour détection intention
   * @returns {Promise<object>} { content, tokensUsed }
   * @private
   */
  async _callDeepSeekWithRetry(prompt) {
    let lastError;
    
    for (let attempt = 1; attempt <= DEEPSEEK_MAX_RETRIES; attempt++) {
      try {
        logger.debug('[AIOrchestrator] Appel DeepSeek', {
          attempt,
          maxRetries: DEEPSEEK_MAX_RETRIES,
          promptLength: prompt.length,
          estimatedTokens: Math.ceil(prompt.length / 4),
          timeout: DEEPSEEK_TIMEOUT
        });

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
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: DEEPSEEK_TIMEOUT
        });

        const content = response.data?.choices?.[0]?.message?.content || '';
        const tokensUsed = {
          input: response.data?.usage?.prompt_tokens || Math.ceil(prompt.length / 4),
          output: response.data?.usage?.completion_tokens || Math.ceil(content.length / 4),
          total: response.data?.usage?.total_tokens || Math.ceil((prompt.length + content.length) / 4)
        };

        logger.info('[AIOrchestrator] DeepSeek réponse reçue', {
          attempt,
          contentLength: content.length,
          tokensInput: tokensUsed.input,
          tokensOutput: tokensUsed.output,
          tokensTotal: tokensUsed.total
        });

        return { content, tokensUsed };

      } catch (error) {
        lastError = error;
        
        logger.warn('[AIOrchestrator] Erreur appel DeepSeek', {
          attempt,
          maxRetries: DEEPSEEK_MAX_RETRIES,
          error: error.message,
          code: error.code,
          isTimeout: error.code === 'ECONNABORTED',
          willRetry: attempt < DEEPSEEK_MAX_RETRIES
        });

        if (attempt < DEEPSEEK_MAX_RETRIES) {
          // Attendre avant retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Tous les retry ont échoué
    logger.error('[AIOrchestrator] Échec DeepSeek après tous les retry', {
      attempts: DEEPSEEK_MAX_RETRIES,
      lastError: lastError.message
    });
    
    throw lastError;
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
      logger.error('[AIOrchestrator] Erreur parsing réponse IA', {
        error: error.message,
        response: aiResponse
      });
      
      return {
        intent: INTENTS.PRODUCT_SEARCH,
        confidence: 0.5,
        extractedEntities: {}
      };
    }
  }

  /**
   * Calcule le coût d'un appel DeepSeek
   */
  _calculateCost(inputTokens, outputTokens) {
    const inputCost = (inputTokens / 1000000) * DEEPSEEK_COST_PER_1M_INPUT;
    const outputCost = (outputTokens / 1000000) * DEEPSEEK_COST_PER_1M_OUTPUT;
    return inputCost + outputCost;
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
    if (userContext.allergens && Array.isArray(userContext.allergens) && userContext.allergens.length > 0) {
      filters.allergens = { $nin: userContext.allergens };
    }

    // Régime
    if (userContext.diet && typeof userContext.diet === 'string') {
      filters.compatibleDiets = userContext.diet;
    }

    // Budget max
    if (userContext.maxBudget && typeof userContext.maxBudget === 'number') {
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
    if (userContext.preferredLabels && Array.isArray(userContext.preferredLabels)) {
      userContext.preferredLabels.forEach(label => {
        facets.push(`labels:${label}`);
      });
    }

    // Catégorie
    if (userContext.category && typeof userContext.category === 'string') {
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

  logger.info('\n========================================');
  logger.info('TESTS UNITAIRES - AI ORCHESTRATOR');
  logger.info('========================================\n');

  // Test 1 : Détection intention par keywords
  const test1 = orchestrator._detectIntentByKeywords('Trouve-moi un shampoing sans sulfate');
  logger.info('Test 1 - Product search:', test1.intent === INTENTS.PRODUCT_SEARCH ? '✅' : '❌');

  // Test 2 : Alternative request
  const test2 = orchestrator._detectIntentByKeywords('Alternative plus saine au Coca-Cola');
  logger.info('Test 2 - Alternative:', test2.intent === INTENTS.ALTERNATIVE_REQUEST ? '✅' : '❌');

  // Test 3 : Recipe search
  const test3 = orchestrator._detectIntentByKeywords('Recette petit-déjeuner IG bas');
  logger.info('Test 3 - Recipe:', test3.intent === INTENTS.RECIPE_SEARCH ? '✅' : '❌');

  // Test 4 : Génération filtres produit
  const filters = orchestrator.generateSearchFilters(
    INTENTS.PRODUCT_SEARCH,
    'shampoing bio',
    { allergens: ['gluten'], maxBudget: 15 }
  );
  logger.info('Test 4 - Filtres produit:', filters.type === 'product' ? '✅' : '❌');

  // Test 5 : Enrichissement contexte
  const enriched = orchestrator.enrichWithContext('shampoing', {
    allergens: ['parfum'],
    diet: 'vegan',
    maxBudget: 20
  });
  logger.info('Test 5 - Contexte enrichi:', enriched.constraints.length >= 2 ? '✅' : '❌');

  logger.info('\n========================================\n');
}
