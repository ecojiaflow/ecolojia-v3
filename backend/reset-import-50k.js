// ========================================
// RESET COMPLET + IMPORT 50K PRODUITS
// ========================================

const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// CONFIGURATION IMPORT 50K
const CONFIG = {
  FOOD: { target: 35000, categories: ['snacks', 'breakfast', 'pasta', 'beverages', 'dairy', 'chocolate', 'biscuits', 'cereals', 'spreads', 'ready-meals'] },
  COSMETIC: { target: 12000, categories: ['face-care', 'body-care', 'hair-care', 'makeup', 'shampoos', 'shower-gels', 'creams', 'soaps'] },
  DETERGENT: { target: 3000, categories: ['cleaning', 'household', 'laundry', 'dishwashing'] },
  BATCH_SIZE: 100,
  DELAY_MS: 300,
  PAGES_PER_CATEGORY: 50
};

// URLs API
const API_URLS = {
  food: 'https://world.openfoodfacts.org/cgi/search.pl',
  cosmetic: 'https://world.openbeautyfacts.org/cgi/search.pl',
  detergent: 'https://world.openbeautyfacts.org/cgi/search.pl'
};

// Fonction de scoring Ecolojia
function calculateEcolojiaScore(product, categoryType) {
  let score = 50;
  
  // Bonus bio/organic
  const labels = product.labels_tags || [];
  if (labels.some(l => l.includes('organic') || l.includes('bio'))) {
    score += 15;
  }
  
  // Bonus nutriscore
  if (product.nutriscore_grade) {
    const bonus = { 'a': 15, 'b': 10, 'c': 5, 'd': 0, 'e': -10 };
    score += bonus[product.nutriscore_grade.toLowerCase()] || 0;
  }
  
  // Bonus ecoscore
  if (product.ecoscore_grade) {
    const bonus = { 'a': 15, 'b': 10, 'c': 5, 'd': 0, 'e': -10 };
    score += bonus[product.ecoscore_grade.toLowerCase()] || 0;
  }
  
  // Pénalité additifs
  const additives = product.additives_tags || [];
  if (additives.length > 10) score -= 15;
  else if (additives.length > 5) score -= 10;
  
  // Pénalité NOVA
  if (product.nova_group && product.nova_group >= 4) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

// Mapper vers format Ecolojia
function mapToEcolojia(product, categoryType, source) {
  const score = calculateEcolojiaScore(product, categoryType);
  
  return {
    barcode: product.code,
    name: product.product_name || product.product_name_fr || product.product_name_en || 'Produit sans nom',
    brand: product.brands || 'Marque inconnue',
    categoryType: categoryType,
    category: categoryType === 'food' ? 'food' : (categoryType === 'cosmetic' ? 'cosmetics' : 'detergents'),
    
    image_url: product.image_url || product.image_front_url || null,
    image_small_url: product.image_small_url || product.image_front_small_url || null,
    
    scores: {
      overallScore: score,
      naturalness: Math.max(0, score - 10),
      health: score,
      environmental: Math.max(0, score - 5),
      social: 50,
      transparency: product.ingredients_text ? 80 : 40,
      processing: product.nova_group ? (5 - product.nova_group) * 20 : 50,
      packaging: 50,
      origin: 50
    },
    
    ingredients: product.ingredients_text ? 
      product.ingredients_text.split(',').slice(0, 30).map(i => ({ name: i.trim() })) : [],
    ingredientsText: product.ingredients_text || '',
    
    ...(categoryType === 'food' && product.nutriments ? {
      nutriments: {
        energy_100g: product.nutriments['energy-kcal_100g'] || product.nutriments.energy_100g,
        fat_100g: product.nutriments.fat_100g,
        saturated_fat_100g: product.nutriments['saturated-fat_100g'],
        carbohydrates_100g: product.nutriments.carbohydrates_100g,
        sugars_100g: product.nutriments.sugars_100g,
        proteins_100g: product.nutriments.proteins_100g,
        salt_100g: product.nutriments.salt_100g,
        fiber_100g: product.nutriments.fiber_100g
      }
    } : {}),
    
    labels: product.labels_tags || [],
    nutriscore_grade: product.nutriscore_grade?.toLowerCase() || null,
    ecoscore_grade: product.ecoscore_grade?.toLowerCase() || null,
    nova_group: product.nova_group || null,
    
    source: source,
    sourceId: product._id || product.code,
    importedAt: new Date(),
    lastUpdated: new Date(),
    
    aiEnriched: false,
    verified: false,
    complete: !!(product.ingredients_text && product.brands && product.product_name)
  };
}

// Import depuis API avec diversification catégories
async function importFromAPI(categoryType, target, categories) {
  console.log(`\n📦 Import ${categoryType}...`);
  console.log(`Objectif: ${target.toLocaleString()} produits`);
  console.log(`Catégories: ${categories.join(', ')}`);
  
  const products = [];
  const seenBarcodes = new Set();
  let imported = 0;
  
  const apiUrl = API_URLS[categoryType];
  
  for (const category of categories) {
    if (imported >= target) break;
    
    console.log(`\n   📂 Catégorie: ${category}`);
    
    for (let page = 1; page <= CONFIG.PAGES_PER_CATEGORY && imported < target; page++) {
      try {
        const pageSize = Math.min(CONFIG.BATCH_SIZE, target - imported);
        
        const response = await axios.get(apiUrl, {
          params: {
            action: 'process',
            json: 1,
            page_size: pageSize,
            page: page,
            tagtype_0: 'categories',
            tag_contains_0: 'contains',
            tag_0: category,
            fields: 'code,product_name,product_name_fr,product_name_en,brands,image_url,image_front_url,image_small_url,image_front_small_url,ingredients_text,nutriments,labels_tags,nutriscore_grade,ecoscore_grade,nova_group,additives_tags,_id'
          },
          timeout: 15000
        });
        
        if (!response.data?.products || response.data.products.length === 0) {
          break;
        }
        
        const batch = response.data.products
          .filter(p => p.code && p.product_name && !seenBarcodes.has(p.code))
          .map(p => {
            seenBarcodes.add(p.code);
            return mapToEcolojia(p, categoryType, apiUrl.includes('openfood') ? 'openfoodfacts' : 'openbeautyfacts');
          });
        
        products.push(...batch);
        imported += batch.length;
        
        if (batch.length > 0) {
          process.stdout.write(`\r   ✅ ${category}: ${imported.toLocaleString()}/${target.toLocaleString()} produits`);
        }
        
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
        
      } catch (error) {
        console.error(`\n   ❌ Erreur ${category} page ${page}:`, error.message);
      }
    }
    
    console.log(''); // Nouvelle ligne après catégorie
  }
  
  return products.slice(0, target);
}

// Fonction principale
async function resetAndImport() {
  console.log('\n🔥 RESET COMPLET + IMPORT 50K PRODUITS');
  console.log('================================================');
  console.log('⚠️  ATTENTION : Suppression totale de la base actuelle');
  console.log('================================================\n');
  
  try {
    // Connexion MongoDB
    console.log('🔄 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à:', mongoose.connection.db.databaseName);
    
    const db = mongoose.connection.db;
    const productsCol = db.collection('products');
    
    // ÉTAPE 1 : BACKUP
    console.log('\n💾 ÉTAPE 1/4 : BACKUP DE LA BASE ACTUELLE');
    console.log('================================================');
    
    const existingProducts = await productsCol.find().toArray();
    const backupFile = `backup-full-products-before-reset-${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(existingProducts, null, 2), 'utf8');
    
    console.log(`✅ Backup créé: ${backupFile}`);
    console.log(`📊 ${existingProducts.length.toLocaleString()} produits sauvegardés`);
    
    // ÉTAPE 2 : SUPPRESSION
    console.log('\n🗑️  ÉTAPE 2/4 : SUPPRESSION TOTALE');
    console.log('================================================');
    
    const deleteResult = await productsCol.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount.toLocaleString()} produits supprimés`);
    
    const remaining = await productsCol.countDocuments();
    console.log(`✅ Collection products vidée (${remaining} produits restants)`);
    
    // ÉTAPE 3 : IMPORT MASSIF
    console.log('\n📦 ÉTAPE 3/4 : IMPORT 50K PRODUITS');
    console.log('================================================');
    console.log('⏱️  Durée estimée : 2-3 heures');
    console.log('================================================');
    
    const startTime = Date.now();
    const allProducts = [];
    
    // Import par catégorie
    for (const [type, config] of Object.entries(CONFIG)) {
      if (!['FOOD', 'COSMETIC', 'DETERGENT'].includes(type)) continue;
      
      const categoryType = type.toLowerCase();
      const products = await importFromAPI(categoryType, config.target, config.categories);
      allProducts.push(...products);
      
      console.log(`\n✅ ${type}: ${products.length.toLocaleString()} produits récupérés`);
    }
    
    // Insertion en masse
    console.log(`\n\n💾 INSERTION DANS MONGODB...`);
    console.log('================================================');
    
    if (allProducts.length > 0) {
      // Insérer par lots de 1000
      const BATCH_INSERT_SIZE = 1000;
      let inserted = 0;
      
      for (let i = 0; i < allProducts.length; i += BATCH_INSERT_SIZE) {
        const batch = allProducts.slice(i, i + BATCH_INSERT_SIZE);
        try {
          await productsCol.insertMany(batch, { ordered: false });
          inserted += batch.length;
          process.stdout.write(`\r   📊 Insertion: ${inserted.toLocaleString()}/${allProducts.length.toLocaleString()} produits`);
        } catch (error) {
          if (error.code === 11000) {
            // Gérer doublons
            inserted += batch.length;
          } else {
            console.error(`\n   ❌ Erreur insertion lot:`, error.message);
          }
        }
      }
      
      console.log('\n✅ Insertion terminée');
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    // ÉTAPE 4 : VÉRIFICATION
    console.log('\n\n✅ ÉTAPE 4/4 : VÉRIFICATION FINALE');
    console.log('================================================');
    
    const totalProducts = await productsCol.countDocuments();
    const byCategoryType = await productsCol.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    const withScore = await productsCol.countDocuments({ 'scores.overallScore': { $exists: true, $ne: null } });
    const withBarcode = await productsCol.countDocuments({ barcode: { $exists: true, $ne: null, $ne: '' } });
    const withBrand = await productsCol.countDocuments({ brand: { $exists: true, $ne: null, $ne: '' } });
    
    console.log(`\n📊 RAPPORT FINAL:`);
    console.log(`Total produits: ${totalProducts.toLocaleString()}`);
    console.log(`⏱️  Durée totale: ${duration} minutes`);
    
    console.log(`\n📂 Distribution par catégorie:`);
    byCategoryType.forEach(cat => {
      const percent = ((cat.count / totalProducts) * 100).toFixed(1);
      console.log(`   ${cat._id}: ${cat.count.toLocaleString()} (${percent}%)`);
    });
    
    console.log(`\n✨ Qualité des données:`);
    console.log(`   Avec barcode: ${withBarcode.toLocaleString()} (${((withBarcode/totalProducts)*100).toFixed(1)}%)`);
    console.log(`   Avec marque: ${withBrand.toLocaleString()} (${((withBrand/totalProducts)*100).toFixed(1)}%)`);
    console.log(`   Avec score: ${withScore.toLocaleString()} (${((withScore/totalProducts)*100).toFixed(1)}%)`);
    
    console.log(`\n✅ IMPORT COMPLET RÉUSSI !`);
    console.log('================================================\n');
    
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

// Lancer
resetAndImport();