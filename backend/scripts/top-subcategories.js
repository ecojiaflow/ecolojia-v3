const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.db.collection('products').aggregate([
    { $match: { subcategory: { $exists: true, $ne: '' } } },
    { $group: { _id: '$subcategory', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]).toArray();
  
  console.log('TOP 20 SUBCATEGORIES:');
  result.forEach((r, i) => console.log((i+1) + '. ' + r._id + ' (' + r.count + ' produits)'));
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
