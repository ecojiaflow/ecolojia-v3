// backend/src/models/Payment.js
// Modele pour l'historique des paiements

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Reference utilisateur
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Informations de paiement
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    required: true,
    default: 'EUR',
    enum: ['EUR', 'USD', 'GBP']
  },
  
  // Statut du paiement
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // Type de transaction
  type: {
    type: String,
    required: true,
    enum: [
      'subscription_created',
      'subscription_payment',
      'subscription_renewed',
      'subscription_upgraded',
      'subscription_downgraded',
      'one_time_purchase',
      'refund'
    ]
  },
  
  // References LemonSqueezy
  subscriptionId: {
    type: String,
    index: true
  },
  
  paymentId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  invoiceId: {
    type: String,
    sparse: true
  },
  
  invoiceUrl: {
    type: String
  },
  
  // Methode de paiement
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'paypal', 'bank_transfer', 'other']
    },
    brand: String, // visa, mastercard, etc.
    last4: String,
    expiryMonth: Number,
    expiryYear: Number
  },
  
  // Details de facturation
  billingAddress: {
    country: String,
    state: String,
    city: String,
    postalCode: String,
    line1: String,
    line2: String
  },
  
  // Metadonnees
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Informations de remboursement
  refund: {
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundId: String
  },
  
  // Periode de l'abonnement
  subscriptionPeriod: {
    start: Date,
    end: Date
  },
  
  // Webhook data
  webhookData: {
    eventName: String,
    eventId: String,
    receivedAt: Date
  },
  
  // Notes internes
  notes: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Date de traitement effectif
  processedAt: Date,
  
  // Tentatives de paiement
  attempts: {
    type: Number,
    default: 1
  },
  
  // Derniere erreur
  lastError: {
    code: String,
    message: String,
    occurredAt: Date
  }
});

// Index composes pour les requetes frequentes
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ subscriptionId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Middleware pour mettre   jour updatedAt
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methodes d'instance
paymentSchema.methods.markAsCompleted = async function() {
  this.status = 'completed';
  this.processedAt = new Date();
  return this.save();
};

paymentSchema.methods.markAsFailed = async function(error) {
  this.status = 'failed';
  this.lastError = {
    code: error.code || 'UNKNOWN',
    message: error.message,
    occurredAt: new Date()
  };
  this.attempts += 1;
  return this.save();
};

paymentSchema.methods.processRefund = async function(amount, reason, refundId) {
  this.status = 'refunded';
  this.refund = {
    amount: amount || this.amount,
    reason,
    refundedAt: new Date(),
    refundId
  };
  return this.save();
};

// Methodes statiques
paymentSchema.statics.findByUserId = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.status) {
    query.where('status', options.status);
  }
  
  if (options.type) {
    query.where('type', options.type);
  }
  
  if (options.startDate || options.endDate) {
    const dateQuery = {};
    if (options.startDate) dateQuery.$gte = options.startDate;
    if (options.endDate) dateQuery.$lte = options.endDate;
    query.where('createdAt', dateQuery);
  }
  
  return query
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

paymentSchema.statics.findBySubscriptionId = function(subscriptionId) {
  return this.find({ subscriptionId })
    .sort({ createdAt: -1 });
};

paymentSchema.statics.getMonthlyRevenue = async function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const result = await this.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$currency',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result;
};

paymentSchema.statics.getUserPaymentStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: { userId: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$status',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalSpent = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  return {
    byStatus: stats,
    totalSpent: totalSpent[0]?.total || 0
  };
};

// Methode pour nettoyer les anciennes donnees
paymentSchema.statics.cleanOldPayments = async function(daysToKeep = 365 * 10) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  // Ne supprimer que les paiements echoues ou annules
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['failed', 'cancelled'] }
  });
};

// Virtual pour le montant formate
paymentSchema.virtual('formattedAmount').get(function() {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: this.currency
  });
  return formatter.format(this.amount);
});

// Virtual pour verifier si remboursable
paymentSchema.virtual('isRefundable').get(function() {
  if (this.status !== 'completed') return false;
  if (this.refund?.refundedAt) return false;
  
  // Remboursable pendant 30 jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.processedAt > thirtyDaysAgo;
});

// Transformer pour JSON
paymentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.webhookData; // Donnees sensibles
    if (ret.paymentMethod?.last4) {
      ret.paymentMethod.last4 = '****' + ret.paymentMethod.last4;
    }
    return ret;
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
