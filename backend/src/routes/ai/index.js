// PATH: backend/src/routes/ai/index.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/ai/chatController');

// ✅ Health‑check public (pas de JWT)
router.get('/test', ctrl.test);

// ✅ Chat IA (protégé par auth + quota dans server.js)
router.post('/chat', ctrl.chat);

module.exports = router;
