// backend/src/scripts/ingestOpenFoodFacts.js

const axios = require('axios');
const Product = require('../models/Product');
const algoliaService = require('../services/search/algoliaService');
const categoryDetection = require('../data/categoryDetection');
const { connectDB } = require('../config/database');

class OpenFoodFactsIngestion {
  constructor() {
    this.baseUrl = 'https://fr.openfoodfacts.org';
    this.batchSize = 1000;
    this.processedCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Ingestion principale
   */
  async run(options = {}) {
    console.log('Ã°Å¸Å¡â‚¬ Demarrage ingestion OpenFoodFacts');
    
    try {
      // Connexion DB
      await connectDB();
      
      // Options
      const limit = options.limit || 10000;
      const offset = options.offset || 0;
      const country = options.country || 'france';
      
      // Recuperer les produits par batch
      await this.processBatches(country, limit, offset);
      
      // Rapport final
      this.printReport();
      
    } catch (error) {
      console.error('Ã¢ÂÅ’ Erreur ingestion:', error);
      process.exit(1);
    }
  }

  /**
   * Traitement par batches
   */
  async processBatches(country, totalLimit, startOffset) {
    let offset = startOffset;
    let hasMore = true;

    while (hasMore && this.processedCount < totalLimit) {
      try {
        console.log(`\nÃ°Å¸â€œÂ¦ Traitement batch offset=${offset}`);
        
        // Recuperer un batch de produits
        const products = await this.fetchBatch(country, this.batchSize, offset);
        
        if (products.length === 0) {
          hasMore = false;
          break;
        }

        // Traiter le batch
        await this.processBatch(products);
        
        // Synchroniser avec Algolia tous les 5 batches
        if (offset % (this.batchSize * 5) === 0) {
          await this.syncToAlgolia();
        }

        offset += this.batchSize;
        
        // Pause pour ne pas surcharger l'API
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`Ã¢ÂÅ’ Erreur batch offset=${offset}:`, error.message);
        this.errorCount++;
        
        // Continuer malgre l'erreur
        offset += this.batchSize;
      }
    }
  }

  /**
   * Recuperer un batch depuis l'API OFF
   */
  async fetchBatch(country, pageSize, page) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v0/search`, {
        params: {
          countries_tags: country,
          page_size: pageSize,
          page: Math.floor(page / pageSize) + 1,
          fields: 'code,product_name,product_name_fr,brands,categories_tags,ingredients,nutriscore_grade,nova_group,ecoscore_grade,image_front_url,image_ingredients_url,nutriments,allergens_tags,additives_tags'
        },
        timeout: 30000
      });

      return response.data.products || [];
      
    } catch (error) {
      console.error('Erreur fetch API OFF:', error.message);
      return [];
    }
  }

  /**
   * Traiter un batch de produits
   */
  async processBatch(products) {
    const operations = [];

    for (const product of products) {
      // Validation basique
      if (!product.code || !product.product_name) {
        continue;
      }

      try {
        // Transformer le produit
        const transformed = await this.transformProduct(product);
        
        // Detecter la categorie
        const detection = await categoryDetection.detectCategory(transformed);
        transformed.category = detection.category;
        transformed.categoryConfidence = detection.confidence;

        // Preparer l'operation upsert
        operations.push({
          updateOne: {
            filter: { barcode: transformed.barcode },
            update: { $set: transformed },
            upsert: true
          }
        });

        this.processedCount++;

      } catch (error) {
        console.error(`Erreur transformation produit ${product.code}:`, error.message);
        this.errorCount++;
      }
    }

    // Executer les operations en batch
    if (operations.length > 0) {
      try {
        const result = await Product.bulkWrite(operations);
        console.log(`Ã¢Å“â€¦ ${result.upsertedCount} nouveaux, ${result.modifiedCount} mis Â  jour`);
      } catch (error) {
        console.error('Erreur bulkWrite:', error.message);
      }
    }
  }

  /**
   * Transformer un produit OFF vers notre modele
   */
  async transformProduct(offProduct) {
    return {
      // Identifiants
      barcode: offProduct.code,
      externalId: offProduct._id || offProduct.code,
      source: 'openFoodFacts',
      
      // Informations de base
      name: offProduct.product_name || 'Produit sans nom',
      name_fr: offProduct.product_name_fr || offProduct.product_name,
      name_en: offProduct.product_name_en,
      brand: offProduct.brands || 'Marque inconnue',
      
      // Categories
      categories: offProduct.categories_tags || [],
      
      // Images
      images: {
        front: offProduct.image_front_url,
        ingredients: offProduct.image_ingredients_url,
        nutrition: offProduct.image_nutrition_url
      },
      
      // Scores
      scores: {
        nova: offProduct.nova_group ? parseInt(offProduct.nova_group) : null,
        nutriscore: offProduct.nutriscore_grade?.toUpperCase(),
        ecoscore: offProduct.ecoscore_grade?.toUpperCase(),
        healthScore: this.calculateHealthScore(offProduct)
      },
      
      // Ingredients
      ingredients: this.parseIngredients(offProduct.ingredients || []),
      
      // Nutrition
      nutrition: offProduct.nutriments ? {
        per100g: {
          energy: offProduct.nutriments['energy-kcal_100g'],
          fat: offProduct.nutriments.fat_100g,
          saturatedFat: offProduct.nutriments['saturated-fat_100g'],
          carbohydrates: offProduct.nutriments.carbohydrates_100g,
          sugars: offProduct.nutriments.sugars_100g,
          protein: offProduct.nutriments.proteins_100g,
          salt: offProduct.nutriments.salt_100g,
          fiber: offProduct.nutriments.fiber_100g,
          sodium: offProduct.nutriments.sodium_100g
        }
      } : null,
      
      // Allergenes et additifs
      allergens: offProduct.allergens_tags || [],
      additives: offProduct.additives_tags || [],
      
      // Metadonnees
      status: 'active',
      lastSyncedAt: new Date(),
      importedAt: new Date()
    };
  }

  /**
   * Parser les ingredients
   */
  parseIngredients(ingredients) {
    if (!Array.isArray(ingredients)) return [];
    
    return ingredients.map(ing => ({
      name: ing.text || ing.id || 'Ingredient',
      percentage: ing.percent_estimate,
      isAllergen: ing.allergen === 'yes',
      vegan: ing.vegan === 'yes',
      vegetarian: ing.vegetarian === 'yes'
    }));
  }

  /**
   * Calculer le score sante
   */
  calculateHealthScore(product) {
    let score = 50; // Base
    
    // Impact NOVA
    if (product.nova_group) {
      const nova = parseInt(product.nova_group);
      score -= (nova - 1) * 15; // -15 points par niveau NOVA
    }
    
    // Impact Nutri-Score
    const nutriscoreImpact = {
      'A': 20, 'B': 10, 'C': 0, 'D': -10, 'E': -20
    };
    
    if (product.nutriscore_grade) {
      score += nutriscoreImpact[product.nutriscore_grade.toUpperCase()] || 0;
    }
    
    // Impact additifs
    if (product.additives_n) {
      score -= Math.min(product.additives_n * 2, 15);
    }
    
    // Bonus bio
    if (product.labels_tags?.includes('en:organic')) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Synchroniser avec Algolia
   */
  async syncToAlgolia() {
    try {
      console.log('Ã°Å¸â€â€ž Synchronisation Algolia...');
      
      // Recuperer les produits non synchronises
      const products = await Product.find({
        'algolia.synced': { $ne: true }
      }).limit(1000);
      
      if (products.length === 0) {
        return;
      }
      
      // Indexer dans Algolia
      await algoliaService.indexProducts(products);
      
      // Marquer comme synchronises
      const productIds = products.map(p => p._id);
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { 'algolia.synced': true, 'algolia.syncedAt': new Date() } }
      );
      
      console.log(`Ã¢Å“â€¦ ${products.length} produits synchronises avec Algolia`);
      
    } catch (error) {
      console.error('Erreur sync Algolia:', error.message);
    }
  }

  /**
   * Utilitaires
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printReport() {
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log('\nÃ°Å¸â€œÅ  RAPPORT D\'INGESTION');
    console.log('Ã¢â€¢Â'.repeat(50));
    console.log(`Ã¢Å“â€¦ Produits traites: ${this.processedCount}`);
    console.log(`Ã¢ÂÅ’ Erreurs: ${this.errorCount}`);
    console.log(`Ã¢ÂÂ±Ã¯Â¸Â Duree: ${Math.round(duration)}s`);
    console.log(`Ã°Å¸â€œË† Vitesse: ${Math.round(this.processedCount / duration)} produits/s`);
    console.log('Ã¢â€¢Â'.repeat(50));
  }
}

// Script CLI
if (require.main === module) {
  const ingestion = new OpenFoodFactsIngestion();
  
  // Parsing des arguments
  const args = process.argv.slice(2);
  const options = {
    limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || 10000,
    offset: parseInt(args.find(a => a.startsWith('--offset='))?.split('=')[1]) || 0,
    country: args.find(a => a.startsWith('--country='))?.split('=')[1] || 'france'
  };
  
  console.log('Options:', options);
  
  // Lancer l'ingestion
  ingestion.run(options).then(() => {
    console.log('Ã¢Å“â€¦ Ingestion terminee');
    process.exit(0);
  }).catch(error => {
    console.error('Ã¢ÂÅ’ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = OpenFoodFactsIngestion;

// ====================================
// backend/src/scripts/syncAlgolia.js
// ====================================

const Product = require('../models/Product');
const algoliaService = require('../services/search/algoliaService');
const { connectDB } = require('../config/database');

class AlgoliaSync {
  constructor() {
    this.batchSize = 1000;
    this.totalSynced = 0;
    this.errors = 0;
  }

  async run(options = {}) {
    console.log('Ã°Å¸â€â€ž Demarrage synchronisation Algolia');
    
    try {
      await connectDB();
      
      if (options.clear) {
        await this.clearIndex();
      }
      
      await this.syncAllProducts(options.force);
      
      this.printReport();
      
    } catch (error) {
      console.error('Ã¢ÂÅ’ Erreur sync:', error);
      process.exit(1);
    }
  }

  async clearIndex() {
    console.log('Ã¢Å¡Â Ã¯Â¸Â Suppression de l\'index Algolia...');
    await algoliaService.clearIndex();
  }

  async syncAllProducts(force = false) {
    const query = force ? {} : {
      $or: [
        { 'algolia.synced': { $ne: true } },
        { 'algolia.syncedAt': { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    };

    const totalProducts = await Product.countDocuments(query);
    console.log(`Ã°Å¸â€œÅ  ${totalProducts} produits Â  synchroniser`);

    let offset = 0;

    while (offset < totalProducts) {
      try {
        const products = await Product.find(query)
          .skip(offset)
          .limit(this.batchSize)
          .lean();

        if (products.length === 0) break;

        await algoliaService.indexProducts(products);

        // Marquer comme synchronises
        const productIds = products.map(p => p._id);
        await Product.updateMany(
          { _id: { $in: productIds } },
          { 
            $set: { 
              'algolia.synced': true, 
              'algolia.syncedAt': new Date() 
            } 
          }
        );

        this.totalSynced += products.length;
        console.log(`Ã¢Å“â€¦ ${this.totalSynced}/${totalProducts} synchronises`);

        offset += this.batchSize;

      } catch (error) {
        console.error(`Ã¢ÂÅ’ Erreur batch ${offset}:`, error.message);
        this.errors++;
        offset += this.batchSize;
      }
    }
  }

  printReport() {
    console.log('\nÃ°Å¸â€œÅ  RAPPORT DE SYNCHRONISATION');
    console.log('Ã¢â€¢Â'.repeat(50));
    console.log(`Ã¢Å“â€¦ Produits synchronises: ${this.totalSynced}`);
    console.log(`Ã¢ÂÅ’ Erreurs: ${this.errors}`);
    
    algoliaService.getIndexStats().then(stats => {
      console.log(`Ã°Å¸â€œÂ Total dans Algolia: ${stats.totalRecords || 0}`);
      console.log('Ã¢â€¢Â'.repeat(50));
    });
  }
}

// CLI
if (require.main === module) {
  const sync = new AlgoliaSync();
  
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force'),
    clear: args.includes('--clear')
  };
  
  sync.run(options).then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = AlgoliaSync;
