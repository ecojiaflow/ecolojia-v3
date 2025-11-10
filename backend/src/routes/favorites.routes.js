const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ⚠️ On utilise le middleware "authenticateUser" exposé par middleware/index.js (vu dans les logs)
const { authenticateUser } = require('../middleware');

const favoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  productId: { type: String, required: true },
  barcode: String,
  createdAt: { type: Date, default: Date.now }
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

// 🔒 Sécurise toutes les routes favorites
router.use(authenticateUser);

// Liste favoris (user scoping)
router.get('/', async (req, res, next) => {
  try {
    const userId = (req.user?.id || req.user?._id || '').toString();
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, favorites });
  } catch (err) {
    next(err);
  }
});

// Ajouter favori (idempotent pour un user)
router.post('/', async (req, res, next) => {
  try {
    const userId = (req.user?.id || req.user?._id || '').toString();
    const { productId, barcode } = req.body || {};

    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId manquant' });
    }

    const existing = await Favorite.findOne({ userId, productId });
    if (existing) {
      return res.json({ success: true, message: 'Déjà en favoris' });
    }

    const favorite = await Favorite.create({ userId, productId, barcode });
    res.json({ success: true, favorite });
  } catch (err) {
    next(err);
  }
});

// Retirer favori (sécurisé: on ne supprime que son propre favori)
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req.user?.id || req.user?._id || '').toString();
    const result = await Favorite.deleteOne({ _id: req.params.id, userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Favori introuvable' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;