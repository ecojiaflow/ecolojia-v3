// backend/src/routes/vision.routes.js – version sans doublon cloudinaryService
//-------------------------------------------------------
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { auth } = require('../middleware/auth');
const { checkQuota } = require('../middleware/quotaMiddleware');
const queueService = require('../services/queue/QueueService');
const visionService = require('../services/vision/VisionService');
const cloudinaryService = require('../services/upload/CloudinaryService'); // unique import

const logger = require('../utils/logger').child('VisionRoutes');

// ──────────────────────────────────────────────────────
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) return cb(new Error('Unsupported image format'));
    cb(null, true);
  },
});

// ──────────────────────────────────────────────────────
router.post('/analyze', auth, checkQuota('scan'), upload.single('image'), async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file && !req.body.imageUrl) return res.status(400).json({ success: false, error: 'Image missing' });

    // Upload or reuse URL
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      const { secure_url } = await cloudinaryService.uploadImage(req.file.buffer, {
        folder: `users/${userId}/vision`,
        resource_type: 'image',
      });
      imageUrl = secure_url;
    }

    // Save analysis doc
    const Analysis = require('../models/Analysis');
    const analysis = await Analysis.create({
      userId,
      method: 'vision',
      timestamp: new Date(),
      visionAnalysis: { status: 'pending', imageUrl },
    });

    // Queue job
    const job = await queueService.addJob('image-analysis', {
      userId,
      imageUrl,
      analysisId: analysis._id.toString(),
    });

    await req.decrementQuota?.();
    res.json({ success: true, data: { analysisId: analysis._id, jobId: job.id } });
  } catch (err) {
    logger.error('Analyze error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────
router.get('/status/:analysisId', auth, async (req, res) => {
  try {
    const { analysisId } = req.params;
    const Analysis = require('../models/Analysis');
    const doc = await Analysis.findOne({ _id: analysisId, userId: req.userId }).select('visionAnalysis');
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });

    const { status, jobId, imageUrl, error } = doc.visionAnalysis;
    if (status === 'processing' && jobId) {
      const job = await queueService.getJob('image-analysis', jobId);
      return res.json({ success: true, status, progress: job?.progress || 0 });
    }
    res.json({ success: status === 'completed', status, imageUrl, error });
  } catch (err) {
    logger.error('Status error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ──────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ success: true, queue: !!queueService.queues['image-analysis'] });
});

module.exports = router;
