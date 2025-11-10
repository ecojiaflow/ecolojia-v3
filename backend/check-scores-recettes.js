require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./src/models/Recipe');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connecté\n');
    
    // Statistiques scores
    const stats = await Recipe.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgScore: { $avg: '$scores.overallScore' },
          minScore: { $min: '$scores.overallScore' },
          maxScore: { $max: '$scores.overallScore' }
        }
      }
    ]);
    
    console.log('📊 STATISTIQUES SCORES :');
    console.log(`   Total : ${stats[0].total} recettes`);
    console.log(`   Score moyen : ${Math.round(stats[0].avgScore)}/100`);
    console.log(`   Score min : ${stats[0].minScore}/100`);
    console.log(`   Score max : ${stats[0].maxScore}/100\n`);
    
    // Répartition par tranche
    const ranges = await Recipe.aggregate([
      {
        $bucket: {
          groupBy: '$scores.overallScore',
          boundaries: [0, 50, 60, 70, 75, 80, 90, 100],
          default: 'null',
          output: { count: { $sum: 1 } }
        }
      }
    ]);
    
    console.log('📈 RÉPARTITION PAR TRANCHE :');
    const labels = {
      0: '0-50   (Mauvais)',
      50: '50-60  (Moyen)',
      60: '60-70  (Correct)',
      70: '70-75  (Bon)',
      75: '75-80  (Très bon) ← SEUIL ACTUEL',
      80: '80-90  (Excellent)',
      90: '90-100 (Parfait)'
    };
    
    ranges.forEach(r => {
      console.log(`   ${labels[r._id]} : ${r.count} recettes`);
    });
    
    // Combien de recettes disponibles avec seuil 75 ?
    const above75 = await Recipe.countDocuments({
      'scores.overallScore': { $gte: 75 },
      isStock: true,
      isPublic: true
    });
    
    const above65 = await Recipe.countDocuments({
      'scores.overallScore': { $gte: 65 },
      isStock: true,
      isPublic: true
    });
    
    console.log(`\n🎯 RECETTES DISPONIBLES :`);
    console.log(`   Score ≥ 75 : ${above75} recettes`);
    console.log(`   Score ≥ 65 : ${above65} recettes`);
    
    if (above75 < 10) {
      console.log(`\n⚠️  PROBLÈME : Seulement ${above75} recettes ≥ 75/100 !`);
      console.log('   → SOLUTION : Baisser le seuil à 65 ou corriger les scores');
    }
    
    // Exemples de recettes par catégorie avec score
    console.log(`\n📋 EXEMPLES (DESSERT) :`);
    const desserts = await Recipe.find({ 
      category: 'dessert',
      isStock: true 
    })
      .limit(5)
      .select('name scores.overallScore')
      .sort({ 'scores.overallScore': -1 });
    
    desserts.forEach(r => {
      console.log(`   • ${r.name} : ${r.scores.overallScore}/100`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });