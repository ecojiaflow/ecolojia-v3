const fs = require('fs');
let content = fs.readFileSync('aiEnrichment.service.js', 'utf8');
const lines = content.split('\n');

console.log('Ligne 93 brute:', JSON.stringify(lines[92]));
console.log('Caractères après logger.info:');
for (let i = 0; i < lines[92].length; i++) {
  if (lines[92].substring(i, i+11) === 'logger.info') {
    console.log('Position', i+11, ':', lines[92].charCodeAt(i+11), 'char:', lines[92][i+11]);
    break;
  }
}
