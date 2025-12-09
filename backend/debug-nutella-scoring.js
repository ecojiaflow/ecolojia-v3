require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const scoringUnified = require('./src/services/scoringUnified');

async function debugNutella() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const nutella = await Product.findOne({ 
    name: { $regex: /Biscuits Nutella B-ready/i } 
  }).lean();
  
  console.log('=== DEBUG NUTELLA ===\n');
  
  // Données passées au scoring
  const scoringData = {
    product_name: nutella.name,
    brands: nutella.brand,
    ingredients_text: nutella.ingredientsText || nutella.ingredients_text,
    nutriments: nutella.nutriments || {},
    nutriscore_grade: nutella.nutriscore_grade,
    nova_group: nutella.nova_group,
    ecoscore_grade: nutella.ecoscore_grade,
    additives: nutella.additives || [],
    labels: nutella.labels || [],
    allergens: nutella.allergens || [],
    origins: nutella.origins || [],
    packaging: nutella.packaging || []
  };
  
  console.log('1. Données envoyées au scoring:');
  console.log(JSON.stringify(scoringData, null, 2));
  
  console.log('\n2. Appel calculateFoodScores...');
  const result = scoringUnified.calculateFoodScores(scoringData);
  
  console.log('\n3. Résultat:');
  console.log('  - overallScore:', result.overallScore);
  console.log('  - healthScore:', result.healthScore);
  console.log('  - environmentScore:', result.environmentScore);
  
  console.log('\n4. Breakdown:');
  console.log(JSON.stringify(result.breakdown, null, 2));
  
  process.exit(0);
}

debugNutella().catch(console.error);
