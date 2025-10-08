require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

async function enrichProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');

    // Trouver produits sans NOVA
    const products = await Product.find({
      'foodData.novaGroup': { $exists: false },
      category: 'food',
      barcode: { $exists: true }
    }).limit(100);

    console.log(`📊 ${products.length} produits à enrichir\n`);

    let enriched = 0;
    let errors = 0;

    for (const product of products) {
      try {
        console.log(`Traitement: ${product.name} (${product.barcode})`);

        // Appel OpenFoodFacts
        const response = await axios.get(
          `https://world.openfoodfacts.org/api/v2/product/${product.barcode}.json`,
          { headers: { 'User-Agent': 'ECOLOJIA/3.0' } }
        );

        if (response.data.status === 1) {
          const offData = response.data.product;

          // Enrichir foodData
          const updates = {};
          
          if (offData.nova_group) {
            updates['foodData.novaGroup'] = parseInt(offData.nova_group);
            console.log(`  ✅ NOVA Groupe ${offData.nova_group}`);
          }

          if (offData.nutriscore_grade) {
            updates['foodData.nutriScore'] = offData.nutriscore_grade.toUpperCase();
            console.log(`  ✅ Nutri-Score ${offData.nutriscore_grade.toUpperCase()}`);
          }

          if (offData.ecoscore_grade) {
            updates['foodData.ecoScore'] = offData.ecoscore_grade.toLowerCase();
            console.log(`  ✅ Eco-Score ${offData.ecoscore_grade}`);
          }

          if (offData.additives_tags && offData.additives_tags.length > 0) {
            updates['foodData.additives'] = offData.additives_tags
              .map(tag => tag.replace('en:', '').toUpperCase())
              .filter(add => add.startsWith('E'));
            console.log(`  ✅ ${updates['foodData.additives'].length} additifs`);
          }

          if (offData.labels_tags) {
            updates['labels_tags'] = offData.labels_tags;
          }

          if (offData.ingredients_text_fr || offData.ingredients_text) {
            updates['foodData.ingredients'] = offData.ingredients_text_fr || offData.ingredients_text;
          }

          if (Object.keys(updates).length > 0) {
            await Product.updateOne(
              { _id: product._id },
              { $set: updates }
            );
            enriched++;
            console.log(`  ✅ ${enriched}/${products.length} enrichis\n`);
          } else {
            console.log(`  ⚠️ Aucune donnée supplémentaire\n`);
          }

          // Rate limit OpenFoodFacts (1 req/s)
          await new Promise(resolve => setTimeout(resolve, 1100));
        } else {
          console.log(`  ⚠️ Produit introuvable sur OpenFoodFacts\n`);
        }
      } catch (err) {
        errors++;
        console.error(`  ❌ Erreur: ${err.message}\n`);
      }
    }

    console.log(`\n✅ Enrichissement terminé: ${enriched} produits, ${errors} erreurs`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  }
}

enrichProducts();
