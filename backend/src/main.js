require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const PORT = process.env.PORT || 10000;
const app = express();

// parsers & CORS
app.use(express.json({ limit: "2mb" }));
app.use(cors({
  origin: (origin, cb) => cb(null, true), // dev: large
  credentials: true,
}));

// Health & Version
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "ecolojia-backend",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});
app.get("/api/version", (_req, res) => {
  let version = "0.0.0";
  try { version = require("../package.json").version; } catch {}
  res.json({ version, commit: process.env.GIT_COMMIT_SHA || null });
});

// ---- Routers optionnels (montage sûr)
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

// MONTAGES
safeMount("/api/analysis", path.join(__dirname, "routes/analysis.routes.js"));
safeMount("/api/vision",   path.join(__dirname, "routes/vision.routes.js"));
safeMount("/api/products", path.join(__dirname, "routes/products.js"));
safeMount("/api/algolia",  path.join(__dirname, "routes/algolia-unified.js"));
// Fallback algolia (si le unified n'existe pas)
if (!app._router.stack.find(s => s?.route?.path?.startsWith?.("/api/algolia"))) {
  safeMount("/api/algolia", path.join(__dirname, "routes/algolia.js"));
}

// M7: OCR public + analyze (stubs si besoin)
try {
  app.use("/api/vision-ocr", require("./routes/vision.ocr.public"));
  console.log("✓ Mounted /api/vision-ocr -> routes/vision.ocr.public.js");
} catch (e) {
  console.warn("Vision OCR public mount failed:", e.message);
}
try {
  app.use("/api/vision", require("./routes/vision.analyze"));
} catch (e) {
  console.warn("Vision analyze route load failed:", e.message);
}

// M8: Réindexation Algolia (router dédié)
try {
  const algoliaReindexRouter = require("./routes/algolia.reindex.routes");
  app.use("/api/algolia-reindex", algoliaReindexRouter);
  console.log("✓ Mounted /api/algolia-reindex -> routes/algolia.reindex.routes.js");
} catch (e) {
  console.warn("Algolia reindex router mount failed:", e.message);
}

// LISTEN
app.listen(PORT, () => {
  console.log(`ECOLOJIA backend (bootstrap M1..M8) on http://localhost:${PORT}`);
});

module.exports = app;
