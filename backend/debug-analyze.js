// backend/debug-analyze.js
const mongoose = require('mongoose');
require('dotenv').config();

async function debugAnalyze() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('./src/models/Product');
  
  // 1. Chercher le Nutella
  console.log('1. Recherche du Nutella...');
  const nutella = await Product.findOne({ barcode: '3017620425035' });
  
  if (!nutella) {
    console.log('❌ Nutella non trouvé');
    process.exit(1);
  }
  
  console.log('✅ Nutella trouvé\n');
  
  // 2. Afficher la structure complète
  console.log('2. Structure complète:');
  console.log(JSON.stringify(nutella.toObject(), null, 2));
  
  // 3. Vérifier les propriétés spécifiques
  console.log('\n3. Propriétés importantes:');
  console.log('nova_group:', nutella.nova_group);
  console.log('nutriscore_grade:', nutella.nutriscore_grade);
  console.log('foodData:', nutella.foodData);
  console.log('foodData.nova:', nutella.foodData?.nova);
  console.log('foodData.nutriscore:', nutella.foodData?.nutriscore);
  
  // 4. Tester ce que retourne le modèle
  console.log('\n4. Test avec lean():');
  const nutellaLean = await Product.findOne({ barcode: '3017620425035' }).lean();
  console.log('nova_group (lean):', nutellaLean.nova_group);
  console.log('nutriscore_grade (lean):', nutellaLean.nutriscore_grade);
  
  process.exit(0);
}

debugAnalyze().catch(console.error);