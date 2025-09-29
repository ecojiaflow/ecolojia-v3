const express = require('express');
const mongoose = require('mongoose');

// compat require pour algoliasearch (évite "is not a function")
let algoliasearch = require('algoliasearch');
if (algoliasearch && algoliasearch.default) algoliasearch = algoliasearch.default;

const router = express.Router();

router.post('/reindex', async (req, res) => {
  try {
    const ADMIN_KEY = (process.env.ADMIN_KEY || '').trim();
    if (!ADMIN_KEY || (req.headers['x-admin-key'] || '').trim() !== ADMIN_KEY) {
      return res.status(401).json({ ok:false, error:'unauthorized' });
    }

    const appId     = (process.env.ALGOLIA_APP_ID || '').trim();
    const adminKey  = (process.env.ALGOLIA_ADMIN_API_KEY || '').trim();
    const indexName = (process.env.ALGOLIA_INDEX_NAME || 'products').trim();

    if (!appId || !adminKey) {
      return res.status(500).json({ ok:false, error:'missing env vars (appId/adminKey)' });
    }

    // ---- NOUVEAU: ping simple Algolia (sans toucher à Mongo) ----
    const ag = algoliasearch(appId, adminKey);
    if ((req.query.ping || '').trim() === '1') {
      try {
        await ag.listIndices();
        return res.json({ ok:true, ping:'algolia-ok', appId });
      } catch (e) {
        return res.status(500).json({ ok:false, ping:'fail', error: e.message, appId });
      }
    }
    // -------------------------------------------------------------

    // S'assurer que mongoose est connecté et utiliser la connexion existante
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }
    const nativeDb = mongoose.connection.db;
    const docs = await nativeDb.collection('products').find({}).toArray();
    if (!docs.length) {
      return res.json({ ok:true, indexed:0, message:'no docs in Mongo' });
    }

    const index = ag.initIndex(indexName);
    const payload = docs.map(d => ({ objectID: String(d._id), ...d }));
    const r = await index.saveObjects(payload, { autoGenerateObjectIDIfNotExist: true });

    return res.json({ ok:true, indexed: payload.length, index:indexName, task: r.taskID || r.taskIDs || null });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e.message });
  }
});

module.exports = router;
