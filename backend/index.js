// backend/index.js - Point d'entrée minimal
console.log('=== ECOLOJIA Backend Starting ===');
console.log('Node version:', process.version);
console.log('Current directory:', __dirname);

// Pas de require('zod') !
require('./src/server.js');
