import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/i18n/locales/en.ts');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer spécifiquement les caractères problématiques
content = content.replace(/cosmÃ©tique/g, 'cosmétique');
content = content.replace(/hygiÃ¨ne/g, 'hygiène');
content = content.replace(/beautÃƒÂ©/g, 'beauté');
content = content.replace(/BeautÃƒÂ©/g, 'Beauté');

// Remplacer les caractères corrompus individuels
const replacements = [
  ['Ã©', 'é'], ['Ã¨', 'è'], ['Ã ', 'à'], ['Ã§', 'ç'],
  ['Ã¢', 'â'], ['Ã®', 'î'], ['Ã´', 'ô'], ['Ã¹', 'ù'],
  ['Ãª', 'ê'], ['Ã‰', 'É'], ['Ã€', 'À'], ['Ã‡', 'Ç']
];

replacements.forEach(([bad, good]) => {
  content = content.replace(new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), good);
});

// Écrire le fichier
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fichier en.ts corrigé!');
