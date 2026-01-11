require('dotenv').config();
const mongoose = require('mongoose');

async function analyzeOtherProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB');
  
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  
  // Compter les produits "other"
  const otherCount = await Product.countDocuments({ subcategory: 'other' });
  const totalCount = await Product.countDocuments({});
  
  console.log(`\n📊 STATISTIQUES BASE:`);
  console.log(`   Total produits: ${totalCount}`);
  console.log(`   Produits "other": ${otherCount}`);
  console.log(`   Pourcentage: ${((otherCount/totalCount)*100).toFixed(1)}%`);
  
  // Échantillon de 10 produits "other"
  const sample = await Product.find({ subcategory: 'other' })
    .select('name brand ingredients_text')
    .limit(10)
    .lean();
  
  console.log(`\n📋 ÉCHANTILLON (10 produits "other"):`);
  sample.forEach((p, i) => {
    console.log(`   ${i+1}. ${p.name} (${p.brand || 'N/A'})`);
  });
  
  await mongoose.disconnect();
  console.log('\n✅ Analyse terminée');
}

analyzeOtherProducts().catch(console.error);
