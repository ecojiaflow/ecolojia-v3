// PATH: backend/src/routes/ai/index.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/ai/chatController');

// âœ… Healthâ€‘check public (pas de JWT)
router.get('/test', ctrl.test);

// âœ… Chat IA (protege par auth + quota dans server.js)
router.post('/chat', ctrl.chat);

module.exports = router;
