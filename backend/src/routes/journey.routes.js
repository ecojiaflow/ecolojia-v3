// === ECOLOJIA V3 - Journey Routes ===
const express = require('express');
const router = express.Router();
const UserJourney = require('../models/UserJourney');
const crypto = require('crypto');

// Helper : Créer hash utilisateur (RGPD compliant)
function createUserHash(userId) {
  return crypto.createHash('sha256').update(userId).digest('hex');
}

// POST /api/journey/scan - Enregistrer un scan
router.post('/scan', async (req, res) => {
  try {
    const { userId, productId, productBarcode, location, deviceType } = req.body;
    
    if (!userId || !productId) {
      return res.status(400).json({ error: 'userId et productId requis' });
    }
    
    const userHash = createUserHash(userId);
    
    const journey = new UserJourney({
      userHash,
      productId,
      productBarcode,
      location: location || 'camera',
      metadata: { deviceType }
    });
    
    await journey.save();
    
    res.json({ success: true, scanId: journey._id });
  } catch (error) {
    console.error('Erreur scan journey:', error);
    res.status(500).json({ error: 'Erreur enregistrement scan' });
  }
});

// GET /api/journey/stats/:userId - Stats utilisateur
router.get('/stats/:userId', async (req, res) => {
  try {
    const userHash = createUserHash(req.params.userId);
    const days = parseInt(req.query.days) || 30;
    
    const stats = await UserJourney.getUserStats(userHash, days);
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur stats journey:', error);
    res.status(500).json({ error: 'Erreur récupération stats' });
  }
});

// GET /api/journey/history/:userId - Historique
router.get('/history/:userId', async (req, res) => {
  try {
    const userHash = createUserHash(req.params.userId);
    const limit = parseInt(req.query.limit) || 20;
    
    const history = await UserJourney.find({ userHash })
      .sort({ scanDate: -1 })
      .limit(limit)
      .populate('productId');
    
    res.json({ scans: history });
  } catch (error) {
    console.error('Erreur history journey:', error);
    res.status(500).json({ error: 'Erreur récupération historique' });
  }
});

module.exports = router;