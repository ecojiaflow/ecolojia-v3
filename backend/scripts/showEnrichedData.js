require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => Product.findOne({ name: /Nutella/i }))
  .then(product => {
    console.log('\n🔍 Nutella - Allergènes enrichis:\n');
    product.foodData.allergens.forEach(a => {
      console.log(`${a.icon} ${a.name} (${a.riskLevel})`);
      console.log(`   Tag: ${a.tag}`);
      console.log(`   Catégorie: ${a.category}`);
      console.log(`   Description: ${a.description}`);
      if (a.concerns?.length > 0) {
        console.log(`   Préoccupations: ${a.concerns.join(', ')}`);
      }
      console.log('');
    });
    
    console.log('\n🧪 Additifs enrichis:\n');
    product.foodData.additives.slice(0, 3).forEach(a => {
      console.log(`${a.code} - ${a.name}`);
      console.log(`   Fonction: ${a.function}`);
      console.log(`   Risque: ${a.riskLevel}`);
      console.log('');
    });
    
    process.exit(0);
  });
