require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function inspectFull() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const nutella = await Product.findOne({ 
    name: { $regex: /nutella/i } 
  }).lean();
  
  console.log('=== NUTELLA COMPLET (JSON) ===\n');
  console.log(JSON.stringify(nutella, null, 2));
  
  process.exit(0);
}

inspectFull().catch(console.error);
