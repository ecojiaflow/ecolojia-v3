// backend/src/models/GDPRLog.js

const mongoose = require('mongoose');

const gdprLogSchema = new mongoose.Schema({
  // Utilisateur concerné
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Type d'action RGPD
  action: {
    type: String,
    required: true,
    enum: [
      'consent_given',
      'consent_withdrawn',
      'consent_updated',
      'data_access_requested',
      'data_access_provided',
      'data_rectification_requested',
      'data_rectified',
      'data_deletion_requested',
      'data_deleted',
      'data_export_requested',
      'data_exported',
      'data_portability_requested',
      'processing_restricted',
      'processing_objection',
      'automated_decision_objection',
      'privacy_policy_accepted',
      'privacy_policy_updated'
    ],
    index: true
  },
  
  // Détails de l'action
  details: {
    // Pour le consentement
    consentTypes: [{
      type: String,
      enum: ['necessary', 'functional', 'analytics', 'marketing']
    }],
    consentVersion: String,
    
    // Pour les demandes
    requestReason: String,
    requestScope: [String], // Quelles données sont concernées
    
    // Pour les exports
    exportFormat: {
      type: String,
      enum: ['json', 'csv', 'pdf']
    },
    exportSize: Number, // Taille en octets
    
    // Pour les suppressions
    deletionScope: {
      type: String,
      enum: ['full', 'partial']
    },
    deletedDataTypes: [String],
    
    // Informations supplémentaires
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    affectedFields: [String]
  },
  
  // Métadonnées légales
  legal: {
    basis: {
      type: String,
      enum: ['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'],
      required: true
    },
    
    // Justification pour les intérêts légitimes
    legitimateInterestsAssessment: String,
    
    // Durée de conservation
    retentionPeriod: Number, // En jours
    retentionReason: String
  },
  
  // Contexte de la demande
  context: {
    ip: {
      type: String,
      required: true
    },
    userAgent: String,
    country: String,
    city: String,
    
    // Source de la demande
    source: {
      type: String,
      enum: ['web_app', 'mobile_app', 'email', 'phone', 'postal', 'support_ticket'],
      default: 'web_app'
    },
    
    // Si c'est via un tiers autorisé
    requestedBy: {
      type: String,
      enum: ['user', 'parent', 'legal_guardian', 'authorized_representative']
    },
    
    // Vérification d'identité
    identityVerified: {
      type: Boolean,
      default: true
    },
    identityVerificationMethod: String
  },
  
  // Traitement de la demande
  processing: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'rejected', 'cancelled'],
      default: 'completed'
    },
    
    // Délais légaux
    receivedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    completedAt: Date,
    
    // Temps de traitement en heures
    processingTime: Number,
    
    // Si rejeté
    rejectionReason: String,
    rejectionLegalBasis: String,
    
    // Responsable du traitement
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    
    // Notes internes
    internalNotes: String
  },
  
  // Communication avec l'utilisateur
  communication: {
    // Notifications envoyées
    notifications: [{
      type: {
        type: String,
        enum: ['email', 'in_app', 'sms', 'postal']
      },
      sentAt: Date,
      template: String,
      status: {
        type: String,
        enum: ['sent', 'delivered', 'failed', 'opened']
      }
    }],
    
    // Confirmations
    userConfirmedAt: Date,
    confirmationMethod: String
  },
  
  // Audit et conformité
  compliance: {
    // Références légales
    legalReferences: [String], // Articles RGPD appliqués
    
    // Transferts de données
    dataTransfers: [{
      destination: String,
      country: String,
      legalBasis: String,
      safeguards: String, // Clauses contractuelles types, etc.
      transferredAt: Date
    }],
    
    // Sous-traitants impliqués
    processors: [{
      name: String,
      purpose: String,
      dataProcessed: [String],
      dpaReference: String // Data Processing Agreement
    }],
    
    // Évaluation des risques
    riskAssessment: {
      level: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      factors: [String],
      mitigations: [String]
    }
  },
  
  // Sécurité
  security: {
    // Hash de vérification pour l'intégrité
    dataHash: String,
    
    // Chiffrement
    encryptionMethod: String,
    
    // Accès aux logs
    accessLog: [{
      accessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      },
      accessedAt: Date,
      purpose: String
    }]
  },
  
  // Métadonnées
  metadata: {
    version: {
      type: String,
      default: '1.0'
    },
    
    // Tags pour faciliter la recherche
    tags: [String],
    
    // Référence à d'autres logs liés
    relatedLogs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GDPRLog'
    }],
    
    // Archivage
    archived: {
      type: Boolean,
      default: false
    },
    archivedAt: Date,
    archiveReason: String
  }
}, {
  timestamps: true,
  collection: 'gdpr_logs'
});

// Index composés pour les recherches fréquentes
gdprLogSchema.index({ userId: 1, action: 1, createdAt: -1 });
gdprLogSchema.index({ 'processing.status': 1, createdAt: -1 });
gdprLogSchema.index({ 'legal.basis': 1, action: 1 });
gdprLogSchema.index({ 'compliance.riskAssessment.level': 1 });

// Index TTL pour l'archivage automatique (7 ans par défaut)
gdprLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 220752000 });

// Méthodes d'instance
gdprLogSchema.methods = {
  // Calculer le temps de traitement
  calculateProcessingTime() {
    if (this.processing.receivedAt && this.processing.completedAt) {
      const diff = this.processing.completedAt - this.processing.receivedAt;
      this.processing.processingTime = Math.round(diff / (1000 * 60 * 60)); // En heures
    }
  },
  
  // Vérifier si dans les délais légaux (30 jours)
  isWithinLegalDeadline() {
    if (!this.processing.receivedAt) return true;
    
    const deadline = new Date(this.processing.receivedAt);
    deadline.setDate(deadline.getDate() + 30);
    
    return new Date() <= deadline;
  },
  
  // Anonymiser les données sensibles pour l'archivage
  anonymizeForArchive() {
    this.context.ip = 'ANONYMIZED';
    this.context.userAgent = 'ANONYMIZED';
    this.context.city = this.context.country; // Garder seulement le pays
    this.processing.internalNotes = 'ARCHIVED';
    this.security.accessLog = [];
  },
  
  // Générer un rapport de conformité
  generateComplianceReport() {
    return {
      action: this.action,
      date: this.createdAt,
      legalBasis: this.legal.basis,
      processingTime: this.processing.processingTime,
      withinDeadline: this.isWithinLegalDeadline(),
      riskLevel: this.compliance.riskAssessment?.level || 'low',
      dataTransfers: this.compliance.dataTransfers?.length || 0,
      processors: this.compliance.processors?.length || 0
    };
  }
};

// Méthodes statiques
gdprLogSchema.statics = {
  // Créer un log avec validation
  async createLog(userId, action, details, context) {
    const log = new this({
      userId,
      action,
      details,
      context,
      legal: {
        basis: this.determineLegalBasis(action)
      }
    });
    
    return log.save();
  },
  
  // Déterminer la base légale selon l'action
  determineLegalBasis(action) {
    const basisMap = {
      'consent_given': 'consent',
      'consent_withdrawn': 'consent',
      'consent_updated': 'consent',
      'data_access_requested': 'legal_obligation',
      'data_rectification_requested': 'legal_obligation',
      'data_deletion_requested': 'legal_obligation',
      'data_portability_requested': 'legal_obligation',
      'privacy_policy_accepted': 'contract'
    };
    
    return basisMap[action] || 'legitimate_interests';
  },
  
  // Obtenir les statistiques RGPD
  async getGDPRStats(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          avgProcessingTime: { $avg: '$processing.processingTime' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];
    
    return this.aggregate(pipeline);
  },
  
  // Obtenir les demandes en attente
  async getPendingRequests() {
    return this.find({
      'processing.status': { $in: ['pending', 'in_progress'] }
    }).populate('userId', 'email profile.firstName profile.lastName');
  },
  
  // Rapport de conformité mensuel
  async generateMonthlyComplianceReport(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const stats = await this.getGDPRStats(startDate, endDate);
    const pending = await this.getPendingRequests();
    
    const breaches = await this.find({
      createdAt: { $gte: startDate, $lte: endDate },
      'processing.processingTime': { $gt: 720 } // Plus de 30 jours
    });
    
    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      totalRequests: stats.reduce((acc, s) => acc + s.count, 0),
      requestsByType: stats,
      pendingRequests: pending.length,
      complianceBreaches: breaches.length,
      averageProcessingTime: stats.reduce((acc, s) => acc + (s.avgProcessingTime || 0), 0) / stats.length
    };
  }
};

// Middleware pre-save
gdprLogSchema.pre('save', function(next) {
  // Calculer automatiquement le temps de traitement
  if (this.processing.completedAt && !this.processing.processingTime) {
    this.calculateProcessingTime();
  }
  
  // Ajouter des tags automatiques
  if (!this.metadata.tags || this.metadata.tags.length === 0) {
    this.metadata.tags = [
      this.action,
      this.legal.basis,
      this.processing.status,
      `year:${new Date(this.createdAt).getFullYear()}`
    ];
  }
  
  next();
});

// Hooks post-save pour les notifications
gdprLogSchema.post('save', async function() {
  // Si c'est une nouvelle demande, notifier les admins
  if (this.processing.status === 'pending' && this.isNew) {
    // TODO: Envoyer notification aux admins
    console.log(`New GDPR request: ${this.action} for user ${this.userId}`);
  }
  
  // Si la demande dépasse les délais, alerter
  if (!this.isWithinLegalDeadline() && this.processing.status !== 'completed') {
    // TODO: Alerte urgente
    console.error(`GDPR request ${this._id} is overdue!`);
  }
});

module.exports = mongoose.model('GDPRLog', gdprLogSchema);