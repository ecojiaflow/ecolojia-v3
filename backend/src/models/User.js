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

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
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