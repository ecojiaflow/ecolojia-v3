const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productScore: Number,
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
  notes: String
});

const mealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    default: 'Mon plan repas'
  },
  meals: [mealItemSchema],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  dietaryPreferences: {
    type: [String],
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'halal', 'kosher'],
    default: []
  },
  targetScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

mealPlanSchema.index({ userId: 1, startDate: -1 });

mealPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

mealPlanSchema.methods.getAverageScore = function() {
  if (this.meals.length === 0) return 0;
  const totalScore = this.meals.reduce((sum, meal) => sum + (meal.productScore || 0), 0);
  return Math.round(totalScore / this.meals.length);
};

mealPlanSchema.methods.getMealsByDate = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.meals.filter(meal => 
    meal.date >= startOfDay && meal.date <= endOfDay
  );
};

module.exports = mongoose.model('MealPlan', mealPlanSchema);