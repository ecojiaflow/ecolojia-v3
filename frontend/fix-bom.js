// PATH: frontend/fix-bom.js
import fs from 'fs';
import path from 'path';

let count = 0;

function removeBom(filePath) {
  const data = fs.readFileSync(filePath);
  if (data[0] === 0xEF && data[1] === 0xBB && data[2] === 0xBF) {
    const cleanData = data.slice(3);
    fs.writeFileSync(filePath, cleanData);
    console.log(`✅ BOM supprimé : ${filePath}`);
    count++;
  }
}

function scanDir(directory) {
  for (const file of fs.readdirSync(directory)) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !fullPath.includes('node_modules')) {
      scanDir(fullPath);
    } else if (stat.isFile()) {
      removeBom(fullPath);
    }
  }
}

console.log('🔍 Suppression des BOM...');
scanDir(process.cwd());
console.log(`✨ Nettoyage BOM terminé ! (${count} fichiers corrigés)`);
