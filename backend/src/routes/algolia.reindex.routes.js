/**
 * Router dédié à la réindexation Algolia (isolé, sans auth).
 * Endpoints:
 *  - GET  /api/algolia-reindex/reindex/status
 *  - POST /api/algolia-reindex/reindex   { "dryRun": true|false }
 */
const express = require("express");
const { MongoClient } = require("mongodb");
const router = express.Router();

const APP_ID = process.env.ALGOLIA_APP_ID;
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const INDEX = process.env.ALGOLIA_INDEX || "products";

let lastRun = null;
let lastIndexed = 0;

function headers() {
  return {
    "X-Algolia-Application-Id": APP_ID,
    "X-Algolia-API-Key": ADMIN_KEY,
    "Content-Type": "application/json",
  };
}

async function sendBatch(objects) {
  const payload = {
    requests: objects.map((o) => ({ action: "updateObject", body: o })),
  };
  const res = await fetch(`https://${APP_ID}-dsn.algolia.net/1/indexes/${encodeURIComponent(INDEX)}/batch`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Algolia batch failed: ${res.status} ${t}`);
  }
  return res.json();
}

router.get("/reindex/status", async (_req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const count = await client.db().collection("products").countDocuments();
    await client.close();
    res.json({ ok: true, index: INDEX, mongoProducts: count, lastRun, lastIndexed });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

router.post("/reindex", async (req, res) => {
  try {
    const dryRun = !!(req.body && req.body.dryRun);
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const cursor = client.db().collection("products").find({}, {
      projection: { name: 1, brand: 1, category: 1, barcode: 1, healthScore: 1, imageUrl: 1 },
    });

    let batch = [];
    let processed = 0;
    const flush = async () => {
      if (!batch.length) return;
      if (!dryRun) await sendBatch(batch);
      processed += batch.length;
      batch = [];
    };

    for await (const doc of cursor) {
      const objectID = doc.barcode ? String(doc.barcode) : String(doc._id);
      batch.push({
        objectID,
        name: doc.name ?? null,
        brand: doc.brand ?? null,
        category: doc.category ?? null,
        barcode: doc.barcode ?? null,
        healthScore: Number.isFinite(doc.healthScore) ? doc.healthScore : null,
        imageUrl: doc.imageUrl ?? null,
      });
      if (batch.length >= 1000) await flush();
    }
    await flush();
    await client.close();

    lastRun = new Date().toISOString();
    lastIndexed = processed;

    res.json({
      ok: true,
      dryRun,
      index: INDEX,
      wouldUpdate: dryRun ? processed : undefined,
      updated: dryRun ? undefined : processed,
      lastRun,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

module.exports = router;
