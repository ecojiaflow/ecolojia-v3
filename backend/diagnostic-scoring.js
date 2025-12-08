const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./src/models/Product');

async function diagnosticScoring() {
  try {
    console.log('\n🔍 CONNEXION MONGODB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Comptage général
    console.log('📊 STATISTIQUES GÉNÉRALES');
    console.log('═══════════════════════════════════════');
    
    const totalProducts = await Product.countDocuments();
    console.log(`Total produits : ${totalProducts.toLocaleString()}`);
    
    // 2. Produits avec score
    const withScore = await Product.countDocuments({
      'scores.overallScore': { $exists: true, $ne: null, $gte: 0 }
    });
    console.log(`Avec score     : ${withScore.toLocaleString()} (${((withScore/totalProducts)*100).toFixed(1)}%)`);
    
    // 3. Produits sans score
    const withoutScore = totalProducts - withScore;
    console.log(`Sans score     : ${withoutScore.toLocaleString()} (${((withoutScore/totalProducts)*100).toFixed(1)}%)`);
    
    // 4. Analyse par catégorie
    console.log('\n📦 RÉPARTITION PAR CATÉGORIE');
    console.log('═══════════════════════════════════════');
    
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$categoryType',
          total: { $sum: 1 },
          withScore: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ['$scores.overallScore', null] },
                  { $gte: ['$scores.overallScore', 0] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    categories.forEach(cat => {
      const percentage = ((cat.withScore / cat.total) * 100).toFixed(1);
      console.log(`${cat._id || 'non défini'.padEnd(15)} : ${cat.total.toString().padStart(6)} produits (${cat.withScore.toString().padStart(6)} scorés - ${percentage}%)`);
    });
    
    // 5. Exemples de produits sans score
    console.log('\n🔍 EXEMPLES PRODUITS SANS SCORE');
    console.log('═══════════════════════════════════════');
    
    const examples = await Product.find({
      $or: [
        { 'scores.overallScore': { $exists: false } },
        { 'scores.overallScore': null }
      ]
    })
    .limit(3)
    .lean();
    
    examples.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name || 'Nom inconnu'}`);
      console.log(`   ID: ${product._id}`);
      console.log(`   Catégorie: ${product.categoryType || 'non défini'}`);
      console.log(`   Marque: ${product.brand || 'non défini'}`);
      console.log(`   Score actuel: ${product.scores?.overallScore || 'AUCUN'}`);
      console.log(`   NutriScore: ${product.nutriscore_grade || 'non défini'}`);
      console.log(`   NOVA: ${product.nova_group || 'non défini'}`);
      console.log(`   EcoScore: ${product.ecoscore_grade || 'non défini'}`);
    });
    
    // 6. Analyse des champs critiques
    console.log('\n📋 CHAMPS CRITIQUES DISPONIBLES');
    console.log('═══════════════════════════════════════');
    
    const fieldStats = await Product.aggregate([
      {
        $project: {
          hasNutriScore: { $ne: ['$nutriscore_grade', null] },
          hasNova: { $ne: ['$nova_group', null] },
          hasEcoScore: { $ne: ['$ecoscore_grade', null] },
          hasSubcategory: { $ne: ['$subcategory', null] },
          hasTags: { $gt: [{ $size: { $ifNull: ['$tags', []] } }, 0] },
          hasIngredients: { $ne: ['$ingredients_text', null] }
        }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          withNutriScore: { $sum: { $cond: ['$hasNutriScore', 1, 0] } },
          withNova: { $sum: { $cond: ['$hasNova', 1, 0] } },
          withEcoScore: { $sum: { $cond: ['$hasEcoScore', 1, 0] } },
          withSubcategory: { $sum: { $cond: ['$hasSubcategory', 1, 0] } },
          withTags: { $sum: { $cond: ['$hasTags', 1, 0] } },
          withIngredients: { $sum: { $cond: ['$hasIngredients', 1, 0] } }
        }
      }
    ]);
    
    if (fieldStats.length > 0) {
      const stats = fieldStats[0];
      const total = stats.totalProducts;
      
      console.log(`NutriScore    : ${stats.withNutriScore.toLocaleString().padStart(6)} / ${total.toLocaleString()} (${((stats.withNutriScore/total)*100).toFixed(1)}%)`);
      console.log(`NOVA          : ${stats.withNova.toLocaleString().padStart(6)} / ${total.toLocaleString()} (${((stats.withNova/total)*100).toFixed(1)}%)`);
      console.log(`EcoScore      : ${stats.withEcoScore.toLocaleString().padStart(6)} / ${total.toLocaleString()} (${((stats.withEcoScore/total)*100).toFixed(1)}%)`);
      console.log(`Subcategory   : ${stats.withSubcategory.toLocaleString().padStart(6)} / ${total.toLocaleString()} (${((stats.withSubcategory/total)*100).toFixed(1)}%)`);
      console.log(`Tags          : ${stats.withTags.toLocaleString().padStart(6)} / ${total.toLocaleString()} (${((stats.withTags/total)*100).toFixed(1)}%)`);
      console.log(`Ingredients   : ${stats.withIngredients.toLocaleString().padStart(6)} / ${total.toLocaleString()} (${((stats.withIngredients/total)*100).toFixed(1)}%)`);
    }
    
    console.log('\n✅ DIAGNOSTIC TERMINÉ\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB\n');
  }
}

diagnosticScoring();
