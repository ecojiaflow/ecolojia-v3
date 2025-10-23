// backend/tests/scoring.test.js
// Tests unitaires scoring V3

const { calculateFoodScores } = require('../src/services/scoringEngine');

// Produits de référence
const TEST_PRODUCTS = {
  siropAgave: {
    name: 'Sirop agave bio',
    novaGroup: 4,
    labels: ['bio', 'ab-agriculture-biologique'],
    nutrition: { 
      per100g: { 
        sugars: 76, 
        salt: 0, 
        saturatedFat: 0, 
        energy: 310,
        fiber: 0,
        protein: 0
      } 
    },
    additives: [],
    ingredients_text: 'sirop agave bio',
    expectedScore: { min: 35, max: 50 }
  },
  
  nutella: {
    name: 'Nutella',
    novaGroup: 4,
    labels: [],
    nutrition: { 
      per100g: { 
        sugars: 56.3, 
        salt: 0.107, 
        saturatedFat: 10.6, 
        energy: 539,
        fiber: 0,
        protein: 6.3
      } 
    },
    additives: ['E322', 'E476'],
    ingredients_text: 'sucre, huile de palme, noisettes',
    expectedScore: { min: 20, max: 35 }
  },
  
  carotteBio: {
    name: 'Carotte bio',
    novaGroup: 1,
    labels: ['bio', 'ab-agriculture-biologique'],
    nutrition: { 
      per100g: { 
        sugars: 4.7, 
        salt: 0.069, 
        saturatedFat: 0.2, 
        energy: 41,
        fiber: 2.8,
        protein: 0.9
      } 
    },
    additives: [],
    ingredients_text: 'carotte',
    expectedScore: { min: 85, max: 100 }
  },
  
  eauMinerale: {
    name: 'Eau minérale',
    novaGroup: 1,
    labels: [],
    nutrition: { 
      per100g: { 
        sugars: 0, 
        salt: 0, 
        saturatedFat: 0, 
        energy: 0,
        fiber: 0,
        protein: 0
      } 
    },
    additives: [],
    ingredients_text: 'eau',
    expectedScore: { min: 80, max: 95 }
  }
};

function runTests() {
  console.log('\n🧪 Tests Scoring V3\n');
  console.log('═'.repeat(60));
  
  let passed = 0;
  let failed = 0;
  let details = [];

  Object.entries(TEST_PRODUCTS).forEach(([key, product]) => {
    const result = calculateFoodScores(product);
    const score = result.overallScore;
    const expected = product.expectedScore;
    
    const isValid = score >= expected.min && score <= expected.max;
    
    const status = isValid ? '✅' : '❌';
    const color = isValid ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${color}${status} ${product.name}${reset}`);
    console.log(`   Score: ${score}/100 (attendu: ${expected.min}-${expected.max})`);
    
    // Détails breakdown
    console.log(`   Santé: ${result.healthScore}/100`);
    console.log(`   Nutrition: ${result.nutritionScore}/100`);
    console.log(`   Environnement: ${result.environmentScore}/100`);
    console.log(`   Éthique: ${result.ethicsScore}/100`);
    console.log('');
    
    if (isValid) {
      passed++;
    } else {
      failed++;
      details.push({
        name: product.name,
        score,
        expected: `${expected.min}-${expected.max}`,
        breakdown: result.breakdown
      });
    }
  });

  console.log('═'.repeat(60));
  console.log(`\n📊 Résultats: ${passed} réussis, ${failed} échoués\n`);
  
  if (failed > 0) {
    console.log('⚠️ Tests échoués - Détails:\n');
    details.forEach(d => {
      console.log(`${d.name}: ${d.score}/100 (attendu ${d.expected})`);
      console.log(JSON.stringify(d.breakdown, null, 2));
    });
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
