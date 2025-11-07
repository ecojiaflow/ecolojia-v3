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
  console.log(`   Batch de ${products.length} produits`);
  
  for (const p of products) {
    try {
      // Debug: voir le produit
      if (imported === 0) {
        console.log(`   Test premier produit: ${p.code} - ${p.product_name}`);
      }
      
      // Vérifier s'il existe
      const exists = await Product.findOne({ barcode: p.code });
      if (exists) {
        if (imported === 0) console.log(`   → Existe déjà, skip`);
        continue;
      }
      
      if (imported === 0) console.log(`   → N'existe pas, import...`);

      // Parser ingrédients
      const inci = (p.ingredients_text || '').split(',').slice(0, 20).map(i => i.trim()).filter(i => i);
      
      if (imported === 0) console.log(`   → ${inci.length} ingrédients détectés`);
      
      // Calculer score
      let scores;
      try {
        scores = scoringEngine.calculateCosmeticScores({
          ingredients: inci,
          allergens: [],
          endocrineDisruptors: [],
          certifications: [],
          biodegradability: 50,
          packaging: 'plastic',
          origin: 'unknown',
          crueltyFree: false
        });
        
        if (imported === 0) console.log(`   → Score calculé: ${scores.overallScore}/100`);
        
      } catch (scoreError) {
        console.log(`   ❌ Erreur scoring:`, scoreError.message);
        scores = {
          overallScore: 50,
          healthScore: 50,
          environmentScore: 50,
          confidence: 0.3,
          dataCompleteness: 'Faible'
        };
      }

      // Créer le produit
      const newProduct = await Product.create({
        barcode: p.code,
        name: p.product_name,
        brand: p.brands || '',
        category: 'cosmetics',
        image_url: p.image_url,
        cosmeticsData: {
          ingredients: inci.map(i => ({ 
            inci: i, 
            function: 'Unknown',
            origin: 'unknown',
            concerns: [],
            isEndocrineDisruptor: false
          })),
          allergens: [],
          endocrineDisruptors: [],
          certifications: []
        },
        scores: {
          overallScore: scores.overallScore || 50,
          healthScore: scores.healthScore || 50,
          environmentScore: scores.environmentScore || 50,
          confidence: scores.confidence || 0.5,
          dataCompleteness: scores.dataCompleteness || 'Partielle',
          breakdown: scores.breakdown || {},
          calculatedAt: new Date()
        },
        source: 'openbeautyfacts',
        lastSync: new Date()
      });
      
      if (imported === 0) console.log(`   → ✅ Créé avec _id: ${newProduct._id}`);
      
      imported++;
      process.stdout.write('.');
      
    } catch (error) {
      if (imported === 0) {
        console.log(`   ❌ ERREUR CRÉATION:`, error.message);
      }
    }
  }
  return imported;
}

async function run() {
  console.log('\n🔄 Connexion MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté\n');
  console.log('🧴 IMPORT 1000 COSMÉTIQUES (mode debug)...\n');

  let total = 0;
  for (let page = 1; page <= 20 && total < 1000; page++) {
    console.log(`\nPage ${page}:`);
    const products = await fetchCosmetics(page);
    const imported = await importBatch(products);
    total += imported;
    console.log(` ✅ ${imported} importés (total: ${total})`);
    
    if (imported === 0 && page === 1) {
      console.log('\n❌ Aucun import page 1, arrêt pour debug');
      break;
    }
    
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
