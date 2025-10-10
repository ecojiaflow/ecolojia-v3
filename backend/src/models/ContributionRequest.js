const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  barcode: { type: String, required: true, index: true },
  suggestedData: {
    name: String,
    brand: String,
    category: { type: String, enum: ['food', 'cosmetics', 'detergents'] },
    ingredients: [String],
    imageUrl: String,
    additionalInfo: String
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  moderatorNotes: String,
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  processedAt: Date
});

contributionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ContributionRequest', contributionSchema);
