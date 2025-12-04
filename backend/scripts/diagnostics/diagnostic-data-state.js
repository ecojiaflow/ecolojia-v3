/**
 * SCRIPT DE DIAGNOSTIC - ÉTAT DES DONNÉES PRODUITS
 * 
 * Objectif : Auditer l'état actuel de la base MongoDB
 * avant enrichissement batch subcategory + tags
 * 
 * @author Lead Technique Senior
 * @date 2025-12-04
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connexion MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecolojia';

async function runDiagnostic() {
  try {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('   DIAGNOSTIC DONNÉES PRODUITS - ECOLOJIA V3.1');
    console.log('═══════════════════════════════════════════════════\n');
    
    // Connexion
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connexion MongoDB établie\n');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    // === 1. STATISTIQUES GLOBALES ===
    console.log('📊 STATISTIQUES GLOBALES');
    console.log('─────────────────────────────────────────────────\n');
    
    const totalProducts = await Product.countDocuments();
    console.log(`Total produits : ${totalProducts.toLocaleString()}`);
    
    // Par catégorie
    const byCategory = await Product.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nRépartition par catégorie :');
    byCategory.forEach(cat => {
      const pct = ((cat.count / totalProducts) * 100).toFixed(1);
      console.log(`  - ${cat._id || 'undefined'}: ${cat.count.toLocaleString()} (${pct}%)`);
    });
    
    // === 2. COMPLÉTUDE SUBCATEGORY ===
    console.log('\n\n🔍 COMPLÉTUDE SUBCATEGORY');
    console.log('─────────────────────────────────────────────────\n');
    
    const withSubcategory = await Product.countDocuments({
      subcategory: { $exists: true, $ne: null, $ne: '' }
    });
    
    const subcategoryPct = ((withSubcategory / totalProducts) * 100).toFixed(1);
    console.log(`Produits avec subcategory : ${withSubcategory.toLocaleString()} / ${totalProducts.toLocaleString()} (${subcategoryPct}%)`);
    console.log(`Produits SANS subcategory : ${(totalProducts - withSubcategory).toLocaleString()} (${(100 - subcategoryPct).toFixed(1)}%)`);
    
    // Par catégorie
    console.log('\nPar catégorie :');
    for (const cat of byCategory) {
      const catTotal = cat.count;
      const catWithSub = await Product.countDocuments({
        categoryType: cat._id,
        subcategory: { $exists: true, $ne: null, $ne: '' }
      });
      const pct = ((catWithSub / catTotal) * 100).toFixed(1);
      console.log(`  - ${cat._id || 'undefined'}: ${catWithSub.toLocaleString()} / ${catTotal.toLocaleString()} (${pct}%)`);
    }
    
    // === 3. COMPLÉTUDE TAGS ===
    console.log('\n\n🏷️  COMPLÉTUDE TAGS');
    console.log('─────────────────────────────────────────────────\n');
    
    const withTags = await Product.countDocuments({
      tags: { $exists: true, $ne: null, $not: { $size: 0 } }
    });
    
    const tagsPct = ((withTags / totalProducts) * 100).toFixed(1);
    console.log(`Produits avec tags : ${withTags.toLocaleString()} / ${totalProducts.toLocaleString()} (${tagsPct}%)`);
    console.log(`Produits SANS tags : ${(totalProducts - withTags).toLocaleString()} (${(100 - tagsPct).toFixed(1)}%)`);
    
    // Par catégorie
    console.log('\nPar catégorie :');
    for (const cat of byCategory) {
      const catTotal = cat.count;
      const catWithTags = await Product.countDocuments({
        categoryType: cat._id,
        tags: { $exists: true, $ne: null, $not: { $size: 0 } }
      });
      const pct = ((catWithTags / catTotal) * 100).toFixed(1);
      console.log(`  - ${cat._id || 'undefined'}: ${catWithTags.toLocaleString()} / ${catTotal.toLocaleString()} (${pct}%)`);
    }
    
    // === 4. PRODUITS LES PLUS SCANNÉS (PRIORITÉ) ===
    console.log('\n\n📈 TOP 10 PRODUITS LES PLUS SCANNÉS');
    console.log('─────────────────────────────────────────────────\n');
    
    const topScanned = await Product.find({
      scanCount: { $exists: true, $gt: 0 }
    })
    .sort({ scanCount: -1 })
    .limit(10)
    .select('name productName barcode categoryType subcategory tags scanCount');
    
    topScanned.forEach((p, i) => {
      const name = p.name || p.productName || 'Sans nom';
      const hasSub = p.subcategory ? '✅' : '❌';
      const hasTags = (p.tags && p.tags.length > 0) ? '✅' : '❌';
      console.log(`${i + 1}. ${name.substring(0, 40)}`);
      console.log(`   Barcode: ${p.barcode || 'N/A'} | Catégorie: ${p.categoryType || 'N/A'}`);
      console.log(`   Scans: ${p.scanCount} | Subcategory: ${hasSub} | Tags: ${hasTags}`);
      console.log('');
    });
    
    // === 5. EXEMPLES DE PRODUITS SANS DONNÉES ===
    console.log('\n📋 EXEMPLES DE PRODUITS SANS SUBCATEGORY/TAGS');
    console.log('─────────────────────────────────────────────────\n');
    
    const missingData = await Product.find({
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: '' },
        { tags: { $exists: false } },
        { tags: null },
        { tags: { $size: 0 } }
      ]
    })
    .limit(5)
    .select('name productName barcode categoryType subcategory tags');
    
    missingData.forEach((p, i) => {
      const name = p.name || p.productName || 'Sans nom';
      console.log(`${i + 1}. ${name.substring(0, 50)}`);
      console.log(`   Barcode: ${p.barcode || 'N/A'}`);
      console.log(`   Catégorie: ${p.categoryType || 'N/A'}`);
      console.log(`   Subcategory: ${p.subcategory || '(vide)'}`);
      console.log(`   Tags: ${p.tags && p.tags.length > 0 ? p.tags.join(', ') : '(vide)'}`);
      console.log('');
    });
    
    // === 6. RECOMMANDATIONS ===
    console.log('\n\n💡 RECOMMANDATIONS');
    console.log('─────────────────────────────────────────────────\n');
    
    const needEnrichment = totalProducts - Math.max(withSubcategory, withTags);
    console.log(`🎯 Produits à enrichir en priorité : ~${needEnrichment.toLocaleString()}`);
    
    if (subcategoryPct < 50) {
      console.log('⚠️  CRITIQUE : Moins de 50% des produits ont subcategory');
      console.log('   → Prioriser enrichissement batch subcategory');
    }
    
    if (tagsPct < 50) {
      console.log('⚠️  CRITIQUE : Moins de 50% des produits ont tags');
      console.log('   → Prioriser enrichissement batch tags');
    }
    
    console.log('\n✅ Stratégie recommandée :');
    console.log('   1. Enrichir top 1000 produits scannés (impact immédiat)');
    console.log('   2. Enrichir produits alimentaires (priorité scoring)');
    console.log('   3. Enrichir cosmétiques et détergents');
    
    // === 7. SAUVEGARDE RAPPORT ===
    const report = {
      date: new Date().toISOString(),
      stats: {
        total: totalProducts,
        withSubcategory,
        withTags,
        subcategoryPct: parseFloat(subcategoryPct),
        tagsPct: parseFloat(tagsPct)
      },
      byCategory: byCategory.map(c => ({
        category: c._id,
        count: c.count
      })),
      topScanned: topScanned.map(p => ({
        name: p.name || p.productName,
        barcode: p.barcode,
        scanCount: p.scanCount,
        hasSubcategory: !!p.subcategory,
        hasTags: p.tags && p.tags.length > 0
      }))
    };
    
    const fs = require('fs');
    const reportPath = './scripts/diagnostics/rapport_diagnostic_' + Date.now() + '.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n📄 Rapport sauvegardé : ${reportPath}`);
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('   DIAGNOSTIC TERMINÉ');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic :', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnexion MongoDB\n');
  }
}

// Exécution
runDiagnostic();
