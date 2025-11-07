const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const Product = require('./src/models/Product');
const scoringEngine = require('./src/services/scoringEngine');

async function fetchCosmetics(page = 1) {
  const url = `https://world.openbeautyfacts.org/cgi/search.pl`;
  const response = await axios.get(url, {
    params: { action: 'process', json: 1, page, page_size: 50, 
      fields: 'code,product_name,brands,ingredients_text,image_url' },
    timeout: 30000
  });
  return (response.data?.products || []).filter(p => p.code && p.product_name);
}

async function importBatch(products) {
  let imported = 0;
  for (const p of products) {
    try {
      const exists = await Product.findOne({ barcode: p.code });
      if (exists) continue;

      const inci = (p.ingredients_text || '').split(',').slice(0, 20);
      const scores = scoringEngine.calculateCosmeticScores({
        ingredients: inci, allergens: [], endocrineDisruptors: [],
        certifications: [], biodegradability: 50, packaging: 'plastic'
      });

      await Product.create({
        barcode: p.code, name: p.product_name, brand: p.brands || '',
        category: 'cosmetics', image_url: p.image_url,
        cosmeticsData: {
          ingredients: inci.map(i => ({ inci: i.trim(), function: 'Unknown' })),
          allergens: [], endocrineDisruptors: [], certifications: []
        },
        scores: { ...scores, calculatedAt: new Date() },
        source: 'openbeautyfacts', lastSync: new Date()
      });
      imported++;
      process.stdout.write('.');
    } catch (e) {}
  }
  return imported;
}

async function run() {
  console.log('\n🔄 Connexion MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté\n');
  console.log('🧴 IMPORT 1000 COSMÉTIQUES...\n');

  let total = 0;
  for (let page = 1; page <= 20 && total < 1000; page++) {
    console.log(`Page ${page}...`);
    const products = await fetchCosmetics(page);
    const imported = await importBatch(products);
    total += imported;
    console.log(` ✅ ${imported} importés (total: ${total})`);
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n✅ TERMINÉ : ${total} produits importés\n`);
  
  const stats = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, 
      avgScore: { $avg: '$scores.overallScore' } } }
  ]);
  
  console.log('📊 BASE :');
  stats.forEach(s => console.log(`   ${s._id}: ${s.count} produits (score: ${Math.round(s.avgScore)}/100)`));
  
  process.exit(0);
}

run().catch(err => { console.error('❌', err); process.exit(1); });
