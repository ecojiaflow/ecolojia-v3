// backend/src/patches/fix-detergent-display.js
// Patch rapide pour corriger l'affichage de la biodegradabilite et CDV

const fs = require('fs');
const path = require('path');

// Chemin vers le fichier   patcher
const filePath = path.join(__dirname, '../services/analysis/detergentAnalyzer.js');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer la partie problematique
const oldCode = `        details: {
          biodegradability,
          cdv,
          irritants,
          voc,
          phosphates,
          composition
        },`;

const newCode = `        details: {
          biodegradability: biodegradability.percentage + '% en ' + biodegradability.timeframe,
          biodegradabilityData: biodegradability,
          cdv: cdv.value + ' ' + cdv.unit,
          cdvData: cdv,
          irritants,
          voc: voc.percentage + '%',
          vocData: voc,
          phosphates: phosphates.present,
          phosphatesData: phosphates,
          composition
        },`;

// Appliquer le patch
if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content);
  console.log('âœ… Patch applique avec succes !');
} else {
  console.log('âš ï¸  Le code semble dej  etre corrige ou different.');
}

console.log('\nPour appliquer ce patch :');
console.log('1. Sauvegardez ce fichier dans backend/src/patches/');
console.log('2. Executez : node src/patches/fix-detergent-display.js');
console.log('3. Redemarrez le serveur');
