// backend/src/models/User.js
// FICHIER COMPLET CORRIGÉ

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schéma utilisateur
const userSchema = new mongoose.Schema({
  // Informations de base
  email: {
    type: String,
    required: [true, 'Email requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: 6
  },
  
  name: {
    type: String,
    required: [true, 'Nom requis'],
    trim: true
  },
  
  // Profil détaillé
  profile: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    avatarUrl: String,
    phone: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    }
  },
  
  // Abonnement
  tier: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free'
  },
  
  subscription: {
    plan: {
      type: String,
      enum: ['monthly', 'annual'],
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'unpaid'],
      default: null
    },
    currentPeriodEnd: Date,
    lemonSqueezyCustomerId: {
      type: String,
      unique: true,
      sparse: true
    },
    lemonSqueezySubscriptionId: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  
  // Quotas
  quotas: {
    scansRemaining: {
      type: Number,
      default: 30
    },
    scansResetDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    aiChatsRemaining: {
      type: Number,
      default: 5
    },
    aiChatsResetDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    exportsRemaining: {
      type: Number,
      default: 0
    },
    exportsResetDate: Date
  },
  
  // Préférences
  preferences: {
    allergies: [{
      type: String,
      enum: ['gluten', 'lactose', 'eggs', 'nuts', 'peanuts', 'soy', 'fish', 'shellfish', 'sesame']
    }],
    diets: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'keto', 'paleo']
    }],
    healthGoals: [{
      type: String,
      enum: ['weight-loss', 'muscle-gain', 'health', 'energy', 'digestion']
    }],
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    }
  },
  
  // Statut et sécurité
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  // Métadonnées
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastLoginAt: Date,
  lastLoginIp: String,
  
  // RGPD
  gdpr: {
    consentDate: Date,
    consentVersion: String,
    marketingConsent: { type: Boolean, default: false },
    dataProcessingConsent: { type: Boolean, default: true }
  },
  
  // Admin
  isAdmin: {
    type: Boolean,
    default: false
  },
  
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true, // createdAt, updatedAt
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Index pour les performances
userSchema.index({ email: 1 });
userSchema.index({ tier: 1 });
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ createdAt: -1 });

// Virtuals
userSchema.virtual('displayName').get(function() {
  if (this.profile?.firstName && this.profile?.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.name || this.email.split('@')[0];
});

userSchema.virtual('isPremium').get(function() {
  return this.tier === 'premium' || this.tier === 'pro';
});

userSchema.virtual('hasActiveSubscription').get(function() {
  return this.subscription?.status === 'active' && 
         this.subscription?.currentPeriodEnd > new Date();
});

// Méthodes d'instance
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateReferralCode = function() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  this.referralCode = `ECO-${code}`;
  return this.referralCode;
};

userSchema.methods.resetQuotas = function() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  if (this.tier === 'free') {
    this.quotas.scansRemaining = 30;
    this.quotas.aiChatsRemaining = 5;
    this.quotas.exportsRemaining = 0;
  } else if (this.tier === 'premium') {
    this.quotas.scansRemaining = 999999;
    this.quotas.aiChatsRemaining = 500;
    this.quotas.exportsRemaining = 100;
  }
  
  this.quotas.scansResetDate = thirtyDaysFromNow;
  this.quotas.aiChatsResetDate = thirtyDaysFromNow;
  this.quotas.exportsResetDate = thirtyDaysFromNow;
};

// Méthodes statiques
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

userSchema.statics.findPremiumUsers = function() {
  return this.find({ tier: { $in: ['premium', 'pro'] } });
};

// Hooks
userSchema.pre('save', async function(next) {
  // Hash le mot de passe seulement s'il a été modifié
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', function(next) {
  // Générer un code de parrainage si nécessaire
  if (this.isNew && !this.referralCode) {
    this.generateReferralCode();
  }
  next();
});

// Export du modèle
const User = mongoose.model('User', userSchema);
module.exports = User;