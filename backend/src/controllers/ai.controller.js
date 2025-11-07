'use strict';

// Import direct (sans path.resolve) vers le service d'enrichissement IA
const enrichment = require('../services/aiEnrichment.service.BACKUP_20251104_223326');

/**
 * POST /api/ai (/enrich)
 * Body: { barcode?, category?, name?, imageUrl?, imageBase64?, source? }
 */
async function enrichHandler(req, res) {
  try {
    const userId = req.userId || 'anonymous';
    const p = req.body || {};
    const input = {
      barcode: p.barcode || null,
      category: p.category || null,
      name: p.name || null,
      imageUrl: p.imageUrl || null,
      imageBase64: p.imageBase64 || null,
      source: p.source || 'mobile'
    };
    if (!input.barcode) {
  // Fallback barcode pour déclencher le pipeline d'enrichissement même sans vrai code-barres
  input.barcode = 'NOBARCODE_' + Date.now();
}
const result = await enrichment.enrichProductWithAI(input, { userId });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[AI ENRICH] error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'AI enrich failed' });
  }
}

module.exports = { enrichHandler };


