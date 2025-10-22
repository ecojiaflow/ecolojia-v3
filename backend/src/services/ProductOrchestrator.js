// backend/src/services/ProductOrchestrator.js
/**
 * Orchestrateur central pour récupération/création produits
 * Gère enrichissement automatique et cache IA
 */

const Product = require('../models/Product');
const DataNormalizer = require('./DataNormalizer');
const ScoringEngineV3 = require('./ScoringEngineV3');
const offClient = require('./offClient');
const scoringUnified = require('./scoringUnified');
const aiEnrichment = require('./aiEnrichment.service');
const visionService = require('./vision/VisionService');
/**
 * Détecte si un code-barre correspond à une catégorie valide
 * @param {string} barcode - Code-barre du produit
 * @returns {Object} { isValid, reason, detectedType }
 */
function detectProductCategory(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return { isValid: false, reason: 'Barcode invalide', detectedType: 'INVALID' };
  }

  // Livres (ISBN-13)
  if (barcode.startsWith('978') || barcode.startsWith('979')) {
    return { 
      isValid: false, 
      reason: 'Code-barre de livre (ISBN) détecté', 
      detectedType: 'BOOK' 
    };
  }

  // Médicaments France (codes CIP)
  if (barcode.startsWith('3400') || barcode.startsWith('3401')) {
    return { 
      isValid: false, 
      reason: 'Code-barre de médicament détecté', 
      detectedType: 'MEDICINE' 
    };
  }

  // Médicaments internationaux (codes spécifiques)
  if (barcode.length === 13 && barcode.startsWith('34')) {
    return { 
      isValid: false, 
      reason: 'Code-barre pharmaceutique détecté', 
      detectedType: 'MEDICINE' 
    };
  }

  // Codes-barres valides pour nos catégories
  return { isValid: true, detectedType: 'VALID' };
}

/**
 * Point d'entrée unique pour obtenir un produit (avec enrichissement auto)
 * @param {Object} input - { barcode, source }
 * @returns {Promise<Object>} Produit enrichi
 */
async function getOrCreateProduct(input) {
  const { barcode, source = 'OFF' } = input;
  
  if (!barcode) {
    throw new Error('Barcode requis');
  }

  // 0. Vérifier catégorie valide (filtrage médicaments/livres)
  const categoryCheck = detectProductCategory(barcode);
  if (!categoryCheck.isValid) {
    console.log('[Orchestrator] Invalid category detected:', categoryCheck);
    return {
      product: null,
      source: 'INVALID_CATEGORY',
      error: categoryCheck.reason,
      detectedType: categoryCheck.detectedType,
      suggestion: 'Ce type de produit n\'est pas analysable par ECOLOJIA'
    };
  }

  // 1. Chercher en base
  let product = await Product.findOne({ barcode }).lean();
  
  if (product && product.scores?.overallScore && isScoreRecent(product.scores)) {
    console.log('[Orchestrator] Product found in DB with recent score:', barcode);
    return {
      product,
      source: 'DATABASE',
      cached: true
    };
  }

  // 2. Récupérer depuis OpenFoodFacts si pas en base
  if (!product) {
    console.log('[Orchestrator] Fetching from OFF:', barcode);
    const offData = await offClient.fetchFromOpenFoodFacts(barcode);
    
    if (!offData) {
      // ⭐ NOUVEAU : Si image fournie, tenter OCR + IA
      if (input.imageFile) {
        console.log('[Orchestrator] ⚡ OFF échoué, tentative OCR+IA...');
        return await createProductFromImage(input);
      }
      
      return {
        product: null,
        source: 'NOT_FOUND',
        error: 'Produit non trouvé sur OpenFoodFacts'
      };
    }
    
    // Mapper données OFF ? format ECOLOJIA
    product = mapOFFToProduct(offData);
  }

  // 3. NOUVELLE ARCHITECTURE : Normaliser puis scorer
  console.log('📦 [Orchestrator] Normalisation des données...');
  const normalizedProduct = DataNormalizer.normalizeProduct(product, product._id ? 'DATABASE' : 'OFF');
  
  console.log('🎯 [Orchestrator] Calcul scientifique du score...');
  const scoringResult = ScoringEngineV3.calculateScore(normalizedProduct);
  
  console.log('📊 [Orchestrator] Résultat:', {
    canScore: scoringResult.canScore,
    score: scoringResult.overallScore,
    confidence: scoringResult.confidence,
    available: scoringResult.availableComponents?.length || 0,
    missing: scoringResult.missingComponents?.length || 0
  });
  
  // 4. Enrichir avec IA UNIQUEMENT si confiance < 70%
  let finalScores = scoringResult;
  let aiUsed = false;
  
  if (!scoringResult.canScore) {
    console.log('⚠️ [Orchestrator] Aucune donnée - Enrichissement IA nécessaire');
    const aiResult = await aiEnrichment.enrichProductWithAI(normalizedProduct, scoringResult);
    
    // Re-normaliser avec données IA
    const enrichedProduct = DataNormalizer.normalizeProduct({
      ...normalizedProduct,
      ...aiResult.estimations
    }, 'AI');
    
    // Re-calculer scores
    finalScores = ScoringEngineV3.calculateScore(enrichedProduct);
    aiUsed = true;
  } else if (scoringResult.confidence < 70) {
    console.log('⚠️ [Orchestrator] Confiance faible - Enrichissement IA optionnel');
    const aiResult = await aiEnrichment.enrichProductWithAI(normalizedProduct, scoringResult);
    
    if (aiResult.success) {
      const enrichedProduct = DataNormalizer.normalizeProduct({
        ...normalizedProduct,
        ...aiResult.estimations
      }, 'AI');
      
      finalScores = ScoringEngineV3.calculateScore(enrichedProduct);
      aiUsed = true;
    }
  } else {
    console.log('✅ [Orchestrator] Données suffisantes - Pas d\'enrichissement IA nécessaire');
  }

  // 5. Sauvegarder en base
  const productData = product.toObject ? product.toObject() : product;
  const savedProduct = await saveProduct({
    ...productData,
    scores: finalScores
  });

  // FIX : Re-fetch le produit pour avoir TOUS les champs (y compris scores)
  const refreshedProduct = await Product.findOne({ barcode: savedProduct.barcode }).lean();

  return {
    product: refreshedProduct,
    source: product._id ? 'DATABASE_UPDATED' : 'OFF_NEW',
    cached: false,
    aiEnrichmentUsed: aiUsed
  };
}


/**
 * Crée un produit depuis une image (OCR + IA)
 * Utilisé quand OpenFoodFacts ne trouve pas le produit
 */
async function createProductFromImage(input) {
  const { barcode, imageFile } = input;
  
  try {
    console.log('[Orchestrator] ?? Analyse image pour produit inconnu:', barcode);
    
    // 1. OCR avec Google Vision
    console.log('[Orchestrator] ?? Extraction texte via OCR...');
    const ocrResult = await visionService.extractText(imageFile);
    
    if (!ocrResult || !ocrResult.text) {
      throw new Error('OCR échoué : aucun texte extrait');
    }
    
    console.log('[Orchestrator] ? Texte extrait:', ocrResult.text.substring(0, 200) + '...');
    
    // 2. Parser avec DeepSeek IA
    console.log('[Orchestrator] ?? Parsing IA des données produit...');
    const parsedProduct = await aiEnrichment.parseProductFromOCR(ocrResult.text, barcode);
    
    if (!parsedProduct || !parsedProduct.name) {
      throw new Error('IA parsing échoué : données insuffisantes');
    }
    
    console.log('[Orchestrator] ? Produit parsé:', parsedProduct.name);
    
    // 3. Calculer scores selon catégorie détectée
    const scoringData = prepareScoringData(parsedProduct);
    
    let scores;
    if (parsedProduct.category === 'cosmetics') {
      scores = scoringUnified.calculateCosmeticsScores(scoringData);
    } else if (parsedProduct.category === 'detergents') {
      scores = scoringUnified.calculateDetergentsScores(scoringData);
    } else {
      scores = scoringUnified.calculateFoodScores(scoringData);
    }
    
    console.log('[Orchestrator] ? Score calculé:', scores.overallScore);
    
    // 4. Créer produit en base avec flag IA
    const productToSave = {
      barcode: barcode,
      name: parsedProduct.name,
      brand: parsedProduct.brand,
      category: parsedProduct.category || 'food',
      
      foodData: parsedProduct.category === 'food' ? {
        ingredients: parsedProduct.ingredients_text,
        nutrition: { per100g: parsedProduct.nutriments },
        novaGroup: parsedProduct.novaGroup,
        nutriScore: parsedProduct.nutriScore,
        additives: parsedProduct.additives,
        labels: parsedProduct.labels
      } : undefined,
      
      cosmeticsData: parsedProduct.category === 'cosmetics' ? {
        inci: parsedProduct.inci || [],
        concerns: parsedProduct.concerns || []
      } : undefined,
      
      detergentsData: parsedProduct.category === 'detergents' ? {
        ingredients: parsedProduct.ingredients || [],
        hazards: parsedProduct.hazards || []
      } : undefined,
      
      scores: scores,
      aiGenerated: true,
      aiConfidence: parsedProduct.confidence || scores.dataQuality?.confidence || 0.5,
      source: 'AI_OCR',
      createdAt: new Date(),
      lastSync: new Date()
    };
    
    const savedProduct = await saveProduct(productToSave);
    
    console.log('[Orchestrator] ?? Produit IA créé avec succès:', savedProduct._id);
    
    return {
      product: savedProduct,
      source: 'AI_GENERATED',
      cached: false,
      aiEnrichmentUsed: true,
      method: 'OCR + DeepSeek'
    };
    
  } catch (error) {
    console.error('[Orchestrator] ? Erreur création produit IA:', error);
    return {
      product: null,
      source: 'AI_ERROR',
      error: `Analyse IA échouée : ${error.message}`
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function isScoreRecent(scores) {
  if (!scores.calculatedAt) return false;
  
  const calculatedAt = new Date(scores.calculatedAt);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return calculatedAt > sevenDaysAgo;
}

function mapOFFToProduct(offData) {
  return {
    barcode: offData.code,
    name: offData.product_name || offData.generic_name,
    brand: offData.brands,
    category: 'food',
    image_url: offData.image_url,
    
    // Données food
    nova_group: offData.nova_group,
    nutriscore_grade: offData.nutriscore_grade,
    ecoscore_grade: offData.ecoscore_grade,
    additives_tags: offData.additives_tags || [],
    labels_tags: offData.labels_tags || [],
    ingredients_text: offData.ingredients_text,
    packaging: offData.packaging,
    origins: offData.origins,
    
    // Nutriments
    nutriments: offData.nutriments || {},
    
    // Metadata
    source: 'openfoodfacts',
    lastSync: new Date()
  };
}

function prepareScoringData(product) {
  // Structure flexible qui supporte produits OFF bruts ET produits MongoDB
  
  // 1. Identifier la source des données
  const isMongoProduct = product.foodData !== undefined;
  
  // 2. Extraire les nutriments selon la source
  let nutriments = {};
  if (isMongoProduct) {
    // Produit MongoDB : chercher dans foodData
    const nutrition = product.foodData?.nutrition?.per100g || {};
    const nutritionalInfo = product.foodData?.nutritionalInfo || {};
    nutriments = {
      sugars_100g: nutrition.sugars || nutritionalInfo.sugars,
      sugars: nutrition.sugars || nutritionalInfo.sugars,
      'saturated-fat_100g': nutrition.saturatedFat || nutritionalInfo.saturatedFat,
      saturated_fat: nutrition.saturatedFat || nutritionalInfo.saturatedFat,
      salt_100g: nutrition.salt || nutritionalInfo.salt,
      salt: nutrition.salt || nutritionalInfo.salt
    };
  } else {
    // Produit OFF brut : utiliser nutriments directement
    const rawNutriments = product.nutriments || {};
    nutriments = {
      sugars_100g: rawNutriments.sugars_100g || rawNutriments.sugars,
      sugars: rawNutriments.sugars_100g || rawNutriments.sugars,
      'saturated-fat_100g': rawNutriments['saturated-fat_100g'] || rawNutriments.saturated_fat,
      saturated_fat: rawNutriments['saturated-fat_100g'] || rawNutriments.saturated_fat,
      salt_100g: rawNutriments.salt_100g || rawNutriments.salt,
      salt: rawNutriments.salt_100g || rawNutriments.salt
    };
  }
  
  // 3. Construire l'objet de scoring unifié
  return {
    // Champs requis pour calculateDataConfidence
    product_name: product.product_name || product.name || '',
    brands: product.brands || product.brand || '',
    ingredients_text: product.ingredients_text || product.foodData?.ingredients || '',
    
    // Scores et labels
    novaGroup: product.nova_group || product.foodData?.novaGroup,
    nutriScore: product.nutriscore_grade || product.foodData?.nutriScore,
    ecoScore: product.ecoscore_grade || product.foodData?.ecoScore,
    
    // Additifs (extraire les codes si objets)
    additives: isMongoProduct 
      ? (product.foodData?.additives?.map(a => a.code || a) || [])
      : (product.additives_tags || []),
    
    // Labels
    labels: product.labels_tags || product.foodData?.labels || [],
    
    // Catégories et packaging
    categories: product.categories_tags || [],
    packaging: product.packaging || '',
    
    // Nutriments unifiés
    nutriments
  };
}

async function saveProduct(productData) {
  const { barcode } = productData;
  
  // Update ou insert
  const updated = await Product.findOneAndUpdate(
    { barcode },
    { $set: productData },
    { upsert: true, new: true }
  );
  
  return updated;
}


  /**
   * Crée un produit depuis données OCR avec scoring ajusté
   * @param {Object} ocrData - Données extraites par OCR
   * @returns {Promise<Object>} - Produit créé avec scores
   */
async function createFromOCR(ocrData) {
    try {
      const {
        code,
        product_name,
        brands,
        quantity,
        ingredients_text,
        categories_tags = ['en:food'],
        source = 'ocr',
        confidence = 0.7,
        ocrMetadata = {}
      } = ocrData;

      console.log(`[Orchestrator] Création produit OCR: ${code} - "${product_name}"`);

      // Vérifier si le produit existe déjà
      const existingProduct = await Product.findOne({ code });
      if (existingProduct) {
        console.log(`[Orchestrator] Produit ${code} existe déjà, mise à jour...`);
        
        // Mettre à jour avec données OCR si meilleure confiance
        if (existingProduct.confidence && existingProduct.confidence >= confidence) {
          console.log(`[Orchestrator] Confiance existante supérieure, abandon mise à jour`);
          return existingProduct;
        }
      }

      // Normaliser les données avec DataNormalizer
      const normalizedData = DataNormalizer.normalizeFromOCR({
        code,
        product_name,
        brands,
        quantity,
        ingredients_text,
        categories_tags
      });

      console.log('[Orchestrator] Données normalisées:', {
        name: normalizedData.product_name,
        ingredients: normalizedData.ingredients?.length || 0
      });

      // Calculer les scores avec ScoringEngineV3
      console.log('[Orchestrator] Calcul des scores...');
      const category = this._detectCategory(categories_tags);
      const scores = ScoringEngineV3.calculateScores(normalizedData, category);

      // Ajuster la confiance des scores selon la confiance OCR
      if (scores && confidence < 1) {
        scores.confidence = scores.confidence * confidence;
        scores.metadata = scores.metadata || {};
        scores.metadata.ocrConfidence = confidence;
        scores.metadata.adjustedByOCR = true;
        
        console.log(`[Orchestrator] Confiance ajustée: ${scores.confidence.toFixed(2)} (base × OCR ${confidence})`);
      }

      // Créer l'objet produit avec métadonnées OCR
      const productData = {
        code,
        product_name,
        brands,
        quantity,
        ingredients_text,
        categories_tags,
        
        // Scores calculés
        scores: scores || null,
        
        // Métadonnées OCR
        source,
        confidence,
        dataQuality: this._assessDataQuality(normalizedData, confidence),
        ocrMetadata: {
          ...ocrMetadata,
          createdAt: new Date(),
          version: '3.2.0'
        },
        
        // Flags spéciaux
        needsVerification: confidence < 0.75,
        isOCRProduct: true,
        
        // Audit
        lastUpdated: new Date(),
        createdAt: new Date()
      };

      // Sauvegarder en base
      const product = existingProduct 
        ? await Product.findOneAndUpdate({ code }, productData, { new: true })
        : await Product.create(productData);

      console.log(`[Orchestrator] ✓ Produit ${existingProduct ? 'mis à jour' : 'créé'}: ${product._id}`);

      // Indexer dans Algolia
      try {
        await algoliaService.indexProduct(product);
        console.log('[Orchestrator] ✓ Produit indexé dans Algolia');
      } catch (algoliaError) {
        console.warn('[Orchestrator] Erreur indexation Algolia:', algoliaError.message);
      }

      return product;

    } catch (error) {
      console.error('[Orchestrator] Erreur création produit OCR:', error);
      throw error;
    }
  }

  /**
   * Évalue la qualité des données OCR
   */
function _assessDataQuality(data, confidence) {
    const hasName = !!data.product_name && data.product_name.length > 3;
    const hasIngredients = !!data.ingredients_text && data.ingredients_text.length > 10;
    const hasBrand = !!data.brands && data.brands.length > 0;

    if (confidence >= 0.8 && hasName && hasIngredients && hasBrand) {
      return 'EXCELLENT';
    } else if (confidence >= 0.65 && hasName && hasIngredients) {
      return 'BON';
    } else if (confidence >= 0.5 && hasName) {
      return 'MOYEN';
    } else {
      return 'FAIBLE';
    }
  }
module.exports = {
  getOrCreateProduct
};



