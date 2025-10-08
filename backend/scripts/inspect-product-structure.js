// scripts/inspect-product-structure.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function inspectStructure() {
  console.log('\n🔍 INSPECTION STRUCTURE PRODUIT\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');

    // Méthode 1 : Rechercher Nutella
    console.log('📋 Recherche Nutella...');
    const nutella = await Product.findOne({ 
      name: { $regex: /nutella/i } 
    }).lean();

    if (nutella) {
      console.log('\n✅ Produit Nutella trouvé:');
      console.log(JSON.stringify(nutella, null, 2));
    } else {
      console.log('⚠️ Aucun Nutella trouvé\n');
      
      // Méthode 2 : Prendre le premier produit
      console.log('📋 Récupération premier produit...');
      const firstProduct = await Product.findOne({}).lean();
      
      if (firstProduct) {
        console.log('\n✅ Premier produit en base:');
        console.log(JSON.stringify(firstProduct, null, 2));
      } else {
        console.log('❌ Aucun produit en base!');
      }
    }

    // Stats rapides
    console.log('\n📊 Stats rapides:');
    const total = await Product.countDocuments({});
    const withScores = await Product.countDocuments({ 
      'scores.healthScore': { $exists: true } 
    });
    const withBreakdown = await Product.countDocuments({ 
      'scores.breakdown': { $exists: true } 
    });
    
    console.log(`   Total: ${total}`);
    console.log(`   Avec scores.healthScore: ${withScores}`);
    console.log(`   Avec scores.breakdown: ${withBreakdown}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    process.exit(1);
  }
}

inspectStructure();
