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

  static _generateWhatIsIt(product) {
    const { name, categoryType, subcategory, brand } = product;
    const categoryLabel = this._getCategoryLabel(categoryType);
    const brandText = brand ? ` de la marque ${brand}` : '';
    const subcatText = subcategory ? ` de type ${subcategory}` : '';
    return `${name}${brandText} est un produit ${categoryLabel}${subcatText}.`;
  }

  static _generateHealthReflex(product, habit) {
    const { scores } = product;
    const overall = scores?.overall || 50;
    let action = habit.action;
    if (overall >= 75) {
      action = 'privilégier ce type de produit dans ton quotidien';
    } else if (overall >= 50) {
      action = habit.action;
    } else {
      action = 'limiter sa consommation et privilégier des alternatives plus simples';
    }
    return `Pour ta santé, l'idéal est de ${action}.`;
  }

  static _generateActionItems(product) {
    const actions = [];
    const { scores, categoryType } = product;
    if (scores?.overall < 70) {
      actions.push({ type: 'alternative', label: 'Voir des alternatives plus saines', icon: '🔄' });
    }
    if (categoryType === 'food' && scores?.overall < 60) {
      actions.push({ type: 'recipe', label: 'Voir une recette de substitution', icon: '🍳' });
    }
    actions.push({ type: 'list', label: 'Ajouter à ma liste de courses', icon: '📝' });
    if (actions.length < 3) {
      actions.push({ type: 'favorite', label: 'Ajouter aux favoris', icon: '⭐' });
    }
    return actions.slice(0, 3);
  }

  static _selectHabitFromLibrary(product) {
    const HABITS_LIBRARY = [
      { id: 'habit_01', title: 'Privilégier les aliments bruts', action: 'choisir des produits avec une liste d\'ingrédients courte' },
      { id: 'habit_02', title: 'Limiter les produits ultra-transformés', action: 'réserver ce type de produit aux occasions spéciales' },
      { id: 'habit_03', title: 'Surveiller la fréquence plus que l\'interdiction', action: 'consommer avec modération dans une alimentation variée' },
      { id: 'habit_04', title: 'Préférer les listes d\'ingrédients courtes', action: 'privilégier les produits avec moins de 5 ingrédients' },
      { id: 'habit_05', title: 'Varier les sources de lipides', action: 'alterner les sources de matières grasses' },
      { id: 'habit_06', title: 'Associer les sucres à des fibres ou protéines', action: 'accompagner de fruits, oléagineux ou légumes' },
      { id: 'habit_07', title: 'Réserver les produits plaisir aux occasions', action: 'limiter la fréquence et savourer consciemment' },
      { id: 'habit_08', title: 'Limiter l\'exposition chimique répétée', action: 'varier les marques et types de produits' },
      { id: 'habit_09', title: 'Favoriser la simplicité des préparations', action: 'privilégier les aliments peu transformés' },
      { id: 'habit_10', title: 'Varier les sources animales et végétales', action: 'alterner protéines animales et végétales' }
    ];
    const { scores, categoryType, nutrition } = product;
    const novaScore = scores?.processing || 0;
    const additifs = scores?.additives || 100;
    const sugars = nutrition?.sugars || 0;
    if (novaScore < 50) return HABITS_LIBRARY[1];
    if (additifs < 40) return HABITS_LIBRARY[7];
    if (sugars > 10) return HABITS_LIBRARY[5];
    if (scores?.overall < 50) return HABITS_LIBRARY[6];
    if (product.ingredients_text && product.ingredients_text.split(',').length > 10) return HABITS_LIBRARY[3];
    return HABITS_LIBRARY[0];
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
