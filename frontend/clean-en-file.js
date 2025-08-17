const fs = require('fs');

// Lire le fichier
const filePath = 'src/i18n/locales/en.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Afficher les lignes problématiques pour debug
const lines = content.split('\n');
console.log('Lignes 376-385 avant correction:');
for (let i = 375; i < 385; i++) {
  if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
}

// Remplacer toutes les occurrences problématiques
content = content.replace(/cosmétique/g, 'cosmétique');
content = content.replace(/hygiène/g, 'hygiène');
content = content.replace(/beauté/g, 'beauté');
content = content.replace(/Beauté/g, 'Beauté');
content = content.replace(/beauté/g, 'beauté');
content = content.replace(/Beauté/g, 'Beauté');

// Remplacer tous les caractères corrompus restants
const fixes = {
  'é': 'é',
  'è': 'è',
  'à': 'à',
  'ç': 'ç',
  'â': 'â',
  'î': 'î',
  'ô': 'ô',
  'ù': 'ù',
  'ê': 'ê',
  'É': 'É',
  'À': 'À',
  'Ç': 'Ç'
};

for (const [bad, good] of Object.entries(fixes)) {
  content = content.replace(new RegExp(bad, 'g'), good);
}

// Écrire le fichier corrigé
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Fichier en.ts nettoyé!');

// Afficher les lignes après correction
const newLines = content.split('\n');
console.log('\nLignes 376-385 après correction:');
for (let i = 375; i < 385; i++) {
  if (newLines[i]) console.log(`${i+1}: ${newLines[i]}`);
}
