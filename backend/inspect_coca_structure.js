const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB\n');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    // Récupérer le Coca-Cola
    const product = await Product.findOne({ barcode: '5449000000996' });
    
    if (!product) {
      console.log('❌ Produit non trouvé');
      process.exit(1);
    }
    
    console.log('📦 PRODUIT:', product.name);
    console.log('Barcode:', product.barcode);
    console.log('\n🔍 STRUCTURE INGRÉDIENTS :');
    console.log('----------------------------');
    
    // Vérifier tous les champs possibles contenant des ingrédients
    const fields = [
      'ingredients',
      'ingredients_text',
      'foodData.ingredients',
      'foodData.ingredients_text',
      'cosmeticData.ingredients',
      'detergentData.ingredients'
    ];
    
    fields.forEach(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], product);
      if (value) {
        console.log(`\n✅ Champ trouvé: ${field}`);
        console.log(`Type: ${Array.isArray(value) ? 'Array' : typeof value}`);
        
        if (Array.isArray(value)) {
          console.log(`Longueur: ${value.length}`);
          console.log(`Premier élément (type): ${typeof value[0]}`);
          if (value[0]) {
            console.log(`Structure premier élément:`);
            console.log(JSON.stringify(value[0], null, 2));
          }
        } else if (typeof value === 'string') {
          console.log(`Longueur texte: ${value.length} caractères`);
          console.log(`Début du texte: ${value.substring(0, 200)}...`);
        }
      }
    });
    
    // Afficher la structure foodData complète
    console.log('\n📊 STRUCTURE FOODDATA COMPLÈTE :');
    console.log('----------------------------');
    if (product.foodData) {
      console.log(JSON.stringify(product.foodData, null, 2).substring(0, 2000));
    } else {
      console.log('⚠️  foodData non trouvé');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });
