const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');

async function createTestDetergent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
    
    // Vérifier combien de produits existent
    const totalCount = await Product.countDocuments();
    const detergentCount = await Product.countDocuments({ categoryType: 'detergent' });
    const cosmeticCount = await Product.countDocuments({ categoryType: 'cosmetic' });
    
    console.log(`\n📊 État actuel de la base :`);
    console.log(`  Total produits : ${totalCount}`);
    console.log(`  Cosmétiques : ${cosmeticCount}`);
    console.log(`  Détergents : ${detergentCount}`);
    
    // Créer un produit détergent test
    const testProduct = new Product({
      barcode: 'TEST_DETERGENT_' + Date.now(),
      name: 'Ariel Lessive Liquide Original',
      brand: 'Ariel',
      categoryType: 'detergent',
      
      detergentData: {
        composition: [
          'Sodium Laureth Sulfate (5-15%)',
          'Cocamidopropyl Betaine (1-5%)',
          'Sodium Citrate (1-5%)',
          'Parfum'
        ],
        surfactants: 15,
        biodegradability: 85,
        ecotoxicity: 'Modérée',
        fragrance: 'Synthétique',
        labels: ['Ecolabel UE']
      },
      
      scores: {
        overallScore: 68,
        breakdown: {
          composition: 65,
          biodegradability: 85,
          toxicity: 60,
          ecoLabels: 80
        },
        confidence: 0.85,
        completeness: 'good'
      },
      
      origin: 'Test manual',
      aiEnriched: false,
      sources: ['Manual creation']
    });
    
    await testProduct.save();
    
    console.log('\n✅ Produit détergent TEST créé !');
    console.log('ID:' + testProduct._id);
    console.log('NAME:' + testProduct.name);
    console.log('SCORE:' + testProduct.scores.overallScore);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.log('ERROR:' + error.message);
    process.exit(1);
  }
}

createTestDetergent();