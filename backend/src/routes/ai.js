const express = require('express');
const router = express.Router();

// middleware centralisé (vu dans les logs: 'authMiddleware' exporté par index.js)
const { authMiddleware } = require('../middleware');
// handler IA universel (créé plus tôt)
const { enrichHandler } = require('../controllers/ai.controller');

// health simple
router.get('/health', (req,res) => res.json({ ok:true, service:'ai' }));

// Enrichissement IA universel (barcode/category/name + OCR)
router.post('/', authMiddleware, enrichHandler);
router.post('/enrich', authMiddleware, enrichHandler);

module.exports = router;
