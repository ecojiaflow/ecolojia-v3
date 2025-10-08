require('dotenv').config();
const mongoose = require('mongoose');

// Schema Product inline (si modèle introuvable)
const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

const { calculateProductScores } = require('../src/services/scoring.service');

async function recalculateAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');

    const products = await Product.find();
    console.log(`📊 ${products.length} produits\n`);

    let updated = 0;

    for (const product of products) {
      try {
        const scores = calculateProductScores(product);
        await Product.updateOne(
          { _id: product._id },
          { $set: { scores, updatedAt: new Date() } }
        );
        updated++;
        if (updated % 100 === 0) console.log(`✅ ${updated}/${products.length}`);
      } catch (err) {
        console.error(`❌ ${product.barcode}: ${err.message}`);
      }
    }

    console.log(`\n✅ Terminé: ${updated} produits mis à jour`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

recalculateAll();
