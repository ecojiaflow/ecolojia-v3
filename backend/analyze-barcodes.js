require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function analyze() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const total = await Product.countDocuments({});
  
  // Barcodes valides (8 ou 13 chiffres)
  const ean13 = await Product.countDocuments({ barcode: { $regex: /^[0-9]{13}$/ } });
  const ean8 = await Product.countDocuments({ barcode: { $regex: /^[0-9]{8}$/ } });
  const other = total - ean13 - ean8;
  
  console.log('=== ANALYSE BARCODES ===');
  console.log('Total:', total);
  console.log('EAN-13 (valides):', ean13, '(' + (ean13/total*100).toFixed(1) + '%)');
  console.log('EAN-8 (valides):', ean8, '(' + (ean8/total*100).toFixed(1) + '%)');
  console.log('Autres (invalides):', other, '(' + (other/total*100).toFixed(1) + '%)');
  console.log('');
  console.log('Produits enrichissables:', ean13 + ean8);
  console.log('Temps estime:', Math.round((ean13 + ean8) * 0.65 / 60), 'minutes');
  
  process.exit(0);
}
analyze();
