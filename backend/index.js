// Render rebuild: 2025-08-04 23:42:25
// backend/index.js - Point d'entrÃ©e minimal
console.log('=== ECOLOJIA Backend Starting ===');
console.log('Node version:', process.version);
console.log('Current directory:', __dirname);

// Pas de require('zod') !
require('./src/server.js');


