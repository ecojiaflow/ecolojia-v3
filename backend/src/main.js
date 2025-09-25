require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const PORT = process.env.PORT || 10000;
const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(cors({
  origin: (origin, cb) => cb(null, true), // en dev: large
  credentials: true
}));

// ---- /api/health + /api/version
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "ecolojia-backend",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString()
  });
});
app.get("/api/version", (_req, res) => {
  let version = "0.0.0";
  try { version = require("../package.json").version; } catch {}
  res.json({ version, commit: process.env.GIT_COMMIT_SHA || null });
});

// ---- Montage conditionnel des routes existantes
function safeMount(base, rel) {
  try {
    const router = require(rel);
    if (router && router.stack) {
      app.use(base, router);
      console.log(`✓ Mounted ${base} -> ${rel}`);
    } else {
      console.warn(`⚠ ${rel} ne retourne pas un router Express`);
    }
  } catch (e) {
    console.warn(`• Route optionnelle ignorée: ${rel} (${e.message})`);
  }
}

safeMount("/api/analysis", path.join(__dirname, "routes/analysis.routes.js"));
safeMount("/api/vision",   path.join(__dirname, "routes/vision.routes.js"));
safeMount("/api/products", path.join(__dirname, "routes/products.js"));
safeMount("/api/algolia",  path.join(__dirname, "routes/algolia-unified.js"));
// fallback possible:
if (!app._router.stack.find(s => s?.route?.path?.startsWith?.("/api/algolia"))) {
  safeMount("/api/algolia", path.join(__dirname, "routes/algolia.js"));
}
// (paiements volontairement non montés en M1)

app.listen(PORT, () => {
  console.log(`ECOLOJIA backend (bootstrap M1) on http://localhost:${PORT}`);
});
