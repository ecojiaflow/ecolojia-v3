const express = require('express');
const mongoose = require('mongoose');

// compat require pour algoliasearch (évite "is not a function")
let algoliasearch = require('algoliasearch');
if (algoliasearch && algoliasearch.default) algoliasearch = algoliasearch.default;

const router = express.Router();

router.post('/reindex', async (req, res) => {
  try {
    const ADMIN_KEY = process.env.ADMIN_KEY;
    if (!ADMIN_KEY || req.headers['x-admin-key'] !== ADMIN_KEY) {
      return res.status(401).json({ ok:false, error:'unauthorized' });
    }

    const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME } = process.env;
    if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY) {
      return res.status(500).json({ ok:false, error:'missing env vars' });
    }
    const indexName = ALGOLIA_INDEX_NAME || 'products';

    // Assurer la connexion mongoose prête
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }
    const nativeDb = mongoose.connection.db;
    const docs = await nativeDb.collection('products').find({}).toArray();

    if (!docs.length) {
      return res.json({ ok:true, indexed:0, message:'no docs in Mongo' });
    }

    const ag = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
    const index = ag.initIndex(indexName);

    const payload = docs.map(d => ({ objectID: String(d._id), ...d }));
    const r = await index.saveObjects(payload, { autoGenerateObjectIDIfNotExist: true });

    return res.json({ ok:true, indexed: payload.length, index:indexName, task: r.taskID || r.taskIDs || null });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e.message });
  }
});

module.exports = router;
