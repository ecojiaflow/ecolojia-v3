require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function enrichNutButters() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('\n🔄 Enrichissement purées de fruits à coque...\n');
  
  let enriched = 0;
  
  // Purées de cacahuètes
  const peanutButters = await Product.find({
    $or: [
      { name: /beurre.*cacahuète/i },
      { name: /beurre.*cacahuete/i },
      { name: /peanut butter/i }
    ]
  });
  
  for (const p of peanutButters) {
    const tags = p.name.toLowerCase().includes('crunchy') 
      ? ['peanut', 'spread', 'protein', 'crunchy', 'natural']
      : ['peanut', 'spread', 'protein', 'creamy', 'natural'];
    
    if (p.name.toLowerCase().includes('chocolat') || p.name.toLowerCase().includes('cacao')) {
      tags.push('chocolate');
    }
    
    await Product.findByIdAndUpdate(p._id, {
      tags,
      subcategory: 'nut-butter'
    });
    enriched++;
  }
  
  // Purées d'amandes
  const almondButters = await Product.find({
    name: /purée.*amande/i
  });
  
  for (const p of almondButters) {
    await Product.findByIdAndUpdate(p._id, {
      tags: ['almond', 'spread', 'protein', 'natural', 'healthy'],
      subcategory: 'nut-butter'
    });
    enriched++;
  }
  
  // Purées de noisettes
  const hazelnutButters = await Product.find({
    name: /purée.*noisette/i
  });
  
  for (const p of hazelnutButters) {
    await Product.findByIdAndUpdate(p._id, {
      tags: ['hazelnut', 'spread', 'protein', 'natural', 'healthy'],
      subcategory: 'nut-butter'
    });
    enriched++;
  }
  
  // Tahini
  const tahini = await Product.find({
    name: /tahini/i
  });
  
  for (const p of tahini) {
    await Product.findByIdAndUpdate(p._id, {
      tags: ['sesame', 'spread', 'protein', 'natural', 'middle-eastern'],
      subcategory: 'nut-butter'
    });
    enriched++;
  }
  
  console.log(`✅ ${enriched} purées de fruits à coque enrichies avec tags et subcategory`);
  process.exit(0);
}

enrichNutButters();
