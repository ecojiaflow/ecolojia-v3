// backend/smart-enrich-tags.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  BATCH_SIZE: 1000,
  SAVE_INTERVAL: 5000,
  DRY_RUN: false,
  MIN_TAGS: 1,
  MAX_TAGS: 10
};

// ═══════════════════════════════════════════════════════════════════
// DICTIONNAIRES DE TAGS PAR DOMAINE
// ═══════════════════════════════════════════════════════════════════

const FOOD_TAGS = {
  ingredients: {
    'chocolat|chocolate|cacao|cocoa': 'chocolate',
    'noisette|hazelnut': 'hazelnut',
    'amande|almond': 'almond',
    'cacahuète|cacahuete|peanut': 'peanut',
    'lait|milk|dairy': 'dairy',
    'fromage|cheese': 'cheese',
    'viande|meat|boeuf|beef|poulet|chicken': 'meat',
    'poisson|fish|saumon|salmon': 'fish',
    'fruit|apple|pomme|banana|banane|orange': 'fruit',
    'légume|vegetable|carotte|carrot|tomate|tomato': 'vegetable',
    'céréale|cereal|blé|wheat|avoine|oat': 'cereal',
    'riz|rice': 'rice',
    'pâte|pasta|spaghetti|macaroni': 'pasta',
    'pain|bread|baguette': 'bread',
    'oeuf|egg': 'egg'
  },
  taste: {
    'sucré|sweet|sugar|sucre': 'sweet',
    'salé|salty|salt|sel': 'salty',
    'épicé|spicy|piquant': 'spicy',
    'amer|bitter': 'bitter',
    'acide|acidic|sour': 'sour'
  },
  texture: {
    'croquant|crunchy|crispy': 'crunchy',
    'crémeux|creamy|onctueux': 'creamy',
    'moelleux|soft': 'soft',
    'liquide|liquid|jus': 'liquid'
  },
  moment: {
    'petit.déjeuner|breakfast': 'breakfast',
    'déjeuner|lunch': 'lunch',
    'dîner|dinner': 'dinner',
    'goûter|snack|collation': 'snack',
    'apéritif|aperitif': 'appetizer'
  },
  labels: {
    'bio|organic|biologique': 'organic',
    'vegan|végétal': 'vegan',
    'sans.gluten|gluten.free': 'gluten-free',
    'sans.lactose|lactose.free': 'lactose-free',
    'équitable|fair.trade': 'fair-trade'
  },
  preparation: {
    'tartine|tartiner|spread': 'spread',
    'boisson|drink|beverage': 'drink',
    'dessert': 'dessert',
    'sauce': 'sauce',
    'soupe|soup': 'soup'
  }
};

const COSMETIC_TAGS = {
  usage: {
    'hydratant|moisturiz': 'moisturizing',
    'nettoy|cleans': 'cleansing',
    'exfoli': 'exfoliating',
    'anti.âge|anti.aging': 'anti-aging',
    'solaire|sun|spf': 'sunscreen',
    'shampo': 'shampoo',
    'savon|soap': 'soap',
    'crème|cream': 'cream',
    'sérum|serum': 'serum'
  },
  skin: {
    'peau.sensible|sensitive.skin': 'sensitive-skin',
    'peau.grasse|oily.skin': 'oily-skin',
    'peau.sèche|dry.skin': 'dry-skin',
    'peau.mixte|combination': 'combination-skin'
  },
  properties: {
    'naturel|natural': 'natural',
    'bio|organic': 'organic',
    'sans.parfum|fragrance.free': 'fragrance-free',
    'hypoallergénique|hypoallergenic': 'hypoallergenic',
    'vegan': 'vegan'
  }
};

const DETERGENT_TAGS = {
  usage: {
    'lessive|laundry': 'laundry',
    'vaisselle|dish': 'dishes',
    'sol|floor': 'floor',
    'vitre|window': 'window',
    'salle.bain|bathroom': 'bathroom',
    'cuisine|kitchen': 'kitchen'
  },
  properties: {
    'écologique|eco.friendly': 'eco-friendly',
    'concentré|concentrated': 'concentrated',
    'bio|biodegradable': 'biodegradable',
    'sans.phosphate|phosphate.free': 'phosphate-free',
    'parfumé|scented': 'scented',
    'hypoallergénique|hypoallergenic': 'hypoallergenic'
  }
};

function extractTagsFromText(text, dictionary) {
  if (!text) return [];
  const textLower = text.toLowerCase();
  const tags = new Set();
  
  for (const [patterns, tag] of Object.entries(dictionary)) {
    const regex = new RegExp(patterns, 'i');
    if (regex.test(textLower)) {
      tags.add(tag);
    }
  }
  
  return Array.from(tags);
}

function generateFoodTags(product) {
  const tags = new Set();
  const searchText = `${product.name} ${product.brand || ''} ${product.ingredients_text || ''}`;
  
  Object.values(FOOD_TAGS).forEach(dict => {
    extractTagsFromText(searchText, dict).forEach(tag => tags.add(tag));
  });
  
  if (product.subcategory) {
    const sub = product.subcategory.toLowerCase();
    if (sub.includes('spread')) tags.add('spread');
    if (sub.includes('snack')) tags.add('snack');
    if (sub.includes('beverage') || sub.includes('drink')) tags.add('drink');
  }
  
  return Array.from(tags);
}

function generateCosmeticTags(product) {
  const tags = new Set();
  const searchText = `${product.name} ${product.brand || ''} ${product.description || ''}`;
  
  Object.values(COSMETIC_TAGS).forEach(dict => {
    extractTagsFromText(searchText, dict).forEach(tag => tags.add(tag));
  });
  
  tags.add('personal-care');
  if (product.name.toLowerCase().includes('bio')) tags.add('organic');
  
  return Array.from(tags);
}

function generateDetergentTags(product) {
  const tags = new Set();
  const searchText = `${product.name} ${product.brand || ''} ${product.description || ''}`;
  
  Object.values(DETERGENT_TAGS).forEach(dict => {
    extractTagsFromText(searchText, dict).forEach(tag => tags.add(tag));
  });
  
  tags.add('cleaning');
  if (product.name.toLowerCase().includes('bio')) tags.add('eco-friendly');
  
  return Array.from(tags);
}

function generateSubcategory(product, tags) {
  const name = product.name.toLowerCase();
  
  if (product.categoryType === 'food') {
    if (tags.includes('spread')) {
      if (tags.includes('chocolate')) return 'chocolate-spread';
      if (tags.includes('hazelnut')) return 'nut-butter';
      if (tags.includes('peanut')) return 'nut-butter';
      if (tags.includes('almond')) return 'nut-butter';
      return 'spread';
    }
    if (tags.includes('snack')) return 'snack';
    if (tags.includes('drink')) return 'beverage';
    if (tags.includes('breakfast')) return 'breakfast';
    if (tags.includes('dessert')) return 'dessert';
  }
  
  if (product.categoryType === 'cosmetic') {
    if (tags.includes('shampoo')) return 'haircare';
    if (tags.includes('cream')) return 'skincare';
    if (tags.includes('soap')) return 'bodycare';
  }
  
  if (product.categoryType === 'detergent') {
    if (tags.includes('laundry')) return 'laundry';
    if (tags.includes('dishes')) return 'dishwashing';
  }
  
  return product.subcategory || null;
}

function generateSmartTags(product) {
  let tags = [];
  
  switch (product.categoryType) {
    case 'food':
      tags = generateFoodTags(product);
      break;
    case 'cosmetic':
      tags = generateCosmeticTags(product);
      break;
    case 'detergent':
      tags = generateDetergentTags(product);
      break;
    default:
      tags = extractTagsFromText(product.name, FOOD_TAGS.ingredients);
  }
  
  if (tags.length > CONFIG.MAX_TAGS) {
    tags = tags.slice(0, CONFIG.MAX_TAGS);
  }
  
  const subcategory = generateSubcategory(product, tags);
  
  return { tags, subcategory };
}

async function main() {
  const startTime = Date.now();
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   ECOLOJIA - ENRICHISSEMENT TAGS INTELLIGENT                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Configuration:');
  console.log(`   • Mode: ${CONFIG.DRY_RUN ? '🧪 SIMULATION' : '✅ PRODUCTION'}`);
  console.log(`   • Batch: ${CONFIG.BATCH_SIZE} produits`);
  console.log(`   • Tags: ${CONFIG.MIN_TAGS}-${CONFIG.MAX_TAGS} par produit\n`);
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');
  
  const stats = {
    total: 0,
    enriched: 0,
    skipped: 0,
    errors: 0,
    byCategory: { food: 0, cosmetic: 0, detergent: 0, other: 0 }
  };
  
  const query = {
    $or: [
      { tags: { $exists: false } },
      { tags: { $size: 0 } }
    ]
  };
  
  const totalProducts = await Product.countDocuments(query);
  console.log(`📊 Produits à enrichir: ${totalProducts}\n`);
  
  if (totalProducts === 0) {
    console.log('✅ Tous les produits ont déjà des tags !');
    process.exit(0);
  }
  
  let processed = 0;
  const bulkOps = [];
  
  const cursor = Product.find(query).cursor();
  
  for (let product = await cursor.next(); product != null; product = await cursor.next()) {
    stats.total++;
    
    try {
      const { tags, subcategory } = generateSmartTags(product);
      
      if (tags.length < CONFIG.MIN_TAGS) {
        stats.skipped++;
        continue;
      }
      
      const update = { tags };
      if (subcategory) update.subcategory = subcategory;
      
      bulkOps.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: update }
        }
      });
      
      stats.enriched++;
      stats.byCategory[product.categoryType || 'other']++;
      
      if (bulkOps.length >= CONFIG.BATCH_SIZE) {
        if (!CONFIG.DRY_RUN) {
          await Product.bulkWrite(bulkOps);
        }
        
        processed += bulkOps.length;
        const progress = ((processed / totalProducts) * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        
        console.log(`⏳ ${processed}/${totalProducts} (${progress}%) | ⏱️  ${elapsed}min`);
        
        bulkOps.length = 0;
      }
      
    } catch (error) {
      stats.errors++;
      console.error(`❌ Erreur produit ${product._id}:`, error.message);
    }
  }
  
  if (bulkOps.length > 0 && !CONFIG.DRY_RUN) {
    await Product.bulkWrite(bulkOps);
    processed += bulkOps.length;
  }
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   ENRICHISSEMENT TERMINÉ                                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Produits enrichis: ${stats.enriched.toLocaleString()}`);
  console.log(`⏭️  Ignorés: ${stats.skipped.toLocaleString()}`);
  console.log(`❌ Erreurs: ${stats.errors}`);
  console.log(`⏱️  Durée: ${duration} minutes\n`);
  
  console.log('📊 Répartition:');
  console.log(`   • Alimentaire: ${stats.byCategory.food.toLocaleString()}`);
  console.log(`   • Cosmétique: ${stats.byCategory.cosmetic.toLocaleString()}`);
  console.log(`   • Détergent: ${stats.byCategory.detergent.toLocaleString()}\n`);
  
  await mongoose.disconnect();
  process.exit(0);
}

process.on('unhandledRejection', (error) => {
  console.error('\n❌ ERREUR:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Arrêt...');
  await mongoose.disconnect();
  process.exit(0);
});

main();
