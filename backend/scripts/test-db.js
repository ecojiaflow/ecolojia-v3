const mongoose = require('mongoose');
require('dotenv').config();

async function testDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
    const count = await mongoose.connection.db.collection('products').countDocuments();
    console.log(`📊 Nombre de produits: ${count}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDB();
