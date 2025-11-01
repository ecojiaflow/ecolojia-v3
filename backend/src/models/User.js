// PATH: backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const aiPreferencesSchema = new mongoose.Schema({
  tone: {
    type: String,
    enum: ['concise', 'detailed', 'educational', 'friendly'],
    default: 'friendly'
  },
  detailLevel: {
    type: String,
    enum: ['minimal', 'moderate', 'comprehensive'],
    default: 'moderate'
  },
  language: {
    type: String,
    enum: ['fr', 'en', 'es', 'de'],
    default: 'fr'
  },
  foodRestrictions: [{
    type: String,
    enum: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free', 'halal', 'kosher', 'low-sodium', 'diabetic']
  }],
  allergens: [{
    type: String,
    enum: ['peanuts', 'tree-nuts', 'milk', 'eggs', 'wheat', 'soy', 'fish', 'shellfish', 'sesame']
  }],
  cosmeticPreferences: {
    avoidIngredients: [String],
    skinType: {
      type: String,
      enum: ['normal', 'dry', 'oily', 'combination', 'sensitive']
    }
  },
  notificationPreferences: {
    emailAlerts: { type: Boolean, default: true },
    productRecalls: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false }
  }
}, { _id: false });

// ⭐ NOUVEAU SCHÉMA V3.2 - PROFIL PERSONNALISÉ
const profileSchema = new mongoose.Schema({
  diet: {
    type: String,
    enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'flexitarian'],
    default: 'omnivore'
  },
  allergens: [{
    type: String,
    enum: [
      'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 
      'soybeans', 'milk', 'nuts', 'celery', 'mustard', 
      'sesame', 'sulfites', 'lupin', 'molluscs',
      'tree-nuts', 'wheat', 'soy', 'shellfish'
    ]
  }],
  goal: {
    type: String,
    enum: ['health', 'eco', 'budget', 'weight-loss', 'muscle-gain', 'general'],
    default: 'health'
  },
  budget: {
    monthly: { type: Number, default: 300, min: 50, max: 2000 },
    preferStick: { type: Boolean, default: false }
  },
  labels: {
    bioRequired: { type: Boolean, default: false },
    bioPriority: { type: Boolean, default: true },
    localPriority: { type: Boolean, default: false },
    fairTrade: { type: Boolean, default: false }
  },
  excludedIngredients: [String],
  preferences: {
    cosmetic: {
      natural: { type: Boolean, default: true },
      vegan: { type: Boolean, default: false },
      skinType: {
        type: String,
        enum: ['normal', 'dry', 'oily', 'combination', 'sensitive']
      }
    },
    detergent: {
      biodegradable: { type: Boolean, default: true },
      fragrance: { 
        type: String, 
        enum: ['none', 'natural', 'any'], 
        default: 'natural' 
      }
    }
  },
  completeness: { type: Number, default: 0, min: 0, max: 100 },
  migratedFromAiPreferences: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Plan & Subscription
  plan: {
    code: {
      type: String,
      enum: ['free', 'premium', 'family'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing'],
      default: 'active'
    },
    periodEnd: Date,
    customerId: String,
    subscriptionId: String
  },
  
  // Quotas & Limits
  limits: {
    scansPerMonth: { type: Number, default: 30 },
    aiChatsPerMonth: { type: Number, default: 5 },
    exportPerMonth: { type: Number, default: 1 },
    favoritesMax: { type: Number, default: 20 }
  },
  
  // Usage tracking (current month)
  usage: {
    currentMonth: { type: Number, default: () => new Date().getMonth() },
    scans: { type: Number, default: 0 },
    aiChats: { type: Number, default: 0 },
    exports: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },
  
  // AI Preferences
  aiPreferences: {
    type: aiPreferencesSchema,
    default: () => ({})
  },
  // ⭐ PROFIL V3.2 - COHABITE avec aiPreferences
  profile: {
    type: profileSchema,
    default: () => ({})
  },
  
  // Timestamps
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
userSchema.index({ 'plan.customerId': 1 });

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.resetMonthlyUsage = function() {
  const currentMonth = new Date().getMonth();
  if (this.usage.currentMonth !== currentMonth) {
    this.usage.currentMonth = currentMonth;
    this.usage.scans = 0;
    this.usage.aiChats = 0;
    this.usage.exports = 0;
    this.usage.lastReset = new Date();
  }
};

userSchema.methods.canScan = function() {
  this.resetMonthlyUsage();
  return this.plan.code === 'premium' || 
         this.plan.code === 'family' || 
         this.usage.scans < this.limits.scansPerMonth;
};

userSchema.methods.canUseAI = function() {
  this.resetMonthlyUsage();
  return this.plan.code === 'premium' || 
         this.plan.code === 'family' || 
         this.usage.aiChats < this.limits.aiChatsPerMonth;
};


// ⭐ MÉTHODE : Migration automatique aiPreferences → profile
userSchema.methods.migrateToV32Profile = function() {
  if (this.profile?.migratedFromAiPreferences) return false;
  if (!this.profile) this.profile = {};

  const aiPrefs = this.aiPreferences || {};
  
  if (aiPrefs.foodRestrictions?.length > 0) {
    const restrictions = aiPrefs.foodRestrictions;
    if (restrictions.includes('vegan')) this.profile.diet = 'vegan';
    else if (restrictions.includes('vegetarian')) this.profile.diet = 'vegetarian';
    else this.profile.diet = 'omnivore';
  }

  if (aiPrefs.allergens?.length > 0) {
    this.profile.allergens = aiPrefs.allergens.map(a => {
      const mapping = { 'tree-nuts': 'nuts', 'wheat': 'gluten', 'soy': 'soybeans', 'shellfish': 'crustaceans' };
      return mapping[a] || a;
    });
  }

  if (!this.profile.goal) this.profile.goal = 'health';
  if (!this.profile.budget) this.profile.budget = { monthly: 300, preferStick: false };
  if (!this.profile.labels) this.profile.labels = { bioRequired: false, bioPriority: true, localPriority: false, fairTrade: false };

  this.profile.migratedFromAiPreferences = true;
  this.calculateProfileCompleteness();
  return true;
};

// ⭐ MÉTHODE : Calculer complétude profil
userSchema.methods.calculateProfileCompleteness = function() {
  if (!this.profile) { this.profile = { completeness: 0 }; return 0; }
  let score = 0;
  if (this.profile.diet && this.profile.diet !== 'omnivore') score += 20;
  if (this.profile.allergens?.length > 0) score += 20;
  if (this.profile.goal && this.profile.goal !== 'general') score += 20;
  if (this.profile.budget?.monthly && this.profile.budget.monthly !== 300) score += 20;
  if (this.profile.labels && (this.profile.labels.bioRequired || this.profile.labels.localPriority || this.profile.labels.fairTrade)) score += 20;
  this.profile.completeness = score;
  return score;
};

// ⭐ HELPER : Libellé régime
userSchema.methods.getDietLabel = function() {
  const labels = { 'omnivore': 'Omnivore', 'vegetarian': 'Végétarien', 'vegan': 'Végane', 'pescatarian': 'Pescétarien', 'flexitarian': 'Flexitarien' };
  return labels[this.profile?.diet] || 'Omnivore';
};

// ⭐ HELPER : Vérifier compatibilité produit/profil
userSchema.methods.isProductCompatible = function(product) {
  if (!this.profile) return { compatible: true };
  const diet = this.profile.diet;
  const allergens = this.profile.allergens || [];
  const ingredients = product.ingredients_text?.toLowerCase() || '';

  if (diet === 'vegan') {
    const animalKeywords = ['lait', 'œuf', 'oeuf', 'miel', 'viande', 'poisson', 'crustacé', 'gélatine'];
    for (const keyword of animalKeywords) {
      if (ingredients.includes(keyword)) return { compatible: false, reason: `Contient ${keyword} (incompatible régime végane)` };
    }
  }

  if (diet === 'vegetarian') {
    const meatKeywords = ['viande', 'poisson', 'poulet', 'bœuf', 'porc', 'agneau'];
    for (const keyword of meatKeywords) {
      if (ingredients.includes(keyword)) return { compatible: false, reason: `Contient ${keyword} (incompatible régime végétarien)` };
    }
  }

  if (allergens.length > 0) {
    const productAllergens = product.allergens || [];
    const conflict = allergens.find(a => productAllergens.includes(a) || ingredients.includes(a));
    if (conflict) return { compatible: false, reason: `⚠️ ALLERGIE : Contient ${conflict}` };
  }

  return { compatible: true };
};
// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = new Date();
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;