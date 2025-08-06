// backend/src/routes/vision.routes.js
// Routes Vision avec imports corrigés

const express = require('express');
const router = express.Router();
const multer = require('multer');
const ProductOCRService = require('../services/vision/ProductOCRService');

// Import unifié depuis middleware/index.js
const { 
  authenticateToken, 
  checkQuotaAfterUpload 
} = require('../middleware');

// Configuration multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Utilisez JPEG, PNG ou WebP.'));
    }
  }
});

// Route d'analyse d'image
// IMPORTANT: L'ordre des middlewares est crucial
// 1. Auth -> 2. Multer -> 3. Quota
router.post('/analyze-image',
  authenticateToken,
  upload.single('image'),
  checkQuotaAfterUpload('scan'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Aucune image fournie'
        });
      }

      console.log('Analyse image pour user:', req.user.userId);
      console.log('Quota info:', req.quotaInfo);

      const ocrService = new ProductOCRService();
      const result = await ocrService.analyzeProductImage(req.file.buffer, {
        userId: req.user.userId,
        language: req.body.language || 'fra',
        enhanceImage: req.body.enhanceImage !== 'false'
      });

      // Décrémenter le quota après succès
      if (req.decrementQuota) {
        await req.decrementQuota();
      }

      res.json({
        success: true,
        jobId: result.jobId,
        status: result.status,
        result: result.result,
        quotaInfo: req.quotaInfo || req.quota,
        message: 'Analyse lancée avec succès'
      });

    } catch (error) {
      console.error('Vision route error:', error);
      res.status(500).json({ 
        error: 'Erreur lors de l\'analyse',
        message: error.message
      });
    }
  }
);

// Route de statut du job
router.get('/status/:jobId', 
  authenticateToken, 
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const ocrService = new ProductOCRService();
      const status = await ocrService.getJobStatus(jobId);

      if (!status) {
        return res.status(404).json({ error: 'Job non trouvé' });
      }

      // Vérifier que le job appartient à l'utilisateur
      if (status.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      res.json(status);
    } catch (error) {
      console.error('Status route error:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération du statut' 
      });
    }
  }
);

// Route de test (dev only)
if (process.env.NODE_ENV === 'development') {
  router.get('/test', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'Vision routes operational',
      endpoints: [
        'POST /api/vision/analyze-image',
        'GET /api/vision/status/:jobId'
      ]
    });
  });
}

// Error handler pour multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'Fichier trop volumineux (max 10MB)' 
      });
    }
  }
  return res.status(500).json({ 
    error: error.message 
  });
});

module.exports = router;
