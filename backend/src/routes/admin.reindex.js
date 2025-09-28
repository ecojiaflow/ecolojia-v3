const express = require('express');
const { MongoClient } = require('mongodb');
const algoliasearch = require('algoliasearch');

const router = express.Router();

router.post('/reindex', async (req, res) => {
  try {
    const ADMIN_KEY = process.env.ADMIN_KEY;
    if (!ADMIN_KEY || req.headers['x-admin-key'] !== ADMIN_KEY) {
      return res.status(401).json({ ok:false, error:'unauthorized' });
    }

    const uri = process.env.MONGODB_URI;
    const appId = process.env.ALGOLIA_APP_ID;
    const adminKey = process.env.ALGOLIA_ADMIN_API_KEY;
    const indexName = process.env.ALGOLIA_INDEX_NAME || 'products';

    if (!uri || !appId || !adminKey) {
      return res.status(500).json({ ok:false, error:'missing env vars' });
    }

    const mongo = new MongoClient(uri);
    await mongo.connect();
    const db = mongo.db();
    const docs = await db.collection('products').find({}).toArray();
    await mongo.close();

    if (!docs.length) return res.json({ ok:true, indexed:0, message:'no docs in Mongo' });

    const ag = algoliasearch(appId, adminKey);
    const index = ag.initIndex(indexName);
    const payload = docs.map(d => ({ objectID: String(d._id), ...d }));

    const r = await index.saveObjects(payload, { autoGenerateObjectIDIfNotExist: true });
    return res.json({ ok:true, indexed: payload.length, index:indexName, task: r.taskID || r.taskIDs || null });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e.message });
  }
});

module.exports = router;
