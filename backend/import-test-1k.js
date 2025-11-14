// ========================================
// IMPORT TEST 1K PRODUITS - OFF/OBF
// ========================================

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// CONFIGURATION
const CONFIG = {
  FOOD: { target: 700, source: 'openfoodfacts' },
  COSMETIC: { target: 250, source: 'openbeautyfacts' },
  DETERGENT: { target: 50, source: 'openbeautyfacts' },
  BATCH_SIZE: 100,
  DELAY_MS: 500 // Délai entre requêtes API
};

// URLs API
const API_URLS = {
  openfoodfacts: 'https://world.openfoodfacts.org/cgi/search.pl',
  openbeautyfacts: 'https://world.openbeautyfacts.org/cgi/search.pl'
};

// Fonction de scoring simple Ecolojia
function calculateEcolojiaScore(product, categoryType) {
  let score = 50; // Score de base
  
  // Bonus si bio
  if (product.labels_tags?.some(l => l.includes('organic') || l.includes('bio'))) {
    score += 15;
  }
  
  // Bonus nutriscore
  if (product.nutriscore_grade) {
    const nutriscoreBonus = { 'a': 15, 'b': 10, 'c': 5, 'd': 0, 'e': -10 };
    score += nutriscoreBonus[product.nutriscore_grade] || 0;
  }
  
  // Bonus ecoscore
  if (product.ecoscore_grade) {
    const ecoscoreBonus = { 'a': 15, 'b': 10, 'c': 5, 'd': 0, 'e': -10 };
    score += ecoscoreBonus[product.ecoscore_grade] || 0;
  }
  
  // Pénalité additifs
  if (product.additives_tags && product.additives_tags.length > 5) {
    score -= 10;
  }
  
  // Limiter entre 0 et 100
  return Math.max(0, Math.min(100, score));
}

// Mapper produit OFF/OBF vers format Ecolojia
function mapToEcolojia(product, categoryType, source) {
  const score = calculateEcolojiaScore(product, categoryType);
  
  return {
    barcode: product.code,
    name: product.product_name || product.product_name_fr || 'Produit sans nom',
    brand: product.brands || 'Marque inconnue',
    categoryType: categoryType,
    category: categoryType === 'food' ? 'food' : (categoryType === 'cosmetic' ? 'cosmetics' : 'detergents'),
    
    // Images
    image_url: product.image_url || product.image_front_url || null,
    image_small_url: product.image_small_url || product.image_front_small_url || null,
    
    // Scores
    scores: {
      overallScore: score,
      naturalness: score > 70 ? score - 10 : score,
      health: score,
      environmental: score > 60 ? score - 5 : score,
      social: 50,
      transparency: product.ingredients_text ? 80 : 40,
      processing: product.nova_group ? (5 - product.nova_group) * 20 : 50,
      packaging: 50,
      origin: 50
    },
    
    // Ingrédients
    ingredients: product.ingredients_text ? 
      product.ingredients_text.split(',').map(i => ({ name: i.trim() })) : [],
    ingredientsText: product.ingredients_text || '',
    
    // Nutrition (si alimentaire)
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
    
    // Labels
    labels: product.labels_tags || [],
    nutriscore_grade: product.nutriscore_grade || null,
    ecoscore_grade: product.ecoscore_grade || null,
    nova_group: product.nova_group || null,
    
    // Métadonnées
    source: source,
    sourceId: product._id || product.code,
    importedAt: new Date(),
    lastUpdated: new Date(),
    
    // Flags
    aiEnriched: false,
    verified: false,
    complete: !!(product.ingredients_text && product.brands)
  };
}

// Fonction d'import depuis OFF/OBF
async function importFromAPI(categoryType, target, source) {
  console.log(`\n📦 Import ${categoryType} depuis ${source}...`);
  console.log(`Objectif: ${target} produits`);
  
  const products = [];
  let page = 1;
  let imported = 0;
  
  while (imported < target) {
    try {
      const pageSize = Math.min(CONFIG.BATCH_SIZE, target - imported);
      
      // Paramètres recherche selon catégorie
      let searchParams = {
        action: 'process',
        json: 1,
        page_size: pageSize,
        page: page,
        fields: 'code,product_name,product_name_fr,brands,image_url,image_front_url,image_small_url,image_front_small_url,ingredients_text,nutriments,labels_tags,nutriscore_grade,ecoscore_grade,nova_group,additives_tags,_id'
      };
      
      // Filtres spécifiques par catégorie
      if (categoryType === 'food') {
        searchParams.tagtype_0 = 'categories';
        searchParams.tag_contains_0 = 'contains';
        searchParams.tag_0 = 'snacks'; // Exemple: snacks
      } else if (categoryType === 'cosmetic') {
        searchParams.tagtype_0 = 'categories';
        searchParams.tag_contains_0 = 'contains';
        searchParams.tag_0 = 'face'; // Exemple: soins visage
      } else if (categoryType === 'detergent') {
        searchParams.tagtype_0 = 'categories';
        searchParams.tag_contains_0 = 'contains';
        searchParams.tag_0 = 'cleaning'; // Exemple: nettoyage
      }
      
      const response = await axios.get(API_URLS[source], { 
        params: searchParams,
        timeout: 10000 
      });
      
      if (!response.data || !response.data.products || response.data.products.length === 0) {
        console.log(`   ⚠️  Page ${page}: Aucun produit trouvé`);
        break;
      }
      
      const batch = response.data.products
        .filter(p => p.code && p.product_name) // Filtrer produits valides
        .map(p => mapToEcolojia(p, categoryType, source));
      
      products.push(...batch);
      imported += batch.length;
      
      console.log(`   ✅ Page ${page}: ${batch.length} produits (${imported}/${target})`);
      
      page++;
      
      // Délai entre requêtes pour respecter rate limit
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
      
    } catch (error) {
      console.error(`   ❌ Erreur page ${page}:`, error.message);
      break;
    }
  }
  
  return products.slice(0, target); // Limiter au target exact
}

// Fonction principale
async function importTest() {
  console.log('\n🚀 DÉMARRAGE IMPORT TEST 1K PRODUITS');
  console.log('================================================');
  console.log('Source: Open Food Facts + Open Beauty Facts');
  console.log('Objectif: 1 000 produits (700 food + 250 cosmetic + 50 detergent)');
  console.log('================================================\n');
  
  try {
    // Connexion MongoDB
    console.log('🔄 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à:', mongoose.connection.db.databaseName);
    
    const db = mongoose.connection.db;
    const productsCol = db.collection('products');
    
    const startTime = Date.now();
    let totalImported = 0;
    let totalSkipped = 0;
    
    // Import par catégorie
    for (const [category, config] of Object.entries(CONFIG)) {
      if (!['FOOD', 'COSMETIC', 'DETERGENT'].includes(category)) continue;
      
      const categoryType = category.toLowerCase();
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📦 CATÉGORIE: ${category}`);
      console.log(`${'='.repeat(50)}`);
      
      // Récupérer produits depuis API
      const products = await importFromAPI(categoryType, config.target, config.source);
      
      console.log(`\n💾 Insertion dans MongoDB...`);
      
      // Insérer dans MongoDB (gérer doublons)
      let inserted = 0;
      let skipped = 0;
      
      for (const product of products) {
        try {
          // Vérifier si existe déjà
          const exists = await productsCol.findOne({ barcode: product.barcode });
          
          if (!exists) {
            await productsCol.insertOne(product);
            inserted++;
          } else {
            skipped++;
          }
        } catch (error) {
          if (error.code === 11000) { // Duplicate key
            skipped++;
          } else {
            console.error(`   ❌ Erreur insertion ${product.barcode}:`, error.message);
          }
        }
      }
      
      totalImported += inserted;
      totalSkipped += skipped;
      
      console.log(`✅ ${category}: ${inserted} insérés, ${skipped} doublons ignorés`);
    }
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    // Rapport final
    console.log(`\n\n${'='.repeat(50)}`);
    console.log('📊 RAPPORT FINAL');
    console.log(`${'='.repeat(50)}`);
    console.log(`✅ Produits importés: ${totalImported}`);
    console.log(`⚠️  Doublons ignorés: ${totalSkipped}`);
    console.log(`⏱️  Durée: ${duration} minutes`);
    
    // État de la base
    const totalProducts = await productsCol.countDocuments();
    const byCategoryType = await productsCol.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log(`\n📦 État de la base:`);
    console.log(`Total produits: ${totalProducts.toLocaleString()}`);
    byCategoryType.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count.toLocaleString()}`);
    });
    
    console.log(`\n✅ Import test terminé avec succès !`);
    console.log(`${'='.repeat(50)}\n`);
    
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

// Lancer l'import
importTest();