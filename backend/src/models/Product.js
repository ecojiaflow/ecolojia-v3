// backend/src/models/Product.js
// VERSION 3.2.3 - Photo Cache System + Scoring V3.2.0 production-ready
const mongoose = require('mongoose');
const logger = require('../config/logger');

// ============================================================================
// SOUS-SCHÉMAS
// ============================================================================

// Schéma pour additifs alimentaires (E-numbers)
const additiveSchema = new mongoose.Schema({
  tag: String,
  code: String,
  name: String,
  function: String,
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'LOW', 'MODERATE', 'HIGH', 'MEDIUM'],
    default: 'LOW',
    set: v => v ? v.toLowerCase() : 'low'
  },
  healthConcerns: [String],
  origin: String
}, { _id: false });

// Schéma pour allergènes
const allergenSchema = new mongoose.Schema({
  tag: String,
  name: String,
  category: String,
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'LOW', 'MODERATE', 'HIGH', 'MEDIUM'],
    default: 'MEDIUM',
    set: v => v ? v.toLowerCase() : 'moderate'
  },
  description: String,
  concerns: [String],
  icon: String
}, { _id: false });

// Schéma pour informations nutritionnelles (pour 100g/100ml)
const nutritionSchema = new mongoose.Schema({
  energy: Number,
  fat: Number,
  saturatedFat: Number,
  carbohydrates: Number,
  sugars: Number,
  fiber: Number,
  protein: Number,
  salt: Number
}, { _id: false });

// Schéma pour ingrédients cosmétiques (liste INCI)
const cosmeticIngredientSchema = new mongoose.Schema({
  inci: String,
  function: String,
  origin: {
    type: String,
    enum: ['a-plus', 'a', 'b', 'c', 'd', 'e', 'unknown']
  },
  concerns: [String],
  isEndocrineDisruptor: { type: Boolean, default: false }
}, { _id: false });

// ============================================================================
// SCHÉMA PRINCIPAL PRODUCT
// ============================================================================

const productSchema = new mongoose.Schema({
  // Identifiant unique produit
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true
  },

  // Informations de base
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  brand: {
    type: String,
    trim: true,
    index: true
  },

  // ============================================================================
  // SYSTÈME DE FILTRAGE MULTI-CATÉGORIES V3.2
  // ============================================================================

  categoryType: {
    type: String,
    enum: ['food', 'cosmetic', 'detergent'],
    required: true,
    index: true
  },

  productType: {
    type: String,
    index: true,
    sparse: true,
    trim: true
  },

  filterMetadata: {
    categoryLabels: [String],
    searchTerms: [String],
    popularityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastEnriched: Date
  },

  // ============================================================================
  // CATÉGORISATION LEGACY (compatibilité)
  // ============================================================================

  category: {
    type: String,
    enum: ['food', 'cosmetics', 'detergents', 'supplements', 'household', 'FOOD', 'COSMETICS'],
    set: v => v ? v.toLowerCase() : undefined
  },
  subcategory: {
    type: String,
    index: true,
    trim: true
  },

  // ============================================================================
  // TAXONOMIE V3.2 : Tags pour moteur d'alternatives intelligent
  // ============================================================================

  tags: {
    type: [String],
    index: true,
    default: []
  },

  imageUrl: String,

  // ============================================================================
  // DONNÉES ENRICHISSEMENT IA (AJOUT 25/12/2025)
  // ============================================================================

  nutrition: {
    energy_kcal: Number,
    fat: Number,
    saturated_fat: Number,
    carbohydrates: Number,
    sugars: Number,
    fiber: Number,
    proteins: Number,
    salt: Number
  },

  ingredients_text: {
    type: String,
    index: true
  },

  additives_tags: [String],

  estimated: {
    type: Boolean,
    default: false,
    index: true
  },
  estimation_source: {
    type: String,
    enum: ['deepseek_ai', 'local_water', 'local_fresh', 'openfoodfacts', 'manual', 'photo-ocr'],
    index: true
  },

  // ============================================================================
  // PHOTO CAPTURE METADATA V3.2.3 (26/12/2025)
  // ============================================================================

  photoHash: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true
  },

  photoOriginalUrl: {
    type: String,
    trim: true
  },

  extractedBy: {
    type: String,
    enum: ['photo-ocr', 'barcode-scan', 'manual', 'openfoodfacts', 'ai-enrichment'],
    index: true
  },

  extractedAt: {
    type: Date,
    index: true
  },

  ocrData: {
    rawText: String,
    detectedBarcode: String,
    detectedBrand: String,
    detectedName: String,
    detectedIngredients: String,
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    processingTime: Number,
    ocrEngine: String
  },

  ocrConfidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  lastScannedAt: {
    type: Date,
    index: true
  },

  // ============================================================================
  // DONNÉES SPÉCIFIQUES PAR CATÉGORIE
  // ============================================================================

  foodData: {
    ingredients: String,
    ingredientsParsed: mongoose.Schema.Types.Mixed,
    additives: [additiveSchema],
    allergens: [allergenSchema],
    labels: [String],
    nutritionalInfo: nutritionSchema,
    novaGroup: { type: Number, min: 1, max: 4 },
    nutriScore: {
      type: String,
      enum: ['a', 'b', 'c', 'd', 'e', 'A', 'B', 'C', 'D', 'E', 'unknown'],
      set: v => v ? v.toLowerCase() : 'unknown'
    },
    ecoScore: {
      type: String,
      enum: ['a-plus', 'a', 'b', 'c', 'd', 'e', 'unknown', 'A-PLUS', 'A', 'B', 'C', 'D', 'E', 'UNKNOWN'],
      set: v => v ? v.toLowerCase() : 'unknown'
    }
  },

  cosmeticsData: {
    inciList: String,
    ingredients: [cosmeticIngredientSchema],
    endocrineDisruptors: [String],
    allergens: [String],
    certifications: [String]
  },

  detergentsData: {
    composition: [String],
    surfactants: [String],
    phosphateFree: Boolean,
    biodegradable: Boolean,
    ecoLabels: [String]
  },

  // ============================================================================
  // SCORES UNIFIÉS V3.0.0
  // ============================================================================

  scores: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      index: true
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100
    },
    environmentScore: {
      type: Number,
      min: 0,
      max: 100
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    dataCompleteness: {
      type: String,
      enum: ['low', 'medium', 'high', 'complete']
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    },
    scoringVersion: {
      type: String,
      default: '3.2.0'
    },
    breakdown: {
      nutriScore: {
        score: Number,
        weight: Number,
        grade: String,
        label: String,
        contribution: Number
      },
      additives: {
        score: Number,
        weight: Number,
        count: Number,
        dangerous: [String],
        label: String,
        contribution: Number
      },
      nova: {
        score: Number,
        weight: Number,
        group: Number,
        label: String,
        contribution: Number
      },
      ecoScore: {
        score: Number,
        weight: Number,
        grade: String,
        label: String,
        contribution: Number
      },
      origin: {
        score: Number,
        weight: Number,
        countries: [String],
        label: String,
        contribution: Number
      },
      packaging: {
        score: Number,
        weight: Number,
        materials: [String],
        label: String,
        contribution: Number
      },
      labels: {
        score: Number,
        weight: Number,
        list: [String],
        isBio: Boolean,
        label: String,
        contribution: Number
      },
      allergens: {
        score: Number,
        weight: Number,
        detected: [String],
        count: Number,
        label: String,
        contribution: Number
      }
    },
    missingData: [String],
    aiEstimations: mongoose.Schema.Types.Mixed,
    aiEnrichmentUsed: {
      type: Boolean,
      default: false
    },
    aiEnrichmentSource: String,
    aiEnrichmentError: String,
    scoringMetadata: mongoose.Schema.Types.Mixed,
    dataQualityInfo: mongoose.Schema.Types.Mixed
  },

  // ============================================================================
  // MÉTADONNÉES ENRICHISSEMENT IA
  // ============================================================================

  aiEnriched: {
    type: Boolean,
    default: false,
    index: true
  },
  aiEnrichmentDate: {
    type: Date
  },
  aiEnrichmentVersion: {
    type: String
  },
  knowledgeBaseUsed: {
    type: Boolean,
    default: false
  },

  // ============================================================================
  // DONNÉES ANALYTICS (LEGACY - compatibilité)
  // ============================================================================

  analysisData: {
    healthScore: { type: Number, min: 0, max: 100 },
    lastAnalyzedAt: Date,
    version: String,
    confidence: Number
  },

  // ============================================================================
  // MÉTADONNÉES USAGE
  // ============================================================================

  viewCount: { type: Number, default: 0, min: 0 },
  scanCount: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  
  // ============================================================================
  // CONSTITUTION ECOLOJIA V3.0 (30/12/2025)
  // ============================================================================
  
  constitution: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

// ============================================================================
// INDEX COMPOSÉS V3.2 (Optimisation queries)
// ============================================================================

productSchema.index({ categoryType: 1, 'scores.overallScore': -1 });
productSchema.index({ categoryType: 1, productType: 1 });
productSchema.index({ categoryType: 1, brand: 1 });
productSchema.index({ category: 1, 'analysisData.healthScore': -1 });

productSchema.index({ name: 'text', brand: 'text' });

productSchema.index({ categoryType: 1, 'foodData.novaGroup': 1 });
productSchema.index({ categoryType: 1, 'foodData.nutriScore': 1 });

productSchema.index({ categoryType: 1, 'cosmeticsData.certifications': 1 });

productSchema.index({ categoryType: 1, 'detergentsData.ecoLabels': 1 });

productSchema.index({ categoryType: 1, subcategory: 1 });
productSchema.index({ categoryType: 1, tags: 1 });

// ============================================================================
// INDEX PHOTO CACHE V3.2.3 (26/12/2025)
// ============================================================================

productSchema.index({ extractedBy: 1, extractedAt: -1 });

// ============================================================================
// MÉTHODES INSTANCE
// ============================================================================

productSchema.methods.incrementView = async function() {
  this.viewCount++;

  logger.info('[Product] Vue incrémentée', {
    productId: this._id,
    barcode: this.barcode,
    name: this.name,
    newViewCount: this.viewCount
  });

  return this.save();
};

productSchema.methods.getPublicData = function() {
  return this.toObject();
};

// ============================================================================
// MÉTHODES STATIQUES
// ============================================================================

productSchema.statics.findByBarcode = function(barcode) {
  logger.debug('[Product] Recherche par barcode', { barcode });
  return this.findOne({ barcode });
};

productSchema.statics.searchProducts = async function(query, category = null) {
  const startTime = Date.now();

  const searchCriteria = { $text: { $search: query } };
  if (category) searchCriteria.category = category;

  const results = await this.find(searchCriteria)
    .select('-__v')
    .limit(20)
    .sort({ score: { $meta: 'textScore' } });

  const duration = Date.now() - startTime;

  logger.info('[Product] Recherche effectuée', {
    query,
    category,
    resultsCount: results.length,
    durationMs: duration
  });

  return results;
};

// ============================================================================
// MIDDLEWARE PRE-SAVE
// ============================================================================

productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ============================================================================
// MIDDLEWARE AUTO-CALCUL SCORES V3.0.0
// ============================================================================
const scoringUnified = require('../services/scoringUnified');
const { generateConstitution } = require('../services/constitution.service');

productSchema.pre('save', async function(next) {
  const startTime = Date.now();

  // ✅ Skip si déjà calculé ET constitution existe
  if (this.scores?.scoringVersion === '3.2.0' && 
      this.scores?.overallScore && 
      this.constitution) {
    logger.debug('[Product] Score + Constitution déjà calculés - Skip');
    return next();
  }

  try {
    logger.debug('[Product] Calcul scores automatique', {
      productId: this._id,
      barcode: this.barcode,
      name: this.name,
      category: this.category || this.categoryType
    });

    let calculatedScores;

    if (this.category === 'food' || this.categoryType === 'food' || !this.category) {
      const nutritionalInfo = this.foodData?.nutritionalInfo || {};

      const scoringData = {
        novaGroup: this.nova_group || this.foodData?.novaGroup,
        nutriScore: this.nutriscore_grade || this.foodData?.nutriScore,
        ecoScore: this.ecoscore_grade || this.foodData?.ecoScore,
        additives: this.foodData?.additives?.map(a => a.code || a.tag || a) || this.additives_tags || [],
        labels: this.foodData?.labels || this.labels_tags || [],
        packaging: this.packaging,
        origin: this.origins,
        ingredients: this.ingredients_text || this.foodData?.ingredients,
        nutriments: this.nutriments || {
          sugars_100g: nutritionalInfo.sugars,
          'saturated-fat_100g': nutritionalInfo.saturatedFat,
          salt_100g: nutritionalInfo.salt
        }
      };

      calculatedScores = scoringUnified.calculateFoodScores(scoringData);
    }
    else if (this.category === 'cosmetics' || this.categoryType === 'cosmetic') {
      calculatedScores = scoringUnified.calculateCosmeticScores(this);
    }
    else if (this.category === 'detergents' || this.categoryType === 'detergent') {
      calculatedScores = scoringUnified.calculateDetergentScores(this);
    }

    if (calculatedScores) {
      this.scores = {
        overallScore: calculatedScores.overallScore,
        healthScore: calculatedScores.healthScore,
        environmentScore: calculatedScores.environmentScore,
        breakdown: calculatedScores.breakdown,
        confidence: calculatedScores.confidence,
        dataCompleteness: calculatedScores.dataCompleteness,
        calculatedAt: new Date(),
        scoringVersion: '3.0.0'
      };

      // ✅ GÉNÉRATION CONSTITUTION V1.0.0
      if (this.category === 'food' || this.categoryType === 'food' || !this.category) {
        this.constitution = generateConstitution(this);
        logger.debug('[Product] Constitution générée', { productId: this._id });
      }

      const duration = Date.now() - startTime;

      logger.info('[Product] Scores calculés avec succès', {
        productId: this._id,
        barcode: this.barcode,
        category: this.category || this.categoryType,
        overallScore: calculatedScores.overallScore,
        healthScore: calculatedScores.healthScore,
        environmentScore: calculatedScores.environmentScore,
        confidence: calculatedScores.confidence,
        durationMs: duration
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('[Product] Erreur calcul scores middleware', {
      error: error.message,
      stack: error.stack,
      productId: this._id,
      barcode: this.barcode,
      category: this.category || this.categoryType,
      durationMs: duration
    });
  }

  next();
});

// ============================================================================
// INITIALISATION MODÈLE
// ============================================================================

const ProductModel = mongoose.model('Product', productSchema);

logger.info('[Product] Modèle Product initialisé', {
  version: '3.2.3 - Photo Cache System + Scoring V3.2.0',
  indexes: productSchema.indexes().length,
  features: ['multi-category', 'auto-scoring', 'alternatives-engine', 'photo-cache']
});

module.exports = ProductModel;



