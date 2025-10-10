const express = require('express');
const multer = require('multer');
const { analyze } = require('../services/visionRuntime');

const { aiLimiter } = require('../middleware/rateLimiter');
const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// POST /api/vision/analyze (upload fichier)
router.post('/analyze', upload.single('image'), aiLimiter, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image requise' 
      });
    }
    
    const result = await analyze(req.file.buffer);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/vision/health
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'vision-ocr',
    mode: 'stub-fallback'
  });
});

module.exports = router;

