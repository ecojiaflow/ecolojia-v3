const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { version } = require('../../package.json');

router.get('/', (req, res) => {
  res.json({
    version,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    features: {
      scanner: true,
      mongodb: true,
      algolia: !process.env.MOCK_ALGOLIA,
      vision: !process.env.MOCK_VISION,
      deepseek: !!process.env.DEEPSEEK_API_KEY
    }
  });
});

module.exports = router;
