/**
 * AUDIT SUBCATEGORIES V2 - INTELLIGENT
 * Évite les faux positifs, utilise les tags OFF comme référence
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Mapping tags OpenFoodFacts -> subcategory Ecolojia
const TAG_TO_SUBCATEGORY = {
  // Dairy
  'en:yogurts': 'yogurt',
  'en:plain-yogurts': 'yogurt',
  'en:skyr': 'yogurt',
  'en:greek-yogurts': 'yogurt',
  'en:fruit-yogurts': 'yogurt',
  'en:cheeses': 'cheese',
  'en:milks': 'milk',
  'en:butters': 'butter',
  'en:creams': 'cream',
  
  // Beverages
  'en:sodas': 'soda',
  'en:colas': 'soda',
  'en:fruit-juices': 'juice',
  'en:orange-juices': 'juice',
  'en:waters': 'water',
  'en:coffees': 'coffee',
  'en:teas': 'tea',
  'en:beers': 'beer',
  'en:wines': 'wine',
  
  // Snacks
  'en:chips-and-fries': 'chips',
  'en:crisps': 'chips',
  'en:biscuits': 'biscuits',
  'en:cookies': 'biscuits',
  'en:chocolates': 'chocolate',
  'en:dark-chocolates': 'chocolate',
  'en:milk-chocolates': 'chocolate',
  'en:chocolate-spreads': 'chocolate-spread',
  'en:candies': 'candy',
  'en:ice-creams': 'ice-cream',
  
  // Cereals & Bread
  'en:breakfast-cereals': 'breakfast-cereals',
  'en:breads': 'bread',
  'en:pastas': 'pasta',
  'en:rices': 'rice',
  
  // Proteins
  'en:meats': 'meat',
  'en:beef': 'meat',
  'en:pork': 'meat',
  'en:chicken': 'meat',
  'en:fishes': 'fish',
  'en:salmons': 'fish',
  'en:eggs': 'egg',
  
  // Produce
  'en:vegetables': 'vegetable',
  'en:fruits': 'fruit',
  'en:salads': 'salad',
  'en:legumes': 'legume'
};

// Mapping nom produit -> subcategory (mots complets uniquement)
const NAME_PATTERNS = [
  { pattern: /\bskyr\b/i, subcategory: 'yogurt' },
  { pattern: /\byaourt\b/i, subcategory: 'yogurt' },
  { pattern: /\byogourt\b/i, subcategory: 'yogurt' },
  { pattern: /\bfromage\b/i, subcategory: 'cheese' },
  { pattern: /\blait\b/i, subcategory: 'milk' },
  { pattern: /\bchips\b/i, subcategory: 'chips' },
  { pattern: /\bpringles\b/i, subcategory: 'chips' },
  { pattern: /\bbiscuit/i, subcategory: 'biscuits' },
  { pattern: /\bcookie/i, subcategory: 'biscuits' },
  { pattern: /\bchocolat\b/i, subcategory: 'chocolate' },
  { pattern: /\bnutella\b/i, subcategory: 'chocolate-spread' },
  { pattern: /\bpain\b/i, subcategory: 'bread' },
  { pattern: /\bpâtes?\b/i, subcategory: 'pasta' },
  { pattern: /\briz\b/i, subcategory: 'rice' },
  { pattern: /\bjus\b/i, subcategory: 'juice' },
  { pattern: /\bsoda\b/i, subcategory: 'soda' },
  { pattern: /\bcoca[-\s]?cola\b/i, subcategory: 'soda' },
  { pattern: /\bpepsi\b/i, subcategory: 'soda' },
  { pattern: /\bfanta\b/i, subcategory: 'soda' },
  { pattern: /\bsprite\b/i, subcategory: 'soda' },
];

async function audit() {
  console.log('🔍 AUDIT SUBCATEGORIES V2 - INTELLIGENT\n');
  console.log('═'.repeat(70));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
    
    // Stats
    const total = await Product.countDocuments({ categoryType: 'food' });
    console.log(`📊 Total produits food: ${total}\n`);
    
    // Trouver les incohérences
    const issues = [];
    const cursor = Product.find({ categoryType: 'food' }).cursor();
    
    let processed = 0;
    for await (const product of cursor) {
      processed++;
      if (processed % 1000 === 0) {
        process.stdout.write(`\r⏳ Traité: ${processed}/${total}`);
      }
      
      const currentSub = product.subcategory;
      const name = (product.name || '').toLowerCase();
      const tags = Array.isArray(product.labels) ? product.labels : (Array.isArray(product.tags) ? product.tags : []);
      
      // 1. Vérifier via tags OFF
      let expectedFromTags = null;
      for (const tag of tags) {
        if (TAG_TO_SUBCATEGORY[tag]) {
          expectedFromTags = TAG_TO_SUBCATEGORY[tag];
          break;
        }
      }
      
      // 2. Vérifier via nom produit (patterns)
      let expectedFromName = null;
      for (const { pattern, subcategory } of NAME_PATTERNS) {
        if (pattern.test(name)) {
          expectedFromName = subcategory;
          break;
        }
      }
      
      // Déterminer expected (tags prioritaire)
      const expected = expectedFromTags || expectedFromName;
      
      // Si incohérence détectée
      if (expected && currentSub !== expected) {
        issues.push({
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          currentSub,
          expectedSub: expected,
          source: expectedFromTags ? 'tags' : 'name',
          tags: tags.slice(0, 5)
        });
      }
    }
    
    console.log(`\n\n✅ Audit terminé: ${issues.length} incohérences détectées\n`);
    
    // Grouper par type
    const grouped = {};
    issues.forEach(i => {
      const key = `${i.currentSub} -> ${i.expectedSub}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    console.log('📋 Résumé des incohérences:');
    Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([key, count]) => {
        console.log(`   ${count}x ${key}`);
      });
    
    // Sauvegarder
    const fs = require('fs');
    fs.writeFileSync('subcategory-issues-v2.json', JSON.stringify(issues, null, 2));
    console.log(`\n💾 Sauvegardé: subcategory-issues-v2.json`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

audit();
