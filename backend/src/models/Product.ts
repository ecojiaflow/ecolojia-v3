import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  barcode: { type: String, index: true, unique: true, sparse: true },
  name: { type: String, required: true, index: 'text' },
  brand: { type: String, index: true },
  category: { type: String, enum: ['food','cosmetics','detergents'], required: true },
  ingredients: String,
  nutriScore: String,
  novaGroup: Number,
  ecoScore: String,
  imageUrl: String,
  scores: { health: Number, eco: Number, global: Number },
  lastAnalyzedAt: Date
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);
