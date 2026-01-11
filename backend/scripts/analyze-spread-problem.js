// backend/scripts/analyze-spread-problem.js
const mongoose = require('mongoose');
require('dotenv').config();

async function analyze() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.connection.collection('products');
  
  console.log('=== ANALYSE DES PRODUITS "SPREAD" ===\n');
  
  // 1. Échantillon de 50 produits "spread" pour voir les vrais types
  const sample = await Product.find({ subcategory: 'spread' })
    .project({ name: 1, barcode: 1, subcategory: 1, tags: 1 })
    .limit(100)
    .toArray();
  
  // Classifier manuellement par mots-clés dans le nom
  const categories = {
    pate_tartiner: [],    // Nutella, pâte chocolat, etc.
    beurre_oleagineux: [], // Beurre cacahuète, purée amandes
    pates: [],            // Spirelli, spaghetti, etc.
    cereales: [],         // Müsli, flocons, etc.
    confiture: [],        // Confiture, marmelade
    fromage: [],          // Fromage à tartiner
    autre: []
  };
  
  const keywords = {
    pate_tartiner: ['nutella', 'tartiner', 'cacao', 'noisette', 'chocolat spread', 'hazelnut spread', 'chocolate spread'],
    beurre_oleagineux: ['pindakaas', 'peanut butter', 'beurre cacahu', 'puree amande', 'puree noisette', 'almond butter', 'cashew butter', 'tahini', 'sesame'],
    pates: ['spirelli', 'spaghetti', 'penne', 'fusilli', 'tagliatelle', 'linguine', 'farfalle', 'rigatoni', 'macaroni', 'lasagne', 'ravioli', 'tortellini', 'gnocchi', 'nouille', 'noodle', 'pasta', 'langue oiseau'],
    cereales: ['müsli', 'musli', 'muesli', 'haferflocken', 'flocon', 'avoine', 'oat', 'granola', 'cereale', 'cereal', 'cornflakes', 'porridge'],
    confiture: ['confiture', 'marmelade', 'gelee', 'jam', 'jelly'],
    fromage: ['fromage', 'cheese', 'kiri', 'vache qui rit', 'philadelphia', 'cream cheese']
  };
  
  sample.forEach(p => {
    const nameLower = p.name.toLowerCase();
    let classified = false;
    
    for (const [category, kws] of Object.entries(keywords)) {
      if (kws.some(kw => nameLower.includes(kw))) {
        categories[category].push(p.name);
        classified = true;
        break;
      }
    }
    
    if (!classified) {
      categories.autre.push(p.name);
    }
  });
  
  // Afficher résultats
  console.log('CLASSIFICATION ÉCHANTILLON (100 produits "spread"):');
  console.log('─'.repeat(50));
  
  for (const [category, products] of Object.entries(categories)) {
    console.log(`\n${category.toUpperCase()} (${products.length} produits):`);
    products.slice(0, 5).forEach(name => console.log(`  - ${name}`));
    if (products.length > 5) console.log(`  ... et ${products.length - 5} autres`);
  }
  
  // 2. Compter globalement par pattern
  console.log('\n\n=== ESTIMATION GLOBALE ===\n');
  
  const patesCount = await Product.countDocuments({ 
    subcategory: 'spread',
    name: { $regex: /spirelli|spaghetti|penne|fusilli|pasta|nouille|macaroni|linguine|tagliatelle|lasagne|langue.*oiseau/i }
  });
  console.log(`Pâtes mal classées en "spread": ~${patesCount}`);
  
  const cerealesCount = await Product.countDocuments({ 
    subcategory: 'spread',
    name: { $regex: /müsli|musli|muesli|haferflocken|flocon|oat|granola|cereal|cornflakes|porridge|avoine/i }
  });
  console.log(`Céréales mal classées en "spread": ~${cerealesCount}`);
  
  const vraisSpreads = await Product.countDocuments({ 
    subcategory: 'spread',
    name: { $regex: /tartiner|nutella|pindakaas|peanut.*butter|beurre.*cacahu|puree.*amande|tahini|confiture|marmelade|fromage.*tartiner|cheese.*spread/i }
  });
  console.log(`Vrais spreads (estimation): ~${vraisSpreads}`);
  
  const total = await Product.countDocuments({ subcategory: 'spread' });
  const malClasses = patesCount + cerealesCount;
  console.log(`\nTotal "spread": ${total}`);
  console.log(`Estimation mal classés: ~${malClasses} (${Math.round(malClasses/total*100)}%)`);
  console.log(`Estimation corrects: ~${total - malClasses} (${Math.round((total-malClasses)/total*100)}%)`);
  
  await mongoose.connection.close();
}
analyze().catch(console.error);
