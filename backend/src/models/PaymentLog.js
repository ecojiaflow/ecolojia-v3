// backend/src/models/PaymentLog.js

const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema({
  // Utilisateur
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Type de transaction
  type: {
    type: String,
    required: true,
    enum: [
      'subscription_creation',
      'subscription_payment',
      'subscription_renewal',
      'subscription_update',
      'subscription_cancellation',
      'refund',
      'chargeback',
      'one_time_purchase',
      'trial_start',
      'trial_end',
      'payment_failed',
      'payment_retry'
    ],
    index: true
  },
  
  // Status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'disputed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Montants
  amount: {
    value: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: 'EUR'
    },
    
    // Montants détaillés
    subtotal: Number,
    tax: Number,
    taxRate: Number,
    discount: Number,
    discountCode: String,
    
    // Conversion si applicable
    originalAmount: {
      value: Number,
      currency: String,
      exchangeRate: Number
    }
  },
  
  // Provider de paiement
  provider: {
    name: {
      type: String,
      required: true,
      enum: ['lemonsqueezy', 'stripe', 'paypal', 'manual'],
      index: true
    },
    
    // IDs externes
    externalIds: {
      customerId: String,
      subscriptionId: String,
      paymentId: String,
      invoiceId: String,
      chargeId: String,
      refundId: String,
      orderId: String,
      checkoutId: String
    },
    
    // Méthode de paiement
    paymentMethod: {
      type: {
        type: String,
        enum: ['card', 'paypal', 'sepa', 'bank_transfer', 'crypto', 'other']
      },
      
      // Détails carte (masqués)
      card: {
        brand: String,
        last4: String,
        expMonth: Number,
        expYear: Number,
        country: String,
        funding: String // credit, debit, prepaid
      },
      
      // Autres méthodes
      paypal: {
        email: String
      },
      
      sepa: {
        last4: String,
        country: String
      }
    },
    
    // Metadata du provider
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Détails de l'abonnement
  subscription: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    
    plan: {
      id: String,
      name: String,
      tier: {
        type: String,
        enum: ['free', 'premium', 'family', 'enterprise']
      },
      interval: {
        type: String,
        enum: ['monthly', 'annual', 'lifetime']
      }
    },
    
    // Période de facturation
    billingPeriod: {
      start: Date,
      end: Date
    },
    
    // Essai gratuit
    trial: {
      isTrialPayment: Boolean,
      trialEndsAt: Date
    },
    
    // Renouvellement
    renewal: {
      isRenewal: Boolean,
      nextBillingDate: Date,
      renewalCount: Number
    }
  },
  
  // Facture
  invoice: {
    number: String,
    url: String,
    pdfUrl: String,
    
    // Adresse de facturation
    billingAddress: {
      name: String,
      company: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      vatNumber: String
    },
    
    // Lignes de facture
    items: [{
      description: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number,
      tax: Number
    }],
    
    // Notes
    notes: String,
    termsAndConditions: String
  },
  
  // Remboursement
  refund: {
    reason: {
      type: String,
      enum: ['requested_by_customer', 'duplicate', 'fraudulent', 'subscription_cancelled', 'product_not_received', 'product_unacceptable', 'other']
    },
    
    amount: Number,
    refundedAt: Date,
    
    // Partial refund
    isPartial: Boolean,
    items: [{
      description: String,
      amount: Number
    }]
  },
  
  // Litige (chargeback)
  dispute: {
    reason: String,
    status: {
      type: String,
      enum: ['warning_needs_response', 'warning_under_review', 'warning_closed', 'needs_response', 'under_review', 'charge_refunded', 'won', 'lost']
    },
    
    amount: Number,
    currency: String,
    
    evidence: {
      submitted: Boolean,
      submittedAt: Date,
      dueBy: Date,
      files: [String]
    },
    
    outcome: {
      type: String,
      enum: ['won', 'lost', 'accepted']
    },
    
    createdAt: Date,
    updatedAt: Date
  },
  
  // Échec de paiement
  failure: {
    code: String,
    message: String,
    
    // Type d'échec
    type: {
      type: String,
      enum: ['card_declined', 'insufficient_funds', 'expired_card', 'invalid_card', 'processing_error', 'authentication_required', 'other']
    },
    
    // Peut être retenté ?
    retryable: Boolean,
    nextRetryAt: Date,
    retryCount: {
      type: Number,
      default: 0
    },
    
    // Actions prises
    actions: [{
      type: String,
      timestamp: Date,
      result: String
    }]
  },
  
  // Contexte
  context: {
    ip: String,
    userAgent: String,
    country: String,
    
    // Source du paiement
    source: {
      type: String,
      enum: ['web_app', 'mobile_app', 'admin_panel', 'api', 'automatic_renewal', 'retry']
    },
    
    // Device
    device: {
      type: String,
      os: String,
      browser: String
    },
    
    // Session
    sessionId: String,
    
    // Tracking
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String
    }
  },
  
  // Métriques
  metrics: {
    // Performance
    processingTime: Number, // ms
    
    // Conversion
    checkoutDuration: Number, // Temps entre début et fin du checkout
    attemptCount: Number, // Nombre de tentatives avant succès
    
    // Risque
    riskScore: Number,
    riskFactors: [String],
    
    // Fidélité
    isFirstPayment: Boolean,
    totalPayments: Number,
    customerLifetimeValue: Number
  },
  
  // Conformité
  compliance: {
    // PCI DSS
    pciCompliant: {
      type: Boolean,
      default: true
    },
    
    // Strong Customer Authentication (SCA)
    sca: {
      required: Boolean,
      type: String, // 3ds, bank_app, etc.
      status: String,
      authenticatedAt: Date
    },
    
    // Consentements
    consents: {
      termsAccepted: Boolean,
      marketingAccepted: Boolean,
      dataProcessingAccepted: Boolean,
      acceptedAt: Date
    },
    
    // Audit
    auditLog: [{
      action: String,
      timestamp: Date,
      userId: mongoose.Schema.Types.ObjectId,
      details: String
    }]
  },
  
  // Notifications
  notifications: {
    // Emails envoyés
    emails: [{
      type: {
        type: String,
        enum: ['receipt', 'invoice', 'failed_payment', 'subscription_confirmation', 'refund_confirmation']
      },
      sentAt: Date,
      status: String,
      messageId: String
    }],
    
    // Webhooks déclenchés
    webhooks: [{
      url: String,
      event: String,
      sentAt: Date,
      responseStatus: Number,
      success: Boolean
    }]
  },
  
  // Métadonnées
  metadata: {
    // Tags pour recherche/filtrage
    tags: [String],
    
    // Notes internes
    internalNotes: String,
    
    // Données custom
    customData: mongoose.Schema.Types.Mixed,
    
    // Version du schema
    version: {
      type: String,
      default: '1.0'
    }
  }
}, {
  timestamps: true,
  collection: 'payment_logs'
});

// Index composés
paymentLogSchema.index({ userId: 1, type: 1, createdAt: -1 });
paymentLogSchema.index({ 'provider.name': 1, status: 1, createdAt: -1 });
paymentLogSchema.index({ 'provider.externalIds.subscriptionId': 1 });
paymentLogSchema.index({ 'subscription.plan.tier': 1, status: 1 });
paymentLogSchema.index({ 'failure.type': 1, 'failure.retryable': 1 });

// Index pour les recherches
paymentLogSchema.index({ 'invoice.number': 1 });
paymentLogSchema.index({ 'provider.externalIds.paymentId': 1 });
paymentLogSchema.index({ 'amount.discountCode': 1 });

// Méthodes d'instance
paymentLogSchema.methods = {
  // Marquer comme complété
  markAsCompleted() {
    this.status = 'completed';
    this.metrics.processingTime = Date.now() - this.createdAt;
    return this.save();
  },
  
  // Marquer comme échoué
  markAsFailed(error) {
    this.status = 'failed';
    this.failure = {
      code: error.code,
      message: error.message,
      type: error.type || 'other',
      retryable: error.retryable !== false,
      retryCount: (this.failure?.retryCount || 0) + 1
    };
    
    if (this.failure.retryable) {
      // Retry avec backoff exponentiel
      const delayMinutes = Math.min(Math.pow(2, this.failure.retryCount) * 30, 1440); // Max 24h
      this.failure.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
    }
    
    return this.save();
  },
  
  // Créer un remboursement
  async createRefund(amount, reason) {
    this.status = 'refunded';
    this.refund = {
      amount: amount || this.amount.value,
      reason: reason,
      refundedAt: new Date(),
      isPartial: amount && amount < this.amount.value
    };
    
    await this.save();
    
    // Créer un nouveau log pour le remboursement
    const refundLog = new this.constructor({
      userId: this.userId,
      type: 'refund',
      status: 'completed',
      amount: {
        value: -this.refund.amount,
        currency: this.amount.currency
      },
      provider: this.provider,
      subscription: this.subscription,
      metadata: {
        originalPaymentId: this._id,
        tags: ['refund', reason]
      }
    });
    
    return refundLog.save();
  },
  
  // Calculer les frais
  calculateFees() {
    const feeRates = {
      lemonsqueezy: { percentage: 0.05, fixed: 0.50 },
      stripe: { percentage: 0.029, fixed: 0.30 },
      paypal: { percentage: 0.034, fixed: 0.35 }
    };
    
    const rate = feeRates[this.provider.name] || { percentage: 0, fixed: 0 };
    const fees = (this.amount.value * rate.percentage) + rate.fixed;
    
    return {
      provider: this.provider.name,
      amount: Math.round(fees * 100) / 100,
      netAmount: this.amount.value - fees
    };
  },
  
  // Générer un numéro de facture
  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    this.invoice.number = `INV-${year}${month}-${random}`;
    return this.invoice.number;
  },
  
  // Envoyer une notification email
  async sendEmailNotification(type) {
    // TODO: Implémenter l'envoi d'email
    this.notifications.emails.push({
      type,
      sentAt: new Date(),
      status: 'sent'
    });
    
    return this.save();
  },
  
  // Vérifier si c'est le premier paiement
  async checkFirstPayment() {
    const previousPayments = await this.constructor.countDocuments({
      userId: this.userId,
      status: 'completed',
      _id: { $ne: this._id },
      createdAt: { $lt: this.createdAt }
    });
    
    this.metrics.isFirstPayment = previousPayments === 0;
    this.metrics.totalPayments = previousPayments + 1;
    
    return this.metrics.isFirstPayment;
  }
};

// Méthodes statiques
paymentLogSchema.statics = {
  // Créer un log de paiement
  async createPaymentLog(userId, type, amount, provider, metadata = {}) {
    const log = new this({
      userId,
      type,
      amount,
      provider: {
        name: provider,
        ...metadata.provider
      },
      subscription: metadata.subscription,
      context: metadata.context,
      metadata: {
        customData: metadata.customData,
        tags: metadata.tags || []
      }
    });
    
    // Vérifier si c'est le premier paiement
    await log.checkFirstPayment();
    
    return log.save();
  },
  
  // Obtenir le chiffre d'affaires
  async getRevenue(startDate, endDate, options = {}) {
    const match = {
      status: 'completed',
      type: { $in: ['subscription_payment', 'subscription_renewal', 'one_time_purchase'] },
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    if (options.tier) {
      match['subscription.plan.tier'] = options.tier;
    }
    
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: options.groupBy || null,
          revenue: { $sum: '$amount.value' },
          count: { $sum: 1 },
          avgTransaction: { $avg: '$amount.value' }
        }
      }
    ];
    
    if (options.groupBy === 'day') {
      pipeline[0].$group._id = {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
      };
    } else if (options.groupBy === 'month') {
      pipeline[0].$group._id = {
        $dateToString: { format: '%Y-%m', date: '$createdAt' }
      };
    }
    
    pipeline.push({ $sort: { _id: 1 } });
    
    return this.aggregate(pipeline);
  },
  
  // Obtenir les métriques de paiement
  async getPaymentMetrics(userId) {
    const [stats] = await this.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $in: ['completed', 'refunded'] }
        }
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$amount.value', 0]
            }
          },
          totalRefunded: {
            $sum: {
              $cond: [{ $eq: ['$status', 'refunded'] }, '$refund.amount', 0]
            }
          },
          avgTransaction: { $avg: '$amount.value' },
          firstPayment: { $min: '$createdAt' },
          lastPayment: { $max: '$createdAt' },
          failedPayments: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    return stats || {
      totalPayments: 0,
      totalSpent: 0,
      totalRefunded: 0,
      avgTransaction: 0,
      firstPayment: null,
      lastPayment: null,
      failedPayments: 0
    };
  },
  
  // Obtenir les paiements échoués à retenter
  async getPaymentsToRetry() {
    return this.find({
      status: 'failed',
      'failure.retryable': true,
      'failure.nextRetryAt': { $lte: new Date() }
    }).populate('userId', 'email profile.firstName profile.lastName');
  },
  
  // Statistiques de taux d'échec
  async getFailureStats(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const stats = await this.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          type: { $in: ['subscription_payment', 'subscription_renewal'] }
        }
      },
      {
        $group: {
          _id: '$failure.type',
          count: { $sum: 1 },
          totalAttempts: { $sum: { $cond: ['$failure.type', 1, 0] } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    return stats;
  },
  
  // Détecter les comportements frauduleux
  async detectFraudPatterns(userId) {
    const recentPayments = await this.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 });
    
    const patterns = {
      rapidPayments: recentPayments.length > 5,
      multipleCards: new Set(recentPayments.map(p => p.provider.paymentMethod?.card?.last4)).size > 3,
      highAmounts: recentPayments.some(p => p.amount.value > 500),
      multipleFailures: recentPayments.filter(p => p.status === 'failed').length > 3
    };
    
    const riskScore = Object.values(patterns).filter(Boolean).length * 25;
    
    return {
      riskScore,
      patterns,
      flagged: riskScore >= 50
    };
  },
  
  // Rapport mensuel
  async generateMonthlyReport(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const [revenue, newSubscriptions, churn, failureRate] = await Promise.all([
      // Revenus
      this.getRevenue(startDate, endDate, { groupBy: 'day' }),
      
      // Nouvelles souscriptions
      this.countDocuments({
        type: 'subscription_creation',
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      
      // Résiliations
      this.countDocuments({
        type: 'subscription_cancellation',
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      
      // Taux d'échec
      this.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            type: { $in: ['subscription_payment', 'subscription_renewal'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        }
      ])
    ]);
    
    const totalRevenue = revenue.reduce((sum, day) => sum + day.revenue, 0);
    const avgDailyRevenue = totalRevenue / new Date(year, month, 0).getDate();
    
    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      revenue: {
        total: totalRevenue,
        daily: revenue,
        average: avgDailyRevenue
      },
      subscriptions: {
        new: newSubscriptions,
        cancelled: churn,
        netGrowth: newSubscriptions - churn
      },
      performance: {
        failureRate: failureRate[0] ? (failureRate[0].failed / failureRate[0].total) : 0,
        successRate: failureRate[0] ? 1 - (failureRate[0].failed / failureRate[0].total) : 1
      }
    };
  }
};

// Middleware pre-save
paymentLogSchema.pre('save', async function(next) {
  // Générer un numéro de facture si nécessaire
  if (this.status === 'completed' && !this.invoice.number) {
    this.generateInvoiceNumber();
  }
  
  // Calculer les métriques
  if (this.status === 'completed' && !this.metrics.customerLifetimeValue) {
    const ltv = await this.constructor.aggregate([
      {
        $match: {
          userId: this.userId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount.value' }
        }
      }
    ]);
    
    this.metrics.customerLifetimeValue = ltv[0]?.total || this.amount.value;
  }
  
  // Ajouter des tags automatiques
  if (!this.metadata.tags || this.metadata.tags.length === 0) {
    this.metadata.tags = [
      this.type,
      this.status,
      this.provider.name,
      this.subscription?.plan?.tier
    ].filter(Boolean);
  }
  
  next();
});

// Hook post-save pour les actions automatiques
paymentLogSchema.post('save', async function() {
  // Envoyer un reçu pour les paiements complétés
  if (this.status === 'completed' && this.isNew) {
    await this.sendEmailNotification('receipt');
  }
  
  // Alerter en cas d'échec de paiement récurrent
  if (this.status === 'failed' && this.type === 'subscription_renewal') {
    // TODO: Envoyer alerte au client
    console.log(`Payment failed for user ${this.userId}: ${this.failure.message}`);
  }
  
  // Détecter les patterns frauduleux
  if (this.status === 'completed') {
    const fraud = await this.constructor.detectFraudPatterns(this.userId);
    if (fraud.flagged) {
      // TODO: Alerte sécurité
      console.warn(`Potential fraud detected for user ${this.userId}`, fraud);
    }
  }
});

module.exports = mongoose.model('PaymentLog', paymentLogSchema);
