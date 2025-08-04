// Render rebuild: 2025-08-04 23:06:54
// backend/index.js - Point d'entrée minimal
console.log('=== ECOLOJIA Backend Starting ===');
console.log('Node version:', process.version);
console.log('Current directory:', __dirname);

// Pas de require('zod') !
require('./src/server.js');

