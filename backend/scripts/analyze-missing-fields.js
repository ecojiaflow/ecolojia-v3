// backend/scripts/analyze-missing-fields.js
// Analyse des champs subcategory et tags manquants
// Usage: node scripts/analyze-missing-fields.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function analyzeDatabase() {
  console.log('🔍 [ANALYSE] Connexion MongoDB...');
  
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ [DB] Connecté à:', mongoose.connection.name);
    
    const Product = mongoose.connection.collection('products');
    
    // ========================================
    // STATISTIQUES GLOBALES
    // ========================================
    
    const totalProducts = await Product.countDocuments();
    console.log('\n📊 ========== STATISTIQUES GLOBALES ==========');
    console.log(`Total produits: ${totalProducts.toLocaleString()}`);
    
    // ========================================
    // PAR CATEGORY TYPE
    // ========================================
    
    const byCategory = await Product.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📂 Par categoryType:');
    byCategory.forEach(c => {
      console.log(`   ${c._id || 'null'}: ${c.count.toLocaleString()}`);
    });
    
    // ========================================
    // SUBCATEGORY MANQUANT
    // ========================================
    
    const noSubcategory = await Product.countDocuments({
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: '' },
        { subcategory: 'other' },
        { subcategory: 'Other' },
        { subcategory: 'OTHER' },
        { subcategory: /^other$/i }
      ]
    });
    
    const withSubcategory = totalProducts - noSubcategory;
    
    console.log('\n🏷️ Subcategory:');
    console.log(`   ✅ Avec subcategory valide: ${withSubcategory.toLocaleString()} (${((withSubcategory/totalProducts)*100).toFixed(1)}%)`);
    console.log(`   ❌ Sans subcategory (ou "other"): ${noSubcategory.toLocaleString()} (${((noSubcategory/totalProducts)*100).toFixed(1)}%)`);
    
    // ========================================
    // TAGS MANQUANTS
    // ========================================
    
    const noTags = await Product.countDocuments({
      $or: [
        { tags: { $exists: false } },
        { tags: null },
        { tags: { $size: 0 } }
      ]
    });
    
    const withTags = totalProducts - noTags;
    
    console.log('\n🔖 Tags:');
    console.log(`   ✅ Avec tags: ${withTags.toLocaleString()} (${((withTags/totalProducts)*100).toFixed(1)}%)`);
    console.log(`   ❌ Sans tags: ${noTags.toLocaleString()} (${((noTags/totalProducts)*100).toFixed(1)}%)`);
    
    // ========================================
    // COMBINÉ : SANS SUBCATEGORY ET SANS TAGS
    // ========================================
    
    const needsEnrichment = await Product.countDocuments({
      $and: [
        {
          $or: [
            { subcategory: { $exists: false } },
            { subcategory: null },
            { subcategory: '' },
            { subcategory: /^other$/i }
          ]
        },
        {
          $or: [
            { tags: { $exists: false } },
            { tags: null },
            { tags: { $size: 0 } }
          ]
        }
      ]
    });
    
    console.log('\n⚠️ À enrichir (sans subcategory ET sans tags):');
    console.log(`   ${needsEnrichment.toLocaleString()} produits`);
    
    // ========================================
    // PAR CATEGORY TYPE : DÉTAIL ENRICHISSEMENT
    // ========================================
    
    console.log('\n📋 Détail par categoryType (à enrichir):');
    
    for (const cat of ['food', 'cosmetic', 'detergent']) {
      const countCat = await Product.countDocuments({ categoryType: cat });
      const needsEnrichCat = await Product.countDocuments({
        categoryType: cat,
        $or: [
          { subcategory: { $exists: false } },
          { subcategory: null },
          { subcategory: '' },
          { subcategory: /^other$/i }
        ]
      });
      
      console.log(`   ${cat}: ${needsEnrichCat.toLocaleString()} / ${countCat.toLocaleString()} à enrichir (${((needsEnrichCat/countCat)*100).toFixed(1)}%)`);
    }
    
    // ========================================
    // ÉCHANTILLON DE PRODUITS À ENRICHIR
    // ========================================
    
    console.log('\n📝 Échantillon de 10 produits à enrichir:');
    
    const sample = await Product.find({
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: '' },
        { subcategory: /^other$/i }
      ]
    })
    .project({ barcode: 1, name: 1, brand: 1, categoryType: 1, subcategory: 1, tags: 1 })
    .limit(10)
    .toArray();
    
    sample.forEach((p, i) => {
      console.log(`   ${i+1}. [${p.categoryType}] ${p.name} (${p.brand || 'N/A'})`);
      console.log(`      barcode: ${p.barcode || 'N/A'}, subcategory: "${p.subcategory || ''}", tags: [${(p.tags || []).join(', ')}]`);
    });
    
    // ========================================
    // ESTIMATION TEMPS ET COÛT
    // ========================================
    
    console.log('\n💰 Estimation enrichissement IA:');
    const batchSize = 100;
    const batches = Math.ceil(needsEnrichment / batchSize);
    const tokensPerProduct = 200; // estimation
    const totalTokens = needsEnrichment * tokensPerProduct;
    const costPer1MTokens = 0.14; // DeepSeek
    const estimatedCost = (totalTokens / 1000000) * costPer1MTokens;
    const timePerBatch = 60; // secondes (avec rate limiting)
    const totalTimeSeconds = batches * timePerBatch;
    const totalTimeHours = totalTimeSeconds / 3600;
    
    console.log(`   Produits à enrichir: ${needsEnrichment.toLocaleString()}`);
    console.log(`   Batches de ${batchSize}: ${batches}`);
    console.log(`   Tokens estimés: ${totalTokens.toLocaleString()}`);
    console.log(`   Coût estimé DeepSeek: $${estimatedCost.toFixed(2)}`);
    console.log(`   Temps estimé: ${totalTimeHours.toFixed(1)} heures`);
    
    console.log('\n✅ [ANALYSE] Terminée');
    
  } catch (error) {
    console.error('❌ [ERREUR]', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 [DB] Connexion fermée');
  }
}

analyzeDatabase();
