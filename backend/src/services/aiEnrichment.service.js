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
   * ✅ CORRECTION : Sauvegarde automatique en MongoDB
   */
  static async enrichProductWithAI(product) {
    const startTime = Date.now();
    logger.info(`🤖 Début enrichissement HYBRIDE - Produit: ${product.name}`);

    try {
      // Initialiser knowledge service
      if (!knowledgeService.initialized) {
        logger.info('📚 Initialisation knowledge service...');
        await knowledgeService.initialize();
      }

      // 1️⃣ VALIDATION
      const validatedProduct = this.validateProductData(product);

      // 2️⃣ ANALYSE KNOWLEDGE BASE
      logger.info('🔬 Analyse base de connaissance scientifique...');
      const knowledgeAnalysis = await this.analyzeWithKnowledgeBase(validatedProduct);

      // 3️⃣ CONTEXTE HYBRIDE
      logger.info('📝 Construction contexte hybride pour DeepSeek...');
      const hybridContext = this.buildHybridContext(validatedProduct, knowledgeAnalysis);

      // 4️⃣ APPEL DEEPSEEK
      logger.info('📡 Appel DeepSeek API (avec contexte scientifique)...');
      const aiResponse = await this.callDeepSeekWithRetry(hybridContext, 2);

      if (!aiResponse || !aiResponse.enrichedData) {
        throw new Error('Réponse IA invalide ou vide');
      }

      // 5️⃣ MERGE DONNÉES
      logger.info('🔄 Merge données hybrides...');
      const enrichedProduct = this.mergeHybridData(
        validatedProduct,
        knowledgeAnalysis,
        aiResponse.enrichedData
      );

      // 6️⃣ RECALCUL SCORE
      logger.info('📊 Recalcul score avec données hybrides...');
      const scoredProduct = await this.recalculateScoreWithValidation(enrichedProduct);

      // Calcul globalScore
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

        const validScores = scoreComponents.filter(s => s !== null && s !== undefined && !isNaN(s));

        if (validScores.length > 0) {
          scoredProduct.globalScore = Math.round(
            validScores.reduce((sum, score) => sum + score, 0) / validScores.length
          );
          logger.info(`📊 globalScore: ${scoredProduct.globalScore}/100 (${validScores.length} composantes)`);
        }
      }

            // 🛡️ Normalisation de secours des scores pour éviter des 0 techniques
      if (scoredProduct && scoredProduct.scores) {
        const baseScores =
          (validatedProduct && validatedProduct.scores) ||
          (product && product.scores) ||
          {};

        // Si le moteur scientifique renvoie 0 mais que l'analyse basique avait un score neutre
        if (scoredProduct.scores.healthScore === 0 && baseScores && typeof baseScores.health === 'number') {
          scoredProduct.scores.healthScore = baseScores.health;
        }

        if (scoredProduct.scores.environmentScore === 0 && baseScores && typeof baseScores.eco === 'number') {
          scoredProduct.scores.environmentScore = baseScores.eco;
        }

        if (scoredProduct.scores.overallScore === 0) {
          let baseOverall = null;
          if (baseScores && typeof baseScores.overallScore === 'number') {
            baseOverall = baseScores.overallScore;
          } else if (baseScores && typeof baseScores.global === 'number') {
            baseOverall = baseScores.global;
          }

          if (typeof baseOverall === 'number') {
            scoredProduct.scores.overallScore = baseOverall;
            scoredProduct.scores.global = baseOverall;
          }
        }
      }

      const duration = Date.now() - startTime;
      const finalScore = scoredProduct.scores?.overallScore || scoredProduct.scores?.global || 50;
      logger.info(`✅ Enrichissement réussi - Score: ${finalScore}/100 - Durée: ${duration}ms`);

      // 7️⃣ ✨ SAUVEGARDE MONGODB (CORRECTION CRITIQUE)
      logger.info('💾 Sauvegarde enrichissement en MongoDB...');
      
      const Product = require('../models/Product');
      
      // 🔧 CONSTRUCTION MANUELLE nutritionalInfo depuis nutriments
      const nutritionalInfoToSave = scoredProduct.nutriments ? {
        energy: scoredProduct.nutriments.energy_100g || scoredProduct.nutriments.energy,
        fat: scoredProduct.nutriments.fat_100g || scoredProduct.nutriments.fat,
        saturatedFat: scoredProduct.nutriments['saturated-fat_100g'] || scoredProduct.nutriments['saturated-fat'],
        carbohydrates: scoredProduct.nutriments.carbohydrates_100g || scoredProduct.nutriments.carbohydrates,
        sugars: scoredProduct.nutriments.sugars_100g || scoredProduct.nutriments.sugars,
        fiber: scoredProduct.nutriments.fiber_100g || scoredProduct.nutriments.fiber,
        proteins: scoredProduct.nutriments.proteins_100g || scoredProduct.nutriments.proteins,
        salt: scoredProduct.nutriments.salt_100g || scoredProduct.nutriments.salt,
        sodium: scoredProduct.nutriments.sodium_100g || scoredProduct.nutriments.sodium
      } : null;
      const updatedProduct = await Product.findByIdAndUpdate(
        product._id,
        {
          $set: {
            'scores.overallScore': scoredProduct.scores?.overallScore,
            'scores.global': scoredProduct.scores?.global,
            'scores.healthScore': scoredProduct.scores?.healthScore,
            'scores.environmentScore': scoredProduct.scores?.environmentScore,
            'scores.nutritionScore': scoredProduct.scores?.nutritionScore,
            'scores.additivesScore': scoredProduct.scores?.additivesScore,
            'scores.novaScore': scoredProduct.scores?.novaScore,
            'scores.nutriScore': scoredProduct.scores?.nutriScore,
            'scores.originScore': scoredProduct.scores?.originScore,
            'scores.labelsScore': scoredProduct.scores?.labelsScore,
            'scores.traceabilityScore': scoredProduct.scores?.traceabilityScore,
            'scores.confidence': scoredProduct.scores?.confidence,
            'scores.breakdown': scoredProduct.scores?.breakdown,
            globalScore: scoredProduct.globalScore,
            aiEnriched: true,
            aiEnrichmentDate: new Date(),
            aiEnrichmentVersion: '3.1-hybrid-mongodb',
            knowledgeBaseUsed: true,
            confidence: scoredProduct.scores?.confidence || 0.8,
            ingredients_text: scoredProduct.ingredients_text,
            nutrition: scoredProduct.nutrition,
            'foodData.nutritionalInfo': nutritionalInfoToSave,
            subcategory: scoredProduct.subcategory || null,
            tags: Array.isArray(scoredProduct.tags) ? scoredProduct.tags : []
          }
        },
        { new: true, runValidators: false }
      );
      
      if (!updatedProduct) {
  logger.warn('⚠️ Produit non trouvé en base lors de la sauvegarde IA, retour mémoire uniquement');
  const hydrated = scoredProduct.toObject ? scoredProduct.toObject() : scoredProduct;

  // On garde l'_id d'origine si possible
  if (product._id && !hydrated._id) {
    hydrated._id = product._id;
  }

  hydrated.knowledgeAnalysis = knowledgeAnalysis;
  hydrated.aiEnriched = true;
  hydrated.enrichmentConfidence = scoredProduct.scores?.confidence || 0.8;
  hydrated.globalScore = scoredProduct.globalScore ?? hydrated.globalScore;

  return hydrated;
}

logger.info('✅ Produit sauvegardé en MongoDB');
const hydrated = updatedProduct.toObject ? updatedProduct.toObject() : updatedProduct;
hydrated.knowledgeAnalysis = knowledgeAnalysis;
hydrated.aiEnriched = true;
hydrated.enrichmentConfidence = scoredProduct.scores?.confidence || 0.8;
hydrated.globalScore = scoredProduct.globalScore ?? hydrated.globalScore;
return hydrated;

    } catch (error) {
            // 🛡️ Normalisation de secours des scores pour éviter des 0 techniques
      if (scoredProduct && scoredProduct.scores) {
        const baseScores =
          (validatedProduct && validatedProduct.scores) ||
          (product && product.scores) ||
          {};

        // Si le moteur scientifique renvoie 0 mais que l'analyse basique avait un score neutre
        if (scoredProduct.scores.healthScore === 0 && baseScores && typeof baseScores.health === 'number') {
          scoredProduct.scores.healthScore = baseScores.health;
        }

        if (scoredProduct.scores.environmentScore === 0 && baseScores && typeof baseScores.eco === 'number') {
          scoredProduct.scores.environmentScore = baseScores.eco;
        }

        if (scoredProduct.scores.overallScore === 0) {
          let baseOverall = null;
          if (baseScores && typeof baseScores.overallScore === 'number') {
            baseOverall = baseScores.overallScore;
          } else if (baseScores && typeof baseScores.global === 'number') {
            baseOverall = baseScores.global;
          }

          if (typeof baseOverall === 'number') {
            scoredProduct.scores.overallScore = baseOverall;
            scoredProduct.scores.global = baseOverall;
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.error(`❌ Échec enrichissement - Durée: ${duration}ms - Erreur: ${error.message}`);

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
      // console.log("[DEBUG analyzeWithKnowledgeBase] product.ingredients_text:", product.ingredients_text);
      // console.log("[DEBUG analyzeWithKnowledgeBase] product.foodData:", product.foodData);
      // console.log("[DEBUG analyzeWithKnowledgeBase] product.foodData?.ingredients:", product.foodData?.ingredients);
      // console.log("[DEBUG analyzeWithKnowledgeBase] typeof:", typeof product.foodData?.ingredients);
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
      const analysis = await knowledgeService.analyzeProductComplete({
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
    // console.log("[DEBUG validateProductData] product reçu:", { name: product.name, hasFoodData: !!product.foodData, foodDataType: typeof product.foodData, ingredients: product.foodData?.ingredients?.substring(0, 50) });

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

    // console.log("[DEBUG validateProductData] RETOURNE:", { name: validated.name, hasIngredientsText: !!validated.ingredients_text, ingredientsTextLength: validated.ingredients_text?.length, hasFoodData: !!validated.foodData });
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

  /**
   * Normalise nutriScore en format STRING ('A', 'B', 'C', 'D', 'E') ou null
   * Gère : chaînes, nombres (0-100), null/undefined
   */
  static normalizeNutriScore(value) {
    if (!value && value !== 0) return null;
    
    // Si c'est une chaîne, extraire la première lettre en majuscule
    if (typeof value === 'string') {
      const match = value.toUpperCase().match(/[A-E]/);
      return match ? match[0] : null;
    }
    
    // Si c'est un nombre, mapper sur l'échelle Nutri-Score (85=A, 70=B, 50=C, 30=D, 15=E)
    if (typeof value === 'number') {
      if (value >= 70) return 'A';      // 85 = A
      if (value >= 55) return 'B';      // 70 = B
      if (value >= 40) return 'C';      // 50 = C
      if (value >= 25) return 'D';      // 30 = D
      return 'E';                       // 15 = E
    }
    
    return null;
  }

  static async recalculateScoreWithValidation(product) {
    try {
      logger.info('🧬 Recalcul score avec moteur scientifique scoringUnified...');

      const plain = product.toObject ? product.toObject() : { ...product };
      const category = plain.category || plain.categoryType || 'food';

      // 🔧 Mapper noms MongoDB → noms scoringUnified
      const rawNutrition = plain.nutriments || plain.nutrition || (plain.foodData && plain.foodData.nutrition) || {};
      const nutriments = {
        // Mapping sugar → sugars_100g
        sugars_100g: rawNutrition.sugar ?? rawNutrition.sugars_100g,
        // Mapping salt → salt_100g
        salt_100g: rawNutrition.salt ?? rawNutrition.salt_100g,
        // Mapping saturated_fat → saturated-fat_100g
        'saturated-fat_100g': rawNutrition.saturated_fat ?? rawNutrition['saturated-fat_100g'] ?? rawNutrition.saturated_fat_100g,
        // Garder tous les autres champs tels quels
        ...rawNutrition
      };

      // Construire les données d'entrée pour scoringUnified (voir scoringUnified.js)
      const scoringData = {
        category: category,
        product_name: plain.name || plain.product_name || '',
        brands: plain.brand || plain.brands || '',
        ingredients_text: plain.ingredients_text || '',
        nutriments,
        // 🔧 FIX: nova_group (racine MongoDB) avant novaGroup (foodData)
        nova_group:
          plain.nova_group ||
          (plain.foodData && plain.foodData.novaGroup) ||
          (plain.scores && plain.scores.novaGroup) ||
          null,
        nutriScore:
          (plain.foodData && plain.foodData.nutriScore) ||
          (plain.scores && plain.scores.nutriScore) ||
          null,
        additives:
          (plain.foodData && plain.foodData.additives) ||
          plain.additives ||
          [],
        // 🔧 FIX: ecoscore_grade (racine MongoDB) avant ecoScore (foodData)
        ecoscore_grade:
          plain.ecoscore_grade ||
          (plain.foodData && plain.foodData.ecoScore) ||
          (plain.scores && plain.scores.ecoScore) ||
          null,
        labels:
          (plain.foodData && plain.foodData.labels) ||
          plain.labels ||
          []
      };

      // Normaliser nutriScore pour le moteur scientifique
      scoringData.nutriScore = this.normalizeNutriScore(scoringData.nutriScore);

      let scientificScores;

      // Router par catégorie
      if (category === 'cosmetics' || category === 'beauty') {
        scientificScores = scoringUnified.calculateCosmeticsScores(scoringData);
      } else if (category === 'detergents' || category === 'detergent' || category === 'cleaning') {
        scientificScores = scoringUnified.calculateDetergentsScores(scoringData);
      } else {
        // Par défaut : moteur alimentaire
        scientificScores = scoringUnified.calculateFoodScores(scoringData);
      }

      if (!scientificScores || typeof scientificScores.overallScore === 'undefined') {
        logger.warn('⚠️ Moteur scientifique na pas renvoyé de score, fallback 50');
        return {
          ...plain,
          scores: {
            ...(plain.scores || {}),
            overallScore: 50,
            global: 50,
            confidence: 0.3,
            scoringVersion: '3.1.0-fallback',
            scoringError: 'scientific engine returned no score'
          }
        };
      }

      logger.info('Score scientifique calculé (moteur scientifique exécuté)');

      const ensureNumber = (value, fallback = 0) =>
        typeof value === 'number' && Number.isFinite(value) ? value : fallback;

      const ensureObject = (value, fallback = {}) =>
        value && typeof value === 'object' ? value : fallback;

      const mergedScores = {
        ...(plain.scores || {}),

        // 🧬 RÉSULTATS SCIENTIFIQUES PRIORITAIRES (avec fallback)
        overallScore: ensureNumber(
          scientificScores.overallScore,
          (plain.scores && (plain.scores.overallScore ?? plain.scores.global)) ?? 50
        ),
        global: ensureNumber(
          scientificScores.overallScore,
          (plain.scores && (plain.scores.global ?? plain.scores.overallScore)) ?? 50
        ),
        healthScore: ensureNumber(
          scientificScores.healthScore,
          (plain.scores && (plain.scores.healthScore ?? plain.scores.health)) ?? 50
        ),
        environmentScore: ensureNumber(
          scientificScores.environmentScore,
          (plain.scores && (plain.scores.environmentScore ?? plain.scores.eco)) ?? 50
        ),

        // 🧬 BREAKDOWN COMPLET 8 COMPOSANTES
        breakdown: ensureObject(
          scientificScores.breakdown,
          (plain.scores && plain.scores.breakdown) || {}
        ),

        // 🧬 QUALITÉ DES DONNÉES
        confidence: ensureNumber(
          scientificScores.confidence,
          typeof (plain.scores && plain.scores.confidence) === 'number'
            ? plain.scores.confidence
            : 0.5
        ),
        dataQualityInfo: scientificScores.dataQualityInfo || (plain.scores && plain.scores.dataQualityInfo),
        dataCompleteness: scientificScores.dataCompleteness || (plain.scores && plain.scores.dataCompleteness),
        missingData: scientificScores.missingData || (plain.scores && plain.scores.missingData),

        // 🧬 MÉTADONNÉES
        scoringVersion:
          (scientificScores.scoringMetadata && scientificScores.scoringMetadata.version) ||
          scientificScores.scoringVersion ||
          '3.1.0',
        scoringMethod:
          (scientificScores.scoringMetadata && scientificScores.scoringMetadata.methodology) ||
          'ECOLOJIA V3 - Scoring scientifique 8 composantes',
        calculatedAt:
          (scientificScores.scoringMetadata && scientificScores.scoringMetadata.calculatedAt) ||
          new Date().toISOString(),

        // 🔍 TRACE IA : on garde les scores IA dans un champ séparé
        aiEnrichmentUsed: true,
        deepSeekScores: plain.scores || {}
      };

      return {
        ...plain,
        scores: mergedScores,
        globalScore: scientificScores.overallScore,
        scientificBreakdown: scientificScores.breakdown
      };
    } catch (error) {
      logger.error('❌ Erreur recalcul score scientifique:', error.message);
      return {
        ...product,
        scores: {
          ...(product.scores || {}),
          overallScore: 50,
          global: 50,
          confidence: 0.3,
          scoringVersion: '3.1.0-fallback',
          scoringError: error.message
        }
      };
    }
  }
  /**
   * Analyse photo produit avec DeepSeek Vision (OCR)
   * @param {Buffer} photoBuffer - Photo en buffer
   * @returns {Promise<Object>} { success, extractedText, barcode, name, brand, ingredients_text, confidence }
   */
  static async analyzeProductPhoto(photoBuffer) {
    try {
      const base64Image = photoBuffer.toString('base64');

      const prompt = `Analyse cette photo de produit alimentaire/cosmétique.
Extrais UNIQUEMENT ces informations si visibles :
- Code-barres (EAN-13/EAN-8)
- Nom du produit
- Marque
- Liste d'ingrédients complète

Réponds en JSON strict :
{
  "barcode": "code si visible ou null",
  "name": "nom produit ou null",
  "brand": "marque ou null",
  "ingredients_text": "liste complète ingrédients ou null",
  "extractedText": "tout le texte visible sur l'étiquette"
}`;

      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const completion = response.data.choices[0].message.content;

      // Parser JSON (retirer markdown si présent)
      let cleaned = completion.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/, '').replace(/```\n?$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/, '').replace(/```\n?$/, '');
      }

      const parsed = JSON.parse(cleaned);

      return {
        success: true,
        barcode: parsed.barcode || null,
        name: parsed.name || null,
        brand: parsed.brand || null,
        ingredients_text: parsed.ingredients_text || null,
        extractedText: parsed.extractedText || '',
        confidence: 75
      };

    } catch (error) {
      console.error('❌ [AIEnrichment] Vision OCR error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

}

module.exports = AIEnrichmentService;




