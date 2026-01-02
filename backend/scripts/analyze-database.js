// analyze-database.js
const mongoose = require('mongoose');
require('dotenv').config();

async function analyzeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const products = db.collection('products');
    
    // Total produits
    const total = await products.countDocuments();
    console.log(`\n📊 TOTAL PRODUITS: ${total}`);
    
    // Avec subcategory
    const withSubcategory = await products.countDocuments({ 
      subcategory: { $exists: true, $ne: null, $ne: '' } 
    });
    console.log(`✅ Avec subcategory: ${withSubcategory} (${(withSubcategory/total*100).toFixed(1)}%)`);
    
    // Avec tags non vides
    const withTags = await products.countDocuments({ 
      tags: { $exists: true, $not: { $size: 0 } } 
    });
    console.log(`✅ Avec tags: ${withTags} (${(withTags/total*100).toFixed(1)}%)`);
    
    // Avec constitution
    const withConstitution = await products.countDocuments({ 
      'constitution.cards': { $exists: true } 
    });
    console.log(`✅ Avec constitution: ${withConstitution} (${(withConstitution/total*100).toFixed(1)}%)`);
    
    // Avec healthReflex
    const withHealthReflex = await products.countDocuments({ 
      'constitution.healthReflex.level': { $exists: true } 
    });
    console.log(`✅ Avec healthReflex: ${withHealthReflex} (${(withHealthReflex/total*100).toFixed(1)}%)`);
    
    // Distribution des levels
    console.log('\n📈 DISTRIBUTION DES LEVELS:');
    const levels = await products.aggregate([
      { $match: { 'constitution.healthReflex.level': { $exists: true } } },
      { $group: { _id: '$constitution.healthReflex.level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    levels.forEach(l => console.log(`  Level ${l._id}: ${l.count}`));
    
    // Produits SANS subcategory
    const withoutSubcategory = total - withSubcategory;
    console.log(`\n⚠️ SANS subcategory: ${withoutSubcategory} (${(withoutSubcategory/total*100).toFixed(1)}%)`);
    
    // Produits SANS tags
    const withoutTags = total - withTags;
    console.log(`⚠️ SANS tags: ${withoutTags} (${(withoutTags/total*100).toFixed(1)}%)`);
    
    await mongoose.disconnect();
    console.log('\n✅ Analyse terminée');
    
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

analyzeDatabase();
