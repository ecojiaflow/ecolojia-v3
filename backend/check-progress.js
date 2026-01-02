require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const total = await Product.countDocuments({});
  const withNova = await Product.countDocuments({ 'scores.breakdown.nova.group': { $exists: true, $ne: null } });
  
  const l1 = await Product.countDocuments({ 'constitution.healthReflex.level': 1 });
  const l2 = await Product.countDocuments({ 'constitution.healthReflex.level': 2 });
  const l3 = await Product.countDocuments({ 'constitution.healthReflex.level': 3 });
  
  console.log('=== PROGRESSION ===');
  console.log('Total:', total);
  console.log('Avec NOVA:', withNova, '(' + (withNova/total*100).toFixed(1) + '%)');
  console.log('L1:', l1, '| L2:', l2, '| L3:', l3);
  
  process.exit(0);
}
check();
