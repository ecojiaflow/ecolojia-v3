require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function inspectNutella() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const nutella = await Product.findOne({ 
    name: { $regex: /nutella/i } 
  }).lean();
  
  if (!nutella) {
    console.log('❌ Nutella non trouvé');
    process.exit(1);
  }
  
  console.log('=== STRUCTURE NUTELLA ===\n');
  console.log('1. Champs racine:');
  console.log('  - name:', nutella.name);
  console.log('  - brand:', nutella.brand);
  console.log('  - barcode:', nutella.barcode);
  
  console.log('\n2. foodData:', nutella.foodData ? 'EXISTS' : 'NULL');
  if (nutella.foodData) {
    console.log('  - nutriScore:', nutella.foodData.nutriScore);
    console.log('  - novaGroup:', nutella.foodData.novaGroup);
    console.log('  - ecoScore:', nutella.foodData.ecoScore);
    console.log('  - additives:', nutella.foodData.additives);
    console.log('  - ingredients:', nutella.foodData.ingredients?.substring(0, 100));
  }
  
  console.log('\n3. scores:', nutella.scores ? 'EXISTS' : 'NULL');
  if (nutella.scores) {
    console.log('  - overallScore:', nutella.scores.overallScore);
    console.log('  - breakdown:', nutella.scores.breakdown ? 'EXISTS' : 'NULL');
  }
  
  console.log('\n4. Autres champs:');
  console.log('  - ingredients_text:', nutella.ingredients_text?.substring(0, 100));
  console.log('  - nutriments:', nutella.nutriments ? 'EXISTS' : 'NULL');
  
  process.exit(0);
}

inspectNutella().catch(console.error);
