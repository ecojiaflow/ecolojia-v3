require('dotenv').config();

// CHEMIN CORRIGÉ depuis scripts/
const scoringUnified = require('../src/services/scoringUnified');

console.log('\n🧪 TEST SCORING UNIFIÉ\n');

// Test avec données Nutella
const nutellaData = {
  novaGroup: 4,
  nutriScore: 'e',
  ecoScore: 'e',
  additives: ['E322', 'E476'],
  labels: [],
  packaging: '',
  origin: '',
  ingredients: 'sucre, huile de palme',
  nutriments: {
    sugars_100g: 56.3,
    'saturated-fat_100g': 10.6,
    salt_100g: 0.107
  }
};

console.log('📊 DONNÉES TEST (Nutella) :');
console.log('   NOVA: 4 (ultra-transformé)');
console.log('   Nutri-Score: E (très mauvais)');
console.log('   Éco-Score: E (très mauvais)');
console.log('   Sucres: 56.3g/100g');
console.log('   Graisses saturées: 10.6g/100g');
console.log('   Sel: 0.107g/100g');
console.log('   Additifs: E322, E476');

console.log('\n🔄 Calcul scores...\n');

const result = scoringUnified.calculateFoodScores(nutellaData);

console.log('✅ RÉSULTAT :');
console.log('   Score global :', result.overallScore, '/100');
console.log('   Score santé :', result.healthScore, '/100');
console.log('   Score environnement :', result.environmentScore, '/100');
console.log('   Confiance :', Math.round(result.confidence * 100), '%');

console.log('\n📊 BREAKDOWN (8 composantes) :');
console.log('   1. NOVA :', result.breakdown.nova.score);
console.log('   2. Nutri-Score :', result.breakdown.nutriScore.score);
console.log('   3. Additifs :', result.breakdown.additives.score);
console.log('   4. Sucres :', result.breakdown.sugars.score);
console.log('   5. Graisses :', result.breakdown.saturatedFat.score);
console.log('   6. Sel :', result.breakdown.salt.score);
console.log('   7. Éco-Score :', result.breakdown.ecoScore.score);
console.log('   8. Labels :', result.breakdown.labels.score);

const filledCount = Object.values(result.breakdown).filter(b => b.score !== undefined && b.score !== null).length;

console.log('\n🎯 Composantes remplies :', filledCount, '/ 8');

if (filledCount === 8) {
  console.log('\n✅✅✅ SCORING UNIFIÉ FONCTIONNE PARFAITEMENT ! ✅✅✅\n');
} else {
  console.log('\n❌ Problème : seulement', filledCount, 'sur 8\n');
}
