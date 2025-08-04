// backend/scripts/import-products.js
// Script pour importer des vrais produits depuis Open Food Facts

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Modèle Product simplifié
const productSchema = new mongoose.Schema({
  barcode: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  brand: String,
  category: { type: String, enum: ['food', 'cosmetic', 'detergent'] },
  
  // Données alimentaires
  ingredients: String,
  nutritionFacts: {
    energy_100g: Number,
    fat_100g: Number,
    saturated_fat_100g: Number,
    carbohydrates_100g: Number,
    sugars_100g: Number,
    proteins_100g: Number,
    salt_100g: Number,
    fiber_100g: Number
  },
  
  // Scores
  nutriscore_grade: String,
  nova_group: Number,
  ecoscore_grade: String,
  
  // Additifs
  additives_tags: [String],
  allergens_tags: [String],
  
  // Images
  image_url: String,
  image_ingredients_url: String,
  image_nutrition_url: String,
  
  // Métadonnées
  imported_from: String,
  imported_at: { type: Date, default: Date.now },
  last_updated: Date
});

const Product = mongoose.model('Product', productSchema);

async function importFromOpenFoodFacts(limit = 100) {
  console.log('🔄 Importation depuis Open Food Facts...');
  
  try {
    // Recherche des produits populaires en France
    const response = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
      params: {
        search_terms: '',
        search_simple: 1,
        action: 'process',
        json: 1,
        page_size: limit,
        page: 1,
        sort_by: 'unique_scans_n', // Produits les plus scannés
        countries_tags_en: 'france'
      }
    });
    
    const products = response.data.products;
    console.log(`📦 ${products.length} produits trouvés`);
    
    let imported = 0;
    let errors = 0;
    
    for (const offProduct of products) {
      try {
        // Vérifier que le produit a les données minimales
        if (!offProduct.code || !offProduct.product_name) {
          continue;
        }
        
        // Mapper les données OFF vers notre modèle
        const productData = {
          barcode: offProduct.code,
          name: offProduct.product_name,
          brand: offProduct.brands,
          category: 'food',
          
          ingredients: offProduct.ingredients_text,
          
          nutritionFacts: {
            energy_100g: offProduct.nutriments?.['energy-kcal_100g'],
            fat_100g: offProduct.nutriments?.fat_100g,
            saturated_fat_100g: offProduct.nutriments?.['saturated-fat_100g'],
            carbohydrates_100g: offProduct.nutriments?.carbohydrates_100g,
            sugars_100g: offProduct.nutriments?.sugars_100g,
            proteins_100g: offProduct.nutriments?.proteins_100g,
            salt_100g: offProduct.nutriments?.salt_100g,
            fiber_100g: offProduct.nutriments?.fiber_100g
          },
          
          nutriscore_grade: offProduct.nutriscore_grade,
          nova_group: offProduct.nova_group,
          ecoscore_grade: offProduct.ecoscore_grade,
          
          additives_tags: offProduct.additives_tags || [],
          allergens_tags: offProduct.allergens_tags || [],
          
          image_url: offProduct.image_url,
          image_ingredients_url: offProduct.image_ingredients_url,
          image_nutrition_url: offProduct.image_nutrition_url,
          
          imported_from: 'openfoodfacts',
          last_updated: new Date(offProduct.last_modified_t * 1000)
        };
        
        // Créer ou mettre à jour le produit
        await Product.findOneAndUpdate(
          { barcode: productData.barcode },
          productData,
          { upsert: true, new: true }
        );
        
        imported++;
        console.log(`✅ Importé: ${productData.name} (${productData.barcode})`);
        
      } catch (error) {
        errors++;
        console.error(`❌ Erreur pour ${offProduct.product_name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Résumé: ${imported} importés, ${errors} erreurs`);
    
  } catch (error) {
    console.error('❌ Erreur d\'import:', error.message);
  }
}

async function importPopularProducts() {
  // Liste de codes-barres de produits populaires en France
  const popularBarcodes = [
    '3017620425035',  // Nutella
    '3033710062003',  // Pom'Potes
    '3017760001830',  // Kinder Bueno
    '5449000000996',  // Coca-Cola
    '3068320055008',  // Evian
    '3228857000166',  // Babybel
    '7613034626844',  // Lion
    '3248830721785',  // Petit Beurre LU
    '5000159407236',  // Mars
    '3033710065967',  // Compote Andros
    '8076809513388',  // Barilla Penne
    '5410188031102',  // Alpro Soja
    '3560070593798',  // Carrefour Bio Lait
    '3329770057258',  // St Michel Madeleines
    '8002270014901',  // Kinder Délice
  ];
  
  console.log('🎯 Import de produits populaires spécifiques...');
  
  for (const barcode of popularBarcodes) {
    try {
      const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      
      if (response.data.status === 1) {
        const offProduct = response.data.product;
        
        const productData = {
          barcode: offProduct.code,
          name: offProduct.product_name,
          brand: offProduct.brands,
          category: 'food',
          ingredients: offProduct.ingredients_text,
          nutritionFacts: {
            energy_100g: offProduct.nutriments?.['energy-kcal_100g'],
            fat_100g: offProduct.nutriments?.fat_100g,
            saturated_fat_100g: offProduct.nutriments?.['saturated-fat_100g'],
            carbohydrates_100g: offProduct.nutriments?.carbohydrates_100g,
            sugars_100g: offProduct.nutriments?.sugars_100g,
            proteins_100g: offProduct.nutriments?.proteins_100g,
            salt_100g: offProduct.nutriments?.salt_100g,
            fiber_100g: offProduct.nutriments?.fiber_100g
          },
          nutriscore_grade: offProduct.nutriscore_grade,
          nova_group: offProduct.nova_group,
          ecoscore_grade: offProduct.ecoscore_grade,
          additives_tags: offProduct.additives_tags || [],
          allergens_tags: offProduct.allergens_tags || [],
          image_url: offProduct.image_url,
          imported_from: 'openfoodfacts'
        };
        
        await Product.findOneAndUpdate(
          { barcode: productData.barcode },
          productData,
          { upsert: true }
        );
        
        console.log(`✅ ${productData.name} - Nutri-Score: ${productData.nutriscore_grade}, NOVA: ${productData.nova_group}`);
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${barcode}:`, error.message);
    }
    
    // Attendre un peu entre les requêtes pour ne pas surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function main() {
  try {
    // Connexion MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
    
    // Importer les produits populaires d'abord
    await importPopularProducts();
    
    // Puis importer plus de produits
    await importFromOpenFoodFacts(200);
    
    // Afficher les statistiques
    const count = await Product.countDocuments();
    const withNutriscore = await Product.countDocuments({ nutriscore_grade: { $exists: true } });
    const withNova = await Product.countDocuments({ nova_group: { $exists: true } });
    
    console.log('\n📊 Base de données:');
    console.log(`- Total produits: ${count}`);
    console.log(`- Avec Nutri-Score: ${withNutriscore}`);
    console.log(`- Avec NOVA: ${withNova}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();