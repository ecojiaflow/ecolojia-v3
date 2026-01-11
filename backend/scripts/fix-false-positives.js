require('dotenv').config();
const mongoose = require('mongoose');

async function fixFalsePositives() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');
  
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  
  // Patterns de faux positifs (pâtes alimentaires, pas pâtes à tartiner)
  const falsePositivePatterns = /rubans|torsades|spaghetti|tagliatelle|lasagne|ravioli|penne|fusilli|macaroni|nouilles|vermicelle|linguine|fettuccine|oeufs frais|pâtes aux|pâtes d'/i;
  
  // Trouver les faux positifs dans chocolate-spread
  const falsePositives = await Product.find({
    subcategory: 'chocolate-spread',
    $or: [
      { name: falsePositivePatterns }
    ]
  }).select('barcode name subcategory').lean();
  
  console.log(`📦 ${falsePositives.length} faux positifs trouvés:\n`);
  
  for (const product of falsePositives) {
    console.log(`   Fixing: ${product.name} → pasta`);
    
    await Product.updateOne(
      { barcode: product.barcode },
      { $set: { subcategory: 'pasta' } }
    );
  }
  
  console.log(`\n✅ ${falsePositives.length} produits corrigés (chocolate-spread → pasta)`);
  
  await mongoose.disconnect();
}

fixFalsePositives().catch(console.error);
