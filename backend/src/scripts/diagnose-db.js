require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function diagnose() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('\n🔍 DIAGNOSTIC COMPLET BASE ECOLOJIA\n');
  console.log('='.repeat(60));

  const totalFood = await Product.countDocuments({ categoryType: 'food' });
  const totalCosmetic = await Product.countDocuments({ categoryType: 'cosmetic' });
  const totalDetergent = await Product.countDocuments({ categoryType: 'detergent' });
  
  console.log('\n📦 VOLUME TOTAL');
  console.log('  Food: ' + totalFood);
  console.log('  Cosmetiques: ' + totalCosmetic);
  console.log('  Detergents: ' + totalDetergent);

  console.log('\n🍎 DONNEES FOOD - CRITIQUES');
  
  const withNova = await Product.countDocuments({ 
    categoryType: 'food', 
    nova_group: { $gte: 1, $lte: 4 }
  });
  
  const withNutriScore = await Product.countDocuments({ 
    categoryType: 'food', 
    nutriscore_grade: { $in: ['a','b','c','d','e','A','B','C','D','E'] }
  });

  const withIngredients = await Product.countDocuments({ 
    categoryType: 'food', 
    ingredients_text: { $exists: true, $ne: null, $ne: '' }
  });

  const withNutriments = await Product.countDocuments({ 
    categoryType: 'food',
    'nutriments.sugars_100g': { $exists: true }
  });

  const withAdditives = await Product.countDocuments({ 
    categoryType: 'food',
    additives_tags: { $exists: true, $not: { $size: 0 } }
  });

  const withImage = await Product.countDocuments({ 
    categoryType: 'food',
    image_url: { $exists: true, $ne: null, $ne: '' }
  });

  console.log('  NOVA reel:        ' + withNova + ' / ' + totalFood + ' (' + (withNova/totalFood*100).toFixed(1) + '%)');
  console.log('  Nutri-Score reel: ' + withNutriScore + ' / ' + totalFood + ' (' + (withNutriScore/totalFood*100).toFixed(1) + '%)');
  console.log('  Ingredients:      ' + withIngredients + ' / ' + totalFood + ' (' + (withIngredients/totalFood*100).toFixed(1) + '%)');
  console.log('  Nutriments:       ' + withNutriments + ' / ' + totalFood + ' (' + (withNutriments/totalFood*100).toFixed(1) + '%)');
  console.log('  Additifs:         ' + withAdditives + ' / ' + totalFood + ' (' + (withAdditives/totalFood*100).toFixed(1) + '%)');
  console.log('  Images:           ' + withImage + ' / ' + totalFood + ' (' + (withImage/totalFood*100).toFixed(1) + '%)');

  // Produits calculables
  const nutrientsNoNova = await Product.countDocuments({
    categoryType: 'food',
    'nutriments.sugars_100g': { $exists: true },
    $or: [{ nova_group: { $exists: false } }, { nova_group: null }]
  });

  const nutrientsNoNutriScore = await Product.countDocuments({
    categoryType: 'food',
    'nutriments.sugars_100g': { $exists: true },
    nutriscore_grade: { $nin: ['a','b','c','d','e','A','B','C','D','E'] }
  });

  console.log('\n📊 PRODUITS CALCULABLES');
  console.log('  Ont nutriments mais pas NOVA:        ' + nutrientsNoNova);
  console.log('  Ont nutriments mais pas NutriScore:  ' + nutrientsNoNutriScore);

  // Enrichissement IA
  const withAiEnrich = await Product.countDocuments({ 
    'aiEnrichment.needsEnrichment': true 
  });

  console.log('\n🤖 ENRICHISSEMENT IA');
  console.log('  Produits enrichis par IA: ' + withAiEnrich);

  // Exemples incomplets
  console.log('\n⚠️ EXEMPLES PRODUITS SANS NOVA NI NUTRISCORE (5 premiers)');
  
  const incomplete = await Product.find({
    categoryType: 'food',
    barcode: { $exists: true, $ne: null },
    $or: [{ nova_group: { $exists: false } }, { nova_group: null }],
    nutriscore_grade: { $nin: ['a','b','c','d','e','A','B','C','D','E'] }
  })
  .select('barcode name brand nova_group nutriscore_grade nutriments.sugars_100g')
  .limit(5)
  .lean();

  incomplete.forEach((p, i) => {
    const hasNutriments = p.nutriments && p.nutriments.sugars_100g !== undefined;
    console.log('  ' + (i+1) + '. ' + (p.name || 'Sans nom') + ' (' + p.barcode + ')');
    console.log('     NOVA: ' + (p.nova_group || 'null') + ' | NutriScore: ' + (p.nutriscore_grade || 'null') + ' | Nutriments: ' + (hasNutriments ? 'OUI' : 'NON'));
  });

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('🎯 RESUME');
  console.log('='.repeat(60));
  
  const pctNova = (withNova/totalFood*100).toFixed(1);
  const pctNutriScore = (withNutriScore/totalFood*100).toFixed(1);

  console.log('\n  NOVA:       ' + pctNova + '% complet');
  console.log('  NutriScore: ' + pctNutriScore + '% complet');
  
  if (nutrientsNoNutriScore > 0) {
    console.log('\n  💡 ' + nutrientsNoNutriScore + ' produits peuvent avoir NutriScore calcule');
  }

  console.log('\n  ✅ Estimation IA = fallback pour le reste');
  console.log('='.repeat(60) + '\n');

  await mongoose.disconnect();
}

diagnose().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
