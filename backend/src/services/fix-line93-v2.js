const fs = require('fs');
let content = fs.readFileSync('aiEnrichment.service.js', 'utf8');
const lines = content.split('\n');

// Ligne 93 (index 92) - Correction spécifique
if (lines[92].includes('logger.info`')) {
  lines[92] = lines[92].replace('logger.info`', 'logger.info(');
  console.log('✅ Ligne 93 corrigée');
} else {
  console.log('⚠️ Pattern non trouvé à ligne 93');
}

fs.writeFileSync('aiEnrichment.service.js', lines.join('\n'), 'utf8');
console.log('Nouvelle ligne 93:', lines[92]);
