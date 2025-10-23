require('dotenv').config();
const mongoose = require('mongoose');
const { calculateProductScores } = require('../src/services/scoring.service');

const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

async function recalculateAfterEnrich() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');

    // Trouver produits récemment enrichis
    const products = await Product.find({
      'foodData.novaGroup': { $exists: true },
      category: 'food'
    });

    console.log(`📊 ${products.length} produits à recalculer\n`);

    let updated = 0;

    for (const product of products) {
      try {
        product.scores = calculateProductScores(product);
        await product.save();
        updated++;

        if (updated % 100 === 0) {
          console.log(`✅ ${updated}/${products.length}`);
        }
      } catch (err) {
        console.error(`❌ ${product.barcode}: ${err.message}`);
      }
    }

    console.log(`\n✅ Recalcul terminé: ${updated} produits`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

recalculateAfterEnrich();
