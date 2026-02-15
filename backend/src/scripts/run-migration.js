const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = require('../models/Product');
  const classifier = require('../services/categoryClassifier.service');

  const products = await Product.find({ categoryType: 'food' }).select('name subcategory categories_tags ingredients_text');
  console.log('Total produits food: ' + products.length);

  let fixed = 0;
  let unchanged = 0;

  for (const p of products) {
    const result = classifier.classifyProduct(p);
    if (result.confidence >= 0.5 && result.subcategory !== p.subcategory) {
      const update = {};
      update['subcategory'] = result.subcategory;
      update['tags'] = classifier.generateTags(result.subcategory, p.name);
      update['classificationSource'] = 'migration-v2';
      await Product.findByIdAndUpdate(p._id, { $set: update });
      console.log('FIX: ' + p.name + ' | ' + p.subcategory + ' -> ' + result.subcategory);
      fixed++;
    } else {
      unchanged++;
    }
  }

  console.log('');
  console.log('=== DONE ===');
  console.log('Fixed: ' + fixed);
  console.log('Unchanged: ' + unchanged);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
