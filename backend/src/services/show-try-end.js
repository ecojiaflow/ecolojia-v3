const fs = require('fs');
const lines = fs.readFileSync('aiEnrichment.service.js', 'utf8').split('\n');

console.log('=== SUITE BLOC TRY (lignes 150-250) ===');
for (let i = 149; i < 250; i++) {
  if (!lines[i]) break;
  console.log(i+1 + ':', lines[i]);
  if (lines[i].includes('} catch') || lines[i].includes('} finally')) {
    console.log('>>> FIN BLOC TRY TROUVÉE');
    break;
  }
}
