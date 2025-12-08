require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const CONFIG = {
  BATCH_SIZE: 1000,
  DRY_RUN: false
};

const FOOD_TAGS = {
  'chocolat|chocolate|cacao': 'chocolate',
  'noisette|hazelnut': 'hazelnut',
  'amande|almond': 'almond',
  'cacahuète|peanut': 'peanut',
  'lait|milk': 'dairy',
  'fromage|cheese': 'cheese',
  'viande|meat': 'meat',
  'poisson|fish': 'fish',
  'fruit': 'fruit',
  'légume|vegetable': 'vegetable',
  'céréale|cereal': 'cereal',
  'pâte|pasta': 'pasta',
  'pain|bread': 'bread',
  'sucré|sweet': 'sweet',
  'salé|salty': 'salty',
  'tartine|spread': 'spread',
  'boisson|drink': 'drink',
  'snack|goûter': 'snack',
  'bio|organic': 'organic'
};

function generateTags(product) {
  const tags = new Set();
  const text = `${product.name} ${product.brand || ''} ${product.ingredients_text || ''}`.toLowerCase();
  
  // Extraire tags
  Object.entries(FOOD_TAGS).forEach(([pattern, tag]) => {
    if (new RegExp(pattern, 'i').test(text)) {
      tags.add(tag);
    }
  });
  
  // FALLBACK OBLIGATOIRE si 0 tags
  if (tags.size === 0) {
    // Catégorie générique
    switch(product.categoryType) {
      case 'food': tags.add('food'); tags.add('grocery'); break;
      case 'cosmetic': tags.add('cosmetic'); tags.add('personal-care'); break;
      case 'detergent': tags.add('cleaning'); tags.add('household'); break;
      default: tags.add('product');
    }
    
    // Ajout tag générique selon nom
    const name = product.name.toLowerCase();
    if (name.length < 20) tags.add('basic');
    else tags.add('standard');
  }
  
  // Subcategory
  let subcategory = product.subcategory;
  if (tags.has('spread')) {
    if (tags.has('chocolate')) subcategory = 'chocolate-spread';
    else if (tags.has('hazelnut') || tags.has('peanut') || tags.has('almond')) subcategory = 'nut-butter';
    else subcategory = 'spread';
  }
  
  return { tags: Array.from(tags), subcategory };
}

async function main() {
  const start = Date.now();
  
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  ENRICHISSEMENT COMPLET 100%             ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté\n');
  
  const query = { $or: [{ tags: { $exists: false }}, { tags: { $size: 0 }}] };
  const total = await Product.countDocuments(query);
  
  console.log(`📊 Produits à enrichir: ${total.toLocaleString()}\n`);
  
  if (total === 0) {
    console.log('✅ Tous enrichis !');
    process.exit(0);
  }
  
  let processed = 0;
  let enriched = 0;
  const bulkOps = [];
  
  const cursor = Product.find(query).cursor();
  
  for (let product = await cursor.next(); product != null; product = await cursor.next()) {
    const { tags, subcategory } = generateTags(product);
    
    const update = { tags };
    if (subcategory) update.subcategory = subcategory;
    
    bulkOps.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: update }
      }
    });
    
    enriched++;
    
    if (bulkOps.length >= CONFIG.BATCH_SIZE) {
      if (!CONFIG.DRY_RUN) await Product.bulkWrite(bulkOps);
      processed += bulkOps.length;
      console.log(`⏳ ${processed.toLocaleString()}/${total.toLocaleString()} (${((processed/total)*100).toFixed(1)}%)`);
      bulkOps.length = 0;
    }
  }
  
  if (bulkOps.length > 0 && !CONFIG.DRY_RUN) {
    await Product.bulkWrite(bulkOps);
    processed += bulkOps.length;
  }
  
  const duration = ((Date.now() - start) / 60000).toFixed(1);
  
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  TERMINÉ                                 ║');
  console.log('╚══════════════════════════════════════════╝\n');
  console.log(`✅ Enrichis: ${enriched.toLocaleString()}`);
  console.log(`⏱️  Durée: ${duration} min\n`);
  
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(console.error);
