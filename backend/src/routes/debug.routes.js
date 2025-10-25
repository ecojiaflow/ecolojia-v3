const express = require('express');
const router = express.Router();
const fs = require('fs');

router.post('/debug-log', (req, res) => {
  try {
    const logPath = 'C:\\Users\\salim\\Desktop\\ECOLOJIA VF CLEAN\\OAUTH_DEBUG.txt';
    const logData = '\n[FRONTEND] ' + JSON.stringify(req.body, null, 2) + '\n';
    fs.appendFileSync(logPath, logData);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
