require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function deepDiagnosis() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const nutella = await Product.findOne({ barcode: '3017620422003' }).lean();
  
  console.log('🔍 DIAGNOSTIC COMPLET NUTELLA\n');
  console.log('='.repeat(80));
  
  // 1. Champs racine
  console.log('\n1️⃣  CHAMPS RACINE :');
  console.log('   - barcode:', nutella.barcode);
  console.log('   - name:', nutella.name);
  console.log('   - category:', nutella.category);
  console.log('   - nova_group:', nutella.nova_group);
  console.log('   - nutriscore_grade:', nutella.nutriscore_grade);
  console.log('   - ecoscore_grade:', nutella.ecoscore_grade);
  
  // 2. foodData
  console.log('\n2️⃣  FOODDATA :');
  if (nutella.foodData) {
    console.log('   ✅ foodData existe');
    console.log('   - novaGroup:', nutella.foodData.novaGroup);
    console.log('   - nutriScore:', nutella.foodData.nutriScore);
    console.log('   - ecoScore:', nutella.foodData.ecoScore);
    console.log('   - additives:', nutella.foodData.additives?.length || 0, 'items');
    console.log('   - labels:', nutella.foodData.labels?.length || 0, 'items');
    console.log('   - nutritionalInfo:', nutella.foodData.nutritionalInfo ? 'existe' : 'null');
  } else {
    console.log('   ❌ foodData est NULL ou UNDEFINED');
  }
  
  // 3. Champs OpenFoodFacts directs
  console.log('\n3️⃣  CHAMPS OPENFOODFACTS DIRECTS :');
  console.log('   - additives_tags:', nutella.additives_tags?.length || 0, 'items');
  console.log('   - labels_tags:', nutella.labels_tags?.length || 0, 'items');
  console.log('   - origins:', nutella.origins);
  console.log('   - packaging:', nutella.packaging);
  console.log('   - ingredients_text:', nutella.ingredients_text?.substring(0, 100) + '...');
  
  // 4. Nutriments
  console.log('\n4️⃣  NUTRIMENTS :');
  if (nutella.nutriments) {
    console.log('   ✅ nutriments existe');
    console.log('   - sugars_100g:', nutella.nutriments.sugars_100g);
    console.log('   - sugars:', nutella.nutriments.sugars);
    console.log('   - saturated-fat_100g:', nutella.nutriments['saturated-fat_100g']);
    console.log('   - saturated_fat:', nutella.nutriments.saturated_fat);
    console.log('   - salt_100g:', nutella.nutriments.salt_100g);
    console.log('   - salt:', nutella.nutriments.salt);
    console.log('   - Tous les champs:', Object.keys(nutella.nutriments).join(', '));
  } else {
    console.log('   ❌ nutriments est NULL ou UNDEFINED');
  }
  
  // 5. nutritionFacts (ancien format?)
  console.log('\n5️⃣  NUTRITIONFACTS (ancien format ?) :');
  if (nutella.nutritionFacts) {
    console.log('   ✅ nutritionFacts existe');
    console.log('   - Champs:', Object.keys(nutella.nutritionFacts).join(', '));
  } else {
    console.log('   ❌ nutritionFacts est NULL');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 CONCLUSION :');
  console.log('   Les données sont stockées dans : ???');
  console.log('   Le middleware cherche dans : foodData + champs racine');
  console.log('   ⚠️  DÉCALAGE = Scores vides\n');
  
  await mongoose.disconnect();
  process.exit(0);
}

deepDiagnosis().catch(console.error);
