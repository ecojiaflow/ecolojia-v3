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
    console.log('âŒ Nutella non trouvÃ©');
    process.exit(1);
  }
  
  console.log('âœ… Nutella trouvÃ©\n');
  
  // 2. Afficher la structure complÃ¨te
  console.log('2. Structure complÃ¨te:');
  console.log(JSON.stringify(nutella.toObject(), null, 2));
  
  // 3. VÃ©rifier les propriÃ©tÃ©s spÃ©cifiques
  console.log('\n3. PropriÃ©tÃ©s importantes:');
  console.log('nova_group:', nutella.nova_group);
  console.log('nutriscore_grade:', nutella.nutriscore_grade);
  console.log('foodData:', nutella.foodData);
  console.log('foodData.nova:', nutella.foodData?.nova);
  console.log('foodData.nutriscore:', nutella.foodData?.nutriscore);
  
  // 4. Tester ce que retourne le modÃ¨le
  console.log('\n4. Test avec lean():');
  const nutellaLean = await Product.findOne({ barcode: '3017620425035' }).lean();
  console.log('nova_group (lean):', nutellaLean.nova_group);
  console.log('nutriscore_grade (lean):', nutellaLean.nutriscore_grade);
  
  process.exit(0);
}

debugAnalyze().catch(console.error);