/**
 * PHOTO ANALYSIS SERVICE V1.1
 * Constitution simplifiée : 6 sections → 3 CARTES (Scope V1)
 * 
 * Pipeline 6 étapes :
 * 1. Validation qualité
 * 2. OCR rapide (extraction texte)
 * 3. Résolution cache
 * 4. Détection catégorie
 * 5. Enrichissement IA (si nécessaire)
 * 6. Sauvegarde + Constitution
 */

const ImageQualityService = require('./imageQuality.service');
const CategoryDetectionService = require('./categoryDetection.service');
const CacheResolverService = require('./cacheResolver.service');
const AIEnrichmentService = require('./aiEnrichment.service');
const OCRProductService = require('./OCRProductService');
const Product = require('../models/Product');
const crypto = require('crypto');
const templates = require('../templates/constitution.templates');
const habitsLibrary = require('../data/habits-library.json');

class PhotoAnalysisService {
  /**
   * Analyse complète photo → Constitution
   * @param {Buffer} photoBuffer - Photo en buffer
   * @param {Object} options - Options { category?: string, userId?: string }
   * @returns {Promise<AnalysisResult>}
   */
  static async analyzePhoto(photoBuffer, options = {}) {
    const startTime = Date.now();
    const { category: suggestedCategory, userId } = options;

    console.log('\n📸 DÉBUT ANALYSE PHOTO');

    try {
      // ======================================
      // ÉTAPE 1 : VALIDATION QUALITÉ
      // ======================================
      console.log('🔍 Étape 1/6 : Validation qualité...');
      const qualityResult = await ImageQualityService.analyzeQuality(photoBuffer);

      if (!qualityResult.isValid) {
        return {
          success: false,
          error: 'QUALITY_CHECK_FAILED',
          message: 'Photo de qualité insuffisante',
          issues: qualityResult.issues,
          instructions: ImageQualityService.getInstructions(qualityResult.issues),
          processingTime: Date.now() - startTime
        };
      }

      console.log('✅ Qualité OK (score:', qualityResult.quality + ')');

      // ======================================
      // ÉTAPE 2 : OCR RAPIDE
      // ======================================
      console.log('🔍 Étape 2/6 : Extraction texte OCR...');
      const ocrResult = await this._performOCR(photoBuffer);

      if (!ocrResult.success) {
        return {
          success: false,
          error: 'OCR_FAILED',
          message: 'Impossible d\'extraire le texte de la photo',
          instructions: ['Assurez-vous que le texte est lisible', 'Améliorez l\'éclairage'],
          processingTime: Date.now() - startTime
        };
      }

      console.log('✅ OCR OK (confidence:', ocrResult.confidence + '%)');

      // ======================================
      // ÉTAPE 3 : RÉSOLUTION CACHE
      // ======================================
      console.log('🔍 Étape 3/6 : Recherche cache...');

      // Générer photoHash
      const photoHash = this._generatePhotoHash(photoBuffer);

      // Chercher cache (barcode → fuzzy → photoHash)
      const cacheResult = await CacheResolverService.resolve({
        barcode: ocrResult.barcode,
        name: ocrResult.name,
        brand: ocrResult.brand,
        photoHash
      });

      if (cacheResult.found) {
        console.log('✅ CACHE HIT (niveau:', cacheResult.level + ')');

        // Produit trouvé en cache → Constitution immédiate
        const constitution = await this._generateConstitution(cacheResult.product);

        return {
          success: true,
          cached: true,
          cacheLevel: cacheResult.level,
          source: 'cache',
          product: cacheResult.product,
          constitution,
          disclaimer: null,
          processingTime: Date.now() - startTime
        };
      }

      console.log('❌ Cache miss - Analyse IA nécessaire');

      // ======================================
      // ÉTAPE 4 : DÉTECTION CATÉGORIE
      // ======================================
      console.log('🔍 Étape 4/6 : Détection catégorie...');
      const categoryDetection = CategoryDetectionService.detectCategory(
        ocrResult.text,
        { name: ocrResult.name, brand: ocrResult.brand }
      );

      console.log('✅ Catégorie détectée:', categoryDetection.category, '(confidence:', categoryDetection.confidence + '%)');

      // Vérifier si catégorie interdite
      if (CategoryDetectionService.isForbiddenCategory(categoryDetection.category)) {
        const userMessage = CategoryDetectionService.getUserMessage(categoryDetection);

        return {
          success: false,
          error: 'FORBIDDEN_CATEGORY',
          category: categoryDetection.category,
          message: userMessage.message,
          suggestion: userMessage.suggestion,
          disclaimer: categoryDetection.disclaimer,
          processingTime: Date.now() - startTime
        };
      }

      // ======================================
      // ÉTAPE 5 : ENRICHISSEMENT IA
      // ======================================
      console.log('🔍 Étape 5/6 : Enrichissement IA (DeepSeek)...');

      // Générer barcode factice si null (éviter duplicate key error)
      if (!ocrResult.barcode) {
        const hash = crypto.createHash('md5')
          .update(`${ocrResult.name || 'unknown'}-${ocrResult.brand || ''}-${Date.now()}`)
          .digest('hex')
          .substring(0, 13);
        ocrResult.barcode = `PHOTO-${hash}`;
      }

      const enrichmentData = {
        barcode: ocrResult.barcode,
        name: ocrResult.name,
        brand: ocrResult.brand,
        categoryType: categoryDetection.category,
        ingredients_text: ocrResult.ingredients,
        ocrData: {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          extractedFields: ocrResult.extractedFields
        }
      };

      const enrichedProduct = await AIEnrichmentService.enrichProductWithAI(
        enrichmentData,
        photoBuffer,
        { includeVision: true }
      );

      // ======================================
      // ÉTAPE 6 : SAUVEGARDE + CONSTITUTION
      // ======================================
      console.log('🔍 Étape 6/6 : Sauvegarde + Constitution...');

      // Ajouter métadonnées photo
      enrichedProduct.photoHash = photoHash;
      enrichedProduct.photoOriginalUrl = null;
      enrichedProduct.extractedBy = 'photo-ocr';
      enrichedProduct.extractedAt = new Date();
      enrichedProduct.lastScannedAt = new Date();
      enrichedProduct.ocrData = ocrResult;
      enrichedProduct.ocrConfidence = ocrResult.confidence;

      // Chercher si produit existe déjà (par barcode ou nom+brand)
      let savedProduct = null;
      
      if (ocrResult.barcode && !ocrResult.barcode.startsWith('PHOTO-')) {
        savedProduct = await Product.findOne({ barcode: ocrResult.barcode });
      }
      
      if (!savedProduct && ocrResult.name) {
        savedProduct = await Product.findOne({
          name: { $regex: new RegExp(`^${ocrResult.name}$`, 'i') },
          brand: { $regex: new RegExp(`^${ocrResult.brand || ''}$`, 'i') }
        });
      }

      // Si produit existe, mettre à jour. Sinon créer.
      if (savedProduct) {
        console.log('✅ Produit existant trouvé (_id:', savedProduct._id + ') - Mise à jour');
        savedProduct.lastScannedAt = new Date();
        savedProduct.scanCount = (savedProduct.scanCount || 0) + 1;
        await savedProduct.save();
      } else {
        console.log('📝 Nouveau produit - Sauvegarde en base...');
        const cacheMetadata = {
          photoHash,
          extractedBy: 'photo-ocr',
          ocrData: ocrResult,
          ocrConfidence: ocrResult.confidence
        };
        savedProduct = await CacheResolverService.saveEnrichedProduct(enrichedProduct, cacheMetadata);
      }

      // Générer Constitution Ecolojia
      const constitution = await this._generateConstitution(savedProduct || enrichedProduct);
      console.log('✅ ANALYSE TERMINÉE - Constitution générée');

      return {
        success: true,
        cached: savedProduct ? true : false,
        source: savedProduct ? 'cache-updated' : 'ai',
        product: savedProduct || enrichedProduct,
        constitution,
        categoryDetection,
        disclaimer: categoryDetection.disclaimer || null,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Erreur analyse photo:', error);
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  static async _performOCR(photoBuffer) {
    try {
      const ocrResult = await OCRProductService.extractTextFromSinglePhoto(photoBuffer);
      if (!ocrResult.success) {
        return { success: false };
      }
      return {
        success: true,
        text: ocrResult.text || '',
        barcode: ocrResult.barcode || null,
        name: ocrResult.name || null,
        brand: ocrResult.brand || null,
        ingredients: ocrResult.ingredients || null,
        confidence: ocrResult.confidence || 70,
        extractedFields: ocrResult
      };
    } catch (error) {
      console.error('❌ OCR error:', error);
      return { success: false };
    }
  }

  static _generatePhotoHash(photoBuffer) {
    return crypto.createHash('sha256').update(photoBuffer).digest('hex');
  }

  static async _generateConstitution(product) {
    const selectedHabit = this._selectHabitFromLibrary(product);
    return {
      whatIsIt: {
        icon: '🧠',
        title: 'Ce que c\'est vraiment',
        content: this._generateWhatIsIt(product)
      },
      healthReflex: {
        icon: '🌱',
        title: 'Le bon réflexe santé',
        content: this._generateHealthReflex(product, selectedHabit)
      },
      actions: {
        icon: '🔁',
        title: 'Ce que tu peux faire',
        content: 'Voici ce que tu peux faire concrètement :',
        items: this._generateActionItems(product)
      },
      associatedHabit: selectedHabit
    };
  }


  // ========================================
  // HELPERS - Constitution enrichie
  // ========================================

  /**
   * Extraire niveau NOVA depuis scores
   * @param {Object} scores - Scores produit
   * @returns {number|null} - Niveau NOVA (1-4) ou null
   */
  static _extractNovaLevel(scores) {
    console.log("[CONSTITUTION] 📊 Extraction NOVA level...");
    if (!scores) return null;
    const processingScore = scores.processing || 0;
    
    // Mapping score → NOVA (logique inverse : score faible = ultra-transformé)
    if (processingScore >= 75) return 1; // Brut
    if (processingScore >= 60) return 2; // Peu transformé
    if (processingScore >= 40) return 3; // Transformé
    return 4; // Ultra-transformé
  }

  /**
   * Extraire top N ingrédients depuis texte
   * @param {string} ingredientsText - Texte ingrédients
   * @param {number} count - Nombre d'ingrédients à extraire
   * @returns {Array<string>} - Tableau ingrédients (max count)
   */
  static _extractTopIngredients(ingredientsText, count = 3) {
    console.log("[CONSTITUTION] 🥕 Extraction top", count, "ingrédients...");
    if (!ingredientsText || typeof ingredientsText !== 'string') return [];
    
    // Nettoyer et séparer par virgule/point-virgule
    const ingredients = ingredientsText
      .split(/[,;]/g)
      .map(i => i.trim())
      .filter(i => i.length > 0)
      .slice(0, count);
    
    // Nettoyer chaque ingrédient (retirer quantités entre parenthèses)
    return ingredients.map(ing => {
      // Retirer contenu entre parenthèses (ex: "sucre (57%)" → "sucre")
      return ing.replace(/\s*\([^)]*\)/g, '').trim();
    });
  }

  /**
   * Générer carte 1 : "Ce que c'est vraiment" (VERSION AMÉLIORÉE)
   * Inclut : NOVA + top 3 ingrédients
   * @param {Object} product - Produit
   * @returns {string} - Description enrichie
   */
  static _generateWhatIsIt(product) {
    const { name, categoryType, subcategory, brand, scores, ingredients_text } = product;
    
    // 1. Label catégorie
    const categoryLabel = templates.categoryLabels[categoryType] || templates.categoryLabels.default;
    
    // 2. Extraire NOVA
    const novaLevel = this._extractNovaLevel(scores);
    const novaInfo = novaLevel ? templates.novaLevels[novaLevel] : null;
    
    // 3. Extraire top 3 ingrédients
    const topIngredients = this._extractTopIngredients(ingredients_text, 3);
    
    // 4. Construire phrase principale
    let mainPhrase = '';
    
    if (brand && novaInfo) {
      // Cas optimal : marque + NOVA
      mainPhrase = templates.whatIsItTemplates.withBrandAndNova(name, brand, novaInfo.label, novaLevel);
    } else if (brand) {
      // Cas : marque uniquement
      mainPhrase = templates.whatIsItTemplates.withBrandOnly(name, brand, categoryLabel);
    } else if (novaInfo) {
      // Cas : NOVA uniquement
      mainPhrase = templates.whatIsItTemplates.withNovaOnly(name, novaInfo.label, novaLevel);
    } else {
      // Cas minimal
      mainPhrase = templates.whatIsItTemplates.basic(name, categoryLabel);
    }
    
    // 5. Ajouter ingrédients principaux si disponibles
    let ingredientsSuffix = '';
    if (topIngredients.length === 3) {
      ingredientsSuffix = templates.ingredientsTemplates.threeIngredients(topIngredients);
    } else if (topIngredients.length === 2) {
      ingredientsSuffix = templates.ingredientsTemplates.twoIngredients(topIngredients);
    } else if (topIngredients.length === 1) {
      ingredientsSuffix = templates.ingredientsTemplates.oneIngredient(topIngredients);
    }
    
    return mainPhrase + ingredientsSuffix + '.';
  }


  /**
   * Générer carte 2 : "Le bon réflexe santé" (VERSION AMÉLIORÉE)
   * Inclut : contexte usage + alternatives concrètes
   * @param {Object} product - Produit
   * @param {Object} habit - Habitude sélectionnée
   * @returns {string} - Réflexe santé contextualisé
   */
  static _generateHealthReflex(product, habit) {
    const { scores, subcategory } = product;
    const overall = scores?.overall || 50;
    
    // 1. Déterminer contexte selon score
    const context = templates.getHealthContext(overall);
    const contextData = templates.healthReflexContexts[context];
    
    // 2. Construire action selon contexte
    let action = '';
    
    if (context === 'excellent') {
      // Score 75-100 : Privilégier
      action = contextData.base;
      
    } else if (context === 'good') {
      // Score 60-74 : Modération
      action = contextData.withModeration;
      
    } else if (context === 'moderate') {
      // Score 40-59 : Occasionnel + alternative
      const alternative = templates.getAlternativeSuggestion(product);
      action = contextData.withAlternative(alternative);
      
    } else {
      // Score <40 : Limiter fortement + alternative
      const alternative = templates.getAlternativeSuggestion(product);
      action = contextData.withAlternative(alternative);
    }
    
    return `Pour ta santé, l'idéal est de ${action}.`;
  }


  /**
   * Générer carte 3 : "Ce que tu peux faire" (VERSION AMÉLIORÉE)
   * Inclut : metadata (count, durée, critère)
   * @param {Object} product - Produit
   * @returns {Array<Object>} - Actions avec metadata
   */
  static _generateActionItems(product) {
    const actions = [];
    const { scores, categoryType, subcategory } = product;
    const overall = scores?.overall || 50;
    
    // ACTION 1 : Alternatives (si score < 70)
    if (overall < 70) {
      // Déterminer critère principal
      const criteriumKey = templates.getMainAlternativeCriterium(product);
      const criterium = templates.alternativeCriteria[criteriumKey];
      
      // Count estimé (V1 : on met "plusieurs", V2 : appel DB réel)
      const estimatedCount = overall < 40 ? 'plusieurs' : 'quelques';
      
      actions.push({
        type: 'alternative',
        label: templates.actionLabels.alternatives.withCount(estimatedCount, criterium),
        icon: '🔄',
        metadata: {
          criterium: criteriumKey,
          estimatedCount
        }
      });
    }
    
    // ACTION 2 : Recette (si food + score < 60)
    if (categoryType === 'food' && overall < 60) {
      // Déterminer durée recette
      const durationKey = templates.getRecipeDuration(product);
      const duration = templates.recipeDurations[durationKey];
      
      // Label avec sous-catégorie si disponible
      const label = subcategory 
        ? templates.actionLabels.recipes.withDuration(subcategory, duration)
        : templates.actionLabels.recipes.generic(duration);
      
      actions.push({
        type: 'recipe',
        label,
        icon: '🍳',
        metadata: {
          duration,
          difficulty: 'facile'
        }
      });
    }
    
    // ACTION 3 : Liste courses (toujours)
    actions.push({
      type: 'list',
      label: templates.actionLabels.shoppingList.add,
      icon: '📝'
    });
    
    // ACTION 4 : Favoris (si < 3 actions)
    if (actions.length < 3) {
      actions.push({
        type: 'favorite',
        label: templates.actionLabels.favorites.add,
        icon: '⭐'
      });
    }
    
    return actions.slice(0, 3);
  }


  /**
   * Évaluer un trigger (expression simple)
   * @param {string} trigger - Expression type "nova_score < 50"
   * @param {Object} product - Produit
   * @returns {boolean} - Trigger valide ou non
   */
  static _evaluateTrigger(trigger, product) {
    const { scores, nutrition, categoryType, ingredients_text } = product;
    
    try {
      // Extraire variable, opérateur, valeur
      const match = trigger.match(/(\w+)\s*(>=|<=|>|<|===|!==)\s*(.+)/);
      if (!match) return false;
      
      const [, variable, operator, rawValue] = match;
      
      // Récupérer valeur réelle du produit
      let actualValue;
      
      switch (variable) {
        case 'nova_score':
        case 'processing_score':
          actualValue = scores?.processing || 0;
          break;
        case 'overall_score':
          actualValue = scores?.overall || 0;
          break;
        case 'additives_score':
          actualValue = scores?.additives || 100;
          break;
        case 'sugar':
          actualValue = nutrition?.sugars || 0;
          break;
        case 'sodium':
          actualValue = nutrition?.sodium || 0;
          break;
        case 'salt_score':
          actualValue = scores?.nutrition || 100;
          break;
        case 'fat_score':
          actualValue = scores?.nutrition || 100;
          break;
        case 'fiber':
          actualValue = nutrition?.fiber || 0;
          break;
        case 'energy_kcal':
          actualValue = nutrition?.energy_kcal || 0;
          break;
        case 'ingredients_count':
          actualValue = ingredients_text ? ingredients_text.split(',').length : 0;
          break;
        case 'categoryType':
          actualValue = categoryType;
          break;
        case 'packaging_score':
          actualValue = scores?.packaging || 50;
          break;
        case 'labels_score':
          actualValue = scores?.labels || 0;
          break;
        case 'environment_score':
          actualValue = scores?.environment || 50;
          break;
        default:
          return false;
      }
      
      // Évaluer comparaison
      const targetValue = rawValue.includes("'") || rawValue.includes('"')
        ? rawValue.replace(/['"]/g, '')
        : parseFloat(rawValue);
      
      switch (operator) {
        case '>': return actualValue > targetValue;
        case '<': return actualValue < targetValue;
        case '>=': return actualValue >= targetValue;
        case '<=': return actualValue <= targetValue;
        case '===': return actualValue === targetValue;
        case '!==': return actualValue !== targetValue;
        default: return false;
      }
      
    } catch (error) {
      console.error(`Erreur évaluation trigger "${trigger}":`, error.message);
      return false;
    }
  }

  /**
   * Sélectionner habitude depuis bibliothèque JSON (VERSION AMÉLIORÉE)
   * Système scoring multi-critères
   * @param {Object} product - Produit
   * @returns {Object} - Habitude sélectionnée
   */
  static _selectHabitFromLibrary(product) {
    const habits = habitsLibrary.habits;
    const { categoryType } = product;
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const habit of habits) {
      let score = 0;
      
      // Évaluer chaque trigger (+1 par trigger valide)
      for (const trigger of habit.triggers) {
        if (this._evaluateTrigger(trigger, product)) {
          score++;
        }
      }
      
      // Bonus catégorie (+2 si match exact, +1 si 'all')
      if (habit.category === categoryType) {
        score += 2;
      } else if (habit.category === 'all') {
        score += 1;
      }
      
      // Mettre à jour meilleur match
      if (score > bestScore) {
        bestScore = score;
        bestMatch = habit;
      }
    }
    
    // Fallback : première habitude si aucun match
    return bestMatch || habits[0];
  }


  static _getCategoryLabel(categoryType) {
    const labels = {
      food: 'alimentaire',
      cosmetic: 'cosmétique',
      detergent: 'd\'entretien',
      supplement: 'complément alimentaire'
    };
    return labels[categoryType] || 'de consommation';
  }
}

module.exports = PhotoAnalysisService;


