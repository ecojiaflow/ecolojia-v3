// backend/src/models/Product.js
const mongoose = require('mongoose');

const additiveSchema = new mongoose.Schema({
  tag: String,
  code: String,
  name: String,
  function: String,
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
    default: 'LOW'
  },
  healthConcerns: [String],
  origin: String
}, { _id: false });

const allergenSchema = new mongoose.Schema({
  tag: String,
  name: String,
  category: String,
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
    default: 'MEDIUM'
  },
  description: String,
  concerns: [String],
  icon: String
}, { _id: false });

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

const cosmeticIngredientSchema = new mongoose.Schema({
  inci: String,
  function: String,
  origin: {
    type: String,
    enum: ['natural', 'synthetic', 'derived']
  },
  concerns: [String],
  isEndocrineDisruptor: { type: Boolean, default: false }
}, { _id: false });

const productSchema = new mongoose.Schema({
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['food', 'cosmetics', 'detergents']
  },
  subcategory: {
    type: String,
    index: true
  },
  imageUrl: String,

  foodData: {
    ingredients: String,
    ingredientsParsed: mongoose.Schema.Types.Mixed,
    additives: [additiveSchema],
    allergens: [allergenSchema],  // ? Modifié en objets
    labels: [String],
    nutritionalInfo: nutritionSchema,
    novaGroup: { type: Number, min: 1, max: 4 },
    nutriScore: { type: String, enum: ['A', 'B', 'C', 'D', 'E'] },
    ecoScore: { type: String, enum: ['A', 'B', 'C', 'D', 'E'] }
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

  // Scores scientifiques (Calculate Once, Store Forever)
  scores: {
    overallScore: { type: Number, min: 0, max: 100, index: true },
    healthScore: { type: Number, min: 0, max: 100 },
    environmentScore: { type: Number, min: 0, max: 100 },
    confidence: Number,
    dataCompleteness: String,
    calculatedAt: { type: Date, default: Date.now },
    scoringVersion: { type: String, default: '3.0.0' },
    breakdown: mongoose.Schema.Types.Mixed  // Flexible pour accepter TOUS les champs
  },

  analysisData: {
    healthScore: { type: Number, min: 0, max: 100 },
    lastAnalyzedAt: Date,
    version: String,
    confidence: Number
  },

  viewCount: { type: Number, default: 0 },
  scanCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ category: 1, 'analysisData.healthScore': -1 });
productSchema.index({ name: 'text', brand: 'text' });

productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

productSchema.methods.incrementView = async function() {
  this.viewCount++;
  return this.save();
};

productSchema.methods.getPublicData = function() {
  return this.toObject();
};

productSchema.statics.findByBarcode = function(barcode) {
  return this.findOne({ barcode });
};

productSchema.statics.searchProducts = async function(query, category = null) {
  const searchCriteria = { $text: { $search: query } };
  if (category) searchCriteria.category = category;
  
  return this.find(searchCriteria)
    .select('-__v')
    .limit(20)
    .sort({ score: { $meta: 'textScore' } });
};


// ============================================================================
// MIDDLEWARE AUTO-CALCUL SCORES V3.0.0
// ============================================================================
const scoringUnified = require('../services/scoringUnified');

productSchema.pre('save', async function(next) {
  if (this.scores?.scoringVersion === '3.0.0' && this.scores?.overallScore) {
    return next();
  }
  
  try {
    let calculatedScores;
    
    if (this.category === 'food' || !this.category) {
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
        nutriments: {
          sugars_100g: nutritionalInfo.sugars,
          'saturated-fat_100g': nutritionalInfo.saturatedFat,
          salt_100g: nutritionalInfo.salt
        }
      };
      
      calculatedScores = scoringUnified.calculateFoodScores(scoringData);
    } 
    else if (this.category === 'cosmetics') {
      calculatedScores = scoringUnified.calculateCosmeticScores(this);
    } 
    else if (this.category === 'detergents') {
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
    }
  } catch (error) {
    console.error('[Middleware]', error.message);
  }
  
  next();
});
module.exports = mongoose.model('Product', productSchema);





