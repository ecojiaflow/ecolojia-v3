// backend/src/models/WebhookLog.js

const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
  // Identification du webhook
  webhookId: {
    type: String,
    required: true,
    index: true
  },
  
  // Provider du webhook
  provider: {
    type: String,
    required: true,
    enum: ['lemonsqueezy', 'stripe', 'paypal', 'algolia', 'sendgrid', 'custom'],
    index: true
  },
  
  // Type d'evenement
  eventType: {
    type: String,
    required: true,
    index: true
  },
  
  // Status du traitement
  status: {
    type: String,
    required: true,
    enum: ['received', 'processing', 'completed', 'failed', 'retrying', 'ignored'],
    default: 'received',
    index: true
  },
  
  // Donnees du webhook
  payload: {
    // Headers recus
    headers: {
      type: Map,
      of: String
    },
    
    // Body brut
    rawBody: String,
    
    // Body parse
    body: mongoose.Schema.Types.Mixed,
    
    // Query parameters
    query: {
      type: Map,
      of: String
    }
  },
  
  // Validation et securite
  security: {
    // Signature
    signature: String,
    signatureValid: Boolean,
    signatureAlgorithm: String,
    
    // Validation timestamp (anti-replay)
    timestamp: Date,
    timestampValid: Boolean,
    
    // IP source
    sourceIp: String,
    sourceIpWhitelisted: Boolean,
    
    // Idempotence
    idempotencyKey: String,
    isDuplicate: {
      type: Boolean,
      default: false
    },
    
    // Secret utilise
    secretUsed: String
  },
  
  // Traitement
  processing: {
    // Timestamps
    receivedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    startedAt: Date,
    completedAt: Date,
    
    // Durees en ms
    validationDuration: Number,
    processingDuration: Number,
    totalDuration: Number,
    
    // Tentatives
    attempts: {
      type: Number,
      default: 1
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    
    // Prochaine tentative
    nextRetryAt: Date,
    
    // Resultat
    result: mongoose.Schema.Types.Mixed,
    
    // Actions effectuees
    actions: [{
      type: {
        type: String,
        enum: ['create', 'update', 'delete', 'notify', 'email', 'sync', 'custom']
      },
      target: String,
      targetId: mongoose.Schema.Types.ObjectId,
      success: Boolean,
      error: String,
      timestamp: Date
    }]
  },
  
  // Erreurs
  error: {
    code: String,
    message: String,
    stack: String,
    details: mongoose.Schema.Types.Mixed,
    
    // Categorie d'erreur
    category: {
      type: String,
      enum: ['validation', 'signature', 'parsing', 'processing', 'database', 'network', 'business_logic', 'unknown']
    },
    
    // Severite
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    
    // Peut etre retente ?
    retryable: {
      type: Boolean,
      default: true
    }
  },
  
  // Relations avec d'autres entites
  relations: {
    // Utilisateur concerne
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    
    // Abonnement concerne
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    
    // Paiement concerne
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentLog'
    },
    
    // IDs externes
    externalIds: {
      customerId: String,
      orderId: String,
      invoiceId: String,
      productId: String,
      variantId: String,
      transactionId: String
    }
  },
  
  // Metadonnees specifiques au provider
  providerData: {
    // LemonSqueezy
    lemonsqueezy: {
      storeId: String,
      testMode: Boolean,
      eventName: String,
      customData: mongoose.Schema.Types.Mixed
    },
    
    // Stripe
    stripe: {
      accountId: String,
      liveMode: Boolean,
      apiVersion: String
    },
    
    // SendGrid
    sendgrid: {
      messageId: String,
      category: [String]
    }
  },
  
  // Monitoring et alertes
  monitoring: {
    // Alertes declenchees
    alerts: [{
      type: {
        type: String,
        enum: ['security', 'failure', 'performance', 'business']
      },
      message: String,
      severity: String,
      timestamp: Date,
      notified: Boolean
    }],
    
    // Metriques
    metrics: {
      responseTime: Number,
      payloadSize: Number,
      memoryUsed: Number
    },
    
    // Tags pour le monitoring
    tags: [String]
  },
  
  // Audit
  audit: {
    // Qui a consulte ce log
    accessLog: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      },
      accessedAt: Date,
      action: String,
      ip: String
    }],
    
    // Modifications manuelles
    manualActions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      },
      action: String,
      reason: String,
      timestamp: Date
    }]
  },
  
  // Configuration
  config: {
    // Retry policy
    retryPolicy: {
      enabled: {
        type: Boolean,
        default: true
      },
      backoffType: {
        type: String,
        enum: ['linear', 'exponential'],
        default: 'exponential'
      },
      initialDelay: {
        type: Number,
        default: 60000 // 1 minute
      },
      maxDelay: {
        type: Number,
        default: 3600000 // 1 heure
      }
    },
    
    // Notifications
    notifications: {
      onFailure: Boolean,
      onSuccess: Boolean,
      channels: [String] // email, slack, sms
    }
  },
  
  // Metadonnees
  metadata: {
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      required: true
    },
    
    version: {
      type: String,
      default: '1.0'
    },
    
    // Pour le debug
    debug: mongoose.Schema.Types.Mixed,
    
    // Archivage
    archived: {
      type: Boolean,
      default: false
    },
    archivedAt: Date
  }
}, {
  timestamps: true,
  collection: 'webhook_logs'
});

// Index composes
webhookLogSchema.index({ provider: 1, eventType: 1, status: 1 });
webhookLogSchema.index({ 'security.idempotencyKey': 1 }, { unique: true, sparse: true });
webhookLogSchema.index({ 'processing.receivedAt': -1, status: 1 });
webhookLogSchema.index({ 'relations.userId': 1, provider: 1, createdAt: -1 });
webhookLogSchema.index({ 'error.severity': 1, status: 1 });

// Index TTL - Garder les logs 90 jours
webhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Methodes d'instance
webhookLogSchema.methods = {
  // Calculer les durees
  calculateDurations() {
    if (this.processing.startedAt && this.processing.receivedAt) {
      this.processing.validationDuration = this.processing.startedAt - this.processing.receivedAt;
    }
    
    if (this.processing.completedAt && this.processing.startedAt) {
      this.processing.processingDuration = this.processing.completedAt - this.processing.startedAt;
    }
    
    if (this.processing.completedAt && this.processing.receivedAt) {
      this.processing.totalDuration = this.processing.completedAt - this.processing.receivedAt;
    }
  },
  
  // Marquer comme traite
  markAsCompleted(result) {
    this.status = 'completed';
    this.processing.completedAt = new Date();
    this.processing.result = result;
    this.calculateDurations();
    return this.save();
  },
  
  // Marquer comme echoue
  markAsFailed(error) {
    this.status = 'failed';
    this.processing.completedAt = new Date();
    this.error = {
      code: error.code || 'UNKNOWN',
      message: error.message,
      stack: error.stack,
      category: error.category || 'unknown',
      severity: error.severity || 'medium',
      retryable: error.retryable !== false
    };
    this.calculateDurations();
    
    // Planifier retry si applicable
    if (this.error.retryable && this.processing.attempts < this.processing.maxAttempts) {
      this.scheduleRetry();
    }
    
    return this.save();
  },
  
  // Planifier une nouvelle tentative
  scheduleRetry() {
    this.status = 'retrying';
    this.processing.attempts++;
    
    const delay = this.calculateRetryDelay();
    this.processing.nextRetryAt = new Date(Date.now() + delay);
    
    return this.save();
  },
  
  // Calculer le delai de retry
  calculateRetryDelay() {
    const config = this.config.retryPolicy;
    const attempt = this.processing.attempts;
    
    let delay;
    if (config.backoffType === 'exponential') {
      delay = Math.min(
        config.initialDelay * Math.pow(2, attempt - 1),
        config.maxDelay
      );
    } else {
      delay = Math.min(
        config.initialDelay * attempt,
        config.maxDelay
      );
    }
    
    return delay;
  },
  
  // Verifier si c'est un duplicate
  async checkDuplicate() {
    if (!this.security.idempotencyKey) return false;
    
    const existing = await this.constructor.findOne({
      'security.idempotencyKey': this.security.idempotencyKey,
      _id: { $ne: this._id }
    });
    
    this.security.isDuplicate = !!existing;
    return this.security.isDuplicate;
  },
  
  // Ajouter une alerte
  addAlert(type, message, severity = 'medium') {
    this.monitoring.alerts.push({
      type,
      message,
      severity,
      timestamp: new Date(),
      notified: false
    });
    return this.save();
  },
  
  // Generer un rapport
  generateReport() {
    return {
      id: this._id,
      provider: this.provider,
      eventType: this.eventType,
      status: this.status,
      received: this.processing.receivedAt,
      duration: this.processing.totalDuration,
      attempts: this.processing.attempts,
      error: this.error ? {
        code: this.error.code,
        message: this.error.message,
        category: this.error.category
      } : null,
      userId: this.relations.userId,
      alerts: this.monitoring.alerts.length
    };
  }
};

// Methodes statiques
webhookLogSchema.statics = {
  // Creer un nouveau log
  async createLog(provider, eventType, payload, security) {
    const log = new this({
      webhookId: payload.body?.id || `${provider}_${Date.now()}`,
      provider,
      eventType,
      payload,
      security,
      metadata: {
        environment: process.env.NODE_ENV || 'development'
      }
    });
    
    // Verifier les duplicates
    await log.checkDuplicate();
    
    return log.save();
  },
  
  // Obtenir les webhooks en echec
  async getFailedWebhooks(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.find({
      status: 'failed',
      'processing.receivedAt': { $gte: since },
      'error.retryable': true,
      'processing.attempts': { $lt: 3 }
    }).sort({ 'processing.receivedAt': -1 });
  },
  
  // Obtenir les webhooks Â  retenter
  async getWebhooksToRetry() {
    return this.find({
      status: 'retrying',
      'processing.nextRetryAt': { $lte: new Date() }
    }).sort({ 'processing.nextRetryAt': 1 });
  },
  
  // Statistiques par provider
  async getProviderStats(provider, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const pipeline = [
      {
        $match: {
          provider,
          'processing.receivedAt': { $gte: since }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$processing.receivedAt' } },
            eventType: '$eventType',
            status: '$status'
          },
          count: { $sum: 1 },
          avgDuration: { $avg: '$processing.totalDuration' }
        }
      },
      {
        $group: {
          _id: {
            date: '$_id.date',
            eventType: '$_id.eventType'
          },
          total: { $sum: '$count' },
          successful: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'completed'] }, '$count', 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'failed'] }, '$count', 0]
            }
          },
          avgDuration: { $avg: '$avgDuration' }
        }
      },
      {
        $sort: { '_id.date': -1 }
      }
    ];
    
    return this.aggregate(pipeline);
  },
  
  // Nettoyer les vieux logs
  async cleanupOldLogs(days = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const result = await this.updateMany(
      {
        createdAt: { $lt: cutoff },
        archived: false
      },
      {
        $set: {
          archived: true,
          archivedAt: new Date(),
          'payload.body': 'ARCHIVED',
          'payload.rawBody': 'ARCHIVED'
        }
      }
    );
    
    return result;
  },
  
  // Detecter les anomalies
  async detectAnomalies(hours = 1) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Taux d'echec eleve
    const failureRate = await this.aggregate([
      {
        $match: {
          'processing.receivedAt': { $gte: since }
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
      },
      {
        $project: {
          failureRate: { $divide: ['$failed', '$total'] }
        }
      }
    ]);
    
    const anomalies = [];
    
    if (failureRate[0]?.failureRate > 0.1) {
      anomalies.push({
        type: 'high_failure_rate',
        value: failureRate[0].failureRate,
        message: `Taux d'echec eleve: ${(failureRate[0].failureRate * 100).toFixed(1)}%`
      });
    }
    
    // Webhooks bloques
    const stuck = await this.countDocuments({
      status: 'processing',
      'processing.startedAt': { $lt: new Date(Date.now() - 10 * 60 * 1000) } // Plus de 10 min
    });
    
    if (stuck > 0) {
      anomalies.push({
        type: 'stuck_webhooks',
        value: stuck,
        message: `${stuck} webhook(s) bloque(s) en traitement`
      });
    }
    
    return anomalies;
  }
};

// Middleware pre-save
webhookLogSchema.pre('save', function(next) {
  // Extraire les metadonnees selon le provider
  if (this.provider === 'lemonsqueezy' && this.payload.body) {
    const body = this.payload.body;
    this.providerData.lemonsqueezy = {
      storeId: body.meta?.store_id,
      testMode: body.meta?.test_mode || false,
      eventName: body.meta?.event_name,
      customData: body.meta?.custom_data
    };
    
    // Extraire les relations
    if (body.data?.attributes) {
      const attrs = body.data.attributes;
      this.relations.externalIds = {
        customerId: attrs.customer_id,
        orderId: attrs.order_id,
        productId: attrs.product_id,
        variantId: attrs.variant_id
      };
    }
  }
  
  // Ajouter des tags pour le monitoring
  this.monitoring.tags = [
    this.provider,
    this.eventType,
    this.status,
    this.metadata.environment
  ];
  
  next();
});

// Hook post-save pour les alertes
webhookLogSchema.post('save', async function() {
  // Alerter si echec critique
  if (this.status === 'failed' && this.error?.severity === 'critical') {
    // TODO: Envoyer alerte
    console.error(`Critical webhook failure: ${this._id}`);
  }
  
  // Alerter si trop de tentatives
  if (this.processing.attempts >= this.processing.maxAttempts) {
    // TODO: Envoyer alerte
    console.error(`Webhook max attempts reached: ${this._id}`);
  }
});

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
