// === ECOLOJIA V3 - ChatHistory Model ===
const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userHash: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'chatHistories'
});

// Index composé
chatHistorySchema.index({ userHash: 1, productId: 1 });

// TTL 90 jours
chatHistorySchema.index({ lastActivity: 1 }, { expireAfterSeconds: 7776000 });

// Méthode : Ajouter message
chatHistorySchema.methods.addMessage = function(role, content) {
  this.messages.push({ role, content, timestamp: new Date() });
  this.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.model('ChatHistory', chatHistorySchema);