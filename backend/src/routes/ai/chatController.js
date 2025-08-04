// PATH: backend/src/controllers/ai/chatController.js
const deepSeekService = require('../../services/ai/deepSeekService');
const novaClassifier  = require('../../services/analysis/novaClassifier');

/**
 * GET /api/v1/ai/test
 */
exports.test = (_req, res) =>
  res.json({ success: true, message: 'AI routes are working!' });

/**
 * POST /api/v1/ai/chat
 * Body: { message: string, sessionId?: string, product?: { name, ingredients } }
 */
exports.chat = async (req, res) => {
  try {
    const { message, sessionId = 'default', product = null } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }

    // Contexte produit (optionnel)
    const context = {};
    if (product && product.ingredients) {
      context.product = {
        ...product,
        analysis: { nova: novaClassifier.classify(product.ingredients, product.name) }
      };
    }

    // Appel DeepSeek
    const systemPrompt =
      'Tu es ECOLOJIA, assistant scientifique expert en nutrition, cosmétique et détergence. ' +
      (context.product ? `Produit concerné : ${context.product.name}. ` : '') +
      'Réponds clairement en français.';

    const reply = await deepSeekService.analyze(message, systemPrompt);

    res.json({ reply, sessionId, context });
  } catch (err) {
    console.error('[ChatController] error:', err.message);
    res.status(500).json({ error: 'chat_failed' });
  }
};
