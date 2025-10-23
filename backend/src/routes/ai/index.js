// PATH: backend/src/routes/ai/index.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/ai/chatController');

// Ã¢Å“â€¦ HealthÃ¢â‚¬â€˜check public (pas de JWT)
router.get('/test', ctrl.test);

// Ã¢Å“â€¦ Chat IA (protege par auth + quota dans server.js)
router.post('/chat', ctrl.chat);

module.exports = router;
