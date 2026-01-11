require('dotenv').config();
const mongoose = require('mongoose');

async function fixBoudoirsMousse() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');
  
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  
  // Fix boudoirs → biscuit
  const boudoirs = await Product.updateMany(
    { name: /boudoir/i },
    { $set: { subcategory: 'biscuit' } }
  );
  console.log(`✅ ${boudoirs.modifiedCount} boudoirs → biscuit`);
  
  // Fix mousse → dairy-dessert
  const mousse = await Product.updateMany(
    { name: /mousse.*chocolat|mousse.*oeufs/i, subcategory: 'pasta' },
    { $set: { subcategory: 'dairy-dessert' } }
  );
  console.log(`✅ ${mousse.modifiedCount} mousse → dairy-dessert`);
  
  // Revérifier les alternatives
  const alternatives = await Product.find({
    subcategory: 'chocolate-spread',
    'constitution.healthReflex.level': { $lte: 2 },
    'scores.overallScore': { $gt: 33 },
    barcode: { $ne: '3017620422003' }
  })
  .select('name scores.overallScore constitution.healthReflex.level')
  .sort({ 'scores.overallScore': -1 })
  .limit(10)
  .lean();
  
  console.log('\n📦 ALTERNATIVES CHOCOLATE-SPREAD CORRIGÉES:\n');
  alternatives.forEach((p, i) => {
    const level = p.constitution?.healthReflex?.level || '?';
    console.log(`   ${i+1}. ${p.name} | Score: ${p.scores?.overallScore} | Niveau: ${level}`);
  });
  
  await mongoose.disconnect();
}

fixBoudoirsMousse().catch(console.error);
