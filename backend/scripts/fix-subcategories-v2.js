/**
 * FIX SUBCATEGORIES V2 - CORRECTIONS FIABLES
 * Corrige uniquement les cas sans ambiguïté
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// Charger les issues
const issues = JSON.parse(fs.readFileSync('subcategory-issues-v2.json', 'utf8'));

// Corrections fiables (sans faux positifs)
const SAFE_CORRECTIONS = {
  // Normalisation pluriel
  'biscuit': 'biscuits',
  'cookie': 'biscuits',
  'yogurt': 'yogurt',
  'chip': 'chips',
  
  // Précisions par source "name" (fiables)
  'dairy->yogurt': true,
  'dairy->cheese': true,
  'snack-salty->chips': true,
  'snack->chips': true,
  'beverage->juice': true,
  'beverage->soda': true,
  'chocolate-bar->chocolate': true,
  'cereal->breakfast-cereals': true,
};

// Corrections à éviter (faux positifs probables)
const SKIP_CORRECTIONS = [
  'chocolate-spread->milk',
  'chocolate-spread->pasta',
  'dessert->milk',
  'chocolate->milk',
  'cereal->chocolate',
  'cereal->milk',
  'biscuit->milk',
  'biscuit->chocolate',
  'pastry->pasta',
];

async function fix() {
  console.log('🔧 FIX SUBCATEGORIES V2\n');
  console.log('═'.repeat(70));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
    
    // Filtrer les corrections fiables
    const safeIssues = issues.filter(issue => {
      const key = `${issue.currentSub}->${issue.expectedSub}`;
      
      // Skip les faux positifs connus
      if (SKIP_CORRECTIONS.includes(key)) return false;
      
      // Accepter les corrections fiables
      if (SAFE_CORRECTIONS[key]) return true;
      
      // Accepter normalisation pluriel
      if (issue.currentSub === 'biscuit' && issue.expectedSub === 'biscuits') return true;
      if (issue.currentSub === 'dairy' && ['yogurt', 'cheese'].includes(issue.expectedSub)) return true;
      if (issue.currentSub === 'snack-salty' && issue.expectedSub === 'chips') return true;
      if (issue.currentSub === 'beverage' && ['juice', 'soda'].includes(issue.expectedSub)) return true;
      if (issue.currentSub === 'chocolate-bar' && issue.expectedSub === 'chocolate') return true;
      
      return false;
    });
    
    console.log(`📊 Issues totales: ${issues.length}`);
    console.log(`✅ Corrections fiables: ${safeIssues.length}`);
    console.log(`⏭️  Ignorées (faux positifs): ${issues.length - safeIssues.length}\n`);
    
    // Grouper par correction
    const grouped = {};
    safeIssues.forEach(i => {
      const key = `${i.currentSub} -> ${i.expectedSub}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    console.log('📋 Corrections à appliquer:');
    Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, count]) => {
        console.log(`   ${count}x ${key}`);
      });
    
    // Appliquer les corrections
    console.log('\n⏳ Application des corrections...');
    let fixed = 0;
    let errors = 0;
    
    for (const issue of safeIssues) {
      try {
        await Product.updateOne(
          { barcode: issue.barcode },
          { $set: { subcategory: issue.expectedSub } }
        );
        fixed++;
        if (fixed % 100 === 0) {
          process.stdout.write(`\r   Corrigé: ${fixed}/${safeIssues.length}`);
        }
      } catch (err) {
        errors++;
      }
    }
    
    console.log(`\n\n✅ Terminé: ${fixed} produits corrigés, ${errors} erreurs`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fix();
