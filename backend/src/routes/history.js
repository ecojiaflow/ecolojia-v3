const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');
const { authOptional } = require('../middleware/auth');

// GET /api/history
router.get('/', authOptional, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Si pas d'utilisateur, retourner une liste vide
    if (!userId) {
      return res.json({
        success: true,
        data: {
          analyses: [],
          pagination: {
            total: 0,
            page: 1,
            pages: 0,
            limit: 12
          }
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = { userId };
    if (req.query.category) {
      query['productSnapshot.category'] = req.query.category;
    }

    const [analyses, total] = await Promise.all([
      Analysis.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Analysis.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        analyses,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

// GET /api/history/count
router.get('/count', authOptional, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json({ success: true, count: 0 });
    }

    const query = { userId };
    if (req.query.category) {
      query['productSnapshot.category'] = req.query.category;
    }

    const count = await Analysis.countDocuments(query);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
