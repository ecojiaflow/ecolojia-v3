// backend/auto-fix.js
// Script pour corriger automatiquement les problèmes

const fs = require('fs');
const path = require('path');

console.log('🔧 Auto-correction ECOLOJIA\n');

// 1. Corriger detergentAnalyzer.js
const detergentPath = path.join(__dirname, 'src/services/analysis/detergentAnalyzer.js');
if (fs.existsSync(detergentPath)) {
  console.log('📝 Correction de detergentAnalyzer.js...');
  
  let content = fs.readFileSync(detergentPath, 'utf8');
  
  // Pattern pour trouver la section details
  const pattern = /details:\s*{\s*(biodegradability,[\s\S]*?composition)\s*}/;
  
  const replacement = `details: {
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
        }`;
  
  if (content.match(pattern)) {
    content = content.replace(pattern, replacement);
    fs.writeFileSync(detergentPath, content);
    console.log('✅ detergentAnalyzer.js corrigé');
  } else {
    console.log('⚠️  Pattern non trouvé, vérifiez manuellement');
  }
}

// 2. Vérifier que ai.js retourne le bon format
const aiPath = path.join(__dirname, 'src/routes/ai.js');
if (fs.existsSync(aiPath)) {
  console.log('\n📝 Vérification de ai.js...');
  
  const content = fs.readFileSync(aiPath, 'utf8');
  
  if (content.includes('response,') && content.includes('success: true')) {
    console.log('✅ ai.js semble correct');
  } else {
    console.log('⚠️  Vérifiez que ai.js retourne bien { success: true, response: "..." }');
  }
}

// 3. Corriger test-ecolojia.js
const testPath = path.join(__dirname, 'test-ecolojia.js');
if (fs.existsSync(testPath)) {
  console.log('\n📝 Correction de test-ecolojia.js...');
  
  let content = fs.readFileSync(testPath, 'utf8');
  
  // Corriger le test AI
  content = content.replace(
    "log(`Réponse: ${data.message?.substring(0, 100)}...`, 'info');",
    "const response = data.response || data.message || data.data?.response;\n      log(`Réponse: ${response?.substring(0, 100)}...`, 'info');"
  );
  
  // Corriger l'affichage biodégradabilité
  const oldBiodeg = "log(`Biodégradabilité: ${data.data?.details?.biodegradability || 'N/A'}%`, 'info');";
  const newBiodeg = `// Gérer les différents formats de biodégradabilité
      const biodeg = data.data?.details?.biodegradability;
      const biodegValue = typeof biodeg === 'object' 
        ? (biodeg.percentage ? \`\${biodeg.percentage}%\` : biodeg) 
        : biodeg;
      log(\`Biodégradabilité: \${biodegValue || 'N/A'}\`, 'info');`;
  
  if (content.includes(oldBiodeg)) {
    content = content.replace(oldBiodeg, newBiodeg);
  }
  
  // Corriger l'affichage CDV
  const oldCDV = "log(`CDV: ${data.data?.details?.cdv || 'N/A'} L/g`, 'info');";
  const newCDV = `// Gérer les différents formats de CDV
      const cdv = data.data?.details?.cdv;
      const cdvValue = typeof cdv === 'object'
        ? (cdv.value ? \`\${cdv.value} \${cdv.unit || 'L/g'}\` : cdv)
        : cdv;
      log(\`CDV: \${cdvValue || 'N/A'}\`, 'info');`;
  
  if (content.includes(oldCDV)) {
    content = content.replace(oldCDV, newCDV);
  }
  
  fs.writeFileSync(testPath, content);
  console.log('✅ test-ecolojia.js corrigé');
}

console.log('\n✨ Corrections terminées !');
console.log('\n📌 Prochaines étapes :');
console.log('1. Redémarrez le serveur : npm start');
console.log('2. Relancez les tests : node test-ecolojia.js');
console.log('\nVous devriez maintenant avoir 100% de réussite ! 🎉');