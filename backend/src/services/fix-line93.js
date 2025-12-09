const fs = require('fs');
let content = fs.readFileSync('aiEnrichment.service.js', 'utf8');
content = content.replace(/logger\.info`/g, 'logger.info(');
fs.writeFileSync('aiEnrichment.service.js', content, 'utf8');
console.log('✅ Ligne 93 corrigée');
const lines = content.split('\n');
console.log('Ligne 93:', lines[92]);
