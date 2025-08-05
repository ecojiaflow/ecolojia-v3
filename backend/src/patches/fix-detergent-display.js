// backend/src/patches/fix-detergent-display.js
// Patch rapide pour corriger l'affichage de la biodégradabilité et CDV

const fs = require('fs');
const path = require('path');

// Chemin vers le fichier à patcher
const filePath = path.join(__dirname, '../services/analysis/detergentAnalyzer.js');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer la partie problématique
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
  console.log('✅ Patch appliqué avec succès !');
} else {
  console.log('⚠️  Le code semble déjà être corrigé ou différent.');
}

console.log('\nPour appliquer ce patch :');
console.log('1. Sauvegardez ce fichier dans backend/src/patches/');
console.log('2. Exécutez : node src/patches/fix-detergent-display.js');
console.log('3. Redémarrez le serveur');
