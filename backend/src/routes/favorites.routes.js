const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  productId: { type: String, required: true },
  barcode: String,
  createdAt: { type: Date, default: Date.now }
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

// Liste favoris
router.get('/', async (req, res) => {
  const userId = req.user?._id || req.userId || 'anonymous';
  const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
  res.json({ success: true, favorites });
});

// Ajouter favori
router.post('/', async (req, res) => {
  const userId = req.user?._id || req.userId || 'anonymous';
  const { productId, barcode } = req.body;
  
  const existing = await Favorite.findOne({ userId, productId });
  if (existing) {
    return res.json({ success: true, message: 'Déjà en favoris' });
  }
  
  const favorite = await Favorite.create({ userId, productId, barcode });
  res.json({ success: true, favorite });
});

// Retirer favori
router.delete('/:id', async (req, res) => {
  await Favorite.deleteOne({ _id: req.params.id });
  res.json({ success: true });
});

module.exports = router;
