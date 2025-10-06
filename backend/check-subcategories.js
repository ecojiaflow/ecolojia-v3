require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const stats = await mongoose.connection.db.collection('products').aggregate([
    { $match: { category: 'food' } },
    { $group: { _id: '$subcategory', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log('=== SUBCATEGORIES ===');
  stats.slice(0,15).forEach(s => console.log(s._id + ': ' + s.count));
  
  const autres = stats.find(s => s._id === 'autres');
  const total = stats.reduce((a,b) => a + b.count, 0);
  console.log('\nAutres: ' + (autres?.count || 0) + '/' + total + ' (' + Math.round((autres?.count||0)/total*100) + '%)');
  
  process.exit(0);
}).catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
