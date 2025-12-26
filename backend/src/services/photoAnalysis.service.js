/**
 * PHOTO ANALYSIS SERVICE V1.0
 * Orchestrateur pipeline photo → Constitution Ecolojia
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
      const cacheResult = await CacheResolverService.resolveProduct({
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
      
      const enrichedProduct = await AIEnrichmentService.enrichProduct(
        enrichmentData,
        photoBuffer,
        { includeVision: true }
      );
      
      if (!enrichedProduct.success) {
        return {
          success: false,
          error: 'AI_ENRICHMENT_FAILED',
          message: 'Échec enrichissement IA',
          processingTime: Date.now() - startTime
        };
      }
      
      console.log('✅ Enrichissement IA OK (score:', enrichedProduct.scores?.overall + ')');
      
      // ======================================
      // ÉTAPE 6 : SAUVEGARDE + CONSTITUTION
      // ======================================
      console.log('🔍 Étape 6/6 : Sauvegarde + Constitution...');
      
      // Ajouter métadonnées photo
      enrichedProduct.photoHash = photoHash;
      enrichedProduct.photoOriginalUrl = null; // À implémenter upload S3/Cloudinary
      enrichedProduct.extractedBy = 'photo';
      enrichedProduct.extractedAt = new Date();
      enrichedProduct.lastScannedAt = new Date();
      enrichedProduct.ocrData = ocrResult;
      enrichedProduct.ocrConfidence = ocrResult.confidence;
      
      // Sauvegarder en base
      const savedProduct = await CacheResolverService.saveEnrichedProduct(enrichedProduct);
      
      // Générer Constitution Ecolojia
      const constitution = await this._generateConstitution(savedProduct);
      
      console.log('✅ Produit sauvegardé (_id:', savedProduct._id + ')');
      console.log('✅ ANALYSE TERMINÉE');
      
      return {
        success: true,
        cached: false,
        source: 'ai',
        product: savedProduct,
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
  
  /**
   * OCR rapide (Tesseract ou DeepSeek Vision)
   * @private
   */
  static async _performOCR(photoBuffer) {
    try {
      // Pour l'instant, utiliser DeepSeek Vision
      // TODO: Implémenter Tesseract local pour économiser coûts
      
      const visionResult = await AIEnrichmentService.analyzeProductPhoto(photoBuffer);
      
      if (!visionResult.success) {
        return { success: false };
      }
      
      return {
        success: true,
        text: visionResult.extractedText || '',
        barcode: visionResult.barcode || null,
        name: visionResult.name || null,
        brand: visionResult.brand || null,
        ingredients: visionResult.ingredients_text || null,
        confidence: visionResult.confidence || 70,
        extractedFields: visionResult
      };
      
    } catch (error) {
      console.error('❌ OCR error:', error);
      return { success: false };
    }
  }
  
  /**
   * Génération photoHash SHA256
   * @private
   */
  static _generatePhotoHash(photoBuffer) {
    return crypto
      .createHash('sha256')
      .update(photoBuffer)
      .digest('hex');
  }
  
  /**
   * Génération Constitution Ecolojia
   * @private
   */
  static async _generateConstitution(product) {
    // Structure Constitution 6 sections
    return {
      whatIsIt: this._generateWhatIsIt(product),
      compositionProcess: this._generateCompositionProcess(product),
      scienceShows: this._generateScienceShows(product),
      healthReflex: this._generateHealthReflex(product),
      possibleActions: this._generatePossibleActions(product),
      habitImpact: this._generateHabitImpact(product)
    };
  }
  
  /**
   * Section 1 : CE QUE C'EST VRAIMENT
   * @private
   */
  static _generateWhatIsIt(product) {
    const { name, categoryType, subcategory } = product;
    
    return {
      title: '🧠 CE QUE C\'EST VRAIMENT',
      content: `${name} est un produit ${this._getCategoryLabel(categoryType)}${subcategory ? ` de type ${subcategory}` : ''}.`
    };
  }
  
  /**
   * Section 2 : COMPOSITION & PROCESSUS
   * @private
   */
  static _generateCompositionProcess(product) {
    const { ingredients_text, scores } = product;
    const novaScore = scores?.processing || 0;
    
    let novaLabel = 'aliment brut';
    if (novaScore >= 75) novaLabel = 'aliment minimalement transformé';
    if (novaScore >= 50 && novaScore < 75) novaLabel = 'aliment transformé';
    if (novaScore < 50) novaLabel = 'aliment ultra-transformé';
    
    return {
      title: '⚙️ COMPOSITION & PROCESSUS',
      content: `Classification NOVA : ${novaLabel}. ${ingredients_text ? 'Ingrédients principaux identifiés.' : 'Liste d\'ingrédients à compléter.'}`
    };
  }
  
  /**
   * Section 3 : CE QUE LA SCIENCE MONTRE
   * @private
   */
  static _generateScienceShows(product) {
    return {
      title: '🧬 CE QUE LA SCIENCE MONTRE',
      content: 'Analyse basée sur données scientifiques disponibles (OMS, ANSES, études pairs). Impact santé dépend de la fréquence et du contexte de consommation.'
    };
  }
  
  /**
   * Section 4 : LE BON RÉFLEXE SANTÉ
   * @private
   */
  static _generateHealthReflex(product) {
    const { scores } = product;
    const overall = scores?.overall || 50;
    
    let reflex = 'consommer avec modération dans le cadre d\'une alimentation variée';
    
    if (overall >= 75) {
      reflex = 'privilégier ce type de produit régulièrement';
    } else if (overall < 40) {
      reflex = 'limiter la fréquence et privilégier des alternatives plus simples';
    }
    
    return {
      title: '🌱 LE BON RÉFLEXE SANTÉ',
      content: `Pour ta santé, l'idéal est de ${reflex}.`
    };
  }
  
  /**
   * Section 5 : ACTIONS POSSIBLES
   * @private
   */
  static _generatePossibleActions(product) {
    return {
      title: '🔁 ACTIONS POSSIBLES',
      content: [
        'Voir alternatives similaires',
        'Consulter liste complète ingrédients',
        'Ajouter aux favoris pour suivi'
      ]
    };
  }
  
  /**
   * Section 6 : IMPACT HABITUDE
   * @private
   */
  static _generateHabitImpact(product) {
    return {
      title: '📈 IMPACT HABITUDE',
      content: 'Cette analyse contribue à développer ton autonomie dans les choix alimentaires quotidiens.'
    };
  }
  
  /**
   * Helper : Label catégorie
   * @private
   */
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
