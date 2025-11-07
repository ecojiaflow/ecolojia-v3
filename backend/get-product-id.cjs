const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Product = require('./src/models/Product');

async function getDetergentId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const product = await Product.findOne({ categoryType: 'detergent' });
    
    if (product) {
      console.log('ID:' + product._id);
      console.log('NAME:' + product.name);
      console.log('SCORE:' + product.scores.overallScore);
    } else {
      console.log('ERROR:No detergent found');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.log('ERROR:' + error.message);
    process.exit(1);
  }
}

getDetergentId();