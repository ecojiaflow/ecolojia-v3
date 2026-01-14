/**
 * AUDIT SUBCATEGORIES MONGODB
 * Identifie les produits avec subcategory incohérente
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Mapping nom produit → subcategory attendue (mots-clés)
const EXPECTED_MAPPINGS = {
  // Boissons
  'coca': 'soda', 'pepsi': 'soda', 'fanta': 'soda', 'sprite': 'soda', 'orangina': 'soda',
  'cola': 'soda', 'limonade': 'soda', 'schweppes': 'soda',
  'jus': 'juice', 'nectar': 'juice', 'smoothie': 'juice',
  'eau': 'water', 'evian': 'water', 'vittel': 'water', 'volvic': 'water', 'cristaline': 'water',
  'café': 'coffee', 'nescafé': 'coffee', 'cappuccino': 'coffee',
  'thé': 'tea', 'lipton': 'tea', 'infusion': 'tea',
  'lait': 'milk', 'lactel': 'milk', 'candia': 'milk',
  'bière': 'beer', 'heineken': 'beer', 'kronenbourg': 'beer',
  'vin': 'wine',
  
  // Produits laitiers
  'yaourt': 'yogurt', 'yogourt': 'yogurt', 'danone': 'yogurt', 'activia': 'yogurt', 'yoplait': 'yogurt',
  'fromage': 'cheese', 'camembert': 'cheese', 'brie': 'cheese', 'comté': 'cheese', 'emmental': 'cheese',
  'crème': 'cream', 'beurre': 'butter', 'margarine': 'margarine',
  
  // Pains et céréales
  'pain': 'bread', 'baguette': 'bread', 'brioche': 'bread', 'croissant': 'bread',
  'céréales': 'breakfast-cereals', 'muesli': 'breakfast-cereals', 'corn flakes': 'breakfast-cereals',
  'pâtes': 'pasta', 'spaghetti': 'pasta', 'penne': 'pasta', 'tagliatelle': 'pasta',
  'riz': 'rice',
  
  // Snacks et sucreries
  'chips': 'chips', 'lay\'s': 'chips', 'pringles': 'chips',
  'biscuit': 'biscuits', 'cookies': 'biscuits', 'oreo': 'biscuits', 'petit beurre': 'biscuits',
  'chocolat': 'chocolate', 'nutella': 'chocolate-spread', 'milka': 'chocolate', 'lindt': 'chocolate',
  'bonbon': 'candy', 'haribo': 'candy', 'carambar': 'candy',
  'glace': 'ice-cream', 'häagen': 'ice-cream', 'magnum': 'ice-cream',
  
  // Viandes et protéines
  'poulet': 'meat', 'bœuf': 'meat', 'porc': 'meat', 'jambon': 'meat', 'saucisse': 'meat',
  'poisson': 'fish', 'saumon': 'fish', 'thon': 'fish', 'cabillaud': 'fish',
  'œuf': 'egg', 'oeuf': 'egg',
  'tofu': 'tofu',
  
  // Légumes et fruits
  'salade': 'salad', 'laitue': 'salad',
  'tomate': 'vegetable', 'carotte': 'vegetable', 'courgette': 'vegetable', 'haricot': 'vegetable',
  'pomme': 'fruit', 'banane': 'fruit', 'orange': 'fruit', 'fraise': 'fruit',
  
  // Huiles et matières grasses
  'huile': 'oil', 'olive': 'oil', 'tournesol': 'oil',
};

// Catégories valides par type
const VALID_CATEGORIES = {
  beverages: ['soda', 'sodas', 'juice', 'juices', 'water', 'coffee', 'tea', 'milk', 'beer', 'wine', 'beverage'],
  dairy: ['yogurt', 'yogurts', 'cheese', 'milk', 'cream', 'butter'],
  bakery: ['bread', 'breakfast-cereals', 'cereal', 'pasta', 'rice'],
  snacks: ['chips', 'biscuits', 'biscuit', 'chocolate', 'chocolate-spread', 'chocolate-bar', 'candy', 'ice-cream', 'snack'],
  proteins: ['meat', 'fish', 'egg', 'tofu', 'legume'],
  produce: ['vegetable', 'fruit', 'salad', 'legume'],
  fats: ['oil', 'butter', 'margarine', 'butter-spread']
};

async function audit() {
  console.log('🔍 AUDIT SUBCATEGORIES MONGODB\n');
  console.log('═'.repeat(70));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
    
    // Stats globales
    const total = await Product.countDocuments({ categoryType: 'food' });
    const withSubcategory = await Product.countDocuments({ categoryType: 'food', subcategory: { $exists: true, $ne: null, $ne: '' } });
    const withoutSubcategory = total - withSubcategory;
    
    console.log(`📊 STATISTIQUES GLOBALES`);
    console.log(`   Total produits alimentaires: ${total}`);
    console.log(`   Avec subcategory: ${withSubcategory}`);
    console.log(`   Sans subcategory: ${withoutSubcategory}\n`);
    
    // Récupérer échantillon de produits
    const products = await Product.find({ 
      categoryType: 'food',
      subcategory: { $exists: true, $ne: null, $ne: '' }
    })
    .select('name brand subcategory barcode')
    .limit(500)
    .lean();
    
    const issues = [];
    const stats = { correct: 0, suspicious: 0, unknown: 0 };
    
    for (const p of products) {
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const sub = (p.subcategory || '').toLowerCase();
      const combined = `${name} ${brand}`;
      
      let expectedSub = null;
      let matchedKeyword = null;
      
      // Chercher un mot-clé qui matche
      for (const [keyword, expected] of Object.entries(EXPECTED_MAPPINGS)) {
        if (combined.includes(keyword.toLowerCase())) {
          expectedSub = expected;
          matchedKeyword = keyword;
          break;
        }
      }
      
      if (expectedSub) {
        // Vérifier si la subcategory actuelle est cohérente
        const isCorrect = sub.includes(expectedSub) || expectedSub.includes(sub) || sub === expectedSub;
        
        if (!isCorrect) {
          stats.suspicious++;
          issues.push({
            barcode: p.barcode,
            name: p.name,
            brand: p.brand,
            currentSub: p.subcategory,
            expectedSub: expectedSub,
            matchedKeyword: matchedKeyword,
            confidence: 'HIGH'
          });
        } else {
          stats.correct++;
        }
      } else {
        stats.unknown++;
      }
    }
    
    // Afficher les issues
    console.log(`\n🔴 INCOHÉRENCES DÉTECTÉES: ${issues.length}`);
    console.log('═'.repeat(70));
    
    // Grouper par type d'erreur
    const grouped = {};
    for (const issue of issues) {
      const key = `${issue.currentSub} → ${issue.expectedSub}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(issue);
    }
    
    // Afficher par groupe (top 20)
    const sortedGroups = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length).slice(0, 20);
    
    for (const [key, items] of sortedGroups) {
      console.log(`\n⚠️  ${key} (${items.length} produits)`);
      items.slice(0, 3).forEach(item => {
        console.log(`   • ${item.name} (${item.barcode}) [mot-clé: ${item.matchedKeyword}]`);
      });
      if (items.length > 3) {
        console.log(`   ... et ${items.length - 3} autres`);
      }
    }
    
    // Résumé
    console.log('\n' + '═'.repeat(70));
    console.log('📈 RÉSUMÉ');
    console.log(`   ✅ Cohérents: ${stats.correct}`);
    console.log(`   ⚠️  Suspects: ${stats.suspicious}`);
    console.log(`   ❓ Non évalués: ${stats.unknown}`);
    console.log(`   📊 Taux d'erreur estimé: ${((stats.suspicious / (stats.correct + stats.suspicious)) * 100).toFixed(1)}%`);
    
    // Exporter les issues pour correction
    if (issues.length > 0) {
      const fs = require('fs');
      const outputPath = './scripts/subcategory-issues.json';
      fs.writeFileSync(outputPath, JSON.stringify(issues, null, 2));
      console.log(`\n💾 Issues exportées dans: ${outputPath}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Déconnecté de MongoDB');
  }
}

audit();
