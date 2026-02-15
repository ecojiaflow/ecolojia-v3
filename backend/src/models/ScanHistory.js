const mongoose = require('mongoose');

const scanHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  barcode: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  scannedAt: { type: Date, default: Date.now, index: true },
  snapshot: {
    name: String,
    brand: String,
    imageUrl: String,
    subcategory: String,
    level: Number,
    nova: Number,
    status: String,
    hasSugarFlag: Boolean,
    hasSaltFlag: Boolean,
    hasAdditives: Boolean,
    isNova4: Boolean
  }
});

scanHistorySchema.index({ userId: 1, scannedAt: -1 });

module.exports = mongoose.model('ScanHistory', scanHistorySchema);
