const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function listEnrichedProducts() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('\n📦 PRODUITS ENRICHIS (AVEC DONNÉES COMPLÈTES)\n');

  // SEULEMENT produits enrichis avec nutrition
  const products = await Product.find({
    estimated: true,
    'nutrition.energy_kcal': { $exists: true }
  })
    .select('name brand scores.overall scores.novaGroup nutrition.sugars_100g nutrition.salt_100g')
    .limit(30)
    .lean();

  console.log(`Trouvés : ${products.length} produits enrichis\n`);

  products.forEach((p, i) => {
    const score = p.scores?.overall || 'N/A';
    const nova = p.scores?.novaGroup || 'N/A';
    const sugars = p.nutrition?.sugars_100g || p.nutrition?.sugars || 'N/A';
    const salt = p.nutrition?.salt_100g || p.nutrition?.salt || 'N/A';
    
    console.log(`${(i+1).toString().padStart(2)}. ${p.name.substring(0, 40).padEnd(40)} | Score: ${score.toString().padStart(3)} | NOVA: ${nova} | Sucres: ${String(sugars).padEnd(5)}g | Sel: ${String(salt).padEnd(5)}g`);
  });

  const totalEnriched = await Product.countDocuments({ estimated: true });
  const total = await Product.countDocuments();

  console.log(`\n✅ Total enrichis : ${totalEnriched} / ${total} (${((totalEnriched/total)*100).toFixed(1)}%)\n`);

  await mongoose.disconnect();
}

listEnrichedProducts().catch(console.error);
