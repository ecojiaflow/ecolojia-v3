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
    time: new Date().toISOString(),
    module: "M11-Payments"
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
      console.log(`? Mounted ${base} -> ${rel}`);
    } else {
      console.warn(`?? ${rel} ne retourne pas un router Express`);
    }
  } catch (e) {
    console.warn(`• Route optionnelle ignorée: ${rel} (${e.message})`);
  }
}

// Routes existantes
safeMount("/api/analysis", path.join(__dirname, "routes/analysis.routes.js"));
safeMount("/api/vision", path.join(__dirname, "routes/vision.routes.js"));
safeMount("/api/products", path.join(__dirname, "routes/products.js"));
safeMount("/api/algolia", path.join(__dirname, "routes/algolia-unified.js"));
safeMount("/api/auth", path.join(__dirname, "routes/auth.simple.js"));
safeMount("/api/dashboard", path.join(__dirname, "routes/dashboard.js"));

// Fallback algolia si algolia-unified ne fonctionne pas
if (!app._router.stack.find(s => s?.route?.path?.startsWith?.("/api/algolia"))) {
  safeMount("/api/algolia", path.join(__dirname, "routes/algolia.js"));
}

// M7: Vision OCR endpoint (analyze-image)
try {
  app.use('/api/vision', require('./routes/vision.analyze'));
  console.log('? Vision analyze route loaded');
} catch(e){ 
  console.warn('?? Vision analyze route load failed:', e.message); 
}

// M7 public OCR mount (no auth, Google or stub)
try {
  app.use("/api/vision-ocr", require("./routes/vision.ocr.public"));
  console.log("? Mounted /api/vision-ocr -> routes/vision.ocr.public.js");
} catch (e) {
  console.warn("?? Vision OCR public mount failed:", e.message);
}

// === ROUTES M11 PAYMENTS ===
try {
  const paymentsRoutes = require('./payments/routes/payments.routes');
  app.use('/api/payments', paymentsRoutes);
  console.log('? Routes M11 Payments chargées sur /api/payments');
} catch (error) {
  console.log('? Routes M11 Payments non chargées:', error.message);
}

try {
  const webhookRoutes = require('./payments/routes/webhook.routes');
  app.use('/api/webhooks', webhookRoutes);
  console.log('? Routes M11 Webhooks chargées sur /api/webhooks');
} catch (error) {
  console.log('? Routes M11 Webhooks non chargées:', error.message);
}

// === DÉMARRAGE SERVEUR ===
app.listen(PORT, () => {
  console.log(`?? ECOLOJIA backend (M11-Payments) on http://localhost:${PORT}`);
  console.log(`?? Health: http://localhost:${PORT}/api/health`);
  console.log(`?? Payments: http://localhost:${PORT}/api/payments`);
  console.log(`?? Webhooks: http://localhost:${PORT}/api/webhooks`);
});

module.exports = app;const webhookRoutes = require('./payments/routes/webhook.routes');
app.use('/api/webhooks', webhookRoutes);
const paymentsRoutes = require('./payments/routes/payments.routes');
app.use('/api/payments', paymentsRoutes);
