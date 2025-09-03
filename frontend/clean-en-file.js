const fs = require('fs');

// Lire le fichier
const filePath = 'src/i18n/locales/en.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Afficher les lignes problÃ©matiques pour debug
const lines = content.split('\n');
console.log('Lignes 376-385 avant correction:');
for (let i = 375; i < 385; i++) {
  if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
}

// Remplacer toutes les occurrences problÃ©matiques
content = content.replace(/cosmÃ©tique/g, 'cosmÃ©tique');
content = content.replace(/hygiÃ¨ne/g, 'hygiÃ¨ne');
content = content.replace(/beaut?/g, 'beaut?');
content = content.replace(/beaut?/g, 'beaut?');
content = content.replace(/beaut?/g, 'beaut?');
content = content.replace(/beaut?/g, 'beaut?');

// Remplacer tous les caractÃ¨res corrompus restants
const fixes = {
  'Ã©': 'Ã©',
  'Ã¨': 'Ã¨',
  'Ã ': 'Ã ',
  'Ã§': 'Ã§',
  'Ã¢': 'Ã¢',
  'Ã®': 'Ã®',
  'Ã´': 'Ã´',
  'Ã¹': 'Ã¹',
  'Ãª': 'Ãª',
  'Ã‰': 'Ã‰',
  'Ã€': 'Ã€',
  'Ã‡': 'Ã‡'
};

for (const [bad, good] of Object.entries(fixes)) {
  content = content.replace(new RegExp(bad, 'g'), good);
}

// Ã‰crire le fichier corrigÃ©
fs.writeFileSync(filePath, content, 'utf8');
console.log('\nâœ… Fichier en.ts nettoyÃ©!');

// Afficher les lignes aprÃ¨s correction
const newLines = content.split('\n');
console.log('\nLignes 376-385 aprÃ¨s correction:');
for (let i = 375; i < 385; i++) {
  if (newLines[i]) console.log(`${i+1}: ${newLines[i]}`);
}
