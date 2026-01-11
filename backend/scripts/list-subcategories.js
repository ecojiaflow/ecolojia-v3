const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  
  const result = await Product.aggregate([
    { $group: { _id: "$subcategory", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 50 }
  ]);
  
  console.log("TOP 50 SUBCATEGORIES:");
  result.forEach(r => console.log(`  ${r.count} - ${r._id}`));
  
  await mongoose.disconnect();
});
