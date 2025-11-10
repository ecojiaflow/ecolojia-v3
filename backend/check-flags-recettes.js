require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./src/models/Recipe');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connecté\n');
    
    // Vérifier isStock
    const withStock = await Recipe.countDocuments({ isStock: true });
    const withoutStock = await Recipe.countDocuments({ isStock: { $ne: true } });
    
    console.log('📊 FLAG isStock :');
    console.log(`   isStock: true  : ${withStock} recettes`);
    console.log(`   isStock: false/null : ${withoutStock} recettes\n`);
    
    // Vérifier isPublic
    const withPublic = await Recipe.countDocuments({ isPublic: true });
    const withoutPublic = await Recipe.countDocuments({ isPublic: { $ne: true } });
    
    console.log('📊 FLAG isPublic :');
    console.log(`   isPublic: true  : ${withPublic} recettes`);
    console.log(`   isPublic: false/null : ${withoutPublic} recettes\n`);
    
    // Vérifier COMBINAISON (ce que RecipeAdapter cherche)
    const available = await Recipe.countDocuments({
      isStock: true,
      isPublic: true,
      'scores.overallScore': { $gte: 75 }
    });
    
    console.log('🎯 RECETTES DISPONIBLES (isStock + isPublic + score ≥ 75) :');
    console.log(`   → ${available} recettes`);
    
    if (available === 0) {
      console.log('\n❌ PROBLÈME : 0 recettes disponibles !');
      console.log('   Les recettes n\'ont pas les bons flags.\n');
    } else {
      console.log('\n✅ Recettes disponibles !\n');
    }
    
    // Vérifier par catégorie
    console.log('📋 DISPONIBLES PAR CATÉGORIE :');
    const byCategory = await Recipe.aggregate([
      {
        $match: {
          isStock: true,
          isPublic: true,
          'scores.overallScore': { $gte: 75 }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    byCategory.forEach(cat => {
      console.log(`   • ${cat._id} : ${cat.count} recettes`);
    });
    
    // Exemples de recettes dessert
    console.log('\n📋 EXEMPLES DESSERT (flags vérifiés) :');
    const desserts = await Recipe.find({
      category: 'dessert',
      isStock: true,
      isPublic: true,
      'scores.overallScore': { $gte: 75 }
    })
      .limit(5)
      .select('name isStock isPublic scores.overallScore');
    
    desserts.forEach(r => {
      console.log(`   • ${r.name} (${r.scores.overallScore}/100) - Stock:${r.isStock} Public:${r.isPublic}`);
    });
    
    // Si 0 disponibles, afficher exemples SANS flags
    if (available === 0) {
      console.log('\n⚠️  EXEMPLES SANS FLAGS (pour debug) :');
      const withoutFlags = await Recipe.find({ category: 'dessert' })
        .limit(5)
        .select('name isStock isPublic scores.overallScore');
      
      withoutFlags.forEach(r => {
        console.log(`   • ${r.name} - Stock:${r.isStock} Public:${r.isPublic}`);
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });