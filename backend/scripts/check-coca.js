const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../src/models/Product');

async function checkCocaCola() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const cocaCola = await Product.findOne({ 
    $or: [
      { barcode: '5449000013473' },
      { name: /coca.*cola/i }
    ]
  });
  
  if (!cocaCola) {
    console.log('❌ Coca-Cola non trouvé');
    process.exit(1);
  }
  
  console.log('\n📊 COCA-COLA - DONNÉES MONGODB:\n');
  console.log('Barcode:', cocaCola.barcode);
  console.log('overallScore:', cocaCola.scores?.overallScore);
  console.log('healthScore:', cocaCola.scores?.healthScore);
  console.log('environmentScore:', cocaCola.scores?.environmentScore);
  console.log('\n🔍 BREAKDOWN:');
  console.log(JSON.stringify(cocaCola.scores?.breakdown, null, 2));
  console.log('\n📅 Calculé le:', cocaCola.scores?.calculatedAt);
  console.log('Version:', cocaCola.scores?.scoringVersion);
  
  await mongoose.disconnect();
}

checkCocaCola();
