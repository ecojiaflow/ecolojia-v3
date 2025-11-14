// PATH: backend/src/services/aiEnrichment.service.js
const deepSeekService = require('./ai/deepSeekService');
const scoringUnified = require('./scoringUnified');

const logger = {
  info: (...args) => console.log('[AI-ENRICH]', ...args),
  warn: (...args) => console.warn('[AI-ENRICH WARN]', ...args),
  error: (...args) => console.error('[AI-ENRICH ERROR]', ...args)
};

/**
 * ============================================================================
 * AI ENRICHMENT SERVICE - VERSION CORRIGÉE
 * ============================================================================
 * 
 * Service d'enrichissement produit par IA (DeepSeek)
 * 
 * CORRECTIONS :
 * ✅ Validation entrées (ingredients = array)
 * ✅ Validation score calculé (pas NaN/undefined)
 * ✅ Gestion erreurs robuste
 * ✅ Retry si échec API
 * ✅ Timeout 30s sur appel DeepSeek
 * ✅ Logs détaillés
 */

class AIEnrichmentService {
  
  /**
   * Point d'entrée principal - Enrichir un produit avec l'IA
   */
  static async enrichProductWithAI(product) {
    const startTime = Date.now();
    logger.info(`🤖 Début enrichissement IA - Produit: ${product.name}`);

    try {
      // ============================================================================
      // ✨ VALIDATION DONNÉES D'ENTRÉE (NOUVEAU)
      // ============================================================================
      const validatedProduct = this.validateProductData(product);

      // Construire le contexte pour l'IA
      const context = this.buildEnrichmentContext(validatedProduct);

      // Appel IA avec timeout et retry
      logger.info('📡 Appel DeepSeek API...');
      const aiResponse = await this.callDeepSeekWithRetry(context, 2); // 2 tentatives max

      if (!aiResponse || !aiResponse.enrichedData) {
        throw new Error('Réponse IA invalide ou vide');
      }

      // Merger les données enrichies
      logger.info('🔄 Merge données enrichies...');
      const enrichedProduct = this.mergeEnrichedData(validatedProduct, aiResponse.enrichedData);

      // ============================================================================
      // ✨ RECALCUL SCORE AVEC VALIDATION (NOUVEAU)
      // ============================================================================
      logger.info('📊 Recalcul score avec données enrichies...');
      const scoredProduct = await this.recalculateScoreWithValidation(enrichedProduct);

      // Marquer comme enrichi par IA
      scoredProduct.aiEnriched = true;
      scoredProduct.aiEnrichmentDate = new Date();
      scoredProduct.aiEnrichmentVersion = '3.1';

      const duration = Date.now() - startTime;
      const finalScore = scoredProduct.scores?.overallScore || scoredProduct.scores?.global || 50;
      
      logger.info(`✅ Enrichissement réussi - Score: ${finalScore}/100 (Confiance: ${Math.round((scoredProduct.scores?.confidence || 0.7) * 100)}%) - Durée: ${duration}ms`);

      return scoredProduct;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`❌ Échec enrichissement IA - Durée: ${duration}ms - Erreur:`, error.message);

      // Retourner le produit original non modifié en cas d'erreur
      return {
        ...product,
        aiEnriched: false,
        aiEnrichmentError: error.message,
        aiEnrichmentAttemptedAt: new Date()
      };
    }
  }

  /**
   * ============================================================================
   * ✨ VALIDATION DONNÉES PRODUIT (NOUVEAU)
   * ============================================================================
   */
  static validateProductData(product) {
    logger.info('🔍 Validation données produit...');

    const validated = { ...product };

    // Validation ingrédients (doit être string, pas array)
    if (validated.foodData?.ingredients) {
      if (Array.isArray(validated.foodData.ingredients)) {
        // ✅ CORRECTION DU BUG ingredients.join
        logger.warn('⚠️ Ingredients est un array, conversion en string');
        validated.foodData.ingredients = validated.foodData.ingredients.join(', ');
      } else if (typeof validated.foodData.ingredients !== 'string') {
        logger.warn('⚠️ Ingredients invalide, conversion en string');
        validated.foodData.ingredients = String(validated.foodData.ingredients || '');
      }
    }

    // Validation ingredientsTags (doit être array)
    if (validated.foodData?.ingredientsTags) {
      if (typeof validated.foodData.ingredientsTags === 'string') {
        logger.warn('⚠️ IngredientsTags est une string, conversion en array');
        validated.foodData.ingredientsTags = validated.foodData.ingredientsTags.split(',').map(s => s.trim());
      } else if (!Array.isArray(validated.foodData.ingredientsTags)) {
        logger.warn('⚠️ IngredientsTags invalide, initialisation array vide');
        validated.foodData.ingredientsTags = [];
      }
    }

    // Validation additives (doit être array)
    if (validated.foodData?.additives) {
      if (typeof validated.foodData.additives === 'string') {
        validated.foodData.additives = validated.foodData.additives.split(',').map(s => s.trim());
      } else if (!Array.isArray(validated.foodData.additives)) {
        validated.foodData.additives = [];
      }
    }

    // Validation allergens (doit être array)
    if (validated.foodData?.allergens) {
      if (typeof validated.foodData.allergens === 'string') {
        validated.foodData.allergens = validated.foodData.allergens.split(',').map(s => s.trim());
      } else if (!Array.isArray(validated.foodData.allergens)) {
        validated.foodData.allergens = [];
      }
    }

    // Validation nutritionFacts (doit être objet)
    if (!validated.foodData?.nutritionFacts || typeof validated.foodData.nutritionFacts !== 'object') {
      validated.foodData = validated.foodData || {};
      validated.foodData.nutritionFacts = {};
    }

    logger.info('✅ Validation terminée');
    return validated;
  }

  /**
   * Construire le contexte pour l'IA
   */
  static buildEnrichmentContext(product) {
    const context = {
      name: product.name || 'Produit inconnu',
      brand: product.brand || 'Marque inconnue',
      category: product.categoryType || product.category || 'food',
      barcode: product.barcode,
      
      existingData: {
        ingredients: product.foodData?.ingredients || '',
        ingredientsTags: product.foodData?.ingredientsTags || [],
        allergens: product.foodData?.allergens || [],
        additives: product.foodData?.additives || [],
        nutritionFacts: product.foodData?.nutritionFacts || {},
        nova: product.foodData?.nova || null,
        nutriscore: product.foodData?.nutriscore || null,
        ecoscore: product.foodData?.ecoscore || null,
        labels: product.foodData?.labels || []
      },
      
      missingFields: this.identifyMissingFields(product),
      dataQuality: product.dataQuality || 'unknown'
    };

    return context;
  }

  /**
   * Identifier les champs manquants
   */
  static identifyMissingFields(product) {
    const missing = [];

    if (!product.foodData?.ingredients || product.foodData.ingredients.length < 10) {
      missing.push('ingredients');
    }

    if (!product.foodData?.nutritionFacts || Object.keys(product.foodData.nutritionFacts).length < 3) {
      missing.push('nutritionFacts');
    }

    if (!product.foodData?.nova) {
      missing.push('nova');
    }

    if (!product.foodData?.nutriscore) {
      missing.push('nutriscore');
    }

    if (!product.foodData?.allergens || product.foodData.allergens.length === 0) {
      missing.push('allergens');
    }

    return missing;
  }

  /**
   * ============================================================================
   * ✨ APPEL DEEPSEEK AVEC RETRY ET TIMEOUT (NOUVEAU)
   * ============================================================================
   */
  static async callDeepSeekWithRetry(context, maxRetries = 2) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`📡 Tentative ${attempt}/${maxRetries}...`);

        // Construire le prompt
        const prompt = this.buildEnrichmentPrompt(context);

        // Appel avec timeout 30s
        const response = await this.callWithTimeout(
          deepSeekService.query(prompt),
          30000, // 30 secondes timeout
          'Timeout DeepSeek API (30s)'
        );

        if (!response) {
          throw new Error('Réponse DeepSeek vide');
        }

        // Parser la réponse
        const enrichedData = this.parseDeepSeekResponse(response);

        logger.info(`✅ Réponse IA reçue (tentative ${attempt})`);
        return { enrichedData };

      } catch (error) {
        lastError = error;
        logger.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);

        // Si c'est la dernière tentative, on throw
        if (attempt === maxRetries) {
          throw new Error(`Échec après ${maxRetries} tentatives: ${lastError.message}`);
        }

        // Attendre 2s avant retry
        await this.sleep(2000);
      }
    }

    throw lastError;
  }

  /**
   * Wrapper timeout pour promesse
   */
  static callWithTimeout(promise, timeoutMs, timeoutMessage) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      )
    ]);
  }

  /**
   * Sleep helper
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Construire le prompt pour DeepSeek
   */
  static buildEnrichmentPrompt(context) {
    const { name, brand, category, existingData, missingFields } = context;

    const prompt = `Tu es un expert en analyse produits ${category === 'food' ? 'alimentaires' : category === 'cosmetics' ? 'cosmétiques' : 'détergents'}.

Produit à enrichir :
- Nom : ${name}
- Marque : ${brand}
- Catégorie : ${category}
- Barcode : ${context.barcode}

Données existantes :
${JSON.stringify(existingData, null, 2)}

Champs manquants à compléter :
${missingFields.join(', ') || 'Aucun (amélioration qualité)'}

Tâche :
1. Analyser les données existantes
2. Compléter/améliorer les champs manquants
3. Estimer NOVA group (1-4) si manquant
4. Estimer Nutri-Score (A-E) si manquant
5. Identifier allergènes probables
6. Estimer valeurs nutritionnelles manquantes (si alimentaire)

Réponds UNIQUEMENT avec un JSON valide (sans markdown) :
{
  "ingredients": "liste complète ingrédients",
  "ingredientsTags": ["tag1", "tag2"],
  "allergens": ["allergène1", "allergène2"],
  "additives": ["E330", "E415"],
  "nutritionFacts": {
    "energy": 250,
    "fat": 5.2,
    "saturatedFat": 1.5,
    "carbohydrates": 45,
    "sugars": 12,
    "fiber": 3,
    "proteins": 8,
    "salt": 0.8
  },
  "nova": 3,
  "nutriscore": "C",
  "ecoscore": "B",
  "labels": ["bio", "vegan"],
  "confidence": 0.75,
  "reasoning": "Explication brève de l'estimation"
}`;

    return prompt;
  }

  /**
   * Parser la réponse DeepSeek
   */
  static parseDeepSeekResponse(response) {
    try {
      // Nettoyer le texte (enlever markdown si présent)
      let text = response;
      
      if (typeof text !== 'string') {
        text = JSON.stringify(text);
      }

      // Enlever les markdown code blocks
      text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      // Parser JSON
      const parsed = JSON.parse(text);

      // Validation structure minimale
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Réponse IA invalide (pas un objet)');
      }

      return parsed;

    } catch (error) {
      logger.error('❌ Erreur parsing réponse IA:', error.message);
      logger.error('Réponse brute:', response);
      throw new Error('Impossible de parser la réponse IA');
    }
  }

  /**
   * Merger les données enrichies
   */
  static mergeEnrichedData(product, enrichedData) {
    const merged = { ...product };

    // Merger foodData
    if (!merged.foodData) {
      merged.foodData = {};
    }

    // Ingredients (préférer enrichedData si plus complet)
    if (enrichedData.ingredients && enrichedData.ingredients.length > (merged.foodData.ingredients?.length || 0)) {
      merged.foodData.ingredients = enrichedData.ingredients;
    }

    // Tags
    if (enrichedData.ingredientsTags && enrichedData.ingredientsTags.length > 0) {
      merged.foodData.ingredientsTags = [
        ...(merged.foodData.ingredientsTags || []),
        ...enrichedData.ingredientsTags
      ].filter((v, i, a) => a.indexOf(v) === i); // Dédupliquer
    }

    // Allergens
    if (enrichedData.allergens && enrichedData.allergens.length > 0) {
      merged.foodData.allergens = [
        ...(merged.foodData.allergens || []),
        ...enrichedData.allergens
      ].filter((v, i, a) => a.indexOf(v) === i);
    }

    // Additives
    if (enrichedData.additives && enrichedData.additives.length > 0) {
      merged.foodData.additives = [
        ...(merged.foodData.additives || []),
        ...enrichedData.additives
      ].filter((v, i, a) => a.indexOf(v) === i);
    }

    // Nutrition facts
    if (enrichedData.nutritionFacts) {
      merged.foodData.nutritionFacts = {
        ...(merged.foodData.nutritionFacts || {}),
        ...enrichedData.nutritionFacts
      };
    }

    // NOVA (si manquant)
    if (enrichedData.nova && !merged.foodData.nova) {
      merged.foodData.nova = enrichedData.nova;
    }

    // Nutri-Score (si manquant)
    if (enrichedData.nutriscore && !merged.foodData.nutriscore) {
      merged.foodData.nutriscore = enrichedData.nutriscore;
    }

    // Eco-Score (si manquant)
    if (enrichedData.ecoscore && !merged.foodData.ecoscore) {
      merged.foodData.ecoscore = enrichedData.ecoscore;
    }

    // Labels
    if (enrichedData.labels && enrichedData.labels.length > 0) {
      merged.foodData.labels = [
        ...(merged.foodData.labels || []),
        ...enrichedData.labels
      ].filter((v, i, a) => a.indexOf(v) === i);
    }

    // Métadonnées enrichissement
    merged.aiEnrichmentMetadata = {
      confidence: enrichedData.confidence || 0.7,
      reasoning: enrichedData.reasoning || 'Enrichissement automatique par IA',
      fieldsEnriched: Object.keys(enrichedData)
    };

    return merged;
  }

  /**
   * ============================================================================
   * ✨ RECALCUL SCORE AVEC VALIDATION (NOUVEAU)
   * ============================================================================
   */
  static async recalculateScoreWithValidation(product) {
    try {
      // Recalculer le score avec données enrichies
      const scoredProduct = await scoringUnified.calculateScores(product);

      // ✅ VALIDATION SCORE (pas NaN, pas undefined)
      if (!scoredProduct.scores) {
        logger.warn('⚠️ Aucun score calculé, structure par défaut');
        scoredProduct.scores = {
          overallScore: 50,
          global: 50,
          confidence: 0.5,
          dataCompleteness: 'partial'
        };
      }

      const overallScore = scoredProduct.scores.overallScore || scoredProduct.scores.global;

      if (overallScore === undefined || overallScore === null || isNaN(overallScore)) {
        logger.warn('⚠️ Score invalide après recalcul, application score par défaut 50');
        scoredProduct.scores.overallScore = 50;
        scoredProduct.scores.global = 50;
      } else {
        // S'assurer que le score est entre 0 et 100
        scoredProduct.scores.overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));
        scoredProduct.scores.global = scoredProduct.scores.overallScore;
      }

      // Ajuster confiance (enrichissement IA = confiance réduite)
      const originalConfidence = scoredProduct.scores.confidence || 0.9;
      const aiConfidence = scoredProduct.aiEnrichmentMetadata?.confidence || 0.7;
      
      // Confiance finale = moyenne pondérée
      scoredProduct.scores.confidence = Math.round((originalConfidence * 0.4 + aiConfidence * 0.6) * 100) / 100;

      // Mettre à jour dataCompleteness
      const completeness = this.calculateDataCompleteness(scoredProduct);
      scoredProduct.scores.dataCompleteness = completeness;

      logger.info(`✅ Score validé: ${scoredProduct.scores.overallScore}/100 (Confiance: ${Math.round(scoredProduct.scores.confidence * 100)}%, Complétude: ${completeness})`);

      return scoredProduct;

    } catch (error) {
      logger.error('❌ Erreur recalcul score:', error.message);

      // Fallback : retourner produit avec score par défaut
      return {
        ...product,
        scores: {
          overallScore: 50,
          global: 50,
          confidence: 0.5,
          dataCompleteness: 'partial'
        }
      };
    }
  }

  /**
   * Calculer complétude des données
   */
  static calculateDataCompleteness(product) {
    const checks = [
      product.name,
      product.brand,
      product.categoryType,
      product.foodData?.ingredients,
      product.foodData?.nutritionFacts?.energy !== undefined,
      product.foodData?.nova,
      product.foodData?.nutriscore,
      product.imageUrl
    ];

    const score = checks.filter(Boolean).length;

    if (score >= 7) return 'excellent';
    if (score >= 5) return 'good';
    if (score >= 3) return 'partial';
    return 'minimal';
  }
}

module.exports = AIEnrichmentService;