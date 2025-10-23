const mongoose = require('mongoose');

const temporaryProductSchema = new mongoose.Schema({
  barcode: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ocrText: String,
  parsedIngredients: [String],
  category: { type: String, enum: ['food', 'cosmetics', 'detergents'], default: 'food' },
  aiAnalysis: {
    score: Number,
    health: { score: Number, warnings: [String], positives: [String] },
    summary: String,
    recommendations: [String]
  },
  imageUrl: String,
  confidence: { type: Number, default: 0.5 },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  createdAt: { type: Date, default: Date.now }
});

temporaryProductSchema.index({ barcode: 1, userId: 1 });

module.exports = mongoose.model('TemporaryProduct', temporaryProductSchema);
