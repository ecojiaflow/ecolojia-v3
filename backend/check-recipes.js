require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./src/models/Recipe');

console.log('🔐 MongoDB URI présent:', process.env.MONGODB_URI ? 'OUI' : 'NON');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connecté');
    
    const count = await Recipe.countDocuments();
    console.log(`📊 Nombre de recettes en base : ${count}`);
    
    if (count > 0) {
      const sample = await Recipe.findOne({ isStock: true });
      if (sample) {
        console.log(`\n📄 Exemple de recette :`);
        console.log(`  • Nom : ${sample.name}`);
        console.log(`  • Catégorie : ${sample.category}`);
        console.log(`  • Score : ${sample.scores?.overallScore || 'N/A'}/100`);
      }
    } else {
      console.log('\n⚠️  Aucune recette en base !');
      console.log('Il faudra importer le stock avant de tester.');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur MongoDB:', err.message);
    process.exit(1);
  });
