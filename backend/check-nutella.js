// backend/check-nutella.js
const mongoose = require('mongoose');
require('dotenv').config();

async function checkNutella() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const db = mongoose.connection.db;
  const collection = db.collection('products');
  
  // Chercher par différents codes-barres Nutella possibles
  const barcodes = ['3017620425035', '3017620422003', '3017620421006'];
  
  console.log('🔍 Recherche du Nutella...\n');
  
  for (const barcode of barcodes) {
    const product = await collection.findOne({ barcode });
    if (product) {
      console.log(`✅ Trouvé avec code ${barcode}:`);
      console.log('Nom:', product.name);
      console.log('NOVA:', product.nova_group);
      console.log('Nutri-Score:', product.nutriscore_grade);
      console.log('Structure complète:');
      console.log(JSON.stringify(product, null, 2));
      break;
    }
  }
  
  // Chercher par nom
  const byName = await collection.findOne({ name: /nutella/i });
  if (byName) {
    console.log('\n✅ Trouvé par nom:');
    console.log('Barcode:', byName.barcode);
    console.log('NOVA:', byName.nova_group);
  }
  
  // Compter les produits avec NOVA
  const withNova = await collection.countDocuments({ nova_group: { $exists: true, $ne: null } });
  console.log(`\n📊 Produits avec NOVA: ${withNova}`);
  
  process.exit(0);
}

checkNutella();