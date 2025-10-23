const express = require('express');
const imageEnrichment = require('../services/imageEnrichment.service');
const router = express.Router();
const Product = require('../models/Product');

// Route de recherche qui utilise l'index MongoDB
router.get('/', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 20, category } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    let products = [];
    let total = 0;

    if (q && q.trim()) {
      // Utiliser l'index texte MongoDB
      const query = { $text: { $search: q } };
      if (category) query.category = category;
      
      products = await Product.find(query)
        .select('name brand barcode category imageUrl ingredients nova_group nutriscore_grade')
        .skip(skip)
        .limit(limitNum)
        .lean();
      
      total = await Product.countDocuments(query);
    } else {
      // Sans recherche, retourner les derniers produits
      const query = category ? { category } : {};
      products = await Product.find(query)
        .sort({ createdAt: -1 })
        .select('name brand barcode category imageUrl ingredients nova_group nutriscore_grade')
        .skip(skip)
        .limit(limitNum)
        .lean();
      
      total = await Product.countDocuments(query);
    }

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('[Search] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche'
    });
  }
});

module.exports = router;
