require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./src/models/Recipe');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connecté\n');
    
    // Grouper par catégorie
    const categories = await Recipe.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📊 CATÉGORIES DISPONIBLES :\n');
    categories.forEach(cat => {
      console.log(`   • ${cat._id} : ${cat.count} recettes`);
    });
    
    console.log('\n📋 EXEMPLES PAR CATÉGORIE :\n');
    
    for (const cat of categories.slice(0, 5)) {
      const examples = await Recipe.find({ category: cat._id })
        .limit(3)
        .select('name category');
      
      console.log(`   ${cat._id} (${cat.count}) :`);
      examples.forEach(r => console.log(`      • ${r.name}`));
      console.log('');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });