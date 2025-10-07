// backend/src/models/Consent.js
// Modèle de consentement RGPD - Version solo dev minimum viable
// Conforme : Art. 6.1, Art. 7, Art. 9 RGPD

const mongoose = require('mongoose');

const ConsentSchema = new mongoose.Schema({
  // === IDENTIFICATION UTILISATEUR ===
  // Hash pour pseudonymisation (jamais email en clair dans index)
  userHash: {
    type: String,
    required: true,
    index: true,
    unique: true
    // Généré via : crypto.createHash('sha256').update(email).digest('hex')
  },
  
  // Email stocké pour droits RGPD (accès, rectification, suppression)
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // === CONSENTEMENTS GRANULAIRES ===
  consents: {
    // 1. Traitement essentiel (base légale : contrat Art. 6.1.b)
    // Toujours true si utilisateur utilise l'app
    essential: {
      accepted: {
        type: Boolean,
        default: true
      },
      acceptedAt: {
        type: Date,
        default: Date.now
      }
    },
    
    // 2. Données de santé (base légale : consentement explicite Art. 9.2.a)
    // CRITIQUE : Requis pour analyser produits alimentaires/cosmétiques
    healthProfiling: {
      accepted: {
        type: Boolean,
        required: true,
        default: false
      },
      acceptedAt: Date,
      
      // Texte du consentement explicite (preuve légale)
      explicitText: {
        type: String,
        default: "J'accepte explicitement que ECOLOJIA traite mes données relatives à la santé (scans de produits alimentaires et cosmétiques, habitudes de consommation) pour me fournir des analyses personnalisées. Je peux retirer ce consentement à tout moment."
      },
      
      // Version de la politique acceptée
      policyVersion: {
        type: String,
        default: '1.0'
      }
    },
    
    // 3. Statistiques anonymisées (base légale : intérêt légitime Art. 6.1.f)
    analytics: {
      accepted: {
        type: Boolean,
        default: false
      },
      acceptedAt: Date
    },
    
    // 4. Marketing (base légale : consentement Art. 6.1.a)
    marketing: {
      accepted: {
        type: Boolean,
        default: false
      },
      acceptedAt: Date
    }
  },
  
  // === MÉTADONNÉES LÉGALES (Preuve consentement) ===
  metadata: {
    // IP au moment du consentement (preuve)
    ipAddress: {
      type: String,
      required: false
    },
    
    // User agent navigateur
    userAgent: {
      type: String,
      required: false
    },
    
    // Version CGU/Politique confidentialité acceptée
    termsVersion: {
      type: String,
      default: '1.0'
    },
    
    // Langue du consentement
    language: {
      type: String,
      default: 'fr',
      enum: ['fr', 'en']
    },
    
    // Source du consentement (web, mobile, etc.)
    source: {
      type: String,
      default: 'web',
      enum: ['web', 'mobile', 'api']
    }
  },
  
  // === HISTORIQUE MODIFICATIONS (Audit trail Art. 7.1) ===
  history: [{
    action: {
      type: String,
      enum: [
        'consent_given',        // Consentement initial donné
        'consent_updated',      // Consentement modifié
        'consent_withdrawn',    // Consentement retiré (Art. 7.3)
        'data_accessed',        // Exercice droit d'accès (Art. 15)
        'data_rectified',       // Exercice droit de rectification (Art. 16)
        'data_deleted',         // Exercice droit à l'effacement (Art. 17)
        'data_exported'         // Exercice droit à la portabilité (Art. 20)
      ],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    consentType: String,      // 'healthProfiling', 'analytics', etc.
    previousValue: Boolean,
    newValue: Boolean,
    reason: String,           // Raison du changement (optionnel)
    ipAddress: String         // IP au moment de l'action
  }],
  
  // === GESTION RÉTENTION DONNÉES (Art. 5.1.e) ===
  retention: {
    // Date de création du consentement
    createdAt: {
      type: Date,
      default: Date.now
    },
    
    // Dernière activité utilisateur (mise à jour à chaque connexion)
    lastActivity: {
      type: Date,
      default: Date.now
    },
    
    // Date de suppression prévue (calculée automatiquement)
    // Règle : 3 ans après dernière activité
    scheduledDeletion: {
      type: Date,
      required: false
    }
  }
  
}, {
  timestamps: true  // Ajoute automatiquement createdAt et updatedAt
});

// === INDEX POUR PERFORMANCE ===
ConsentSchema.index({ email: 1 });
ConsentSchema.index({ userHash: 1 });
ConsentSchema.index({ 'retention.scheduledDeletion': 1 }); // Pour nettoyage automatique

// === MÉTHODES INSTANCE ===

/**
 * Mettre à jour la dernière activité
 * À appeler à chaque connexion utilisateur
 */
ConsentSchema.methods.updateActivity = function() {
  this.retention.lastActivity = new Date();
  
  // Recalculer date de suppression : 3 ans après lastActivity
  const threeYearsLater = new Date();
  threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
  this.retention.scheduledDeletion = threeYearsLater;
  
  return this.save();
};

/**
 * Retirer un consentement (Art. 7.3 RGPD)
 * @param {string} consentType - Type de consentement ('healthProfiling', 'analytics', 'marketing')
 * @param {string} ipAddress - IP de l'utilisateur (preuve)
 */
ConsentSchema.methods.withdrawConsent = function(consentType, ipAddress = null) {
  if (!this.consents[consentType]) {
    throw new Error(`Type de consentement invalide : ${consentType}`);
  }
  
  // Enregistrer dans historique (audit trail)
  this.history.push({
    action: 'consent_withdrawn',
    timestamp: new Date(),
    consentType: consentType,
    previousValue: this.consents[consentType].accepted,
    newValue: false,
    ipAddress: ipAddress
  });
  
  // Retirer le consentement
  this.consents[consentType].accepted = false;
  this.consents[consentType].acceptedAt = new Date();
  
  return this.save();
};

/**
 * Donner ou mettre à jour un consentement
 * @param {string} consentType - Type de consentement
 * @param {boolean} value - true ou false
 * @param {string} ipAddress - IP de l'utilisateur
 */
ConsentSchema.methods.updateConsent = function(consentType, value, ipAddress = null) {
  if (!this.consents[consentType]) {
    throw new Error(`Type de consentement invalide : ${consentType}`);
  }
  
  const previousValue = this.consents[consentType].accepted;
  
  // Enregistrer dans historique
  this.history.push({
    action: value ? 'consent_given' : 'consent_withdrawn',
    timestamp: new Date(),
    consentType: consentType,
    previousValue: previousValue,
    newValue: value,
    ipAddress: ipAddress
  });
  
  // Mettre à jour consentement
  this.consents[consentType].accepted = value;
  this.consents[consentType].acceptedAt = new Date();
  
  return this.save();
};

/**
 * Enregistrer exercice d'un droit RGPD
 * @param {string} action - Type d'action ('data_accessed', 'data_deleted', etc.)
 * @param {string} ipAddress - IP de l'utilisateur
 */
ConsentSchema.methods.logGDPRAction = function(action, ipAddress = null) {
  this.history.push({
    action: action,
    timestamp: new Date(),
    ipAddress: ipAddress
  });
  
  return this.save();
};

/**
 * Vérifier si l'utilisateur a donné le consentement pour données de santé
 * CRITIQUE : Requis avant toute analyse produit
 */
ConsentSchema.methods.hasHealthConsent = function() {
  return this.consents.healthProfiling.accepted === true;
};

/**
 * Obtenir un résumé du consentement (pour affichage utilisateur)
 */
ConsentSchema.methods.getSummary = function() {
  return {
    email: this.email,
    healthProfiling: this.consents.healthProfiling.accepted,
    analytics: this.consents.analytics.accepted,
    marketing: this.consents.marketing.accepted,
    lastActivity: this.retention.lastActivity,
    accountAge: Math.floor((Date.now() - this.retention.createdAt) / (1000 * 60 * 60 * 24)) // jours
  };
};

// === MÉTHODES STATIQUES ===

/**
 * Trouver consentement par email
 */
ConsentSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Trouver consentement par hash
 */
ConsentSchema.statics.findByHash = function(userHash) {
  return this.findOne({ userHash });
};

/**
 * Créer un nouveau consentement avec valeurs par défaut
 */
ConsentSchema.statics.createConsent = async function(email, healthConsent = false, ipAddress = null, userAgent = null) {
  const crypto = require('crypto');
  const userHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  
  const consent = new this({
    userHash: userHash,
    email: email.toLowerCase(),
    consents: {
      essential: {
        accepted: true,
        acceptedAt: new Date()
      },
      healthProfiling: {
        accepted: healthConsent,
        acceptedAt: healthConsent ? new Date() : null,
        explicitText: healthConsent ? this.schema.paths['consents.healthProfiling.explicitText'].defaultValue : null,
        policyVersion: '1.0'
      },
      analytics: {
        accepted: false
      },
      marketing: {
        accepted: false
      }
    },
    metadata: {
      ipAddress: ipAddress,
      userAgent: userAgent,
      termsVersion: '1.0',
      language: 'fr',
      source: 'web'
    },
    history: [{
      action: 'consent_given',
      timestamp: new Date(),
      consentType: 'essential',
      newValue: true,
      ipAddress: ipAddress
    }],
    retention: {
      createdAt: new Date(),
      lastActivity: new Date()
    }
  });
  
  // Calculer date de suppression (3 ans)
  const threeYearsLater = new Date();
  threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
  consent.retention.scheduledDeletion = threeYearsLater;
  
  if (healthConsent) {
    consent.history.push({
      action: 'consent_given',
      timestamp: new Date(),
      consentType: 'healthProfiling',
      newValue: true,
      ipAddress: ipAddress
    });
  }
  
  return consent.save();
};

// Export du modèle
module.exports = mongoose.model('Consent', ConsentSchema);