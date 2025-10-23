/**
 * TEST RAPIDE DIAGNOSTIC SPRINT 2
 * VÃ©rifie les imports et classes de base
 */

console.log('Ã°Å¸â€Â === DIAGNOSTIC SPRINT 2 ===');

// Test 1: VÃ©rification fichiers Sprint 1
console.log('\nÃ°Å¸â€œâ€š Test 1: VÃ©rification fichiers existants...');

try {
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'src/scorers/food/novaClassifier.js',
    'src/scorers/food/additivesAnalyzer.js',
    'src/scorers/common/confidenceCalculator.js',
    'src/data/nova-rules.json',
    'src/data/additives-efsa.json'
  ];
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? 'Ã¢Å“â€¦' : 'Ã¢ÂÅ’'} ${file}`);
  });
  
} catch (error) {
  console.log('   Ã¢ÂÅ’ Erreur vÃ©rification fichiers:', error.message);
}

// Test 2: VÃ©rification nouveaux fichiers Sprint 2
console.log('\nÃ°Å¸â€œâ€š Test 2: VÃ©rification nouveaux fichiers Sprint 2...');

try {
  const fs = require('fs');
  
  const newFiles = [
    'src/data/nutri-score-tables.json',
    'src/data/glycemic-index-db.json',
    'src/scorers/food/nutriScorer.js',
    'src/scorers/food/glycemicEstimator.js'
  ];
  
  newFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? 'Ã¢Å“â€¦' : 'Ã¢ÂÅ’'} ${file}`);
  });
  
} catch (error) {
  console.log('   Ã¢ÂÅ’ Erreur vÃ©rification nouveaux fichiers:', error.message);
}

// Test 3: Test imports individuels
console.log('\nÃ°Å¸â€â€” Test 3: Test imports individuels...');

// Test NovaClassifier
try {
  const NovaClassifier = require('./src/scorers/food/novaClassifier');
  console.log(`   Ã¢Å“â€¦ NovaClassifier: ${typeof NovaClassifier === 'function' ? 'Constructor OK' : 'Type: ' + typeof NovaClassifier}`);
} catch (error) {
  console.log(`   Ã¢ÂÅ’ NovaClassifier: ${error.message}`);
}

// Test AdditivesAnalyzer
try {
  const AdditivesAnalyzer = require('./src/scorers/food/additivesAnalyzer');
  console.log(`   Ã¢Å“â€¦ AdditivesAnalyzer: ${typeof AdditivesAnalyzer === 'function' ? 'Constructor OK' : 'Type: ' + typeof AdditivesAnalyzer}`);
} catch (error) {
  console.log(`   Ã¢ÂÅ’ AdditivesAnalyzer: ${error.message}`);
}

// Test NutriScorer (nouveau)
try {
  const NutriScorer = require('./src/scorers/food/nutriScorer');
  console.log(`   Ã¢Å“â€¦ NutriScorer: ${typeof NutriScorer === 'function' ? 'Constructor OK' : 'Type: ' + typeof NutriScorer}`);
} catch (error) {
  console.log(`   Ã¢ÂÅ’ NutriScorer: ${error.message}`);
}

// Test GlycemicEstimator (nouveau)
try {
  const GlycemicEstimator = require('./src/scorers/food/glycemicEstimator');
  console.log(`   Ã¢Å“â€¦ GlycemicEstimator: ${typeof GlycemicEstimator === 'function' ? 'Constructor OK' : 'Type: ' + typeof GlycemicEstimator}`);
} catch (error) {
  console.log(`   Ã¢ÂÅ’ GlycemicEstimator: ${error.message}`);
}

// Test 4: Test donnÃ©es JSON
console.log('\nÃ°Å¸â€œÅ  Test 4: Test chargement donnÃ©es JSON...');

try {
  const nutriTables = require('./src/data/nutri-score-tables.json');
  console.log(`   Ã¢Å“â€¦ nutri-score-tables.json: ${Object.keys(nutriTables).length} sections`);
} catch (error) {
  console.log(`   Ã¢ÂÅ’ nutri-score-tables.json: ${error.message}`);
}

try {
  const glycemicDB = require('./src/data/glycemic-index-db.json');
  console.log(`   Ã¢Å“â€¦ glycemic-index-db.json: ${Object.keys(glycemicDB.categories || {}).length} catÃ©gories`);
} catch (error) {
  console.log(`   Ã¢ÂÅ’ glycemic-index-db.json: ${error.message}`);
}

// Test 5: Test instanciation simple
console.log('\nÃ°Å¸Ââ€”Ã¯Â¸Â Test 5: Test instanciation simple...');

try {
  const NutriScorer = require('./src/scorers/food/nutriScorer');
  const nutriScorer = new NutriScorer();
  console.log('   Ã¢Å“â€¦ NutriScorer instanciÃ© avec succÃ¨s');
} catch (error) {
  console.log(`   Ã¢ÂÅ’ Erreur instanciation NutriScorer: ${error.message}`);
}

try {
  const GlycemicEstimator = require('./src/scorers/food/glycemicEstimator');
  const glycemicEstimator = new GlycemicEstimator();
  console.log('   Ã¢Å“â€¦ GlycemicEstimator instanciÃ© avec succÃ¨s');
} catch (error) {
  console.log(`   Ã¢ÂÅ’ Erreur instanciation GlycemicEstimator: ${error.message}`);
}

console.log('\nÃ°Å¸Å½Â¯ === FIN DIAGNOSTIC ===');
console.log('Ã°Å¸â€œÂ Partage ces rÃ©sultats pour diagnostic prÃ©cis du problÃ¨me !');