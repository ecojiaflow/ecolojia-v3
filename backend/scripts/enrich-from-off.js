require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const axios = require('axios');

async function enrichFromOFF() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté\n');
  
  // 1. Récupérer depuis OFF API
  console.log('📡 Requête OpenFoodFacts API...');
  const response = await axios.get('https://world.openfoodfacts.org/api/v2/product/3017620422003.json', {
    headers: { 'User-Agent': 'ECOLOJIA/3.0.0' }
  });
  
  const offData = response.data.product;
  console.log('✅ Données OFF récupérées\n');
  
  // 2. Extraire nutriments
  console.log('📊 NUTRIMENTS OFF :');
  console.log('   - sugars_100g:', offData.nutriments?.sugars_100g);
  console.log('   - saturated-fat_100g:', offData.nutriments?.['saturated-fat_100g']);
  console.log('   - salt_100g:', offData.nutriments?.salt_100g);
  console.log('   - energy_100g:', offData.nutriments?.['energy-kcal_100g']);
  console.log('   - fat_100g:', offData.nutriments?.fat_100g);
  console.log('   - proteins_100g:', offData.nutriments?.proteins_100g);
  
  // 3. Mettre à jour MongoDB
  console.log('\n🔄 Mise à jour MongoDB...');
  const nutella = await Product.findOne({ barcode: '3017620422003' });
  
  // Enrichir foodData.nutritionalInfo
  nutella.foodData.nutritionalInfo = {
    energy: offData.nutriments?.['energy-kcal_100g'] || 0,
    fat: offData.nutriments?.fat_100g || 0,
    saturatedFat: offData.nutriments?.['saturated-fat_100g'] || 0,
    carbohydrates: offData.nutriments?.carbohydrates_100g || 0,
    sugars: offData.nutriments?.sugars_100g || 0,
    fiber: offData.nutriments?.fiber_100g || 0,
    protein: offData.nutriments?.proteins_100g || 0,
    salt: offData.nutriments?.salt_100g || 0
  };
  
  // Créer aussi nutriments racine (pour compatibilité)
  nutella.nutriments = {
    'energy-kcal_100g': offData.nutriments?.['energy-kcal_100g'],
    'fat_100g': offData.nutriments?.fat_100g,
    'saturated-fat_100g': offData.nutriments?.['saturated-fat_100g'],
    'carbohydrates_100g': offData.nutriments?.carbohydrates_100g,
    'sugars_100g': offData.nutriments?.sugars_100g,
    'fiber_100g': offData.nutriments?.fiber_100g,
    'proteins_100g': offData.nutriments?.proteins_100g,
    'salt_100g': offData.nutriments?.salt_100g
  };
  
  // Enrichir champs racine
  nutella.nova_group = offData.nova_group || nutella.foodData.novaGroup;
  nutella.nutriscore_grade = offData.nutriscore_grade || nutella.foodData.nutriScore?.toLowerCase();
  nutella.ecoscore_grade = offData.ecoscore_grade || nutella.foodData.ecoScore?.toLowerCase();
  nutella.additives_tags = offData.additives_tags || [];
  nutella.labels_tags = offData.labels_tags || [];
  nutella.origins = offData.origins || '';
  nutella.ingredients_text = offData.ingredients_text || '';
  
  // Forcer recalcul scores
  nutella.scores = undefined;
  
  await nutella.save();
  
  console.log('✅ MongoDB mis à jour\n');
  
  // 4. Vérifier
  const updated = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('📊 VÉRIFICATION :');
  console.log('   - nutriments existe ?', updated.nutriments ? 'OUI' : 'NON');
  console.log('   - nutritionalInfo existe ?', updated.foodData.nutritionalInfo ? 'OUI' : 'NON');
  console.log('   - sugars_100g:', updated.nutriments?.sugars_100g);
  console.log('   - scores calculés ?', updated.scores?.overallScore || 'NON');
  
  console.log('\n📊 BREAKDOWN :');
  if (updated.scores?.breakdown) {
    Object.keys(updated.scores.breakdown).forEach(key => {
      const item = updated.scores.breakdown[key];
      console.log('   -', key, ':', item.score !== undefined ? item.score + '/100' : 'vide');
    });
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

enrichFromOFF().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
