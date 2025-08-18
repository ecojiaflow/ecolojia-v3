// backend/src/models/VisionAnalysis.js

const mongoose = require('mongoose');

const visionAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Metadonnees de l'image
  imageMetadata: {
    size: Number,
    mimeType: String,
    dimensions: {
      width: Number,
      height: Number
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },

  // Resultats de l'OCR
  ocrResult: {
    service: {
      type: String,
      enum: ['tesseract', 'ocrspace', 'googlevision'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    processingTime: Number, // en ms
    rawText: String,
    language: String
  },

  // Donnees extraites
  extractedData: {
    productName: String,
    brand: String,
    barcode: String,
    category: String,
    ingredients: String,
    weight: String,
    nutritionalInfo: {
      energy: Number,
      proteins: Number,
      carbs: Number,
      sugars: Number,
      fat: Number,
      saturated: Number,
      fiber: Number,
      salt: Number,
      sodium: Number
    },
    allergens: [String]
  },

  // Produit trouve
  matchedProduct: {
    found: {
      type: Boolean,
      default: false
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    matchMethod: {
      type: String,
      enum: ['barcode', 'name_brand', 'similarity']
    },
    matchConfidence: Number
  },

  // Analyse du produit (si trouve ou cree)
  productAnalysis: {
    healthScore: Number,
    environmentScore: Number,
    nova: Number,
    nutriscore: String,
    ecoscore: String,
    warnings: [String],
    recommendations: [String]
  },

  // Statut et erreurs
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    message: String,
    code: String,
    timestamp: Date
  },

  // Metadonnees
  metadata: {
    userAgent: String,
    ipAddress: String,
    appVersion: String,
    platform: String // 'web', 'ios', 'android'
  }
}, {
  timestamps: true
});

// Index pour les recherches
visionAnalysisSchema.index({ userId: 1, createdAt: -1 });
visionAnalysisSchema.index({ 'extractedData.barcode': 1 });
visionAnalysisSchema.index({ 'matchedProduct.productId': 1 });
visionAnalysisSchema.index({ status: 1 });

// Methodes virtuelles
visionAnalysisSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed' && this.ocrResult.confidence > 0.5;
});

visionAnalysisSchema.virtual('dataCompleteness').get(function() {
  const fields = [
    'productName',
    'brand',
    'barcode',
    'ingredients',
    'category'
  ];
  
  const filledFields = fields.filter(field => 
    this.extractedData[field] && this.extractedData[field].length > 0
  );
  
  return filledFields.length / fields.length;
});

// Methodes statiques
visionAnalysisSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalScans: { $sum: 1 },
        successfulScans: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        productsFound: {
          $sum: { $cond: ['$matchedProduct.found', 1, 0] }
        },
        avgConfidence: { $avg: '$ocrResult.confidence' },
        avgProcessingTime: { $avg: '$ocrResult.processingTime' }
      }
    }
  ]);

  return stats[0] || {
    totalScans: 0,
    successfulScans: 0,
    productsFound: 0,
    avgConfidence: 0,
    avgProcessingTime: 0
  };
};

// Methodes d'instance
visionAnalysisSchema.methods.toClientJSON = function() {
  return {
    id: this._id,
    status: this.status,
    confidence: this.ocrResult?.confidence,
    extractedData: this.extractedData,
    productFound: this.matchedProduct?.found || false,
    productId: this.matchedProduct?.productId,
    analysis: this.productAnalysis,
    createdAt: this.createdAt
  };
};

const VisionAnalysis = mongoose.model('VisionAnalysis', visionAnalysisSchema);

module.exports = VisionAnalysis;