const express = require('express');
const router = express.Router();

// middleware centralisé (vu dans les logs: 'authOptional' exporté par index.js)
const { authOptional } = require('../middleware');
// handler IA universel (créé plus tôt)
const { enrichHandler } = require('../controllers/ai.controller');

// health simple
router.get('/health', (req,res) => res.json({ ok:true, service:'ai' }));

// Enrichissement IA universel (barcode/category/name + OCR)
router.post('/', enrichHandler);
router.post('/enrich', enrichHandler);

module.exports = router;


