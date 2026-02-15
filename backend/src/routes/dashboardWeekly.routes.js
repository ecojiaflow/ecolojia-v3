const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const ScanHistory = require('../models/ScanHistory');
const logger = require('../utils/logger');

function getWeekProfile(dist) {
  const total = (dist.base || 0) + (dist.regular || 0) + (dist.occasional || 0) + (dist.limit || 0);
  if (total === 0) return { level: 'empty', label: 'Aucun produit scanne', description: 'Scanne tes produits pour voir ton profil semaine.' };

  const baseRatio = ((dist.base || 0) + (dist.regular || 0)) / total;
  const limitRatio = (dist.limit || 0) / total;

  if (baseRatio >= 0.7 && limitRatio <= 0.1)
    return { level: 'excellent', label: 'Semaine bien equilibree', description: 'Les produits de base dominent largement. L equilibre est la.' };
  if (baseRatio >= 0.5 && limitRatio <= 0.2)
    return { level: 'good', label: 'Majoritairement equilibre', description: 'Cette semaine, les produits plaisir sont presents plusieurs fois. L equilibre reste possible si la base domine.' };
  if (baseRatio >= 0.3)
    return { level: 'mixed', label: 'Semaine contrastee', description: 'Plusieurs produits a limiter cette semaine. La variete et le retour a la base aident.' };
  return { level: 'unbalanced', label: 'Beaucoup de produits a limiter', description: 'Cette semaine merite attention. Revenir a des produits bruts aide a retablir l equilibre.' };
}

// GET /api/dashboard/week
router.get('/week', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    // Calculer les bornes de la semaine
    let from, to;
    if (req.query.from && req.query.to) {
      from = new Date(req.query.from);
      to = new Date(req.query.to);
      to.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      from = new Date(now);
      from.setDate(now.getDate() + mondayOffset);
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
    }

    const scans = await ScanHistory.find({
      userId,
      scannedAt: { $gte: from, $lte: to }
    }).sort({ scannedAt: -1 }).lean();

    // Distribution
    const distribution = { base: 0, regular: 0, occasional: 0, limit: 0 };
    let sugarFreq = 0, saltFreq = 0, additivesFreq = 0, nova4Freq = 0;

    const products = scans.map(s => {
      const snap = s.snapshot || {};
      const st = snap.status || 'unknown';
      if (distribution[st] !== undefined) distribution[st]++;

      if (snap.hasSugarFlag) sugarFreq++;
      if (snap.hasSaltFlag) saltFreq++;
      if (snap.hasAdditives) additivesFreq++;
      if (snap.isNova4) nova4Freq++;

      return {
        barcode: s.barcode,
        name: snap.name,
        brand: snap.brand,
        imageUrl: snap.imageUrl,
        subcategory: snap.subcategory,
        status: st,
        level: snap.level,
        nova: snap.nova,
        scannedAt: s.scannedAt
      };
    });

    const profile = getWeekProfile(distribution);

    res.json({
      period: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10)
      },
      totalScans: scans.length,
      distribution,
      exposures: {
        sugarFrequency: sugarFreq,
        saltFrequency: saltFreq,
        additivesFrequency: additivesFreq,
        nova4Frequency: nova4Freq
      },
      profile,
      products
    });

  } catch (err) {
    logger.error('[DASHBOARD] Erreur week:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
