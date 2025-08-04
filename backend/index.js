// Point d'entrée Render - Force Node.js
if (typeof Bun !== 'undefined') {
  console.error('ERROR: Bun detected! Use Node.js instead.');
  process.exit(1);
}

console.log('Starting with Node.js', process.version);
require('./src/server.js');
