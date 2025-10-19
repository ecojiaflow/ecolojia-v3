const mongoose = require('mongoose');
require('dotenv').config();

async function findCosmetic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    // Trouver 5 cosmétiques avec TOUS les champs
    const cosmetics = await Product.find({ category: 'cosmetics' })
      .limit(5)
      .lean(); // Récupérer objet brut
    
    console.log('\n📊 COSMÉTIQUES TROUVÉS:\n');
    
    cosmetics.forEach((p, i) => {
      const code = p.code || p.barcode || p._id;
      console.log(`${i + 1}. Code: ${code}`);
      console.log(`   Nom: ${p.product_name || p.name || 'N/A'}`);
      console.log(`   Marque: ${p.brands || p.brand || 'N/A'}`);
      console.log(`   Score: ${p.scores?.overallScore || 'N/A'}`);
      console.log(`   Champ code existe: ${!!p.code}`);
      console.log(`   Champ barcode existe: ${!!p.barcode}`);
      console.log('');
    });
    
    if (cosmetics.length > 0) {
      const firstCode = cosmetics[0].code || cosmetics[0].barcode || cosmetics[0]._id;
      console.log(`✅ Premier code à tester: ${firstCode}`);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

findCosmetic();
