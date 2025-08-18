// backend/src/models/ChatHistory.js
// Modele pour l'historique des conversations avec l'IA

const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  // Reference utilisateur
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // ID de conversation pour regrouper les messages
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  
  // Message de l'utilisateur
  userMessage: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Reponse de l'IA
  aiResponse: {
    type: String,
    required: true,
    maxlength: 5000
  },
  
  // Contexte de la conversation
  context: {
    // Produit concerne si applicable
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    
    // Type de question
    questionType: {
      type: String,
      enum: [
        'general',
        'product_specific',
        'comparison',
        'nutrition_advice',
        'allergen_info',
        'alternative_suggestion',
        'nova_explanation',
        'additive_info',
        'other'
      ],
      default: 'general'
    },
    
    // Categorie de produit concernee
    productCategory: {
      type: String,
      enum: ['food', 'cosmetics', 'detergents']
    },
    
    // Metadonnees additionnelles
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  
  // Tokens utilises (pour tracking des couts)
  usage: {
    promptTokens: {
      type: Number,
      default: 0
    },
    completionTokens: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    estimatedCost: {
      type: Number,
      default: 0
    }
  },
  
  // ‰valuation de la reponse par l'utilisateur
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    helpful: Boolean,
    comment: String,
    reportedAt: Date
  },
  
  // Actions suggerees extraites de la reponse
  suggestedActions: [{
    type: {
      type: String,
      enum: ['search_product', 'scan_product', 'view_alternatives', 'read_more']
    },
    value: mongoose.Schema.Types.Mixed,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Informations techniques
  model: {
    type: String,
    default: 'deepseek-chat'
  },
  
  temperature: {
    type: Number,
    default: 0.7
  },
  
  // Erreurs eventuelles
  error: {
    occurred: {
      type: Boolean,
      default: false
    },
    message: String,
    code: String,
    timestamp: Date
  },
  
  // Statut de la conversation
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  
  // Marqueurs
  flags: {
    inappropriate: {
      type: Boolean,
      default: false
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: Date,
    flagReason: String
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  archived: {
    type: Boolean,
    default: false
  },
  
  archivedAt: Date
});

// Index composes pour les requetes frequentes
chatHistorySchema.index({ userId: 1, timestamp: -1 });
chatHistorySchema.index({ userId: 1, conversationId: 1, timestamp: 1 });
chatHistorySchema.index({ userId: 1, 'context.productId': 1 });
chatHistorySchema.index({ 'context.questionType': 1, timestamp: -1 });

// Index de recherche textuelle
chatHistorySchema.index({ userMessage: 'text', aiResponse: 'text' });

// Middleware pour calculer les tokens totaux
chatHistorySchema.pre('save', function(next) {
  if (this.usage.promptTokens && this.usage.completionTokens) {
    this.usage.totalTokens = this.usage.promptTokens + this.usage.completionTokens;
    // Estimation du cout (DeepSeek: ~$0.001 per 1K tokens)
    this.usage.estimatedCost = (this.usage.totalTokens / 1000) * 0.001;
  }
  next();
});

// Methodes d'instance
chatHistorySchema.methods.addFeedback = async function(rating, helpful, comment) {
  this.feedback = {
    rating,
    helpful,
    comment,
    reportedAt: new Date()
  };
  return this.save();
};

chatHistorySchema.methods.archive = async function() {
  this.archived = true;
  this.archivedAt = new Date();
  this.status = 'archived';
  return this.save();
};

chatHistorySchema.methods.flag = async function(userId, reason) {
  this.flags = {
    inappropriate: true,
    flaggedBy: userId,
    flaggedAt: new Date(),
    flagReason: reason
  };
  return this.save();
};

// Methodes statiques
chatHistorySchema.statics.getConversation = function(userId, conversationId) {
  return this.find({
    userId,
    conversationId,
    status: { $ne: 'deleted' }
  })
  .sort({ timestamp: 1 })
  .populate('context.productId', 'name brand');
};

chatHistorySchema.statics.getUserConversations = function(userId, options = {}) {
  const query = this.find({
    userId,
    status: { $ne: 'deleted' }
  });
  
  if (options.archived !== undefined) {
    query.where('archived', options.archived);
  }
  
  // Grouper par conversation et prendre le dernier message
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        status: { $ne: 'deleted' }
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$userMessage' },
        lastResponse: { $first: '$aiResponse' },
        lastTimestamp: { $first: '$timestamp' },
        messageCount: { $sum: 1 }
      }
    },
    {
      $sort: { lastTimestamp: -1 }
    },
    {
      $limit: options.limit || 20
    }
  ]);
};

chatHistorySchema.statics.searchConversations = function(userId, searchQuery, options = {}) {
  return this.find({
    userId,
    $text: { $search: searchQuery },
    status: { $ne: 'deleted' }
  })
  .select({ score: { $meta: 'textScore' } })
  .sort({ score: { $meta: 'textScore' } })
  .limit(options.limit || 20);
};

chatHistorySchema.statics.getUsageStats = async function(userId, period = 'month') {
  const dateLimit = new Date();
  
  switch (period) {
    case 'day':
      dateLimit.setDate(dateLimit.getDate() - 1);
      break;
    case 'week':
      dateLimit.setDate(dateLimit.getDate() - 7);
      break;
    case 'month':
      dateLimit.setMonth(dateLimit.getMonth() - 1);
      break;
  }
  
  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: dateLimit }
      }
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        totalTokens: { $sum: '$usage.totalTokens' },
        totalCost: { $sum: '$usage.estimatedCost' },
        avgTokensPerMessage: { $avg: '$usage.totalTokens' }
      }
    }
  ]);
  
  return stats[0] || {
    totalMessages: 0,
    totalTokens: 0,
    totalCost: 0,
    avgTokensPerMessage: 0
  };
};

chatHistorySchema.statics.getMostAskedTopics = function(period = 'month') {
  const dateLimit = new Date();
  dateLimit.setMonth(dateLimit.getMonth() - 1);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: dateLimit },
        'context.questionType': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$context.questionType',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);
};

// Methode pour nettoyer les anciennes conversations
chatHistorySchema.statics.cleanOldConversations = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.updateMany(
    {
      timestamp: { $lt: cutoffDate },
      archived: false
    },
    {
      $set: { 
        archived: true,
        archivedAt: new Date(),
        status: 'archived'
      }
    }
  );
};

// Virtual pour obtenir un resume de la conversation
chatHistorySchema.virtual('summary').get(function() {
  return {
    question: this.userMessage.substring(0, 100) + (this.userMessage.length > 100 ? '...' : ''),
    responsePreview: this.aiResponse.substring(0, 150) + (this.aiResponse.length > 150 ? '...' : '')
  };
});

// Transformer pour JSON
chatHistorySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
