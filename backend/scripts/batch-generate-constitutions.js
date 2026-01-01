require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const PhotoAnalysisService = require('../src/services/photoAnalysis.service');

async function generateConstitutions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');

    const products = await Product.find({
      $or: [
        { constitution: { $exists: false } },
        { constitution: null }
      ]
    }); // Test avec 10

    console.log(`📊 ${products.length} produits à enrichir`);

    let success = 0;
    let errors = 0;

    for (const product of products) {
      try {
        console.log(`🔄 ${product.name}`);
        
        // Générer Constitution
        const constitution = await PhotoAnalysisService._generateConstitution(product);
        
        // ✅ CORRECTION : Utiliser .save() au lieu de .updateOne()
        product.constitution = constitution;
        product.constitutionGeneratedAt = new Date();
        product.constitutionVersion = '3.0';
        
        await product.save();
        
        success++;
        console.log(`✅ [${success}/${products.length}] ${product.name}`);

      } catch (err) {
        errors++;
        console.error(`❌ ${product.name}: ${err.message}`);
      }
    }

    console.log(`\n📊 RÉSULTAT FINAL :`);
    console.log(`✅ Succès : ${success}`);
    console.log(`❌ Erreurs : ${errors}`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

generateConstitutions();

