// backend/src/routes/algolia-reindex.js
// M8 Enhanced - Job de réindexation avec facettes et analytics

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const algoliaService = require('../services/algolia/algoliaService');
const { asyncHandler } = require('../middleware');

// POST /api/algolia/reindex - Job de réindexation complète
router.post('/reindex', asyncHandler(async (req, res) => {
  const { 
    batchSize = 100, 
    category = null, 
    staging = false,
    dryRun = false 
  } = req.body;

  if (!algoliaService.isConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Service Algolia non configuré'
    });
  }

  console.log(`?? Démarrage réindexation${dryRun ? ' (DRY RUN)' : ''}`);
  const startTime = Date.now();

  try {
    // Construire la requête MongoDB
    const query = {};
    if (category) {
      query.category = category;
    }

    // Compter le total
    const totalCount = await Product.countDocuments(query);
    console.log(`?? ${totalCount} produits à traiter${category ? ` (catégorie: ${category})` : ''}`);

    if (totalCount === 0) {
      return res.json({
        success: true,
        message: 'Aucun produit à indexer',
        stats: { processed: 0, indexed: 0, errors: 0 }
      });
    }

    let stats = {
      processed: 0,
      indexed: 0,
      errors: 0,
      duplicates: 0,
      withoutName: 0,
      byCategory: {}
    };

    // Configurer l'index avant indexation
    if (!dryRun) {
      await algoliaService.configureIndex(staging);
      console.log(`?? Index ${staging ? 'staging' : 'production'} configuré`);
    }

    // Traitement par batch
    for (let skip = 0; skip < totalCount; skip += batchSize) {
      const products = await Product.find(query)
        .skip(skip)
        .limit(batchSize)
        .lean();

      const transformed = [];

      for (const product of products) {
        try {
          // Transformer le produit
          const algoliaProduct = algoliaService.transformProductForAlgolia(product);
          
          // Vérifications qualité
          if (!algoliaProduct.title || algoliaProduct.title.trim().length === 0) {
            stats.withoutName++;
            console.warn(`?? Produit sans nom ignoré: ${product._id}`);
            continue;
          }

          // Détecter doublons par titre+brand
          const key = `${algoliaProduct.title}-${algoliaProduct.brand}`.toLowerCase();
          if (transformed.find(p => `${p.title}-${p.brand}`.toLowerCase() === key)) {
            stats.duplicates++;
            continue;
          }

          // Enrichir avec données M8
          algoliaProduct._tags = [
            `category:${algoliaProduct.category}`,
            `brand:${algoliaProduct.brand}`,
            `score_bucket:${getScoreBucket(algoliaProduct.healthScore)}`
          ];

          // Ajouter buckets pour facettes
          algoliaProduct.scoreBucket = getScoreBucket(algoliaProduct.healthScore);
          algoliaProduct.priceRange = getPriceRange(algoliaProduct.price);

          transformed.push(algoliaProduct);

          // Stats par catégorie
          stats.byCategory[algoliaProduct.category] = 
            (stats.byCategory[algoliaProduct.category] || 0) + 1;

        } catch (error) {
          console.error(`? Erreur transformation produit ${product._id}:`, error);
          stats.errors++;
        }
      }

      stats.processed += products.length;

      if (!dryRun && transformed.length > 0) {
        // Indexer le batch
        const result = await algoliaService.indexProducts(transformed, staging);
        stats.indexed += result.success;
        stats.errors += result.failed;
      } else {
        stats.indexed += transformed.length;
      }

      // Log progression
      const progress = Math.round((stats.processed / totalCount) * 100);
      console.log(`?? Progression: ${progress}% (${stats.processed}/${totalCount})`);

      // Pause pour éviter surcharge
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = Date.now() - startTime;
    console.log(`? Réindexation terminée en ${duration}ms`);

    res.json({
      success: true,
      message: `Réindexation ${dryRun ? '(dry run) ' : ''}terminée`,
      stats: {
        ...stats,
        duration: `${Math.round(duration / 1000)}s`,
        indexUsed: staging ? 'staging' : 'production',
        totalProducts: totalCount
      }
    });

  } catch (error) {
    console.error('? Erreur réindexation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réindexation',
      message: error.message
    });
  }
}));

// GET /api/algolia/reindex/status - Statut de la réindexation
router.get('/status', asyncHandler(async (req, res) => {
  if (!algoliaService.isConfigured()) {
    return res.json({ configured: false });
  }

  try {
    const [prodStats, stagingStats] = await Promise.all([
      algoliaService.getIndexStats(false),
      algoliaService.getIndexStats(true)
    ]);

    res.json({
      success: true,
      production: prodStats,
      staging: stagingStats,
      lastSync: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// DELETE /api/algolia/clear/:index - Vider un index (staging uniquement)
router.delete('/clear/:index', asyncHandler(async (req, res) => {
  const { index } = req.params;
  
  if (index !== 'staging') {
    return res.status(403).json({
      success: false,
      error: 'Seul l\'index staging peut être vidé'
    });
  }

  if (!algoliaService.isConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Service Algolia non configuré'
    });
  }

  try {
    await algoliaService.clearIndex(true);
    
    res.json({
      success: true,
      message: 'Index staging vidé avec succès'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// POST /api/algolia/promote - Promouvoir staging vers production
router.post('/promote', asyncHandler(async (req, res) => {
  if (!algoliaService.isConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Service Algolia non configuré'
    });
  }

  try {
    await algoliaService.promoteStaging();
    
    res.json({
      success: true,
      message: 'Staging promu en production avec succès'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Utilitaires
function getScoreBucket(score) {
  if (!score) return 'unknown';
  if (score >= 81) return '81-100';
  if (score >= 61) return '61-80';
  if (score >= 41) return '41-60';
  if (score >= 21) return '21-40';
  return '0-20';
}

function getPriceRange(price) {
  if (!price) return 'unknown';
  if (price < 5) return '0-5';
  if (price < 15) return '5-15';
  if (price < 30) return '15-30';
  return '30+';
}

module.exports = router;
