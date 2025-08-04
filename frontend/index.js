// Simple health check server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ecolojia-backend' });
});

// Démarrer le serveur principal
try {
  require('./src/server.js');
} catch (error) {
  console.error('Error starting main server:', error);
  
  // Fallback server
  app.listen(PORT, () => {
    console.log(`Fallback server running on port ${PORT}`);
  });
}
