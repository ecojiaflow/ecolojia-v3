const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    // Chercher 5 produits qui ont des ingrédients
    const products = await Product.find({
      'foodData.ingredients': { $exists: true, $ne: [] }
    })
    .select('barcode name brand foodData.ingredients')
    .limit(5);
    
    console.log(`\n📦 Trouvé ${products.length} produits avec ingrédients :\n`);
    
    products.forEach(p => {
      console.log(`Barcode: ${p.barcode}`);
      console.log(`Nom: ${p.name}`);
      console.log(`Ingrédients: ${p.foodData?.ingredients?.length || 0} items`);
      console.log(`---`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });
