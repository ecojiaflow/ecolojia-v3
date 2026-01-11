// backend/scripts/analyze-other-spreads.js
const mongoose = require('mongoose');
require('dotenv').config();

async function analyze() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.connection.collection('products');
  
  console.log('=== ANALYSE DES PRODUITS "SPREAD" NON IDENTIFIABLES ===\n');
  
  // Exclure les vrais spreads identifiables
  const excludePatterns = /tartiner|nutella|pindakaas|peanut.*butter|beurre.*cacahu|puree.*amande|tahini|confiture|marmelade|fromage.*tartiner|cheese.*spread|spirelli|spaghetti|penne|fusilli|pasta|nouille|müsli|musli|muesli|haferflocken|flocon|oat|granola|cereal/i;
  
  // Récupérer 30 produits "autre" avec plus de détails
  const others = await Product.find({ 
    subcategory: 'spread',
    name: { $not: excludePatterns }
  })
    .project({ 
      name: 1, 
      barcode: 1, 
      brand: 1,
      subcategory: 1, 
      tags: 1,
      categories_tags: 1,
      ingredients_text: 1,
      'scores.overallScore': 1,
      'constitution.healthReflex.level': 1
    })
    .limit(30)
    .toArray();
  
  console.log('ÉCHANTILLON DE 30 PRODUITS "SPREAD" NON IDENTIFIABLES:\n');
  
  others.forEach((p, i) => {
    console.log(`${i+1}. ${p.name}`);
    console.log(`   Barcode: ${p.barcode || 'N/A'}`);
    console.log(`   Brand: ${p.brand || 'N/A'}`);
    console.log(`   Tags: ${JSON.stringify(p.tags) || 'N/A'}`);
    console.log(`   Categories_tags: ${JSON.stringify(p.categories_tags?.slice(0,3)) || 'N/A'}`);
    console.log(`   Ingrédients: ${p.ingredients_text?.substring(0, 80) || 'N/A'}...`);
    console.log(`   Score: ${p.scores?.overallScore || 'N/A'}, Level: ${p.constitution?.healthReflex?.level || 'N/A'}`);
    console.log('');
  });
  
  // Vérifier si ces produits ont des categories_tags d'OpenFoodFacts
  const withCategoriesTags = await Product.countDocuments({ 
    subcategory: 'spread',
    categories_tags: { $exists: true, $ne: [] }
  });
  
  const withoutCategoriesTags = await Product.countDocuments({ 
    subcategory: 'spread',
    $or: [
      { categories_tags: { $exists: false } },
      { categories_tags: [] }
    ]
  });
  
  console.log('\n=== STATISTIQUES ===');
  console.log(`Produits "spread" avec categories_tags: ${withCategoriesTags}`);
  console.log(`Produits "spread" sans categories_tags: ${withoutCategoriesTags}`);
  
  await mongoose.connection.close();
}
analyze().catch(console.error);
