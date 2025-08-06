// backend/src/services/algolia/algoliaSync.js

require('dotenv').config();
const algoliasearch = require('algoliasearch');
const Product = require('../../models/Product');

class AlgoliaSync {
  constructor() {
    // Initialiser le client Algolia avec les clés Admin
    this.client = algoliasearch(
      process.env.ALGOLIA_APP_ID,
      process.env.ALGOLIA_ADMIN_API_KEY // Clé Admin, pas la clé de recherche
    );
    
    // Index principal
    this.index = this.client.initIndex(process.env.ALGOLIA_INDEX_NAME || 'ecolojia_products');
    
    // Configuration de l'index
    this.configureIndex();
  }

  /**
   * Configure les paramètres de l'index Algolia
   */
  async configureIndex() {
    try {
      await this.index.setSettings({
        // Attributs recherchables (par ordre de priorité)
        searchableAttributes: [
          'name',
          'nameTranslations.fr',
          'nameTranslations.en',
          'brand',
          'barcode',
          'categories',
          'tags'
        ],
        
        // Attributs pour facettes (filtres)
        attributesForFaceting: [
          'filterOnly(category)',
          'searchable(brand)',
          'searchable(tags)',
          'nova',
          'nutriscore',
          'ecoscore',
          'certifications.name',
          'status'
        ],
        
        // Attributs à récupérer
        attributesToRetrieve: [
          'objectID',
          'name',
          'nameTranslations',
          'brand',
          'barcode',
          'category',
          'images',
          'nova',
          'nutriscore',
          'ecoscore',
          'healthScore',
          'price',
          'tags'
        ],
        
        // Ranking personnalisé
        customRanking: [
          'desc(metadata.scanCount)',
          'desc(metadata.viewCount)',
          'desc(healthScore)',
          'asc(nova)'
        ],
        
        // Configuration de la recherche
        removeWordsIfNoResults: 'allOptional',
        advancedSyntax: true,
        allowTyposOnNumericTokens: false,
        
        // Highlighting
        attributesToHighlight: [
          'name',
          'brand'
        ],
        
        // Pagination
        hitsPerPage: 20,
        paginationLimitedTo: 1000
      });
      
      console.log('✅ Index Algolia configuré');
    } catch (error) {
      console.error('❌ Erreur configuration Algolia:', error);
    }
  }

  /**
   * Transforme un produit MongoDB pour Algolia
   */
  transformProductForAlgolia(product) {
    const doc = product.toObject ? product.toObject() : product;
    
    // Calculer le healthScore si pas présent
    let healthScore = 50; // Score par défaut
    
    if (doc.category === 'food') {
      // Score basé sur NOVA et Nutriscore - prendre depuis les champs racine ou foodData
      const novaValue = doc.foodData?.novaScore || doc.nova_group || null;
      const nutriValue = doc.foodData?.nutriScore || doc.nutriscore_grade || null;
      
      const novaScore = novaValue ? (5 - novaValue) * 20 : 50;
      const nutriScore = {
        'A': 100, 'B': 80, 'C': 60, 'D': 40, 'E': 20,
        'a': 100, 'b': 80, 'c': 60, 'd': 40, 'e': 20
      }[nutriValue] || 50;
      
      healthScore = Math.round((novaScore + nutriScore) / 2);
    }
    
    return {
      objectID: doc._id.toString(),
      name: doc.name,
      nameTranslations: doc.nameTranslations,
      brand: doc.brand,
      brandSlug: doc.brandSlug,
      barcode: doc.barcode,
      category: doc.category,
      subCategories: doc.subCategories || [],
      tags: doc.tags || [],
      
      // Images
      images: {
        front: doc.images?.front,
        thumb: doc.images?.front // Pour l'affichage dans les résultats
      },
      
      // Scores (selon la catégorie)
      nova: doc.foodData?.novaScore || doc.nova_group || null,
      nutriscore: doc.foodData?.nutriScore || doc.nutriscore_grade?.toUpperCase() || null,
      ecoscore: doc.foodData?.ecoscore || doc.ecoscore_grade?.toUpperCase() || null,
      healthScore: healthScore,
      
      // Données spécifiques food (gestion des anciens et nouveaux formats)
      allergens: doc.foodData?.allergens || doc.allergens_tags || [],
      additives: doc.foodData?.additives?.length || doc.additives_tags?.length || 0,
      
      // Métadonnées
      scanCount: doc.metadata?.scanCount || 0,
      viewCount: doc.metadata?.viewCount || 0,
      
      // Certifications
      certifications: doc.certifications || [],
      labels: doc.labels || [],
      
      // Prix (si disponible)
      price: doc.price?.amount || null,
      
      // Status (optionnel)
      status: doc.status || 'active',
      
      // Timestamps pour tri
      createdAt: doc.metadata?.createdAt?.getTime() || Date.now(),
      updatedAt: doc.metadata?.updatedAt?.getTime() || Date.now()
    };
  }

  /**
   * Synchronise un seul produit
   */
  async syncProduct(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        console.log(`⏭️  Produit ${productId} ignoré (inexistant)`);
        return false;
      }
      
      const algoliaObject = this.transformProductForAlgolia(product);
      await this.index.saveObject(algoliaObject);
      
      console.log(`✅ Produit synchronisé: ${product.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur sync produit ${productId}:`, error);
      return false;
    }
  }

  /**
   * Synchronise tous les produits par batch
   */
  async syncAllProducts(options = {}) {
    const {
      batchSize = 100,
      category = null,
      onProgress = null
    } = options;
    
    console.log('🚀 Démarrage synchronisation Algolia...');
    
    try {
      // Construire la requête
      const query = {};
      if (category) {
        query.category = category;
      }
      
      // Compter le total
      const totalCount = await Product.countDocuments(query);
      console.log(`📊 ${totalCount} produits à synchroniser`);
      
      let processed = 0;
      let synced = 0;
      let errors = 0;
      
      // Traiter par batch
      for (let skip = 0; skip < totalCount; skip += batchSize) {
        const products = await Product.find(query)
          .skip(skip)
          .limit(batchSize)
          .lean();
        
        const algoliaObjects = products.map(product => {
          try {
            return this.transformProductForAlgolia(product);
          } catch (error) {
            console.error(`❌ Erreur transformation ${product.name}:`, error);
            errors++;
            return null;
          }
        }).filter(obj => obj !== null);
        
        if (algoliaObjects.length > 0) {
          try {
            await this.index.saveObjects(algoliaObjects);
            synced += algoliaObjects.length;
            console.log(`✅ Batch ${skip / batchSize + 1}: ${algoliaObjects.length} produits`);
          } catch (error) {
            console.error(`❌ Erreur batch:`, error);
            errors += algoliaObjects.length;
          }
        }
        
        processed += products.length;
        
        // Callback de progression
        if (onProgress) {
          onProgress({
            processed,
            total: totalCount,
            synced,
            errors,
            percentage: Math.round((processed / totalCount) * 100)
          });
        }
        
        // Pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('\n📊 Synchronisation terminée:');
      console.log(`✅ Synchronisés: ${synced}`);
      console.log(`❌ Erreurs: ${errors}`);
      console.log(`⏱️  Total traités: ${processed}`);
      
      return { synced, errors, processed };
      
    } catch (error) {
      console.error('❌ Erreur synchronisation globale:', error);
      throw error;
    }
  }

  /**
   * Supprime un produit de l'index
   */
  async deleteProduct(productId) {
    try {
      await this.index.deleteObject(productId.toString());
      console.log(`🗑️  Produit ${productId} supprimé d'Algolia`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur suppression ${productId}:`, error);
      return false;
    }
  }

  /**
   * Nettoie l'index (supprime les produits qui n'existent plus)
   */
  async cleanIndex() {
    console.log('🧹 Nettoyage de l\'index Algolia...');
    
    try {
      // Récupérer tous les IDs dans MongoDB
      const activeProducts = await Product.find(
        {},
        { _id: 1 }
      ).lean();
      
      const mongoIds = new Set(
        activeProducts.map(p => p._id.toString())
      );
      
      // Parcourir l'index Algolia
      let deletedCount = 0;
      
      await this.index.browseObjects({
        query: '',
        attributesToRetrieve: ['objectID'],
        batch: (batch) => {
          const toDelete = batch
            .filter(obj => !mongoIds.has(obj.objectID))
            .map(obj => obj.objectID);
          
          if (toDelete.length > 0) {
            this.index.deleteObjects(toDelete);
            deletedCount += toDelete.length;
            console.log(`🗑️  Suppression de ${toDelete.length} produits obsolètes`);
          }
        }
      });
      
      console.log(`✅ Nettoyage terminé: ${deletedCount} produits supprimés`);
      return deletedCount;
      
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error);
      throw error;
    }
  }

  /**
   * Statistiques de l'index
   */
  async getIndexStats() {
    try {
      const stats = await this.index.search('', {
        hitsPerPage: 0,
        facets: ['category', 'nova', 'nutriscore']
      });
      
      return {
        totalProducts: stats.nbHits,
        byCategory: stats.facets?.category || {},
        byNova: stats.facets?.nova || {},
        byNutriscore: stats.facets?.nutriscore || {}
      };
    } catch (error) {
      console.error('❌ Erreur stats:', error);
      return null;
    }
  }
}

// Export de la classe
module.exports = AlgoliaSync;
