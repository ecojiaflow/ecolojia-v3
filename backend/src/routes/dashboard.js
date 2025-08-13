// PATH: backend/src/routes/dashboard.js
const express = require('express');
const router = express.Router();

// Modèles (avec fallback console si absent)
let Analysis, Product;
try { Analysis = require('../models/Analysis'); } catch { Analysis = null; }
try { Product = require('../models/Product'); } catch { Product = null; }

// Helper errors
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/dashboard/stats
router.get('/stats', asyncHandler(async (req, res) => {
  // userId facultatif : si non fourni, on agrège globalement (ou user 'demo' si tu préfères)
  const userId = req.user?.id || null;

  // Fallback mock si pas de modèles/db
  const dbReady = !!(Analysis && Product);
  if (!dbReady) {
    return res.json({
      success: true,
      data: {
        totals: { scans: 12, products: 8, favorites: 3 },
        averages: { health: 72, environment: 68, ethics: 70 },
        weeklyTrend: [
          { day: 'Lun', scans: 2 }, { day: 'Mar', scans: 1 }, { day: 'Mer', scans: 3 },
          { day: 'Jeu', scans: 2 }, { day: 'Ven', scans: 2 }, { day: 'Sam', scans: 1 }, { day: 'Dim', scans: 1 }
        ],
        recentAnalyses: [],
        topProducts: []
      }
    });
  }

  // Filtres
  const match = {};
  if (userId) match.userId = userId;

  // 1) Totaux + moyennes
  const [agg] = await Analysis.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        scans: { $sum: 1 },
        avgHealth: { $avg: '$results.healthScore' },
        avgEnv: { $avg: '$results.environmentScore' },
        avgEthics: { $avg: '$results.ethicsScore' }
      }
    }
  ]);

  // 2) Tendances 7 derniers jours
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const trendRaw = await Analysis.aggregate([
    { $match: { ...match, createdAt: { $gte: new Date(since.setHours(0,0,0,0)) } } },
    {
      $group: {
        _id: {
          y: { $year: '$createdAt' },
          m: { $month: '$createdAt' },
          d: { $dayOfMonth: '$createdAt' },
          w: { $isoDayOfWeek: '$createdAt' }
        },
        scans: { $sum: 1 }
      }
    },
    { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
  ]);

  const dayMap = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const weeklyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    const hit = trendRaw.find(t => (
      `${t._id.y}-${t._id.m}-${t._id.d}` === key
    ));
    weeklyTrend.push({ day: dayMap[(d.getDay()+6)%7], scans: hit?.scans || 0 });
  }

  // 3) Dernières analyses
  const recentAnalyses = await Analysis.find(match)
    .sort({ createdAt: -1 })
    .limit(10)
    .select({
      createdAt: 1,
      'productSnapshot.name': 1,
      'productSnapshot.category': 1,
      'results.healthScore': 1,
      'results.foodAnalysis.nutriScore': 1,
      'results.foodAnalysis.ecoScore': 1
    })
    .lean();

  // 4) Top produits (par scans)
  const topProducts = await Product.find({})
    .sort({ scanCount: -1 })
    .limit(10)
    .select({ name: 1, brand: 1, barcode: 1, imageUrl: 1, category: 1, 'analysisData.healthScore': 1 })
    .lean();

  res.json({
    success: true,
    data: {
      totals: {
        scans: agg?.scans || 0,
        products: await Product.countDocuments({}),
        favorites: 0 // à brancher si favoris
      },
      averages: {
        health: Math.round(agg?.avgHealth || 0),
        environment: Math.round(agg?.avgEnv || 0),
        ethics: Math.round(agg?.avgEthics || 0)
      },
      weeklyTrend,
      recentAnalyses: recentAnalyses.map(a => ({
        date: a.createdAt,
        productName: a.productSnapshot?.name || 'Produit',
        category: a.productSnapshot?.category || 'food',
        score: a.results?.healthScore ?? 0,
        nutriScore: a.results?.foodAnalysis?.nutriScore,
        ecoScore: a.results?.foodAnalysis?.ecoScore
      })),
      topProducts
    }
  });
}));

module.exports = router;
