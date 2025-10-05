const express = require('express');
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

router.post('/deepseek', deepseekChat);

module.exports = router;
