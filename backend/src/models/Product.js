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

module.exports = mongoose.model('Product', productSchema);

