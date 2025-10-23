// PATH: backend/src/routes/vision.routes.js
const express = require('express');
const router = express.Router();

const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Flags
const ENABLE_VISION = process.env.ENABLE_VISION === '1';

// Middleware auth (no-op si indisponible)
let authenticateToken = null;
try {
  // PrÃ©fÃ©rence: index exporte authenticateToken
  const mw = require('../middleware');
  authenticateToken = typeof mw.authenticateToken === 'function' ? mw.authenticateToken : null;
} catch (_) {
  try {
    // Fallback: certains projets lâ€™exportent via ../middleware/auth
    const mw2 = require('../middleware/auth');
    authenticateToken = typeof mw2.authenticateToken === 'function' ? mw2.authenticateToken : null;
  } catch (_) {}
}
const authMw = authenticateToken || ((req, res, next) => next());

// Vision service (peut Ãªtre partiel en dev)
let visionService = null;
try {
  visionService = require('../services/vision/VisionService');
} catch (_) {
  visionService = null;
}

// Multer (uniquement si Vision activÃ©e & upload nÃ©cessaire)
let upload = null;
if (ENABLE_VISION) {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads/vision');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp/;
      const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
      ok ? cb(null, true) : cb(new Error('Formats acceptÃ©s: JPEG/PNG/WebP'));
    },
  });
}

// ========== ROUTES ==========

// Health: toujours disponible
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    enabled: ENABLE_VISION,
    hasHandler: !!(visionService && typeof visionService.analyzeImage === 'function'),
    timestamp: new Date().toISOString(),
  });
});

// Si Vision OFF OU handler manquant -> stubs sÃ»rs (pas de crash)
const analyzeImageHandlerOk = visionService && typeof visionService.analyzeImage === 'function';
const extractOk = visionService && typeof visionService.extractStructuredData === 'function';

if (!ENABLE_VISION || !analyzeImageHandlerOk) {
  console.warn('âš ï¸ Vision dÃ©sactivÃ©e ou handler indisponible â€” montage des stubs /api/vision/*');

  router.post('/analyze-image', authMw, (req, res) => {
    return res.status(503).json({
      success: false,
      message:
        'Service OCR indisponible. Activez ENABLE_VISION=1 et fournissez VisionService.analyzeImage() pour lâ€™utiliser.',
    });
  });

  router.post('/extract-test', (req, res) => {
    return res.status(503).json({
      success: false,
      message: 'Extraction indisponible en dev sans OCR.',
    });
  });

  router.get('/status/:jobId', (req, res) => {
    return res.status(404).json({ success: false, message: 'Aucun job en cours en mode stub.' });
  });
} else {
  // Version complÃ¨te uniquement quand Vision est prÃªte
  const jobs = new Map();

  router.post('/analyze-image', authMw, upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image requise dans le champ "image".' });
    }
    const jobId = uuidv4();
    const imagePath = req.file.path;
    jobs.set(jobId, { status: 'processing', startTime: Date.now() });

    try {
      // Lancer lâ€™analyse async
      visionService
        .analyzeImage(imagePath, { jobId, language: req.body.language || 'fr' })
        .then(() => {
          // Le service doit lui-mÃªme mettre Ã  jour le job (ou on peut le faire ici si on reÃ§oit un rÃ©sultat)
          // Ici on ne force pas pour respecter ton implÃ©mentation existante.
          setTimeout(async () => {
            try { await fs.unlink(imagePath); } catch (_) {}
          }, 30 * 60 * 1000);
        })
        .catch((err) => {
          jobs.set(jobId, { status: 'failed', error: err?.message || 'Erreur OCR' });
        });

      // Petit dÃ©lai pour rÃ©ponse immÃ©diate si rapide
      await new Promise((r) => setTimeout(r, 1500));
      const j = jobs.get(jobId);
      if (j && j.status === 'completed') return res.json(j);

      return res.json({ success: true, jobId, status: 'processing' });
    } catch (err) {
      try { await fs.unlink(req.file.path); } catch (_) {}
      return res.status(500).json({ success: false, message: 'Erreur analyse image', error: err?.message });
    }
  });

  router.get('/status/:jobId', (req, res) => {
    const j = jobs.get(req.params.jobId);
    if (!j) return res.status(404).json({ success: false, message: 'Job non trouvÃ©' });
    return res.json(j);
  });

  router.post('/extract-test', (req, res) => {
    if (!extractOk) {
      return res.status(503).json({ success: false, message: 'extractStructuredData indisponible.' });
    }
    try {
      const { text } = req.body || {};
      if (!text) return res.status(400).json({ success: false, message: 'Texte requis' });
      const extractedData = visionService.extractStructuredData({ text });
      return res.json({ success: true, extractedData });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Erreur extraction', error: e?.message });
    }
  });
}

module.exports = router;
