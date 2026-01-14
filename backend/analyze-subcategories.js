const mongoose = require('mongoose');
require('dotenv').config();

async function analyzeSubcategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connecté à MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    // Total produits
    const total = await collection.countDocuments();
    console.log(`\n📊 TOTAL PRODUITS: ${total}`);
    
    // Produits AVEC subcategory
    const withSubcat = await collection.countDocuments({ 
      subcategory: { $exists: true, $ne: null, $ne: "" } 
    });
    console.log(`✓ Avec subcategory: ${withSubcat} (${((withSubcat/total)*100).toFixed(1)}%)`);
    
    // Produits SANS subcategory
    const withoutSubcat = await collection.countDocuments({ 
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: "" }
      ]
    });
    console.log(`✗ Sans subcategory: ${withoutSubcat} (${((withoutSubcat/total)*100).toFixed(1)}%)`);
    
    // Produits AVEC tags
    const withTags = await collection.countDocuments({ 
      tags: { $exists: true, $ne: null, $not: { $size: 0 } } 
    });
    console.log(`✓ Avec tags: ${withTags} (${((withTags/total)*100).toFixed(1)}%)`);
    
    // Produits SANS tags
    const withoutTags = await collection.countDocuments({ 
      $or: [
        { tags: { $exists: false } },
        { tags: null },
        { tags: { $size: 0 } }
      ]
    });
    console.log(`✗ Sans tags: ${withoutTags} (${((withoutTags/total)*100).toFixed(1)}%)`);
    
    // Top 10 subcategories
    console.log('\n📋 TOP 10 SUBCATEGORIES:');
    const topSubcats = await collection.aggregate([
      { $match: { subcategory: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$subcategory", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    topSubcats.forEach((s, i) => {
      console.log(`  ${i+1}. ${s._id}: ${s.count} produits`);
    });
    
    // Exemples de produits SANS subcategory
    console.log('\n🔍 EXEMPLES PRODUITS SANS SUBCATEGORY:');
    const examples = await collection.find({ 
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: "" }
      ]
    }).limit(5).toArray();
    examples.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.product_name || p.name || 'Sans nom'} (${p.barcode})`);
      console.log(`     category: ${p.category || 'N/A'}`);
      console.log(`     subcategory: ${p.subcategory || 'VIDE'}`);
    });
    
    // Vérifier champs foodData
    console.log('\n📦 ANALYSE FOODDATA:');
    const withFoodData = await collection.countDocuments({ 
      "foodData.subcategory": { $exists: true, $ne: null, $ne: "" } 
    });
    console.log(`  Avec foodData.subcategory: ${withFoodData}`);
    
    const withCategories = await collection.countDocuments({ 
      "foodData.categories": { $exists: true, $ne: null, $ne: "" } 
    });
    console.log(`  Avec foodData.categories: ${withCategories}`);
    
    await mongoose.disconnect();
    console.log('\n✓ Déconnecté de MongoDB');
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

analyzeSubcategories();
