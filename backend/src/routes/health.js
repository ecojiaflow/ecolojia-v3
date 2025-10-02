const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
  const uptime = process.uptime();
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(uptime),
    mongodb: mongoStatus,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
