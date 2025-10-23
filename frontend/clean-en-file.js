const fs = require('fs');

// Lire le fichier
const filePath = 'src/i18n/locales/en.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Afficher les lignes problÃƒÂ©matiques pour debug
const lines = content.split('\n');
console.log('Lignes 376-385 avant correction:');
for (let i = 375; i < 385; i++) {
  if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
}

// Remplacer toutes les occurrences problÃƒÂ©matiques
content = content.replace(/cosmÃƒÂ©tique/g, 'cosmÃƒÂ©tique');
content = content.replace(/hygiÃƒÂ¨ne/g, 'hygiÃƒÂ¨ne');
content = content.replace(/beaut?/g, 'beaut?');
content = content.replace(/beaut?/g, 'beaut?');
content = content.replace(/beaut?/g, 'beaut?');
content = content.replace(/beaut?/g, 'beaut?');

// Remplacer tous les caractÃƒÂ¨res corrompus restants
const fixes = {
  'ÃƒÂ©': 'ÃƒÂ©',
  'ÃƒÂ¨': 'ÃƒÂ¨',
  'ÃƒÂ ': 'ÃƒÂ ',
  'ÃƒÂ§': 'ÃƒÂ§',
  'ÃƒÂ¢': 'ÃƒÂ¢',
  'ÃƒÂ®': 'ÃƒÂ®',
  'ÃƒÂ´': 'ÃƒÂ´',
  'ÃƒÂ¹': 'ÃƒÂ¹',
  'ÃƒÂª': 'ÃƒÂª',
  'Ãƒâ€°': 'Ãƒâ€°',
  'Ãƒâ‚¬': 'Ãƒâ‚¬',
  'Ãƒâ€¡': 'Ãƒâ€¡'
};

for (const [bad, good] of Object.entries(fixes)) {
  content = content.replace(new RegExp(bad, 'g'), good);
}

// Ãƒâ€°crire le fichier corrigÃƒÂ©
fs.writeFileSync(filePath, content, 'utf8');
console.log('\nÃ¢Å“â€¦ Fichier en.ts nettoyÃƒÂ©!');

// Afficher les lignes aprÃƒÂ¨s correction
const newLines = content.split('\n');
console.log('\nLignes 376-385 aprÃƒÂ¨s correction:');
for (let i = 375; i < 385; i++) {
  if (newLines[i]) console.log(`${i+1}: ${newLines[i]}`);
}
