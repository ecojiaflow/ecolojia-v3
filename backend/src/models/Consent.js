// backend/src/models/Consent.js
// ModÃ¨le de consentement RGPD - Version solo dev minimum viable
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
    // GÃ©nÃ©rÃ© via : crypto.createHash('sha256').update(email).digest('hex')
  },
  
  // Email stockÃ© pour droits RGPD (accÃ¨s, rectification, suppression)
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // === CONSENTEMENTS GRANULAIRES ===
  consents: {
    // 1. Traitement essentiel (base lÃ©gale : contrat Art. 6.1.b)
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
    
    // 2. DonnÃ©es de santÃ© (base lÃ©gale : consentement explicite Art. 9.2.a)
    // CRITIQUE : Requis pour analyser produits alimentaires/cosmÃ©tiques
    healthProfiling: {
      accepted: {
        type: Boolean,
        required: true,
        default: false
      },
      acceptedAt: Date,
      
      // Texte du consentement explicite (preuve lÃ©gale)
      explicitText: {
        type: String,
        default: "J'accepte explicitement que ECOLOJIA traite mes donnÃ©es relatives Ã  la santÃ© (scans de produits alimentaires et cosmÃ©tiques, habitudes de consommation) pour me fournir des analyses personnalisÃ©es. Je peux retirer ce consentement Ã  tout moment."
      },
      
      // Version de la politique acceptÃ©e
      policyVersion: {
        type: String,
        default: '1.0'
      }
    },
    
    // 3. Statistiques anonymisÃ©es (base lÃ©gale : intÃ©rÃªt lÃ©gitime Art. 6.1.f)
    analytics: {
      accepted: {
        type: Boolean,
        default: false
      },
      acceptedAt: Date
    },
    
    // 4. Marketing (base lÃ©gale : consentement Art. 6.1.a)
    marketing: {
      accepted: {
        type: Boolean,
        default: false
      },
      acceptedAt: Date
    }
  },
  
  // === MÃ‰TADONNÃ‰ES LÃ‰GALES (Preuve consentement) ===
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
    
    // Version CGU/Politique confidentialitÃ© acceptÃ©e
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
        'consent_given',        // Consentement initial donnÃ©
        'consent_updated',      // Consentement modifiÃ©
        'consent_withdrawn',    // Consentement retirÃ© (Art. 7.3)
        'data_accessed',        // Exercice droit d'accÃ¨s (Art. 15)
        'data_rectified',       // Exercice droit de rectification (Art. 16)
        'data_deleted',         // Exercice droit Ã  l'effacement (Art. 17)
        'data_exported'         // Exercice droit Ã  la portabilitÃ© (Art. 20)
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
  
  // === GESTION RÃ‰TENTION DONNÃ‰ES (Art. 5.1.e) ===
  retention: {
    // Date de crÃ©ation du consentement
    createdAt: {
      type: Date,
      default: Date.now
    },
    
    // DerniÃ¨re activitÃ© utilisateur (mise Ã  jour Ã  chaque connexion)
    lastActivity: {
      type: Date,
      default: Date.now
    },
    
    // Date de suppression prÃ©vue (calculÃ©e automatiquement)
    // RÃ¨gle : 3 ans aprÃ¨s derniÃ¨re activitÃ©
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

// === MÃ‰THODES INSTANCE ===

/**
 * Mettre Ã  jour la derniÃ¨re activitÃ©
 * Ã€ appeler Ã  chaque connexion utilisateur
 */
ConsentSchema.methods.updateActivity = function() {
  this.retention.lastActivity = new Date();
  
  // Recalculer date de suppression : 3 ans aprÃ¨s lastActivity
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
 * Donner ou mettre Ã  jour un consentement
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
  
  // Mettre Ã  jour consentement
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
 * VÃ©rifier si l'utilisateur a donnÃ© le consentement pour donnÃ©es de santÃ©
 * CRITIQUE : Requis avant toute analyse produit
 */
ConsentSchema.methods.hasHealthConsent = function() {
  return this.consents.healthProfiling.accepted === true;
};

/**
 * Obtenir un rÃ©sumÃ© du consentement (pour affichage utilisateur)
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

// === MÃ‰THODES STATIQUES ===

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
 * CrÃ©er un nouveau consentement avec valeurs par dÃ©faut
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

// Export du modÃ¨le
module.exports = mongoose.model('Consent', ConsentSchema);