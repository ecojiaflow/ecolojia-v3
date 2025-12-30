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
const { RISK_FLAGS } = require('../config/riskFlags.config');
const fs = require('fs');
const path = require('path');

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
    const { scores } = product;
    
    // 1. Calculer FLAGS
    const flags = this._computeFlags(product, scores);
    const context = this._buildContext(product, scores);
    
    // 2. Déterminer niveau
    const productLevel = this._determineLevel(product, flags, context);
    
    // 3. Générer message selon niveau
    let content = '';
    
    switch (productLevel.level) {
      case 1:
        content = this._generateLevel1Message(product, flags, habit);
        break;
      case 2:
        content = this._generateLevel2Message(product, flags, habit);
        break;
      case 3:
        content = this._generateLevel3Message(product, flags, productLevel.sublevel, habit);
        break;
      default:
        content = this._generateLevel2Message(product, flags, habit);
    }
    
    return content;
  }

  static _generateLevel1Message(product, flags, habit) {
    const category = product.categoryType || 'food';
    
    if (category === 'food') {
      return "Pour ta santé, l'idéal est d'intégrer ce type de produit dans une alimentation variée et équilibrée.";
    }
    
    return "Pour ta santé, ce type de produit peut être utilisé sans précaution particulière.";
  }

  static _generateLevel2Message(product, flags, habit) {
    const category = product.categoryType || 'food';
    
    let message = "Dans une perspective d'habitudes durables, ";
    
    if (category === 'food') {
      message += "limiter la fréquence d'intégration de ce type de produit. ";
      
      const hasUPF = flags.some(f => f.id === 'ultra_processed');
      const hasHighSugar = flags.some(f => ['high_added_sugar', 'sugar_sweetened_beverage'].includes(f.id));
      const hasHighSodium = flags.some(f => f.id === 'high_sodium');
      
      if (hasUPF) {
        message += "Les produits ultra-transformés, ";
      }
      
      if (hasHighSugar) {
        message += "riches en sucres ajoutés, ";
      }
      
      if (hasHighSodium) {
        message += "riches en sel, ";
      }
      
      message += "peuvent contribuer à un déséquilibre nutritionnel en cas de consommation régulière.";
    } else {
      message += "privilégier un usage modéré de ce type de produit.";
    }
    
    return message;
  }

  static _generateLevel3Message(product, flags, sublevel, habit) {
    const category = product.categoryType || 'food';
    
    let message = "Dans une perspective d'habitudes durables, ";
    
    if (sublevel === 'occasions') {
      message += "ce type de produit ne constitue pas une base adaptée à un usage régulier. ";
      message += "À réserver aux occasions. ";
    } else {
      message += "limiter fortement l'intégration régulière de ce type de produit. ";
    }
    
    if (category === 'food') {
      const hasUPF = flags.some(f => f.id === 'ultra_processed');
      const hasHighSugar = flags.some(f => ['high_added_sugar', 'sugar_sweetened_beverage'].includes(f.id));
      const hasAdditives = flags.some(f => f.id === 'problematic_additives');
      
      if (hasUPF) {
        message += "Les données convergentes (ANSES, OMS) montrent qu'un usage régulier de produits ultra-transformés ";
      }
      
      if (hasHighSugar) {
        message += "riches en sucres ajoutés ";
      }
      
      if (hasAdditives) {
        message += "contenant plusieurs additifs controversés ";
      }
      
      message += "contribue à une dégradation progressive de l'équilibre nutritionnel.";
    } else {
      message += "Par principe de précaution, limiter l'exposition répétée à ce type de produit.";
    }
    
    return message;
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


  static _loadKnowledgeRules(category) {
    try {
      const rulesPath = path.join(__dirname, '../knowledge/rules.json');
      const rulesData = fs.readFileSync(rulesPath, 'utf8');
      const allRules = JSON.parse(rulesData);
      
      return allRules.filter(rule => 
        rule.category === category && 
        rule.status === 'active'
      );
    } catch (error) {
      console.error('[WARN] Erreur chargement rules.json:', error.message);
      return [];
    }
  }

  static _buildContext(product, scores) {
    const novaLevel = this._extractNovaLevel(scores);
    const ingredients = this._extractTopIngredients(product.ingredients_text || '', 20);
    
    const nutrients = {
      energy_kcal_100g: product.nutrition?.energy_kcal || 0,
      sugars_g_100g: product.nutrition?.sugars || 0,
      sugars_g_100ml: product.nutrition?.sugars || 0,
      salt_g_100g: product.nutrition?.salt || 0,
      fat_g_100g: product.nutrition?.fat || 0,
      saturated_fat_g_100g: product.nutrition?.saturated_fat || 0,
      fiber_g_100g: product.nutrition?.fiber || 0,
      protein_g_100g: product.nutrition?.protein || 0,
      carbohydrates_g_100g: product.nutrition?.carbohydrates || 0
    };

    const name = product.name?.toLowerCase() || '';
    const subcategory = product.subcategory?.toLowerCase() || '';
    const isBeverage = name.includes('boisson') || 
                       name.includes('jus') || 
                       name.includes('soda') ||
                       subcategory.includes('boisson');
    
    const isSolidFood = !isBeverage && product.categoryType === 'food';

    const additivesRiskCount = {
      high: ingredients.additives?.filter(a => a.risk === 'high').length || 0,
      medium: ingredients.additives?.filter(a => a.risk === 'medium').length || 0,
      low: ingredients.additives?.filter(a => a.risk === 'low').length || 0
    };

    return {
      nova: novaLevel,
      nutrients,
      isBeverage,
      isSolidFood,
      additivesRiskCount,
      additivesCount: ingredients.additives?.length || 0,
      ingredientsText: product.ingredients_text || '',
      categoryHints: product.tags || [],
      subcategory: product.subcategory || ''
    };
  }

  static _computeFlags(product, scores) {
    const category = product.categoryType || 'food';
    const context = this._buildContext(product, scores);
    
    const categoryFlags = RISK_FLAGS[category] || {};
    const triggeredFlags = [];
    
    for (const [flagId, flagDef] of Object.entries(categoryFlags)) {
      try {
        const isTriggered = flagDef.trigger(product, context);
        
        if (isTriggered) {
          triggeredFlags.push({
            id: flagId,
            severity: flagDef.severity,
            evidence_tier: flagDef.evidence_tier,
            domains: flagDef.domains,
            refs: flagDef.refs,
            notes: flagDef.notes
          });
        }
      } catch (error) {
        console.error(`[WARN] Erreur évaluation flag ${flagId}:`, error.message);
      }
    }
    
    return triggeredFlags;
  }

  static _hasScientificEvidence(flags, category) {
    const rules = this._loadKnowledgeRules(category);
    const flagIds = flags.map(f => f.id);
    
    const matchedRules = rules.filter(rule => 
      rule.status === 'active' &&
      rule.consensus === true &&
      ['A', 'B'].includes(rule.evidence_tier) &&
      rule.applies_to_flags.some(f => flagIds.includes(f))
    );
    
    return matchedRules.length > 0;
  }

  static _hasSimpleSubstitution(product, context) {
    return true;
  }

  static _isHabitualUse(product, category, context) {
    if (category === 'food') {
      const tags = product.tags || [];
      const habitualTags = ['snacking', 'gouter', 'petit-dejeuner', 
                            'aperitif', 'dessert', 'encas', 'boisson'];
      return habitualTags.some(tag => tags.includes(tag));
    }
    
    if (category === 'cosmetic') {
      const name = product.name?.toLowerCase() || '';
      const dailyProducts = ['creme', 'deodorant', 'dentifrice'];
      return dailyProducts.some(type => name.includes(type));
    }
    
    return false;
  }

  static _decideFoodLevel(flags, majorFlags, substitution, habitual, evidence) {
    if (flags.length === 0) {
      return { level: 1, label: 'Acceptable' };
    }
    
    const hasUPF = flags.some(f => f.id === 'ultra_processed');
    const hasSugaryBeverage = flags.some(f => f.id === 'sugar_sweetened_beverage');
    
    if (!hasUPF && !hasSugaryBeverage && majorFlags.length === 0 && flags.length <= 2) {
      return { level: 1, label: 'Acceptable' };
    }
    
    if (evidence && 
        habitual && 
        substitution &&
        hasUPF &&
        (majorFlags.length >= 2 || 
         (majorFlags.length >= 1 && flags.length >= 3))) {
      
      const is3A = flags.some(f => ['sugar_sweetened_beverage', 
                                     'high_added_sugar', 
                                     'problematic_additives'].includes(f.id));
      
      return {
        level: 3,
        sublevel: is3A ? 'occasions' : 'limit_strongly',
        label: is3A ? 'À réserver aux occasions' : 'À limiter fortement'
      };
    }
    
    return { level: 2, label: 'À limiter au quotidien' };
  }

  static _determineLevel(product, flags, context) {
    const category = product.categoryType || 'food';
    const majorFlags = flags.filter(f => f.severity === 'high');
    
    const substitution = this._hasSimpleSubstitution(product, context);
    const habitual = this._isHabitualUse(product, category, context);
    const evidence = this._hasScientificEvidence(flags, category);
    
    if (category === 'food') {
      return this._decideFoodLevel(flags, majorFlags, substitution, habitual, evidence);
    }
    
    if (majorFlags.length >= 2) {
      return { level: 3, label: 'À limiter fortement' };
    } else if (flags.length > 0) {
      return { level: 2, label: 'À limiter au quotidien' };
    } else {
      return { level: 1, label: 'Acceptable' };
    }
  }
}
module.exports = PhotoAnalysisService;



