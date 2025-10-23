const scoringUnified = require('./src/services/scoringUnified');

const testData = {
  novaGroup: 4,
  nutriScore: 'E',
  ecoScore: 'E',
  additives: ['E322', 'E476'],
  labels: [],
  packaging: 'Plastic',
  origin: 'France',
  ingredients: 'Sucre, huile de palme...',
  nutriments: {
    sugars_100g: 56.3,
    'saturated-fat_100g': 10.6,
    salt_100g: 0.107
  }
};

console.log('🧪 TEST DIRECT scoringUnified.calculateFoodScores()\n');
console.log('INPUT :');
console.log(JSON.stringify(testData, null, 2));

const result = scoringUnified.calculateFoodScores(testData);

console.log('\n📊 OUTPUT :');
console.log('overallScore:', result.overallScore);
console.log('confidence:', result.confidence);
console.log('\nBREAKDOWN :');
Object.keys(result.breakdown).forEach(key => {
  const item = result.breakdown[key];
  console.log('  -', key, ':', item.score !== undefined ? item.score : 'UNDEFINED');
});
