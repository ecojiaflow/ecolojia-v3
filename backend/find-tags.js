const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./src/models/Product');

async function findProductsWithTags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Trouver produits avec tags
    const productsWithTags = await Product.find({
      tags: { $exists: true, $ne: [], $not: { $size: 0 } }
    })
    .limit(5)
    .lean();

    console.log(`📦 ${productsWithTags.length} produits trouvés avec tags :\n`);

    productsWithTags.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name || 'Nom inconnu'}`);
      console.log(`   Catégorie: ${product.categoryType}`);
      console.log(`   Subcategory: ${product.subcategory || 'non défini'}`);
      console.log(`   Tags: ${JSON.stringify(product.tags)}`);
      console.log(`   Marque: ${product.brand || 'non défini'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

findProductsWithTags();
