// PATH: backend\src\routes\vision.routes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const visionService = require('../services/vision/VisionService');
const { authenticateToken } = require('../middleware');

const router = express.Router();

// Configuration Multer pour l'upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/vision');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les formats JPEG, PNG et WebP sont acceptes'));
    }
  }
});

// Jobs en memoire (en prod: utiliser Redis ou BullMQ)
const visionJobs = new Map();

/**
 * POST /api/vision/analyze-image
 * Analyse une image avec OCR
 */
router.post('/analyze-image', 
  authenticateToken, // Optionnel en dev
  upload.single('image'), 
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Image requise',
        details: 'Veuillez envoyer une image dans le champ "image"'
      });
    }

    const jobId = uuidv4();
    const imagePath = req.file.path;

    try {
      // Demarrer l'analyse en async
      visionJobs.set(jobId, { 
        status: 'processing', 
        startTime: Date.now() 
      });

      // Lancer l'analyse (non bloquant)
      visionService.analyzeImage(imagePath, {
        jobId,
        language: req.body.language || 'fr'
      }).then(async (result) => {
        // Mettre   jour le job
        visionJobs.set(jobId, result);
        
        // Nettoyer l'image apres 5 minutes
        setTimeout(async () => {
          try {
            await fs.unlink(imagePath);
            visionJobs.delete(jobId); // Nettoyer le job apres 30 min
          } catch (error) {
            console.error('Erreur suppression image:', error);
          }
        }, 30 * 60 * 1000);
      }).catch(error => {
        visionJobs.set(jobId, {
          status: 'failed',
          error: error.message
        });
      });

      // Si l'analyse est tres rapide (< 2s), renvoyer directement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const job = visionJobs.get(jobId);
      if (job && job.status === 'completed') {
        return res.json(job);
      }

      // Sinon, renvoyer l'ID du job
      res.json({ 
        jobId,
        status: 'processing',
        message: 'Analyse en cours, utilisez /status/:jobId pour verifier'
      });

    } catch (error) {
      // Nettoyer en cas d'erreur
      await fs.unlink(imagePath).catch(() => {});
      
      res.status(500).json({ 
        error: 'Erreur analyse image',
        details: error.message 
      });
    }
});

/**
 * GET /api/vision/status/:jobId
 * Verifier le statut d'une analyse
 */
router.get('/status/:jobId', async (req, res) => {
  const { jobId } = req.params;
  
  const job = visionJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ 
      error: 'Job non trouve',
      jobId 
    });
  }

  res.json(job);
});

/**
 * POST /api/vision/extract-test
 * Route de test pour l'extraction (dev only)
 */
router.post('/extract-test', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Texte requis' });
  }

  try {
    const extractedData = visionService.extractStructuredData({ text });
    res.json({ extractedData });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur extraction',
      details: error.message 
    });
  }
});

/**
 * GET /api/vision/health
 * Verifier l'etat du service
 */
router.get('/health', async (req, res) => {
  try {
    const hasGoogleVision = !!visionService.googleVisionClient;
    const hasTesseract = true; // Toujours disponible
    
    res.json({
      status: 'healthy',
      services: {
        googleVision: hasGoogleVision,
        tesseract: hasTesseract
      },
      activeJobs: visionJobs.size
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;