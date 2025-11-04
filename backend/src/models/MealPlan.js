const mongoose = require('mongoose');

/**
 * MEAL PLAN MODEL - ECOLOJIA V3.1
 * Plan repas hebdomadaire avec recettes ET produits
 * Calcul automatique score global + calories + macros
 */

const mealItemSchema = new mongoose.Schema({
  // Type : recette OU produit
  type: {
    type: String,
    enum: ['recipe', 'product'],
    required: true
  },
  
  // Si type = recipe
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  },
  recipeName: String,
  recipeScore: Number,
  
  // Si type = product
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: String,
  productScore: Number,
  
  // Commun
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  portion: {
    type: Number,
    default: 1
  },
  
  // Nutrition (calculée ou récupérée)
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  
  notes: String
}, { _id: true });

const mealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  description: String,
  
  // Dates du plan
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  // Items (recettes + produits)
  items: [mealItemSchema],
  
  // ============================================================================
  // SCORES GLOBAUX (calculés automatiquement)
  // ============================================================================
  
  scores: {
    overall: { type: Number, min: 0, max: 100 },
    health: { type: Number, min: 0, max: 100 },
    environment: { type: Number, min: 0, max: 100 },
    
    byDay: [{
      date: Date,
      score: Number
    }]
  },
  
  // ============================================================================
  // NUTRITION GLOBALE (calculée automatiquement)
  // ============================================================================
  
  nutrition: {
    totalCalories: Number,
    avgCaloriesPerDay: Number,
    totalProtein: Number,
    totalCarbs: Number,
    totalFat: Number,
    totalFiber: Number,
    
    byDay: [{
      date: Date,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }]
  },
  
  // ============================================================================
  // CONFIGURATION UTILISATEUR
  // ============================================================================
  
  config: {
    targetCalories: Number, // Objectif calories/jour
    targetMacros: {
      proteinPercent: Number,
      carbsPercent: Number,
      fatPercent: Number
    },
    dietary: {
      type: String,
      enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo']
    },
    allergens: [String],
    budget: Number // Budget total semaine
  },
  
  // ============================================================================
  // STATUT
  // ============================================================================
  
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  
  generationPrompt: String, // Prompt utilisé si généré par IA
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: Date
});

// ============================================================================
// INDEX
// ============================================================================

mealPlanSchema.index({ userId: 1, startDate: -1 });
mealPlanSchema.index({ userId: 1, status: 1 });

// ============================================================================
// MÉTHODES
// ============================================================================

/**
 * Calculer scores globaux du plan
 */
mealPlanSchema.methods.calculateScores = function() {
  if (!this.items || this.items.length === 0) {
    this.scores = { overall: 0, health: 0, environment: 0, byDay: [] };
    return;
  }
  
  // Score global moyen
  const scores = this.items
    .map(item => item.recipeScore || item.productScore)
    .filter(s => s !== undefined && s !== null);
  
  if (scores.length > 0) {
    this.scores.overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    this.scores.health = this.scores.overall; // Simplifié pour l'instant
    this.scores.environment = this.scores.overall;
  }
  
  // Scores par jour
  const dayMap = new Map();
  this.items.forEach(item => {
    const dateKey = item.date.toISOString().split('T')[0];
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, []);
    }
    const score = item.recipeScore || item.productScore;
    if (score !== undefined) {
      dayMap.get(dateKey).push(score);
    }
  });
  
  this.scores.byDay = Array.from(dayMap.entries()).map(([dateKey, scores]) => ({
    date: new Date(dateKey),
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }));
};

/**
 * Calculer nutrition globale du plan
 */
mealPlanSchema.methods.calculateNutrition = function() {
  if (!this.items || this.items.length === 0) {
    this.nutrition = {
      totalCalories: 0,
      avgCaloriesPerDay: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      byDay: []
    };
    return;
  }
  
  // Totaux
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  
  this.items.forEach(item => {
    if (item.nutrition) {
      totalCalories += (item.nutrition.calories || 0) * item.portion;
      totalProtein += (item.nutrition.protein || 0) * item.portion;
      totalCarbs += (item.nutrition.carbs || 0) * item.portion;
      totalFat += (item.nutrition.fat || 0) * item.portion;
      totalFiber += (item.nutrition.fiber || 0) * item.portion;
    }
  });
  
  // Nombre de jours
  const daysDiff = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  this.nutrition.totalCalories = Math.round(totalCalories);
  this.nutrition.avgCaloriesPerDay = Math.round(totalCalories / daysDiff);
  this.nutrition.totalProtein = Math.round(totalProtein);
  this.nutrition.totalCarbs = Math.round(totalCarbs);
  this.nutrition.totalFat = Math.round(totalFat);
  this.nutrition.totalFiber = Math.round(totalFiber);
  
  // Par jour
  const dayMap = new Map();
  this.items.forEach(item => {
    const dateKey = item.date.toISOString().split('T')[0];
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }
    
    const dayData = dayMap.get(dateKey);
    if (item.nutrition) {
      dayData.calories += (item.nutrition.calories || 0) * item.portion;
      dayData.protein += (item.nutrition.protein || 0) * item.portion;
      dayData.carbs += (item.nutrition.carbs || 0) * item.portion;
      dayData.fat += (item.nutrition.fat || 0) * item.portion;
    }
  });
  
  this.nutrition.byDay = Array.from(dayMap.entries()).map(([dateKey, data]) => ({
    date: new Date(dateKey),
    calories: Math.round(data.calories),
    protein: Math.round(data.protein),
    carbs: Math.round(data.carbs),
    fat: Math.round(data.fat)
  }));
};

/**
 * Hook pre-save : recalculer scores et nutrition
 */
mealPlanSchema.pre('save', function(next) {
  this.calculateScores();
  this.calculateNutrition();
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MealPlan', mealPlanSchema);