const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const totalFood = await db.collection('products').countDocuments({ categoryType: 'food' });
  const migrated = await db.collection('products').countDocuments({ 
    categoryType: 'food',
    'constitution.migratedAt': { $exists: true }
  });
  const notMigrated = totalFood - migrated;
  
  console.log('==================================================');
  console.log('ETAT BASE MONGODB');
  console.log('==================================================');
  console.log('Total food:', totalFood);
  console.log('Migres V2:', migrated);
  console.log('Non migres:', notMigrated);
  console.log('Progression:', ((migrated/totalFood)*100).toFixed(1) + '%');
  console.log('==================================================');
  
  await mongoose.disconnect();
}

check().catch(console.error);
