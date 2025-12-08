require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function enrichAllNutella() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Trouver tous les Nutella
  const nutellas = await Product.find({ name: /nutella/i });
  
  console.log(`\n🔄 Enrichissement de ${nutellas.length} produits Nutella...\n`);
  
  let enriched = 0;
  
  for (const nutella of nutellas) {
    // Déterminer tags et subcategory selon le type
    let tags, subcategory;
    
    if (nutella.name.toLowerCase().includes('biscuit')) {
      tags = ['chocolate', 'hazelnut', 'sweet', 'biscuit', 'spread', 'nutella'];
      subcategory = 'snack';
    } else if (nutella.name.toLowerCase().includes('b-ready') || nutella.name.toLowerCase().includes('be-ready')) {
      tags = ['chocolate', 'hazelnut', 'sweet', 'snack', 'wafer'];
      subcategory = 'snack';
    } else if (nutella.name.toLowerCase().includes('croissant')) {
      tags = ['chocolate', 'hazelnut', 'pastry', 'sweet', 'breakfast'];
      subcategory = 'pastry';
    } else if (nutella.name.toLowerCase().includes('& go')) {
      tags = ['chocolate', 'hazelnut', 'spread', 'sweet', 'snack', 'portable'];
      subcategory = 'snack';
    } else {
      // Nutella classique (spread)
      tags = ['chocolate', 'hazelnut', 'spread', 'sweet', 'snack'];
      subcategory = 'chocolate-spread';
    }
    
    await Product.findByIdAndUpdate(nutella._id, {
      tags,
      subcategory
    });
    
    enriched++;
  }
  
  console.log(`✅ ${enriched} produits Nutella enrichis avec tags et subcategory`);
  process.exit(0);
}

enrichAllNutella();
