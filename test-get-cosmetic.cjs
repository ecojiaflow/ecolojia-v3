const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function getCosmetic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
    
    const Product = require('./backend/src/models/Product');
    
    // Récupérer 1 produit cosmétique
    const product = await Product.findOne({ categoryType: 'cosmetic' })
      .sort({ 'scores.overallScore': 1 }); // Prendre un produit avec score faible pour test intéressant
    
    if (!product) {
      console.log('❌ Aucun produit cosmétique trouvé en base');
      process.exit(1);
    }
    
    console.log('\n========================================');
    console.log('📦 PRODUIT TROUVÉ :');
    console.log('========================================');
    console.log('ID:', product._id.toString());
    console.log('Nom:', product.name);
    console.log('Marque:', product.brand || 'N/A');
    console.log('Score:', product.scores?.overallScore || 'N/A', '/100');
    console.log('Catégorie:', product.categoryType);
    
    if (product.cosmeticData) {
      console.log('\nDétails cosmétiques :');
      console.log('- Perturbateurs endocriniens:', product.cosmeticData.endocrineDisruptors?.length || 0);
      console.log('- Allergènes:', product.cosmeticData.allergens?.length || 0);
      console.log('- Labels:', product.cosmeticData.labels?.join(', ') || 'Aucun');
    }
    
    console.log('\n========================================');
    console.log('🧪 COMMANDE cURL POUR TEST :');
    console.log('========================================\n');
    
    const curlCmd = `curl -X POST http://localhost:10000/api/education/explain -H "Content-Type: application/json" -d "{\\"productId\\":\\"${product._id.toString()}\\",\\"userProfile\\":{\\"sensitiveSkin\\":true}}"`;
    
    console.log(curlCmd);
    
    console.log('\n========================================');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

getCosmetic();