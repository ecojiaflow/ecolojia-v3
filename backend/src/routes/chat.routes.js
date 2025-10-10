const express = require('express');
const aiCache = require('../services/aiCache.service');
const { aiCacheMiddleware } = require('../middleware/aiCache.middleware');
const ChatHistory = require('../models/ChatHistory');
const { enrichPromptWithProduct } = require('../services/productPrompt.service');
const crypto = require('crypto');
const { aiLimiter } = require('../middleware/rateLimiter');
const { deepseekChat } = require('../controllers/deepseek.controller');

const router = express.Router();

router.get('/health', (_req, res) => {
  const enabled = process.env.ENABLE_CHAT === '1';
  const provider = process.env.AI_PROVIDER || 'deepseek';
  const apiKeyConfigured = !!process.env.DEEPSEEK_API_KEY;
  
  res.json({ 
    status: enabled ? 'ready' : 'disabled', 
    provider, 
    apiKeyConfigured,
    modelHints: ['deepseek-chat'] 
  });
});

router.post('/deepseek', aiLimiter, aiCacheMiddleware, deepseekChat);


// POST /product-chat - Chat contextuel produit
router.post('/product-chat', aiLimiter, async (req, res) => {
  try {
    const { userId, productId, message } = req.body;
    
    if (!userId || !productId || !message) {
      return res.status(400).json({ error: 'userId, productId et message requis' });
    }
    
    const userHash = crypto.createHash('sha256').update(userId).digest('hex');
    
    // Enrichir prompt avec données produit
    const enriched = await enrichPromptWithProduct(productId);
    if (!enriched) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    // Récupérer ou créer historique
    let chat = await ChatHistory.findOne({ userHash, productId });
    if (!chat) {
      chat = new ChatHistory({ userHash, productId, messages: [] });
    }
    
    // Ajouter message utilisateur
    await chat.addMessage('user', message);
    
    // Appeler DeepSeek avec contexte enrichi
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: enriched.systemPrompt },
          ...chat.messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'Erreur réponse IA';
    
    // Sauvegarder réponse
    await chat.addMessage('assistant', assistantMessage);
    
    res.json({
      success: true,
      message: assistantMessage,
      product: enriched.productData
    });
    
  } catch (error) {
    console.error('Erreur product-chat:', error);
    res.status(500).json({ error: 'Erreur chat produit' });
  }
});


router.get('/cache-stats', (req, res) => {
  res.json({ success: true, stats: aiCache.getStats() });
});

module.exports = router;


