const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('dotenv').config();

const ALG_APP_ID   = process.env.ALGOLIA_APP_ID || process.env.VITE_ALGOLIA_APP_ID;
const ALG_ADMINKEY = process.env.ALGOLIA_ADMIN_KEY || process.env.ALGOLIA_ADMIN_API_KEY;
const INDEX_NAME   = process.env.ALGOLIA_INDEX || process.env.ALGOLIA_INDEX_NAME || 'ecolojia_products';

async function ensureMongo() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI manquante');
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DBNAME, serverSelectionTimeoutMS: 30000 });
}

router.get('/reindex/status', async (req, res) => {
  try {
    let dbConnected = (mongoose.connection.readyState === 1);
    if (!dbConnected) {
      try { await ensureMongo(); dbConnected = true; } catch { dbConnected = false; }
    }
    return res.json({
      configured: !!(ALG_APP_ID && ALG_ADMINKEY),
      appId: !!ALG_APP_ID,
      adminKey: !!ALG_ADMINKEY,
      index: INDEX_NAME,
      dbConnected
    });
  } catch (e) {
    return res.status(500).json({ configured: false, error: e.message });
  }
});

router.post('/reindex', async (req, res) => {
  const dryRun = !!(req.body && req.body.dryRun);
  try {
    await ensureMongo();

    const db = mongoose.connection.db;

    // Compter les produits (sans Model, via collection native)
    const total = await db.collection('products').countDocuments();

    if (dryRun) {
      return res.json({
        success: true,
        dryRun: true,
        totals: { products: total },
        message: 'Dry-run OK, aucune écriture Algolia.'
      });
    }

    // --- Réindexation réelle minimaliste (batch lecture seule) ---
    if (!(ALG_APP_ID && ALG_ADMINKEY)) {
      return res.status(400).json({ success: false, error: 'Algolia non configuré (APP_ID / ADMIN_KEY manquants)' });
    }

    // Client Algolia sans dépendance externe
    const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
    const chunkSize = 1000;
    let sent = 0;
    for (let skip = 0; skip < total; skip += chunkSize) {
      const items = await db.collection('products')
        .find({}, { projection: { _id: 1, name: 1, brand: 1, category: 1, barcode: 1, healthScore: 1 } })
        .skip(skip).limit(chunkSize).toArray();

      // Map en records Algolia
      const records = items.map(doc => ({
        objectID: String(doc._id),
        name: doc.name || '',
        brand: doc.brand || '',
        category: doc.category || '',
        barcode: doc.barcode || '',
        healthScore: typeof doc.healthScore === 'number' ? doc.healthScore : null,
      }));

      // Push batch via REST Algolia
      const url = https://-dsn.algolia.net/1/indexes//batch;
      const payload = { requests: records.map(r => ({ action: 'upsertObject', body: r })) };
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Algolia-API-Key': ALG_ADMINKEY,
          'X-Algolia-Application-Id': ALG_APP_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error('Algolia batch error: ' + txt);
      }
      sent += records.length;
    }

    return res.json({ success: true, dryRun: false, indexed: sent, index: INDEX_NAME });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Erreur lors de la réindexation', message: e.message });
  }
});

module.exports = router;
