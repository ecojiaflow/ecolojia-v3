// PATH: backend/src/services/aiEnrichment.service.js
const deepSeekService = require('./ai/deepSeekService');
const scoringUnified = require('./scoringUnified');
const knowledgeService = require('../knowledge/knowledge.service');

const logger = {
  info: (...args) => console.log('[AI-ENRICH]', ...args),
  warn: (...args) => console.warn('[AI-ENRICH WARN]', ...args),
  error: (...args) => console.error('[AI-ENRICH ERROR]', ...args)
};

/**
 * ============================================================================
 * AI ENRICHMENT SERVICE - VERSION HYBRIDE 3.1
 * ============================================================================
 *
 * Système hybride intelligent combinant :
 * ✅ Base de connaissance scientifique (knowledge.service)
 * ✅ Analyse IA contextuelle (DeepSeek)
 * ✅ Scoring précis avec sources
 *
 * @version 3.1.0-hybrid
 * @date 2025-11-16
 */

class AIEnrichmentService {

  /**
   * Point d'entrée principal - Enrichir un produit avec système hybride
   */
  static async enrichProductWithAI(product) {
    const startTime = Date.now();
    logger.info(`🤖 Début enrichissement HYBRIDE - Produit: ${product.name}`);

    try {
      // Initialiser knowledge service si pas encore fait
      if (!knowledgeService.initialized) {
        logger.info('📚 Initialisation knowledge service...');
        await knowledgeService.initialize();
      }

      // ============================================================================
      // 1️⃣ VALIDATION DONNÉES D'ENTRÉE
      // ============================================================================
      const validatedProduct = this.validateProductData(product);

      // ============================================================================
      // 2️⃣ ANALYSE BASE DE CONNAISSANCE SCIENTIFIQUE (NOUVEAU)
      // ============================================================================
      logger.info('🔬 Analyse base de connaissance scientifique...');
      const knowledgeAnalysis = await this.analyzeWithKnowledgeBase(validatedProduct);

      // ============================================================================
      // 3️⃣ CONSTRUCTION CONTEXTE ENRICHI POUR DEEPSEEK
      // ============================================================================
      logger.info('📝 Construction contexte hybride pour DeepSeek...');
      const hybridContext = this.buildHybridContext(validatedProduct, knowledgeAnalysis);

      // ============================================================================
      // 4️⃣ APPEL DEEPSEEK AVEC CONTEXTE SCIENTIFIQUE
      // ============================================================================
      logger.info('📡 Appel DeepSeek API (avec contexte scientifique)...');
      const aiResponse = await this.callDeepSeekWithRetry(hybridContext, 2);

      if (!aiResponse || !aiResponse.enrichedData) {
        throw new Error('Réponse IA invalide ou vide');
      }

      // ============================================================================
      // 5️⃣ MERGE DONNÉES : Knowledge base + IA + Produit original
      // ============================================================================
      logger.info('🔄 Merge données hybrides...');
      const enrichedProduct = this.mergeHybridData(
        validatedProduct,
        knowledgeAnalysis,
        aiResponse.enrichedData
      );

      // ============================================================================
      // 6️⃣ RECALCUL SCORE AVEC VALIDATION
      // ============================================================================
      logger.info('📊 Recalcul score avec données hybrides...');
      const scoredProduct = await this.recalculateScoreWithValidation(enrichedProduct);

      // Métadonnées enrichissement
      scoredProduct.aiEnriched = true;
      scoredProduct.aiEnrichmentDate = new Date();
      scoredProduct.aiEnrichmentVersion = '3.1-hybrid';
      scoredProduct.knowledgeBaseUsed = true;
      scoredProduct.knowledgeAnalysis = knowledgeAnalysis;

      const duration = Date.now() - startTime;
      const finalScore = scoredProduct.scores?.overallScore || scoredProduct.scores?.global || 50;

      logger.info(`✅ Enrichissement HYBRIDE réussi - Score: ${finalScore}/100 (Confiance: ${Math.round((scoredProduct.scores?.confidence || 0.8) * 100)}%) - Durée: ${duration}ms`);
      // ⭐ CORRECTION CRITIQUE : Sauvegarder globalScore au niveau racine
      if (!scoredProduct.globalScore && scoredProduct.scores) {
        const scoreComponents = [
          scoredProduct.scores.healthScore,
          scoredProduct.scores.environmentScore,
          scoredProduct.scores.nutritionScore,
          scoredProduct.scores.additivesScore,
          scoredProduct.scores.novaScore,
          scoredProduct.scores.originScore,
          scoredProduct.scores.labelsScore,
          scoredProduct.scores.traceabilityScore
        ];
        
        // Filtrer les scores valides (non null, non undefined, non NaN)
        const validScores = scoreComponents.filter(s => s !== null && s !== undefined && !isNaN(s));
        
        if (validScores.length > 0) {
          scoredProduct.globalScore = Math.round(
            validScores.reduce((sum, score) => sum + score, 0) / validScores.length
          );
          logger.info(`📊 globalScore calculé et sauvegardé: ${scoredProduct.globalScore}/100 (basé sur ${validScores.length} composantes valides)`);
        } else {
          logger.warn('⚠️ Impossible de calculer globalScore : aucune composante valide');
          scoredProduct.globalScore = null;
        }
      }

      // ⭐ Convertir en plain object pour préserver globalScore
      return scoredProduct.toObject 
        ? { ...scoredProduct.toObject(), globalScore: scoredProduct.globalScore }
        : scoredProduct;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`❌ Échec enrichissement HYBRIDE - Durée: ${duration}ms - Erreur:`, error.message);

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
   * NOUVELLE MÉTHODE : Analyser avec base de connaissance scientifique
   * ============================================================================
   */
  static async analyzeWithKnowledgeBase(product) {
    try {
      // ⭐ SUPPORT DES DEUX FORMATS : string ET array
      console.log("[DEBUG analyzeWithKnowledgeBase] product.ingredients_text:", product.ingredients_text);
      console.log("[DEBUG analyzeWithKnowledgeBase] product.foodData:", product.foodData);
      console.log("[DEBUG analyzeWithKnowledgeBase] product.foodData?.ingredients:", product.foodData?.ingredients);
      console.log("[DEBUG analyzeWithKnowledgeBase] typeof:", typeof product.foodData?.ingredients);
      let ingredientsText = "";
      
      if (product.ingredients_text) {
        ingredientsText = product.ingredients_text;
      } else if (product.foodData?.ingredients) {
        const ingredients = product.foodData.ingredients;
        
        // Si c'est un array, on le joint
        if (Array.isArray(ingredients)) {
          ingredientsText = ingredients.join(', ');
        } 
        // Si c'est déjà un string, on l'utilise tel quel
        else if (typeof ingredients === 'string') {
          ingredientsText = ingredients;
        }
      }

      if (!ingredientsText) {
        logger.warn('⚠️  Pas d\'ingrédients à analyser avec knowledge base');
        return {
          analyzed: false,
          reason: 'no_ingredients',
          criticalIssues: [],
          highIssues: [],
          moderateIssues: []
        };
      }

      // Appeler knowledge service
      const analysis = knowledgeService.analyzeProductComplete({
        name: product.name || product.product_name,
        ingredients: ingredientsText
      });

        // ⭐ CONVERSION specificData → criticalIssues/highIssues/moderateIssues
        if (analysis.ingredientsAnalysis) {
          for (const ingredientAnalysis of analysis.ingredientsAnalysis) {
            if (ingredientAnalysis.specificData && ingredientAnalysis.specificData.variants) {
              for (const variant of ingredientAnalysis.specificData.variants) {
                if (variant.risks && variant.risks.length > 0) {
                  for (const risk of variant.risks) {
                    const issue = {
                      ingredient: ingredientAnalysis.name,
                      score: variant.score,
                      category: variant.type,
                      details: risk.details,
                      level: risk.severity
                    };
                    
                    if (risk.severity === 'critical') {
                      analysis.criticalIssues.push(issue);
                    } else if (risk.severity === 'high') {
                      analysis.highIssues.push(issue);
                    } else if (risk.severity === 'moderate') {
                      analysis.moderateIssues.push(issue);
                    }
                  }
                }
              }
            }
          }
        }
      logger.info(`📊 Knowledge base: ${analysis.criticalIssues.length} critiques, ${analysis.highIssues.length} élevés, ${analysis.moderateIssues.length} modérés`);

      return {
        analyzed: true,
        ...analysis,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('❌ Erreur analyse knowledge base:', error.message);
      return {
        analyzed: false,
        error: error.message,
        criticalIssues: [],
        highIssues: [],
        moderateIssues: []
      };
    }
  }

  /**
   * ============================================================================
   * NOUVELLE MÉTHODE : Construire contexte hybride pour DeepSeek
   * ============================================================================
   */
  static buildHybridContext(product, knowledgeAnalysis) {
    const baseContext = this.buildEnrichmentContext(product);

    // Ajouter contexte scientifique si disponible
    if (knowledgeAnalysis.analyzed) {
      baseContext.scientificContext = {
        knowledgeBaseAnalysis: {
          totalIngredients: knowledgeAnalysis.totalIngredients,
          criticalIssues: knowledgeAnalysis.criticalIssues,
          highIssues: knowledgeAnalysis.highIssues,
          moderateIssues: knowledgeAnalysis.moderateIssues,
          scoreImpact: knowledgeAnalysis.scoreImpact,
          redFlags: knowledgeAnalysis.redFlags,
          hiddenProcesses: knowledgeAnalysis.hiddenProcesses
        },
        instructions: `
IMPORTANT : Une base de connaissance scientifique a pré-analysé ce produit.
Utilise ces détections pour affiner ton analyse des 8 composantes Ecolojia.

Règles :
- Si un ingrédient est dans criticalIssues → impact FORT sur scores concernés
- Si procédé caché détecté → réduire processingScore significativement
- Si red flag détecté → réduire scores concernés
- Cite les sources scientifiques fournies par la knowledge base
- Ajoute ton expertise pour aspects non couverts par la base

Score impact détecté : ${knowledgeAnalysis.scoreImpact} points
Ceci doit influencer tes calculs de composantes.
        `.trim()
      };
    }

    return baseContext;
  }

  /**
   * ============================================================================
   * NOUVELLE MÉTHODE : Merger données hybrides
   * ============================================================================
   */
  static mergeHybridData(product, knowledgeAnalysis, aiData) {
    const merged = this.mergeEnrichedData(product, aiData);

    // Enrichir avec détections knowledge base
    if (knowledgeAnalysis.analyzed) {
      merged.knowledgeDetections = {
        criticalIssues: knowledgeAnalysis.criticalIssues,
        highIssues: knowledgeAnalysis.highIssues,
        moderateIssues: knowledgeAnalysis.moderateIssues,
        redFlags: knowledgeAnalysis.redFlags,
        hiddenProcesses: knowledgeAnalysis.hiddenProcesses,
        recommendations: knowledgeAnalysis.recommendations
      };

      // Ajuster confiance selon détections
      if (merged.scores) {
        const baseConfidence = merged.scores.confidence || 0.7;
        const knowledgeBonus = knowledgeAnalysis.analyzed ? 0.15 : 0;
        merged.scores.confidence = Math.min(baseConfidence + knowledgeBonus, 0.95);
      }
    }

    // ⭐ COPIER globalScore du product original vers merged
    if (product.globalScore !== undefined) {
      merged.globalScore = product.globalScore;
      logger.info(`📊 globalScore copié dans merged: ${merged.globalScore}/100`);
    }

    return merged;
  }

  /**
   * ============================================================================
   * MÉTHODES EXISTANTES (conservées)
   * ============================================================================
   */

  static validateProductData(product) {
    logger.info('🔍 Validation données produit...');
    console.log("[DEBUG validateProductData] product reçu:", { name: product.name, hasFoodData: !!product.foodData, foodDataType: typeof product.foodData, ingredients: product.foodData?.ingredients?.substring(0, 50) });

    // ⭐ FIX: Mongoose document → plain object
    const validated = product.toObject ? product.toObject() : { ...product };

    // Validation ingrédients
    if (validated.foodData?.ingredients) {
      if (Array.isArray(validated.foodData.ingredients)) {
        validated.ingredients_text = validated.foodData.ingredients.join(', ');
      } else if (typeof validated.foodData.ingredients === 'string') {
        validated.ingredients_text = validated.foodData.ingredients;
      }
    }

    // Nettoyer NaN potentiels
    if (validated.scores) {
      Object.keys(validated.scores).forEach(key => {
        if (typeof validated.scores[key] === 'number' && isNaN(validated.scores[key])) {
          logger.warn(`⚠️  Score ${key} est NaN - Remplacé par null`);
          validated.scores[key] = null;
        }
      });
    }

    console.log("[DEBUG validateProductData] RETOURNE:", { name: validated.name, hasIngredientsText: !!validated.ingredients_text, ingredientsTextLength: validated.ingredients_text?.length, hasFoodData: !!validated.foodData });
    return validated;
  }

  static buildEnrichmentContext(product) {
    const category = product.category || 'food';

    return {
      productName: product.name || product.product_name || 'Produit inconnu',
      brand: product.brand || '',
      category: category,
      ingredients: product.ingredients_text || '',
      currentScores: product.scores || {},
      barcode: product.barcode || product.code || '',
      existingData: {
        hasNutritionFacts: !!(product.foodData?.nutrition || product.nutrition),
        hasIngredients: !!(product.ingredients_text || product.foodData?.ingredients),
        hasImages: !!(product.image_url || product.images)
      }
    };
  }

  static async callDeepSeekWithRetry(context, maxRetries = 2) {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY manquante');
    }

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`🔄 Tentative ${attempt}/${maxRetries}...`);

        const category = context.category || 'food';
        
        const result = await deepSeekService.analyzeProduct({
          apiKey,
          product: {
            name: context.productName,
            brand: context.brand,
            ingredients_text: context.ingredients,
            category: category,
            scientificContext: context.scientificContext // NOUVEAU : Contexte hybride
          },
          category
        });

        logger.info('✅ Appel DeepSeek réussi');
        return { enrichedData: result };

      } catch (error) {
        lastError = error;
        logger.warn(`⚠️  Tentative ${attempt} échouée:`, error.message);

        if (attempt < maxRetries) {
          const delay = 1000 * attempt;
          logger.info(`⏳ Retry dans ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  static mergeEnrichedData(product, enrichedData) {
    return {
      ...product,
      ...enrichedData,
      scores: {
        ...(product.scores || {}),
        ...(enrichedData.scores || {})
      },
      foodData: {
        ...(product.foodData || {}),
        ...(enrichedData.foodData || {}),
        nutrition: {
          ...(product.foodData?.nutrition || {}),
          ...(enrichedData.nutrition || {})
        }
      }
    };
  }

  static async recalculateScoreWithValidation(product) {
    try {
      // ✅ NOUVEAU : Utiliser les scores DeepSeek directement
      // Les scores IA sont déjà calculés et validés par DeepSeek
      
      const scores = product.scores || {};
      
      // Validation anti-NaN de tous les scores
      Object.keys(scores).forEach(key => {
        if (typeof scores[key] === 'number' && isNaN(scores[key])) {
          logger.warn(`⚠️  Score ${key} est NaN - Remplacé par 50`);
          scores[key] = 50;
        }
      });

      // Calculer le score global à partir des 8 composantes si disponibles
      let globalScore = scores.overallScore || scores.global;
      
      if (!globalScore || isNaN(globalScore)) {
        // Calculer à partir des composantes disponibles
        const components = [
          scores.naturalScore,
          scores.healthScore,
          scores.environmentScore,
          scores.nutriScore,
          scores.additivesScore,
          scores.processingScore,
          scores.originScore,
          scores.labelsScore
        ].filter(s => typeof s === 'number' && !isNaN(s));
        
        if (components.length > 0) {
          globalScore = Math.round(components.reduce((a, b) => a + b, 0) / components.length);
          logger.info(`📊 Score global recalculé : ${globalScore}/100 (moyenne de ${components.length} composantes)`);
        } else {
          globalScore = 50;
          logger.warn('⚠️  Aucune composante valide - Score global par défaut : 50');
        }
      }

      // Validation finale du score global
      if (globalScore < 0) globalScore = 0;
      if (globalScore > 100) globalScore = 100;

      return {
        ...product,
        scores: {
          ...scores,
          overallScore: globalScore,
          global: globalScore
        }
      };

    } catch (error) {
      logger.error('❌ Erreur recalcul score:', error.message);
      return {
        ...product,
        scores: {
          ...(product.scores || {}),
          overallScore: 50,
          global: 50,
          confidence: 0.5
        }
      };
    }
  }
}

module.exports = AIEnrichmentService;




