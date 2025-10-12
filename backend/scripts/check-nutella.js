const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../src/models/Product');

async function checkNutella() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const nutella = await Product.findOne({ name: /nutella/i });
  
  if (!nutella) {
    console.log('❌ Nutella non trouvé');
    process.exit(1);
  }
  
  console.log('\n📊 NUTELLA - DONNÉES COMPLÈTES:\n');
  console.log('Barcode:', nutella.barcode);
  console.log('overallScore:', nutella.scores?.overallScore);
  console.log('healthScore:', nutella.scores?.healthScore);
  console.log('environmentScore:', nutella.scores?.environmentScore);
  console.log('\n🔍 BREAKDOWN COMPLET:');
  console.log(JSON.stringify(nutella.scores?.breakdown, null, 2));
  console.log('\n📅 Version:', nutella.scores?.scoringVersion);
  
  console.log('\n🧬 DONNÉES SOURCE:');
  console.log('NOVA:', nutella.foodData?.novaGroup);
  console.log('Nutri-Score:', nutella.foodData?.nutriScore);
  console.log('Eco-Score:', nutella.foodData?.ecoScore);
  console.log('Additifs:', nutella.foodData?.additives?.length || 0);
  
  await mongoose.disconnect();
}

checkNutella();
