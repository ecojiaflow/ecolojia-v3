const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

class RulesPhase2 {
  constructor() {
    // Règles élargies avec patterns multi-langues
    this.rules = {
      // SNACKS & BISCUITS
      'snack': [
        'cracker', 'sablé', 'fourré', 'biscuit', 'cookie',
        'wafer', 'gaufrette', 'galette', 'palets'
      ],
      
      // CHOCOLAT (multi-langues)
      'chocolate-bar': [
        'schokolade', 'cioccolato', 'chocolate', 'chocolat',
        'vollmilch', 'milchschokolade'
      ],
      
      // PRODUITS VÉGÉTAUX
      'plant-based': [
        'soja', 'tofu', 'seitan', 'tempeh', 'veggie',
        'végétal', 'plant'
      ],
      
      // POISSONS
      'seafood': [
        'fish', 'poisson', 'saumon', 'thon', 'sardine',
        'truite', 'anchois', 'maquereau'
      ],
      
      // BREAKFAST
      'breakfast': [
        'müsli', 'muesli', 'céréales', 'granola', 'porridge',
        'petit déjeuner', 'flakes'
      ],
      
      // FROMAGE
      'cheese': [
        'fromage', 'cheese', 'emmental', 'cheddar', 'parmesan',
        'mozzarella', 'chèvre', 'brie', 'camembert'
      ],
      
      // CONDIMENTS
      'condiment': [
        'sauce', 'ketchup', 'mayonnaise', 'moutarde', 'mustard',
        'vinaigrette', 'dressing'
      ],
      
      // PAIN & VIENNOISERIE
      'bread': [
        'pain', 'bread', 'baguette', 'toast', 'brioche'
      ],
      
      // CONFITURE & MIEL
      'jam': [
        'confiture', 'jam', 'marmelade', 'miel', 'honey'
      ],
      
      // FRUITS SECS
      'dried-fruit': [
        'figue', 'fig', 'abricot', 'apricot', 'raisin sec',
        'cranberries', 'dattes'
      ]
    };
    
    // Fallback par tags élargis
    this.tagFallback = {
      'organic': 'snack',  // Si seulement "organic", probablement snack
      'cereal': 'breakfast',
      'fish': 'seafood',
      'cheese': 'cheese',
      'fruit': 'dried-fruit'
    };
  }

  findSubcategory(product) {
    const name = (product.name || '').toLowerCase();
    const tags = product.tags || [];
    
    // 1. Chercher correspondance dans les règles élargies
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
    
    return null;
  }

  async enrichAll() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('=== ENRICHISSEMENT PHASE 2 (RÈGLES ÉLARGIES) ===\n');
    
    // Récupérer produits encore sans subcategory
    const products = await Product.find({
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: '' }
      ]
    })
      .select('_id name brand tags categoryType')
      .lean();
    
    console.log(`Produits à enrichir: ${products.length}\n`);
    
    const stats = {
      total: products.length,
      enriched: 0,
      bySubcategory: {}
    };
    
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
                enrichedBy: 'rules-phase2',
                enrichedAt: new Date()
              }
            }
          }
        });
        
        stats.enriched++;
        stats.bySubcategory[subcategory] = (stats.bySubcategory[subcategory] || 0) + 1;
      }
    }
    
    // Exécuter
    if (bulkOps.length > 0) {
      console.log('Application règles élargies...');
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
    
    // État final
    const finalCount = await Product.countDocuments({
      subcategory: { $exists: true, $ne: null, $ne: '' }
    });
    const totalProducts = await Product.countDocuments();
    
    console.log(`\n=== ÉTAT FINAL BASE COMPLÈTE ===`);
    console.log(`Total produits: ${totalProducts}`);
    console.log(`Avec subcategory: ${finalCount} (${((finalCount/totalProducts)*100).toFixed(1)}%)`);
    console.log(`Sans subcategory: ${totalProducts - finalCount}`);
    
    // Si reste des non enrichis
    if (stats.total - stats.enriched > 0) {
      console.log('\n=== ÉCHANTILLON ENCORE NON ENRICHIS ===');
      const stillNotEnriched = await Product.find({
        $or: [
          { subcategory: { $exists: false } },
          { subcategory: null },
          { subcategory: '' }
        ]
      })
        .select('name brand tags categoryType')
        .limit(20)
        .lean();
      
      stillNotEnriched.forEach(p => {
        console.log(`  - ${p.name}`);
        console.log(`    Tags: ${p.tags?.join(', ') || 'AUCUN'}`);
        console.log(`    Catégorie: ${p.categoryType || 'UNDEFINED'}`);
      });
      
      console.log(`\n💡 RECOMMANDATION:`);
      const remaining = stats.total - stats.enriched;
      if (remaining < 100) {
        console.log(`   ${remaining} produits restants → Enrichissement manuel ou IA ciblé`);
      } else {
        console.log(`   ${remaining} produits restants → Ajouter règles ou IA en dernier recours`);
      }
    }
    
    await mongoose.disconnect();
    process.exit(0);
  }
}

const service = new RulesPhase2();
service.enrichAll();
