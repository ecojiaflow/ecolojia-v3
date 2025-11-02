const mongoose = require('mongoose');

const shoppingItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  unit: {
    type: String,
    enum: ['unite', 'kg', 'g', 'l', 'ml', 'piece'],
    default: 'unite'
  },
  category: {
    type: String,
    enum: ['fruits-legumes', 'viandes-poissons', 'produits-laitiers', 'epicerie', 'surgeles', 'boissons', 'hygiene', 'entretien', 'autres'],
    default: 'autres'
  },
  checked: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  }
}, { _id: true });

const shoppingListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  items: [shoppingItemSchema],
  shared: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour performance
shoppingListSchema.index({ userId: 1, createdAt: -1 });

// Middleware pre-save
shoppingListSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Méthode pour calculer score moyen
shoppingListSchema.methods.calculateAverageScore = function() {
  if (this.items.length === 0) return 0;
  const itemsWithScore = this.items.filter(item => item.score != null);
  if (itemsWithScore.length === 0) return 0;
  const sum = itemsWithScore.reduce((acc, item) => acc + item.score, 0);
  return Math.round(sum / itemsWithScore.length);
};

module.exports = mongoose.model('ShoppingList', shoppingListSchema);