const path = require('path');
const enrichment = require(path.resolve(__dirname, '..', 'services', 'ai', ''));
/**
 * Handler enrichissement IA universel
 * Accepte: { barcode?, category?, name?, imageUrl?, imageBase64?, source? }
 * Retourne: { product, score, alternatives, steps, ocr?, cached? }
 */
async function enrichHandler(req, res) {
  try {
    const userId = req.userId || 'anonymous';
    const payload = req.body || {};

    // Normalisation minimale
    const input = {
      barcode: payload.barcode || null,
      category: payload.category || null,
      name: payload.name || null,
      imageUrl: payload.imageUrl || null,
      imageBase64: payload.imageBase64 || null,
      source: payload.source || 'mobile'
    };

    // Appel service principal (détecte catégorie et pipeline si absent)
    const result = await enrichment.enrichProductWithAI(input, { userId });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[AI ENRICH] error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'AI enrich failed' });
  }
}

module.exports = { enrichHandler };
