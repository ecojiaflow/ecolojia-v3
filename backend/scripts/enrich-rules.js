const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

class RulesBasedEnrichment {
  constructor() {
    // Règles de mapping nom → subcategory
    this.rules = {
      // CHOCOLATE
      'chocolate-bar': [
        'tablette', 'tablet', 'bar', 'noir', 'dark', 'milk chocolate',
        'chocolat noir', 'chocolat au lait', 'excellence', 'lindt',
        'cacao', 'cocoa', '85%', '70%', '95%', 'côte d or'
      ],
      'chocolate-spread': [
        'pâte à tartiner', 'tartiner', 'spread', 'nutella', 'noisette',
        'hazelnut', 'crema', 'crème chocolat'
      ],
      'snack': [
        'cookie', 'biscuit', 'petit écolier', 'petites madeleines',
        'fingers', 'kinder', 'break', 'cooky', 'madeleine'
      ],
      'breakfast': [
        'granola', 'céréales', 'muesli', 'petit déjeuner',
        'breakfast', 'flakes'
      ],
      'candy': [
        'bonbon', 'candy', 'confiserie', 'caramel'
      ],
      'dessert': [
        'gâteau', 'cake', 'pâtisserie', 'brownie', 'mousse'
      ],
      'beverage': [
        'boisson', 'drink', 'lait', 'milk', 'chocolat chaud'
      ]
    };
    
    // Fallback par tag
    this.tagFallback = {
      'chocolate': 'chocolate-bar',
      'spread': 'chocolate-spread',
      'drink': 'beverage',
      'breakfast': 'breakfast',
      'snack': 'snack'
    };
  }

  findSubcategory(product) {
    const name = (product.name || '').toLowerCase();
    const tags = product.tags || [];
    
    // 1. Chercher correspondance dans les règles
    for (const [subcategory, keywords] of Object.entries(this.rules)) {
      for (const keyword of keywords) {
        if (name.includes(keyword.toLowerCase())) {
          return subcategory;
        }
      }
    }
    
    // 2. Fallback par tag
    for (const tag of tags) {
      if (this.tagFallback[tag]) {
        return this.tagFallback[tag];
      }
    }
    
    // 3. Par défaut pour chocolate
    if (tags.includes('chocolate')) {
      return 'chocolate-bar';
    }
    
    return null;
  }

  async enrichAll() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('=== ENRICHISSEMENT PAR RÈGLES (SANS IA) ===\n');
    
    // Récupérer produits sans subcategory
    const products = await Product.find({
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: '' }
      ],
      tags: { $exists: true, $not: { $size: 0 } }
    })
      .select('_id name brand tags categoryType')
      .lean();
    
    console.log(`Produits à enrichir: ${products.length}\n`);
    
    // Statistiques
    const stats = {
      total: products.length,
      enriched: 0,
      bySubcategory: {}
    };
    
    // Préparer bulk operations
    const bulkOps = [];
    
    for (const product of products) {
      const subcategory = this.findSubcategory(product);
      
      if (subcategory) {
        bulkOps.push({
          updateOne: {
            filter: { _id: product._id },
            update: {
              $set: {
                subcategory: subcategory,
                enrichedBy: 'rules',
                enrichedAt: new Date()
              }
            }
          }
        });
        
        stats.enriched++;
        stats.bySubcategory[subcategory] = (stats.bySubcategory[subcategory] || 0) + 1;
      }
    }
    
    // Exécuter en bulk
    if (bulkOps.length > 0) {
      console.log('Application des règles...');
      const result = await Product.bulkWrite(bulkOps);
      console.log(`✅ ${result.modifiedCount} produits enrichis\n`);
    }
    
    // Résultats
    console.log('=== RÉSULTATS PAR SUBCATEGORY ===');
    Object.entries(stats.bySubcategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([sub, count]) => {
        console.log(`  ${sub}: ${count} produits`);
      });
    
    console.log(`\n=== RÉSULTATS GLOBAUX ===`);
    console.log(`Total analysé: ${stats.total}`);
    console.log(`✅ Enrichis: ${stats.enriched} (${((stats.enriched/stats.total)*100).toFixed(1)}%)`);
    console.log(`❌ Non enrichis: ${stats.total - stats.enriched}`);
    
    // État final base
    const finalCount = await Product.countDocuments({
      subcategory: { $exists: true, $ne: null, $ne: '' }
    });
    const totalProducts = await Product.countDocuments();
    
    console.log(`\n=== ÉTAT FINAL BASE ===`);
    console.log(`Total produits: ${totalProducts}`);
    console.log(`Avec subcategory: ${finalCount} (${((finalCount/totalProducts)*100).toFixed(1)}%)`);
    console.log(`Sans subcategory: ${totalProducts - finalCount}`);
    
    // Échantillon non enrichis
    if (stats.total - stats.enriched > 0) {
      console.log('\n=== ÉCHANTILLON NON ENRICHIS ===');
      const notEnriched = await Product.find({
        $or: [
          { subcategory: { $exists: false } },
          { subcategory: null },
          { subcategory: '' }
        ],
        tags: { $exists: true, $not: { $size: 0 } }
      })
        .select('name tags')
        .limit(10)
        .lean();
      
      notEnriched.forEach(p => {
        console.log(`  - ${p.name} (tags: ${p.tags.join(', ')})`);
      });
    }
    
    await mongoose.disconnect();
    process.exit(0);
  }
}

const service = new RulesBasedEnrichment();
service.enrichAll();
