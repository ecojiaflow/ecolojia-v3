const fs = require('fs');
const lines = fs.readFileSync('aiEnrichment.service.js', 'utf8').split('\n');

console.log('=== BLOC TRY LIGNE 36 ===');
for (let i = 35; i < 150; i++) {
  console.log(i+1 + ':', lines[i]);
  if (i > 35 && (lines[i].includes('} catch') || lines[i].includes('} finally'))) {
    console.log('>>> FIN BLOC TRY');
    break;
  }
}
