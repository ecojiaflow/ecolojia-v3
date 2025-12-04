// PATH: backend/src/models/User.js
// VERSION: 3.2.1 - Production-Ready avec Logger & RGPD
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

/**
 * ═══════════════════════════════════════════════════════════════
 * SOUS-SCHÉMA : AI PREFERENCES (LEGACY - À MIGRER VERS PROFILE)
 * ═══════════════════════════════════════════════════════════════
 * Conservé pour rétrocompatibilité. Migration automatique vers
 * profileSchema via méthode migrateToV32Profile()
 */
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

/**
 * ═══════════════════════════════════════════════════════════════
 * SOUS-SCHÉMA : PROFIL UTILISATEUR V3.2 (ACTUEL)
 * ═══════════════════════════════════════════════════════════════
 * Profil personnalisé multi-catégories (food, cosmetic, detergent)
 * Utilisé pour :
 * - Alternatives personnalisées
 * - Recherche IA contextuelle
 * - Recommandations produits
 * - Optimisation budget
 */
const profileSchema = new mongoose.Schema({
  // ALIMENTATION
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
  
  // BUDGET
  budget: {
    monthly: { type: Number, default: 300, min: 50, max: 2000 },
    preferStick: { type: Boolean, default: false }
  },
  
  // LABELS & CERTIFICATIONS
  labels: {
    bioRequired: { type: Boolean, default: false },
    bioPriority: { type: Boolean, default: true },
    localPriority: { type: Boolean, default: false },
    fairTrade: { type: Boolean, default: false }
  },
  
  // INGRÉDIENTS EXCLUS (personnalisé)
  excludedIngredients: [String],
  
  // PRÉFÉRENCES COSMÉTIQUES & DÉTERGENTS
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
  
  // MÉTA-DONNÉES PROFIL
  completeness: { type: Number, default: 0, min: 0, max: 100 },
  migratedFromAiPreferences: { type: Boolean, default: false }
}, { _id: false });

/**
 * ═══════════════════════════════════════════════════════════════
 * SCHÉMA PRINCIPAL : USER
 * ═══════════════════════════════════════════════════════════════
 */
const userSchema = new mongoose.Schema({
  // ────────────────────────────────────────────────────────────
  // AUTHENTIFICATION
  // ────────────────────────────────────────────────────────────
  email: {
    type: String,
    required: [true, 'Email requis'],
    unique: true,
    lowercase: true,
    trim: true,
    // ✅ CORRECTION : Validation regex stricte format email
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} n'est pas un format email valide`
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Permet null/undefined pour users non-Google
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  name: {
    type: String,
    required: [true, 'Nom requis'],
    trim: true
  },
  avatar: String,
  
  // ────────────────────────────────────────────────────────────
  // VÉRIFICATION EMAIL
  // ────────────────────────────────────────────────────────────
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // ────────────────────────────────────────────────────────────
  // ✅ NOUVEAU : CONFORMITÉ RGPD (Article 7, 17, 20)
  // ────────────────────────────────────────────────────────────
  rgpd: {
    consentGiven: {
      type: Boolean,
      required: true,
      default: false
    },
    consentDate: {
      type: Date,
      default: null
    },
    consentVersion: {
      type: String,
      default: '1.0'
    },
    lastGdprRequest: {
      type: Date,
      default: null
    },
    dataExportRequested: {
      type: Boolean,
      default: false
    }
  },
  
  // ✅ NOUVEAU : SOFT DELETE (droit à l'oubli)
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },

  // ────────────────────────────────────────────────────────────
  // PLAN & ABONNEMENT
  // ────────────────────────────────────────────────────────────
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
    customerId: String, // LemonSqueezy customer ID
    subscriptionId: String // LemonSqueezy subscription ID
  },

  // ────────────────────────────────────────────────────────────
  // QUOTAS & LIMITES (FREEMIUM)
  // ────────────────────────────────────────────────────────────
  limits: {
    scansPerMonth: { type: Number, default: 30 },
    aiChatsPerMonth: { type: Number, default: 5 },
    exportPerMonth: { type: Number, default: 1 },
    favoritesMax: { type: Number, default: 20 }
  },

  // ────────────────────────────────────────────────────────────
  // USAGE TRACKING (MOIS EN COURS)
  // ────────────────────────────────────────────────────────────
  usage: {
    currentMonth: { type: Number, default: () => new Date().getMonth() },
    scans: { type: Number, default: 0 },
    aiChats: { type: Number, default: 0 },
    exports: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },

  // ────────────────────────────────────────────────────────────
  // PRÉFÉRENCES UTILISATEUR
  // ────────────────────────────────────────────────────────────
  aiPreferences: {
    type: aiPreferencesSchema,
    default: () => ({})
  },
  profile: {
    type: profileSchema,
    default: () => ({})
  },

  // ────────────────────────────────────────────────────────────
  // TIMESTAMPS
  // ────────────────────────────────────────────────────────────
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * INDEX OPTIMISÉS (PERFORMANCE QUERIES)
 * ═══════════════════════════════════════════════════════════════
 */

// Index simple : recherche par email (query fréquente auth)
userSchema.index({ email: 1 });

// Index simple : recherche par googleId (OAuth Google)
userSchema.index({ googleId: 1 });

// Index simple : recherche client LemonSqueezy
userSchema.index({ 'plan.customerId': 1 });

// Index composé : users actifs non supprimés
userSchema.index({ isDeleted: 1, 'plan.status': 1 });

// Index composé : email vérifié + non supprimé (auth complète)
userSchema.index({ email: 1, emailVerified: 1, isDeleted: 1 });

// Index : tri par date création (admin dashboard)
userSchema.index({ createdAt: -1 });

/**
 * ═══════════════════════════════════════════════════════════════
 * MÉTHODES D'INSTANCE
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Comparer mot de passe (auth login)
 * @param {string} candidatePassword - Mot de passe en clair
 * @returns {Promise<boolean>} - True si match, false sinon
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  const startTime = Date.now();
  
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    const duration = Date.now() - startTime;
    
    logger.info('[User] Comparaison mot de passe', {
      userId: this._id,
      email: this.email,
      success: isMatch,
      durationMs: duration
    });
    
    return isMatch;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('[User] Erreur comparaison mot de passe', {
      error: error.message,
      stack: error.stack,
      userId: this._id,
      email: this.email,
      durationMs: duration
    });
    
    throw new Error('Erreur lors de la vérification du mot de passe');
  }
};

/**
 * Réinitialiser quotas mensuels si changement de mois
 * @returns {boolean} - True si reset effectué, false sinon
 */
userSchema.methods.resetMonthlyUsage = function() {
  const currentMonth = new Date().getMonth();
  
  if (this.usage.currentMonth !== currentMonth) {
    const previousUsage = {
      month: this.usage.currentMonth,
      scans: this.usage.scans,
      aiChats: this.usage.aiChats,
      exports: this.usage.exports
    };
    
    this.usage.currentMonth = currentMonth;
    this.usage.scans = 0;
    this.usage.aiChats = 0;
    this.usage.exports = 0;
    this.usage.lastReset = new Date();
    
    logger.info('[User] Reset quotas mensuels', {
      userId: this._id,
      email: this.email,
      previousUsage,
      newMonth: currentMonth
    });
    
    return true;
  }
  
  return false;
};

/**
 * Vérifier si l'utilisateur peut scanner un produit
 * @returns {boolean} - True si scan autorisé, false sinon
 */
userSchema.methods.canScan = function() {
  this.resetMonthlyUsage();
  
  const canScan = this.plan.code === 'premium' ||
                  this.plan.code === 'family' ||
                  this.usage.scans < this.limits.scansPerMonth;
  
  if (!canScan) {
    logger.warn('[User] Quota scan dépassé', {
      userId: this._id,
      email: this.email,
      plan: this.plan.code,
      usage: this.usage.scans,
      limit: this.limits.scansPerMonth
    });
  }
  
  return canScan;
};

/**
 * Vérifier si l'utilisateur peut utiliser l'IA
 * @returns {boolean} - True si IA autorisée, false sinon
 */
userSchema.methods.canUseAI = function() {
  this.resetMonthlyUsage();
  
  const canUseAI = this.plan.code === 'premium' ||
                   this.plan.code === 'family' ||
                   this.usage.aiChats < this.limits.aiChatsPerMonth;
  
  if (!canUseAI) {
    logger.warn('[User] Quota IA dépassé', {
      userId: this._id,
      email: this.email,
      plan: this.plan.code,
      usage: this.usage.aiChats,
      limit: this.limits.aiChatsPerMonth
    });
  }
  
  return canUseAI;
};

/**
 * ═══════════════════════════════════════════════════════════════
 * MIGRATION AUTOMATIQUE aiPreferences → profile (V3.2)
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Migrer aiPreferences (legacy) vers profile (V3.2)
 * @returns {boolean} - True si migration effectuée, false si déjà migrée
 */
userSchema.methods.migrateToV32Profile = function() {
  if (this.profile?.migratedFromAiPreferences) {
    logger.info('[User] Migration V3.2 déjà effectuée', {
      userId: this._id,
      email: this.email
    });
    return false;
  }
  
  if (!this.profile) this.profile = {};
  const aiPrefs = this.aiPreferences || {};

  // Migration foodRestrictions → diet
  if (aiPrefs.foodRestrictions?.length > 0) {
    const restrictions = aiPrefs.foodRestrictions;
    if (restrictions.includes('vegan')) this.profile.diet = 'vegan';
    else if (restrictions.includes('vegetarian')) this.profile.diet = 'vegetarian';
    else this.profile.diet = 'omnivore';
  }

  // Migration allergens
  if (aiPrefs.allergens?.length > 0) {
    this.profile.allergens = aiPrefs.allergens.map(a => {
      const mapping = {
        'tree-nuts': 'nuts',
        'wheat': 'gluten',
        'soy': 'soybeans',
        'shellfish': 'crustaceans'
      };
      return mapping[a] || a;
    });
  }

  // Valeurs par défaut
  if (!this.profile.goal) this.profile.goal = 'health';
  if (!this.profile.budget) {
    this.profile.budget = { monthly: 300, preferStick: false };
  }
  if (!this.profile.labels) {
    this.profile.labels = {
      bioRequired: false,
      bioPriority: true,
      localPriority: false,
      fairTrade: false
    };
  }

  this.profile.migratedFromAiPreferences = true;
  this.calculateProfileCompleteness();
  
  logger.info('[User] Migration V3.2 effectuée', {
    userId: this._id,
    email: this.email,
    diet: this.profile.diet,
    allergens: this.profile.allergens,
    completeness: this.profile.completeness
  });
  
  return true;
};

/**
 * Calculer complétude du profil (0-100%)
 * @returns {number} - Score de complétude
 */
userSchema.methods.calculateProfileCompleteness = function() {
  if (!this.profile) {
    this.profile = { completeness: 0 };
    return 0;
  }
  
  let score = 0;
  
  // +20% : Régime alimentaire spécifique
  if (this.profile.diet && this.profile.diet !== 'omnivore') score += 20;
  
  // +20% : Allergènes déclarés
  if (this.profile.allergens?.length > 0) score += 20;
  
  // +20% : Objectif défini
  if (this.profile.goal && this.profile.goal !== 'general') score += 20;
  
  // +20% : Budget personnalisé
  if (this.profile.budget?.monthly && this.profile.budget.monthly !== 300) {
    score += 20;
  }
  
  // +20% : Labels/certifications activés
  if (this.profile.labels) {
    const hasLabels = this.profile.labels.bioRequired ||
                     this.profile.labels.localPriority ||
                     this.profile.labels.fairTrade;
    if (hasLabels) score += 20;
  }
  
  this.profile.completeness = score;
  
  logger.info('[User] Complétude profil calculée', {
    userId: this._id,
    email: this.email,
    completeness: score
  });
  
  return score;
};

/**
 * ═══════════════════════════════════════════════════════════════
 * HELPERS MÉTIER
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Obtenir libellé régime alimentaire (i18n)
 * @returns {string} - Libellé français du régime
 */
userSchema.methods.getDietLabel = function() {
  const labels = {
    'omnivore': 'Omnivore',
    'vegetarian': 'Végétarien',
    'vegan': 'Végane',
    'pescatarian': 'Pescétarien',
    'flexitarian': 'Flexitarien'
  };
  return labels[this.profile?.diet] || 'Omnivore';
};

/**
 * Vérifier compatibilité produit avec profil utilisateur
 * @param {Object} product - Produit à vérifier
 * @returns {Object} - { compatible: boolean, reason?: string }
 */
userSchema.methods.isProductCompatible = function(product) {
  if (!this.profile) {
    return { compatible: true };
  }
  
  const diet = this.profile.diet;
  const allergens = this.profile.allergens || [];
  const ingredients = product.ingredients_text?.toLowerCase() || '';

  // VÉRIFICATION RÉGIME VÉGANE
  if (diet === 'vegan') {
    const animalKeywords = [
      'lait', 'œuf', 'oeuf', 'miel', 'viande',
      'poisson', 'crustacé', 'gélatine', 'lactose'
    ];
    
    for (const keyword of animalKeywords) {
      if (ingredients.includes(keyword)) {
        logger.info('[User] Produit incompatible (végane)', {
          userId: this._id,
          productId: product._id,
          productName: product.name,
          reason: keyword
        });
        
        return {
          compatible: false,
          reason: `Contient ${keyword} (incompatible régime végane)`
        };
      }
    }
  }

  // VÉRIFICATION RÉGIME VÉGÉTARIEN
  if (diet === 'vegetarian') {
    const meatKeywords = [
      'viande', 'poisson', 'poulet', 'bœuf',
      'porc', 'agneau', 'veau', 'dinde'
    ];
    
    for (const keyword of meatKeywords) {
      if (ingredients.includes(keyword)) {
        logger.info('[User] Produit incompatible (végétarien)', {
          userId: this._id,
          productId: product._id,
          productName: product.name,
          reason: keyword
        });
        
        return {
          compatible: false,
          reason: `Contient ${keyword} (incompatible régime végétarien)`
        };
      }
    }
  }

  // VÉRIFICATION ALLERGÈNES
  if (allergens.length > 0) {
    const productAllergens = product.allergens || [];
    
    // Vérifier allergènes déclarés produit
    const conflict = allergens.find(a =>
      productAllergens.includes(a) || ingredients.includes(a)
    );
    
    if (conflict) {
      logger.warn('[User] ALERTE ALLERGÈNE détectée', {
        userId: this._id,
        productId: product._id,
        productName: product.name,
        allergen: conflict,
        severity: 'HIGH'
      });
      
      return {
        compatible: false,
        reason: `⚠️ ALLERGIE : Contient ${conflict}`
      };
    }
  }

  return { compatible: true };
};

/**
 * ═══════════════════════════════════════════════════════════════
 * MIDDLEWARE PRE-SAVE
 * ═══════════════════════════════════════════════════════════════
 */
userSchema.pre('save', async function(next) {
  const startTime = Date.now();
  
  try {
    // Hash password si modifié
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
      
      logger.info('[User] Mot de passe hashé', {
        userId: this._id,
        email: this.email,
        isNew: this.isNew
      });
    }
    
    // Mise à jour timestamp
    this.updatedAt = new Date();
    
    // Log création nouveau user
    if (this.isNew) {
      logger.info('[User] Nouvel utilisateur créé', {
        userId: this._id,
        email: this.email,
        name: this.name,
        plan: this.plan.code,
        authMethod: this.googleId ? 'google' : 'email',
        rgpdConsent: this.rgpd?.consentGiven || false
      });
    }
    
    const duration = Date.now() - startTime;
    logger.info('[User] Pre-save middleware exécuté', {
      userId: this._id,
      durationMs: duration
    });
    
    next();
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('[User] Erreur pre-save middleware', {
      error: error.message,
      stack: error.stack,
      userId: this._id,
      email: this.email,
      durationMs: duration
    });
    
    next(error);
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * INITIALISATION MODÈLE
 * ═══════════════════════════════════════════════════════════════
 */
const User = mongoose.model('User', userSchema);

// Log initialisation modèle
logger.info('[User] Modèle User initialisé', {
  version: '3.2.1',
  indexes: userSchema.indexes().length,
  features: [
    'multi-auth',
    'freemium-quotas',
    'rgpd-compliance',
    'soft-delete',
    'profile-v32',
    'ai-preferences-legacy',
    'allergen-detection',
    'diet-compatibility'
  ]
});

module.exports = User;
