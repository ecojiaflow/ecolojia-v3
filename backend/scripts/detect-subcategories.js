require('dotenv').config();
const mongoose = require('mongoose');

const KEYWORDS_MAP = {
  'tartiner': 'spreads',
  'nutella': 'spreads',
  'chocolat': 'chocolat',
  'biscuit': 'biscuits',
  'gateau': 'biscuits',
  'yaourt': 'yaourts',
  'yogurt': 'yaourts',
  'fromage': 'fromages',
  'lait': 'produits-laitiers',
  'pates': 'pates',
  'pasta': 'pates',
  'riz': 'cereales',
  'cereales': 'cereales',
  'pain': 'pains',
  'jus': 'boissons',
  'eau': 'eaux',
  'soda': 'sodas',
  'legume': 'legumes',
  'fruit': 'fruits',
  'viande': 'viandes',
  'poisson': 'poissons'
};

function detectSubcategory(name) {
  const lower = name.toLowerCase();
  for (const [keyword, sub] of Object.entries(KEYWORDS_MAP)) {
    if (lower.includes(keyword)) return sub;
  }
  return 'autres';
}

(async function() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const products = await db.collection('products').find({ category: 'food' }).toArray();
  console.log(`Traitement de ${products.length} produits food\n`);
  
  let updated = 0;
  for (const p of products) {
    const subcategory = detectSubcategory(p.name);
    await db.collection('products').updateOne(
      { _id: p._id },
      { $set: { subcategory } }
    );
    updated++;
    if (updated % 500 === 0) console.log(`  ${updated}/${products.length}`);
  }
  
  console.log(`\n? ${updated} subcategories détectées`);
  
  const stats = await db.collection('products').aggregate([
    { $match: { category: 'food' } },
    { $group: { _id: '$subcategory', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log('\n?? Distribution subcategories:');
  stats.forEach(s => console.log(`  ${s._id}: ${s.count}`));
  
  process.exit(0);
})();
