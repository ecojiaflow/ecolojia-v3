console.log('=== DEBUG SERVER START ===');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Vérifier les imports
try {
  console.log('Loading dotenv...');
  require('dotenv').config();
  
  console.log('Loading express...');
  const express = require('express');
  
  console.log('Loading utils...');
  const { logger } = require('./utils/logger');
  
  console.log('All imports successful!');
} catch (error) {
  console.error('Import error:', error);
  process.exit(1);
}

// Démarrer serveur minimal
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'ECOLOJIA Backend Running' });
});

app.listen(PORT, () => {
  console.log(Server running on port );
});
