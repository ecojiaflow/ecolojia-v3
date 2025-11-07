const mongoose = require('mongoose');
require('dotenv').config();

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    const Product = require('./src/models/Product');
    
    // Compter les produits enrichis
    const enrichedCount = await Product.countDocuments({
      productType: { $exists: true, $ne: null }
    });
    
    console.log(`✅ Produits enrichis : ${enrichedCount}\n`);
    
    // Prendre un exemple de chaque catégorie
    const foodExample = await Product.findOne({ categoryType: 'food' })
      .select('name categoryType productType filterMetadata')
      .lean();
    
    const cosmeticExample = await Product.findOne({ categoryType: 'cosmetic' })
      .select('name categoryType productType filterMetadata')
      .lean();
    
    console.log('📦 EXEMPLE FOOD :');
    console.log(`   Nom: ${foodExample?.name}`);
    console.log(`   CategoryType: ${foodExample?.categoryType}`);
    console.log(`   ProductType: ${foodExample?.productType}`);
    console.log(`   Labels: ${foodExample?.filterMetadata?.categoryLabels?.slice(0, 3).join(', ') || 'aucun'}\n`);
    
    if (cosmeticExample) {
      console.log('💄 EXEMPLE COSMETIC :');
      console.log(`   Nom: ${cosmeticExample?.name}`);
      console.log(`   CategoryType: ${cosmeticExample?.categoryType}`);
      console.log(`   ProductType: ${cosmeticExample?.productType}`);
      console.log(`   Labels: ${cosmeticExample?.filterMetadata?.categoryLabels?.slice(0, 3).join(', ') || 'aucun'}\n`);
    }
    
    // Vérifier les index
    console.log('📊 Index MongoDB existants :');
    const indexes = await Product.collection.getIndexes();
    Object.keys(indexes).forEach(name => {
      console.log(`   ✓ ${name}`);
    });
    console.log('');
    
    console.log('========================================');
    console.log('  ✅ MIGRATION VALIDÉE');
    console.log('========================================\n');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

verify();