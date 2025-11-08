// === ECOLOJIA V3 - UserJourney Model ===
// Tracking scans utilisateurs (RGPD compliant)

const mongoose = require('mongoose');

const userJourneySchema = new mongoose.Schema({
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
  productBarcode: String,
  scanDate: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    enum: ['camera', 'search', 'favorites', 'history'],
    default: 'camera'
  },
  metadata: {
    deviceType: String,
    appVersion: String
  }
}, {
  timestamps: true,
  collection: 'userJourneys'
});

// Index composé pour requêtes rapides
userJourneySchema.index({ userHash: 1, scanDate: -1 });

// TTL automatique : suppression après 90 jours (RGPD)
userJourneySchema.index({ scanDate: 1 }, { expireAfterSeconds: 7776000 });

// Méthode : Obtenir stats utilisateur
userJourneySchema.statics.getUserStats = async function(userHash, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const scans = await this.find({
    userHash,
    scanDate: { $gte: startDate }
  }).populate('productId');

  return {
    totalScans: scans.length,
    uniqueProducts: new Set(scans.map(s => s.productBarcode)).size,
    recentScans: scans.slice(0, 10)
  };
};

module.exports = mongoose.model('UserJourney', userJourneySchema);