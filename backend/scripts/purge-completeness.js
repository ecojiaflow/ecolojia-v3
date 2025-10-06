const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function purgeCompleteness() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('🔧 Suppression champ dataCompleteness...');
  
  const result = await Product.updateMany(
    {},
    { $unset: { dataCompleteness: "" } }
  );
  
  console.log(`✓ ${result.modifiedCount} produits mis à jour`);
  process.exit(0);
}

purgeCompleteness().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
