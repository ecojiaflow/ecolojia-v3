const mongoose = require('mongoose');
require('dotenv').config();

async function rescoreCosmetic(barcode) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    if (!barcode) {
      console.error('❌ Usage: node scripts/rescore-cosmetic.js <barcode>');
      process.exit(1);
    }
    
    // Chercher par code OU barcode
    const product = await Product.findOne({ 
      $or: [
        { code: barcode },
        { barcode: barcode }
      ]
    });
    
    if (!product) {
      console.error(`❌ Produit ${barcode} non trouvé`);
      process.exit(1);
    }
    
    const displayCode = product.code || product.barcode;
    console.log(`\n📦 PRODUIT TROUVÉ:`);
    console.log(`   Code: ${displayCode}`);
    console.log(`   Nom: ${product.product_name || product.name || 'N/A'}`);
    console.log(`   Catégorie: ${product.category}`);
    console.log(`   Score actuel: ${product.scores?.overallScore || 'N/A'}`);
    
    // Supprimer les scores
    console.log(`\n🗑️  Suppression des scores...`);
    product.scores = undefined;
    await product.save();
    
    console.log(`✅ Scores supprimés !`);
    console.log(`\n👉 Maintenant, testez via API pour forcer recalcul:`);
    console.log(`   GET http://localhost:10000/api/products/${displayCode}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

const barcode = process.argv[2];
rescoreCosmetic(barcode);
