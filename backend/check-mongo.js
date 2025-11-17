require('dotenv').config();
const mongoose = require('mongoose');

async function checkProduct() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));
    
    const product = await Product.findOne({ barcode: '3017620422003' });
    
    if (product) {
      console.log('\n📊 SCORES DANS MONGODB:');
      console.log(JSON.stringify(product.scores, null, 2));
      
      if (product.scores?.breakdown) {
        console.log('\n✅ BREAKDOWN PRÉSENT DANS LA BASE !');
        console.log('Version:', product.scores.scoringVersion);
      } else {
        console.log('\n❌ BREAKDOWN ABSENT DANS LA BASE');
        console.log('Version:', product.scores?.scoringVersion);
      }
    } else {
      console.log('❌ Produit non trouvé');
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}

checkProduct();
