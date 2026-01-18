const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const products = await mongoose.connection.db.collection('products')
    .find({ 'additives_extracted.2': { $exists: true } })
    .limit(5)
    .project({ barcode: 1, name: 1, additives_extracted: 1 })
    .toArray();
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
});
