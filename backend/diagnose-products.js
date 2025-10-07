const mongoose = require('mongoose');
require('dotenv').config();

async function diagnose() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
  const Product = mongoose.model('Product', ProductSchema);
  
  console.log('\n📊 RÉPARTITION PRODUITS:\n');
  
  // Total
  const total = await Product.countDocuments();
  console.log(`Total produits: ${total}`);
  
  // Par catégorie
  const byCategory = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log('\nPar catégorie:');
  byCategory.forEach(c => console.log(`  ${c._id}: ${c.count}`));
  
  // Food avec barcode
  const foodWithBarcode = await Product.countDocuments({ 
    category: 'food', 
    barcode: { $exists: true, $ne: null } 
  });
  console.log(`\nFood avec barcode: ${foodWithBarcode}`);
  
  // Food SANS barcode
  const foodNoBarcode = await Product.countDocuments({ 
    category: 'food', 
    $or: [
      { barcode: { $exists: false } },
      { barcode: null }
    ]
  });
  console.log(`Food SANS barcode: ${foodNoBarcode}`);
  
  // Avec nutrition déjà
  const withNutrition = await Product.countDocuments({ 
    'foodData.nutrition.per100g.sugars': { $exists: true }
  });
  console.log(`\nProduits avec nutrition: ${withNutrition}`);
  
  // Sans nutrition
  const withoutNutrition = await Product.countDocuments({ 
    category: 'food',
    barcode: { $exists: true, $ne: null },
    'foodData.nutrition.per100g.sugars': { $exists: false }
  });
  console.log(`Produits SANS nutrition (éligibles): ${withoutNutrition}`);
  
  await mongoose.disconnect();
}

diagnose();
