// cleanup-ghost-products.js
require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

async function cleanup() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('? MONGODB_URI non trouvé dans .env');
      process.exit(1);
    }
    
    console.log('?? Connexion MongoDB...');
    await mongoose.connect(uri);
    console.log('? MongoDB connecté');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    console.log('?? Recherche produits fantômes...');
    
    // Supprimer produits avec barcode null/vide OU sans nom
    const result = await Product.deleteMany({
      $or: [
        { barcode: null },
        { barcode: '' },
        { barcode: { $exists: false } },
        { name: null },
        { name: '' },
        { name: { $exists: false } }
      ]
    });
    
    console.log(`? ${result.deletedCount} produits fantômes supprimés`);
    
    await mongoose.disconnect();
    console.log('? Déconnexion MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('? Erreur:', error.message);
    process.exit(1);
  }
}

cleanup();
