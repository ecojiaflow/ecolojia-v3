// backend/src/models/Product.js
// VERSION 3.2.1 - Système de filtrage multi-catégories production-ready
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
    // Normalisation automatique vers lowercase
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
  energy: Number,        // kJ
  fat: Number,           // g
  saturatedFat: Number,  // g
  carbohydrates: Number, // g
  sugars: Number,        // g
  fiber: Number,         // g
  protein: Number,       // g
  salt: Number           // g
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
    sparse: true,  // Permet plusieurs docs sans barcode (null/undefined)
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

  // Catégorie principale (food/cosmetic/detergent)
  categoryType: {
    type: String,
    enum: ['food', 'cosmetic', 'detergent'],
    required: true,  // OBLIGATOIRE pour filtrage
    index: true
  },

  // Type de produit spécifique (ex: "shampooing", "lessive liquide", "biscuits")
  productType: {
    type: String,
    index: true,
    sparse: true,
    trim: true
  },

  // Métadonnées pour filtrage avancé et recherche Algolia
  filterMetadata: {
    categoryLabels: [String],     // Labels lisibles (ex: ["Bio", "Vegan", "Sans gluten"])
    searchTerms: [String],         // Termes de recherche (ex: ["shampooing", "cheveux", "naturel"])
    popularityScore: {             // Score de popularité (pour tri par pertinence)
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastEnriched: Date             // Date dernier enrichissement IA/API
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

  // Tags descriptifs pour matching sémantique (ex: ["breakfast", "sweet", "chocolate"])
  tags: {
    type: [String],
    index: true,
    default: []
  },
  
  imageUrl: String,

  // ============================================================================
  // DONNÉES SPÉCIFIQUES PAR CATÉGORIE
  // ============================================================================

  // FOOD : Données alimentaires
  foodData: {
    ingredients: String,
    ingredientsParsed: mongoose.Schema.Types.Mixed,
    additives: [additiveSchema],
    allergens: [allergenSchema],
    labels: [String],                    // Bio, Label Rouge, AOP, etc.
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

  // COSMETICS : Données cosmétiques
  cosmeticsData: {
    inciList: String,                          // Liste INCI brute
    ingredients: [cosmeticIngredientSchema],   // Ingrédients parsés
    endocrineDisruptors: [String],             // Perturbateurs endocriniens détectés
    allergens: [String],                       // Allergènes cosmétiques
    certifications: [String]                   // Cosmos, Ecocert, etc.
  },

  // DETERGENTS : Données produits ménagers
  detergentsData: {
    composition: [String],        // Composition générale
    surfactants: [String],        // Agents tensioactifs
    phosphateFree: Boolean,       // Sans phosphates
    biodegradable: Boolean,       // Biodégradabilité
    ecoLabels: [String]          // Écolabel, EU Ecolabel, etc.
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
      default: '3.0.0' 
    },
    breakdown: mongoose.Schema.Types.Mixed,        // Détail 8 composantes
    missingData: [String],                         // Champs manquants
    aiEstimations: mongoose.Schema.Types.Mixed,    // Estimations IA
    aiEnrichmentUsed: { 
      type: Boolean, 
      default: false 
    },
    aiEnrichmentSource: String,                    // DeepSeek, GPT, etc.
    aiEnrichmentError: String,                     // Erreur enrichissement IA
    scoringMetadata: mongoose.Schema.Types.Mixed,  // Métadonnées calcul
    dataQualityInfo: mongoose.Schema.Types.Mixed   // Qualité données sources
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
  updatedAt: { type: Date, default: Date.now }
});

// ============================================================================
// INDEX COMPOSÉS V3.2 (Optimisation queries)
// ============================================================================

// Index principaux pour filtrage et tri
productSchema.index({ categoryType: 1, 'scores.overallScore': -1 });
productSchema.index({ categoryType: 1, productType: 1 });
productSchema.index({ categoryType: 1, brand: 1 });
productSchema.index({ category: 1, 'analysisData.healthScore': -1 });

// Index full-text pour recherche
productSchema.index({ name: 'text', brand: 'text' });

// Index spécifiques FOOD
productSchema.index({ categoryType: 1, 'foodData.novaGroup': 1 });
productSchema.index({ categoryType: 1, 'foodData.nutriScore': 1 });

// Index spécifiques COSMETICS
productSchema.index({ categoryType: 1, 'cosmeticsData.certifications': 1 });

// Index spécifiques DETERGENTS
productSchema.index({ categoryType: 1, 'detergentsData.ecoLabels': 1 });

// Index pour moteur d'alternatives V3.2
productSchema.index({ categoryType: 1, subcategory: 1 });  // Matching rapide par sous-catégorie
productSchema.index({ categoryType: 1, tags: 1 });         // Recherche similarité par tags

// ============================================================================
// MÉTHODES INSTANCE
// ============================================================================

// Incrémenter compteur de vues
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

// Obtenir données publiques (sans champs sensibles)
productSchema.methods.getPublicData = function() {
  return this.toObject();
};

// ============================================================================
// MÉTHODES STATIQUES
// ============================================================================

// Recherche par code-barres
productSchema.statics.findByBarcode = function(barcode) {
  logger.debug('[Product] Recherche par barcode', { barcode });
  return this.findOne({ barcode });
};

// Recherche full-text
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

// Mise à jour timestamp automatique
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ============================================================================
// MIDDLEWARE AUTO-CALCUL SCORES V3.0.0
// ============================================================================
const scoringUnified = require('../services/scoringUnified');

productSchema.pre('save', async function(next) {
  const startTime = Date.now();
  
  // Si scores déjà calculés avec version 3.0.0, on skip
  if (this.scores?.scoringVersion === '3.0.0' && this.scores?.overallScore) {
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

    // Calcul selon catégorie
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

    // Appliquer scores calculés
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
    
    // On continue même en cas d'erreur (pas bloquant)
  }

  next();
});

// ============================================================================
// INITIALISATION MODÈLE
// ============================================================================

const ProductModel = mongoose.model('Product', productSchema);

logger.info('[Product] Modèle Product initialisé', {
  version: '3.2.1',
  indexes: productSchema.indexes().length,
  features: ['multi-category', 'auto-scoring', 'alternatives-engine']
});

module.exports = ProductModel;