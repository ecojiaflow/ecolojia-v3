// backend/scripts/fix-nutella-and-similar.js
const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.connection.collection('products');
  
  console.log('=== CORRECTION NUTELLA ET PRODUITS SIMILAIRES ===\n');
  
  // Liste des produits connus qui doivent être "spread"
  const knownSpreads = [
    { barcode: '3017620422003', name: 'Nutella' },
    { name: /nutella/i },
    { name: /nocciolata/i },
    { name: /banania/i },
    { name: /ovomaltine.*crunchy/i },
    { name: /milka.*tartiner/i },
    { name: /kinder.*tartiner/i }
  ];
  
  // Corriger par barcode Nutella
  const nutellaResult = await Product.updateOne(
    { barcode: '3017620422003' },
    { $set: { subcategory: 'spread' } }
  );
  console.log(`Nutella (3017620422003): ${nutellaResult.modifiedCount} corrigé`);
  
  // Corriger tous les produits avec "nutella" dans le nom
  const nutellaNameResult = await Product.updateMany(
    { name: { $regex: /nutella/i }, subcategory: { $ne: 'spread' } },
    { $set: { subcategory: 'spread' } }
  );
  console.log(`Produits "nutella" dans le nom: ${nutellaNameResult.modifiedCount} corrigés`);
  
  // Corriger produits avec pâte + chocolat/noisette/cacao dans le nom
  const pateChocoResult = await Product.updateMany(
    { 
      name: { $regex: /pâte.*(chocolat|noisette|cacao)|chocolat.*tartiner|noisette.*tartiner/i },
      subcategory: { $ne: 'spread' }
    },
    { $set: { subcategory: 'spread' } }
  );
  console.log(`Produits "pâte chocolat/noisette": ${pateChocoResult.modifiedCount} corrigés`);
  
  // Corriger produits avec "beurre de cacahuète" mal classés
  const peanutResult = await Product.updateMany(
    { 
      name: { $regex: /beurre.*cacahu|peanut.*butter|pindakaas/i },
      subcategory: { $ne: 'spread' }
    },
    { $set: { subcategory: 'spread' } }
  );
  console.log(`Produits "beurre cacahuète": ${peanutResult.modifiedCount} corrigés`);
  
  // Corriger produits avec "purée d'amande/noisette"
  const pureeResult = await Product.updateMany(
    { 
      name: { $regex: /purée.*(amande|noisette|sésame)|almond.*butter|tahini/i },
      subcategory: { $ne: 'spread' }
    },
    { $set: { subcategory: 'spread' } }
  );
  console.log(`Produits "purée oléagineux": ${pureeResult.modifiedCount} corrigés`);
  
  // Vérification finale
  console.log('\n=== VÉRIFICATION ===\n');
  
  const nutella = await Product.findOne({ barcode: '3017620422003' });
  console.log(`Nutella subcategory: ${nutella.subcategory}`);
  
  const totalSpreads = await Product.countDocuments({ subcategory: 'spread' });
  console.log(`Total produits "spread": ${totalSpreads}`);
  
  await mongoose.connection.close();
}
fix().catch(console.error);
