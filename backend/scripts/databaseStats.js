require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const products = await Product.find({ category: 'food' });
  
  const nova = { 1: 0, 2: 0, 3: 0, 4: 0, null: 0 };
  const allergenCounts = {};
  let totalAdditives = 0;
  let highRiskAdditives = 0;
  let veryHighRiskAllergens = 0;
  
  products.forEach(p => {
    nova[p.foodData.novaGroup || 'null']++;
    totalAdditives += p.foodData.additives?.length || 0;
    highRiskAdditives += p.foodData.additives?.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'VERY_HIGH').length || 0;
    veryHighRiskAllergens += p.foodData.allergens?.filter(a => a.riskLevel === 'VERY_HIGH').length || 0;
    
    p.foodData.allergens?.forEach(a => {
      allergenCounts[a.name] = (allergenCounts[a.name] || 0) + 1;
    });
  });
  
  console.log('\n📊 STATISTIQUES DE LA BASE\n');
  console.log(`📦 Total produits: ${products.length}\n`);
  console.log('🔢 Répartition NOVA:');
  console.log(`   NOVA 1 (non transformés): ${nova[1]}`);
  console.log(`   NOVA 2 (ingrédients culinaires): ${nova[2]}`);
  console.log(`   NOVA 3 (transformés): ${nova[3]}`);
  console.log(`   NOVA 4 (ultra-transformés): ${nova[4]}`);
  console.log(`   Sans NOVA: ${nova.null}\n`);
  
  console.log(`🧪 Additifs: ${totalAdditives} total (${highRiskAdditives} à risque élevé)\n`);
  console.log(`⚠️ Allergènes graves (VERY_HIGH): ${veryHighRiskAllergens}\n`);
  
  console.log('🥛 Allergènes les plus fréquents:');
  Object.entries(allergenCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([name, count]) => console.log(`   ${name}: ${count} produits`));
  
  process.exit(0);
});
