/**
 * SCRIPT DE CORRECTION DES SUBCATEGORIES
 * Corrige les produits mal classes en utilisant le classifier par regles
 * 
 * Usage: node scripts/fix-subcategories.js [--dry-run] [--limit=1000]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const classifier = require('../src/services/categoryClassifier.service');

const BATCH_SIZE = 100;

async function connectDB() {
  console.log('Connexion MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connecte a:', mongoose.connection.db.databaseName);
}

async function fixSubcategories(options = {}) {
  const { dryRun = false, limit = null } = options;
  
  console.log('\n========== CORRECTION SUBCATEGORIES ==========');
  console.log(`Mode: ${dryRun ? 'DRY RUN (simulation)' : 'REEL (modifications)'}`);
  console.log(`Limite: ${limit || 'Aucune'}`);
  
  // Stats
  const stats = {
    total: 0,
    corrected: 0,
    unchanged: 0,
    errors: 0,
    byCategory: {}
  };
  
  // Query tous les produits food
  const query = { categoryType: 'food' };
  const totalCount = await Product.countDocuments(query);
  console.log(`\nProduits food en base: ${totalCount}`);
  
  const maxToProcess = limit ? Math.min(limit, totalCount) : totalCount;
  console.log(`Produits a traiter: ${maxToProcess}\n`);
  
  // Traiter par batch
  let processed = 0;
  let cursor = Product.find(query).select('barcode name subcategory tags ingredients_text categories_tags').lean().cursor();
  
  let batch = [];
  
  for await (const product of cursor) {
    if (limit && processed >= limit) break;
    
    // Classifier le produit
    const result = classifier.classifyProduct(product);
    const oldSubcat = product.subcategory || 'none';
    const newSubcat = result.subcategory;
    
    stats.total++;
    
    if (oldSubcat !== newSubcat && result.confidence >= 0.5) {
      stats.corrected++;
      stats.byCategory[newSubcat] = (stats.byCategory[newSubcat] || 0) + 1;
      
      if (!dryRun) {
        batch.push({
          updateOne: {
            filter: { barcode: product.barcode },
            update: {
              $set: {
                subcategory: newSubcat,
                tags: classifier.generateTags(newSubcat, product.name),
                classificationSource: 'rule-based-v1',
                classificationKeyword: result.matchedKeyword,
                classifiedAt: new Date()
              }
            }
          }
        });
        
        // Execute batch si plein
        if (batch.length >= BATCH_SIZE) {
          await Product.bulkWrite(batch);
          batch = [];
        }
      }
      
      // Log premiers exemples
      if (stats.corrected <= 10) {
        console.log(`  [CORRIGE] "${product.name}": ${oldSubcat} -> ${newSubcat} (match: ${result.matchedKeyword})`);
      }
    } else {
      stats.unchanged++;
    }
    
    processed++;
    
    // Progress
    if (processed % 1000 === 0) {
      console.log(`  Progress: ${processed}/${maxToProcess} (${Math.round(processed/maxToProcess*100)}%)`);
    }
  }
  
  // Execute remaining batch
  if (batch.length > 0 && !dryRun) {
    await Product.bulkWrite(batch);
  }
  
  // Resultats
  console.log('\n========== RESULTATS ==========');
  console.log(`Total traites: ${stats.total}`);
  console.log(`Corriges: ${stats.corrected}`);
  console.log(`Inchanges: ${stats.unchanged}`);
  console.log(`Erreurs: ${stats.errors}`);
  console.log('\nPar categorie:');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
  
  return stats;
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;
  
  try {
    await connectDB();
    await fixSubcategories({ dryRun, limit });
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDeconnecte.');
  }
}

main();
