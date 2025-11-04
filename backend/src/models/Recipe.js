const mongoose = require('mongoose');

/**
 * RECIPE MODEL - ECOLOJIA V3.1
 * Recettes scientifiques avec scoring santé/environnement
 * Intégrées aux produits Ecolojia pour liste courses automatique
 */

const IngredientSchema = new mongoose.Schema({
  // Lien vers produit Ecolojia (si disponible)
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product'
  },
  
  // Données de base
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { 
    type: String, 
    enum: ['g', 'kg', 'ml', 'L', 'càs', 'càc', 'pincée', 'unité'],
    required: true 
  },
  
  // Rôle nutritionnel
  role: { 
    type: String, 
    enum: ['base', 'protein', 'fat', 'fiber', 'flavor', 'texture'],
    default: 'base'
  },
  
  // Scoring (si lié à produit)
  score: { type: Number, min: 0, max: 100 },
  
  // Substitutions possibles
  substitutions: [{
    name: String,
    quantity: Number,
    unit: String,
    reason: String, // "Sans gluten", "Vegan", etc.
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  }]
}, { _id: false });

const StepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  instruction: { type: String, required: true },
  duration: Number, // minutes
  temperature: Number, // °C si cuisson
  tips: [String]
}, { _id: false });

const RecipeSchema = new mongoose.Schema({
  // ============================================================================
  // IDENTIFICATION
  // ============================================================================
  
  name: { 
    type: String, 
    required: true, 
    index: 'text' 
  },
  
  slug: { 
    type: String, 
    unique: true,
    index: true
  },
  
  description: String,
  image: String,
  
  category: { 
    type: String, 
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'],
    required: true,
    index: true 
  },
  
  // ============================================================================
  // SCORING (comme Product)
  // ============================================================================
  
  scores: {
    overallScore: { 
      type: Number, 
      min: 0, 
      max: 100,
      index: true 
    },
    
    healthScore: { type: Number, min: 0, max: 100 },
    environmentScore: { type: Number, min: 0, max: 100 },
    
    confidence: { 
      type: Number, 
      min: 0, 
      max: 1,
      default: 0.9
    },
    
    // Détail composantes
    breakdown: {
      glycemicImpact: { score: Number, weight: Number, label: String },
      satiety: { score: Number, weight: Number, label: String },
      cardiovascular: { score: Number, weight: Number, label: String },
      digestion: { score: Number, weight: Number, label: String },
      co2Footprint: { score: Number, weight: Number, label: String },
      localSourcing: { score: Number, weight: Number, label: String }
    }
  },
  
  // ============================================================================
  // NUTRITION (calculée depuis ingrédients)
  // ============================================================================
  
  nutrition: {
    perServing: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fiber: Number,
      fat: Number,
      saturatedFat: Number,
      sugar: Number,
      salt: Number
    }
  },
  
  // ============================================================================
  // INGRÉDIENTS INTELLIGENTS
  // ============================================================================
  
  ingredients: [IngredientSchema],
  
  // ============================================================================
  // ÉTAPES
  // ============================================================================
  
  steps: [StepSchema],
  
  // ============================================================================
  // MÉTADONNÉES RECETTE
  // ============================================================================
  
  prepTime: { type: Number, required: true }, // minutes
  cookTime: Number,
  totalTime: Number, // Auto-calculé
  
  servings: { type: Number, default: 4 },
  
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  
  cost: {
    perServing: Number,
    total: Number
  },
  
  // ============================================================================
  // PROFILS CIBLES (filtrage)
  // ============================================================================
  
  targetProfiles: {
    dietary: [{ 
      type: String,
      enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo']
    }],
    
    goals: [{ 
      type: String,
      enum: ['health', 'eco', 'budget', 'weight-loss', 'muscle-gain']
    }],
    
    allergens: [String] // Liste allergènes ABSENTS
  },
  
  // ============================================================================
  // IMPACT ENVIRONNEMENTAL
  // ============================================================================
  
  environmental: {
    co2Total: Number,
    co2PerServing: Number,
    seasonality: { 
      type: String, 
      enum: ['all-year', 'spring', 'summer', 'fall', 'winter']
    }
  },
  
  // ============================================================================
  // IA METADATA
  // ============================================================================
  
  generatedBy: { 
    type: String, 
    enum: ['manual', 'ai', 'community'],
    default: 'manual'
  },
  
  aiPrompt: String,
  
  // ============================================================================
  // OWNERSHIP
  // ============================================================================
  
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  isPublic: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  isStock: { type: Boolean, default: false }, // Recette stock (bibliothèque)
  
  // Stats
  viewCount: { type: Number, default: 0 },
  savedCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

// ============================================================================
// INDEX
// ============================================================================

RecipeSchema.index({ name: 'text', 'ingredients.name': 'text' });
RecipeSchema.index({ 'scores.overallScore': -1 });
RecipeSchema.index({ category: 1, 'scores.overallScore': -1 });
RecipeSchema.index({ isStock: 1, isPublic: 1 });

// ============================================================================
// MÉTHODES
// ============================================================================

// Calculer temps total automatiquement
RecipeSchema.pre('save', function(next) {
  this.totalTime = this.prepTime + (this.cookTime || 0);
  next();
});

// Générer slug automatiquement
RecipeSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Vérifier compatibilité avec profil utilisateur
RecipeSchema.methods.isCompatibleWith = function(userProfile) {
  const userAllergens = userProfile.allergens || [];
  const recipeAllergens = this.targetProfiles.allergens || [];
  
  const hasAllergen = userAllergens.some(a => !recipeAllergens.includes(a));
  if (hasAllergen) {
    return { compatible: false, reason: 'Allergène incompatible' };
  }
  
  return { compatible: true };
};

module.exports = mongoose.model('Recipe', RecipeSchema);