const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const stats = await Product.aggregate([
    { $match: { category: 'cosmetics' } },
    { $group: { 
      _id: null, 
      total: { $sum: 1 },
      avg: { $avg: '$scores.overallScore' },
      min: { $min: '$scores.overallScore' },
      max: { $max: '$scores.overallScore' },
      withBreakdown: { $sum: { $cond: [{ $ifNull: ['$scores.breakdown', false] }, 1, 0] } }
    }}
  ]);
  
  console.log('📊 COSMÉTIQUES :');
  console.log('   Total:', stats[0].total);
  console.log('   Score moyen:', Math.round(stats[0].avg) + '/100');
  console.log('   Min:', Math.round(stats[0].min) + '/100');
  console.log('   Max:', Math.round(stats[0].max) + '/100');
  console.log('   Avec breakdown:', stats[0].withBreakdown);
  
  process.exit(0);
}

check();
