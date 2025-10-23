// cleanup-ghost-products.js
require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('? MongoDB connecté');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
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
    process.exit(0);
  } catch (error) {
    console.error('? Erreur:', error.message);
    process.exit(1);
  }
}

cleanup();
