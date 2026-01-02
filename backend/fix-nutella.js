require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.db.collection('products').updateOne(
    { _id: new mongoose.Types.ObjectId('691780b7c56dd19f3eddfc01') },
    { $set: { 
      'constitution.healthReflex': { 
        level: 3, 
        sublevel: 'occasions', 
        levelLabel: 'A reserver aux occasions', 
        flags: ['ultra_transforme', 'nutriscore_e', 'sucre_eleve'] 
      },
      'foodData.novaGroup': 4
    }}
  );
  console.log('Modified:', result.modifiedCount);
  process.exit(0);
});
