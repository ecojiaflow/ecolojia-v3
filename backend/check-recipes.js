require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./src/models/Recipe');

console.log('🔍 Connexion MongoDB...');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connecté');
    
    const count = await Recipe.countDocuments();
    console.log(`\n📊 Nombre total de recettes : ${count}`);
    
    if (count > 0) {
      const recettes = await Recipe.find().limit(5).select('name category isStock');
      console.log('\n📋 Exemples de recettes :');
      recettes.forEach(r => {
        console.log(`   • ${r.name} (${r.category}${r.isStock ? ', STOCK' : ''})`);
      });
    } else {
      console.log('\n❌ AUCUNE RECETTE EN BASE !');
      console.log('→ Il faut importer les 15 recettes scientifiques');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur MongoDB:', err.message);
    process.exit(1);
  });