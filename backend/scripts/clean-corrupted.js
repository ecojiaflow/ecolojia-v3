const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function cleanCorrupted() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== NETTOYAGE PRODUITS CORROMPUS ===\n');
  
  // Trouver produits corrompus
  const corrupted = await Product.find({
    $or: [
      { tags: { $exists: false } },
      { tags: { $size: 0 } }
    ],
    $or: [
      { categoryType: { $exists: false } },
      { categoryType: null },
      { categoryType: '' }
    ]
  }).lean();
  
  console.log(`Produits corrompus trouvés: ${corrupted.length}\n`);
  
  corrupted.forEach(p => {
    console.log(`ID: ${p._id}`);
    console.log(`Nom: ${p.name}`);
    console.log(`---`);
  });
  
  // Option 1 : Supprimer
  const result = await Product.deleteMany({
    $or: [
      { tags: { $exists: false } },
      { tags: { $size: 0 } }
    ],
    $or: [
      { categoryType: { $exists: false } },
      { categoryType: null },
      { categoryType: '' }
    ]
  });
  
  console.log(`\n✅ ${result.deletedCount} produits corrompus supprimés`);
  
  // Vérification
  const remaining = await Product.countDocuments();
  console.log(`\nProduits restants en base: ${remaining}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

cleanCorrupted().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
