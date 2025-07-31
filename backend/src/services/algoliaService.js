// backend/src/services/algoliaService.js

const algoliasearch = require('algoliasearch');

class AlgoliaService {
  constructor() {
    // Vérification des variables d'environnement
    this.appId = process.env.ALGOLIA_APP_ID;
    this.adminKey = process.env.ALGOLIA_ADMIN_API_KEY || process.env.ALGOLIA_ADMIN_KEY;
    this.indexName = process.env.ALGOLIA_INDEX_NAME || 'ecolojia_products';
    this.stagingIndexName = process.env.ALGOLIA_INDEX_STAGING || 'ecolojia_products_staging';

    console.log('🔍 Configuration Algolia:', {
      APP_ID: this.appId ? '✅ Présent' : '❌ Manquant',
      ADMIN_KEY: this.adminKey ? '✅ Présent' : '❌ Manquant',
      INDEX: this.indexName,
      STAGING: this.stagingIndexName
    });

    // Initialiser le client uniquement si configuré
    if (this.appId && this.adminKey) {
      try {
        this.client = algoliasearch(this.appId, this.adminKey);
        this.productsIndex = this.client.initIndex(this.indexName);
        this.stagingIndex = this.client.initIndex(this.stagingIndexName);
        console.log('✅ Client Algolia initialisé');
      } catch (error) {
        console.error('❌ Erreur initialisation Algolia:', error);
        this.client = null;
      }
    } else {
      console.warn('⚠️ Algolia non configuré - mode dégradé activé');
      this.client = null;
    }
  }

  /**
   * Vérifie si le service est configuré
   */
  isConfigured() {
    return !!(this.client && this.productsIndex);
  }

  /**
   * Transforme un produit MongoDB vers le format Algolia optimisé
   */
  transformProductForAlgolia(product) {
    // Gestion sécurisée des valeurs null/undefined
    const safeProduct = {
      id: product._id || product.id,
      title: product.name || product.title || 'Produit sans nom',
      slug: product.slug || this.generateSlug(product.name || product.title),
      description: product.description || '',
      brand: product.brand || '',
      category: product.category || 'other',
      tags: Array.isArray(product.tags) ? product.tags : [],
      images: this.extractImages(product),
      barcode: product.barcode || '',
      
      // Scores
      scores: product.scores || {},
      healthScore: product.scores?.healthScore || 50,
      environmentScore: product.scores?.environmentScore || 50,
      nova: product.scores?.nova || null,
      nutriscore: product.scores?.nutriscore || null,
      ecoscore: product.scores?.ecoscore || null,
      
      // Timestamps
      createdAt: product.createdAt || product.created_at || new Date(),
      updatedAt: product.updatedAt || product.updated_at || new Date(),
      
      // Métadonnées
      source: product.source || 'manual',
      status: product.status || 'active',
      scanCount: product.scanCount || 0
    };

    // Format Algolia avec objectID et champs de recherche optimisés
    return {
      objectID: String(safeProduct.id),
      
      // Champs principaux
      title: safeProduct.title,
      slug: safeProduct.slug,
      description: safeProduct.description,
      brand: safeProduct.brand,
      category: safeProduct.category,
      barcode: safeProduct.barcode,
      tags: safeProduct.tags,
      
      // Images
      imageUrl: safeProduct.images.front || safeProduct.images[0] || null,
      images: safeProduct.images,
      
      // Scores pour le ranking
      healthScore: safeProduct.healthScore,
      environmentScore: safeProduct.environmentScore,
      nova: safeProduct.nova,
      nutriscore: safeProduct.nutriscore,
      ecoscore: safeProduct.ecoscore,
      
      // Champs de recherche optimisés (lowercase pour la recherche)
      _searchableTitle: safeProduct.title.toLowerCase().trim(),
      _searchableBrand: safeProduct.brand.toLowerCase().trim(),
      _searchableTags: safeProduct.tags.join(' ').toLowerCase(),
      _searchableDescription: safeProduct.description.toLowerCase().trim(),
      _searchableBarcode: safeProduct.barcode,
      
      // Classification et scoring
      novaGroup: this.normalizeNovaGroup(safeProduct.nova),
      isHealthy: safeProduct.healthScore > 70,
      isEcological: safeProduct.environmentScore > 70,
      categoryIcon: this.getCategoryIcon(safeProduct.category),
      confidenceScore: this.calculateConfidenceScore(safeProduct),
      
      // Métadonnées
      source: safeProduct.source,
      status: safeProduct.status,
      popularity: safeProduct.scanCount,
      createdAt: Math.floor(new Date(safeProduct.createdAt).getTime() / 1000),
      updatedAt: Math.floor(new Date(safeProduct.updatedAt).getTime() / 1000)
    };
  }

  /**
   * Génère un slug à partir d'un texte
   */
  generateSlug(text) {
    if (!text) return 'product-' + Date.now();
    
    return text
      .toLowerCase()
      .trim()
      .replace(/[àáäâ]/g, 'a')
      .replace(/[èéëê]/g, 'e')
      .replace(/[ìíïî]/g, 'i')
      .replace(/[òóöô]/g, 'o')
      .replace(/[ùúüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Extrait les images d'un produit
   */
  extractImages(product) {
    const images = {};
    
    // Images standards
    if (product.images) {
      if (typeof product.images === 'object' && !Array.isArray(product.images)) {
        Object.assign(images, product.images);
      } else if (Array.isArray(product.images)) {
        product.images.forEach((img, index) => {
          images[`image${index}`] = img;
        });
      }
    }
    
    // Images individuelles
    if (product.image_url) images.front = product.image_url;
    if (product.image_front_url) images.front = product.image_front_url;
    if (product.image_ingredients_url) images.ingredients = product.image_ingredients_url;
    if (product.image_nutrition_url) images.nutrition = product.image_nutrition_url;
    
    return images;
  }

  /**
   * Normalise le groupe NOVA
   */
  normalizeNovaGroup(nova) {
    if (!nova) return null;
    const novaNum = parseInt(nova);
    return (novaNum >= 1 && novaNum <= 4) ? novaNum : null;
  }

  /**
   * Retourne l'icône associée à une catégorie
   */
  getCategoryIcon(category) {
    const icons = {
      'food': '🍎',
      'alimentaire': '🍎',
      'cosmetics': '💄',
      'cosmetique': '💄',
      'detergents': '🧽',
      'detergent': '🧽',
      'hygiene': '🧼',
      'other': '📦'
    };
    return icons[category] || icons.other;
  }

  /**
   * Calcule un score de confiance global sur 100
   */
  calculateConfidenceScore(product) {
    let score = 50; // Base
    
    // Bonus pour les données complètes
    if (product.brand && product.brand.length > 2) score += 10;
    if (product.description && product.description.length > 50) score += 10;
    if (product.images && Object.keys(product.images).length > 0) score += 10;
    if (product.barcode) score += 10;
    
    // Bonus pour les scores
    if (product.nova !== null) score += 5;
    if (product.nutriscore) score += 5;
    if (product.ecoscore) score += 5;
    
    // Bonus pour la source
    if (product.source === 'openFoodFacts') score += 10;
    else if (product.source === 'manual') score -= 5;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Configure les paramètres optimaux de l'index Algolia
   */
  async configureIndex(useStaging = false) {
    if (!this.isConfigured()) {
      console.warn('Algolia non configuré - skip configuration index');
      return;
    }

    try {
      const index = useStaging ? this.stagingIndex : this.productsIndex;
      
      await index.setSettings({
        // Attributs pour la recherche
        searchableAttributes: [
          'unordered(title)',
          'unordered(brand)',
          'barcode',
          'unordered(tags)',
          'unordered(description)',
          '_searchableTitle',
          '_searchableBrand',
          '_searchableTags'
        ],
        
        // Attributs pour les filtres et facettes
        attributesForFaceting: [
          'category',
          'brand',
          'searchable(tags)',
          'nova',
          'nutriscore',
          'ecoscore',
          'source',
          'status',
          'filterOnly(barcode)',
          'filterOnly(healthScore)',
          'filterOnly(environmentScore)'
        ],
        
        // Attributs à récupérer
        attributesToRetrieve: [
          'objectID',
          'title',
          'slug',
          'brand',
          'category',
          'barcode',
          'imageUrl',
          'images',
          'healthScore',
          'environmentScore',
          'nova',
          'nutriscore',
          'ecoscore',
          'tags',
          'description'
        ],
        
        // Attributs pour highlighting
        attributesToHighlight: [
          'title',
          'brand',
          'tags',
          'description'
        ],
        
        // Snippets
        attributesToSnippet: [
          'description:50'
        ],
        
        // Tri personnalisé
        customRanking: [
          'desc(healthScore)',
          'desc(environmentScore)',
          'desc(popularity)',
          'desc(confidenceScore)'
        ],
        
        // Configuration de la recherche
        typoTolerance: true,
        minWordSizefor1Typo: 4,
        minWordSizefor2Typos: 8,
        allowTyposOnNumericTokens: false,
        ignorePlurals: ['fr', 'en'],
        removeStopWords: ['fr', 'en'],
        
        // Pagination
        hitsPerPage: 20,
        paginationLimitedTo: 1000,
        
        // Autres paramètres
        distinct: false,
        replaceSynonymsInHighlight: true,
        removeWordsIfNoResults: 'lastWords',
        advancedSyntax: true,
        queryLanguages: ['fr', 'en'],
        
        // Synonymes de base
        synonyms: [
          {
            objectID: 'bio-synonyms',
            type: 'synonym',
            synonyms: ['bio', 'biologique', 'organic', 'organique']
          },
          {
            objectID: 'gluten-synonyms',
            type: 'synonym',
            synonyms: ['sans gluten', 'gluten free', 'no gluten', 'gluten-free']
          },
          {
            objectID: 'vegan-synonyms',
            type: 'synonym',
            synonyms: ['vegan', 'végétalien', 'végane', 'vegetalien']
          },
          {
            objectID: 'sugar-synonyms',
            type: 'synonym',
            synonyms: ['sans sucre', 'sugar free', 'no sugar', 'sugar-free']
          }
        ]
      });
      
      console.log(`✅ Configuration index ${useStaging ? 'staging' : 'production'} mise à jour`);
    } catch (error) {
      console.error('❌ Erreur configuration index:', error);
      throw error;
    }
  }

  /**
   * Indexe un seul produit dans Algolia
   */
  async indexProduct(product, useStaging = false) {
    if (!this.isConfigured()) {
      console.warn('Algolia non configuré - skip indexation');
      return null;
    }

    try {
      const algoliaProduct = this.transformProductForAlgolia(product);
      const index = useStaging ? this.stagingIndex : this.productsIndex;
      
      const result = await index.saveObject(algoliaProduct);
      console.log(`✅ Produit "${product.name || product.title}" indexé (${algoliaProduct.objectID})`);
      
      return result;
    } catch (error) {
      console.error(`❌ Erreur indexation produit:`, error);
      throw error;
    }
  }

  /**
   * Indexe plusieurs produits en batch
   */
  async indexProducts(products, useStaging = false) {
    if (!this.isConfigured()) {
      console.warn('Algolia non configuré - skip indexation batch');
      return { success: 0, failed: products.length };
    }

    if (!Array.isArray(products) || products.length === 0) {
      return { success: 0, failed: 0 };
    }

    try {
      const algoliaProducts = products.map(product => 
        this.transformProductForAlgolia(product)
      );
      
      const index = useStaging ? this.stagingIndex : this.productsIndex;
      const result = await index.saveObjects(algoliaProducts);
      
      console.log(`✅ Batch indexé: ${products.length} produits`);
      return { 
        success: result.objectIDs.length, 
        failed: products.length - result.objectIDs.length 
      };
    } catch (error) {
      console.error('❌ Erreur indexation batch:', error);
      return { success: 0, failed: products.length };
    }
  }

  /**
   * Recherche de produits avec filtres avancés
   */
  async searchProducts(query = '', filters = {}, options = {}) {
    if (!this.isConfigured()) {
      console.warn('Algolia non configuré - recherche impossible');
      return { hits: [], nbHits: 0, facets: {} };
    }

    try {
      const index = options.useStaging ? this.stagingIndex : this.productsIndex;
      
      // Construction des filtres Algolia
      const algoliaFilters = [];
      
      if (filters.category) {
        algoliaFilters.push(`category:${filters.category}`);
      }
      
      if (filters.brand) {
        algoliaFilters.push(`brand:"${filters.brand}"`);
      }
      
      if (filters.nova) {
        algoliaFilters.push(`nova=${filters.nova}`);
      }
      
      if (filters.minHealthScore) {
        algoliaFilters.push(`healthScore >= ${filters.minHealthScore}`);
      }
      
      if (filters.tags && Array.isArray(filters.tags)) {
        filters.tags.forEach(tag => {
          algoliaFilters.push(`tags:${tag}`);
        });
      }
      
      if (filters.barcode) {
        algoliaFilters.push(`barcode:${filters.barcode}`);
      }
      
      // Options de recherche
      const searchOptions = {
        page: options.page || 0,
        hitsPerPage: options.hitsPerPage || 20,
        facets: ['category', 'brand', 'nova', 'nutriscore', 'ecoscore', 'tags'],
        maxValuesPerFacet: 50
      };
      
      if (algoliaFilters.length > 0) {
        searchOptions.filters = algoliaFilters.join(' AND ');
      }
      
      // Analytics
      if (options.analytics !== false) {
        searchOptions.analytics = true;
        searchOptions.clickAnalytics = true;
      }
      
      const result = await index.search(query, searchOptions);
      
      console.log(`🔍 Recherche "${query}": ${result.nbHits} résultats`);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur recherche Algolia:', error);
      return { hits: [], nbHits: 0, facets: {}, error: error.message };
    }
  }

  /**
   * Recherche par code-barres
   */
  async searchByBarcode(barcode) {
    return this.searchProducts('', { barcode }, { hitsPerPage: 1 });
  }

  /**
   * Supprime un produit de l'index
   */
  async deleteProduct(productId, useStaging = false) {
    if (!this.isConfigured()) return;

    try {
      const index = useStaging ? this.stagingIndex : this.productsIndex;
      await index.deleteObject(String(productId));
      console.log(`✅ Produit ${productId} supprimé de l'index`);
    } catch (error) {
      console.error(`❌ Erreur suppression produit ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour partiellement un produit
   */
  async updateProduct(productId, updates, useStaging = false) {
    if (!this.isConfigured()) return;

    try {
      const index = useStaging ? this.stagingIndex : this.productsIndex;
      
      await index.partialUpdateObject({
        objectID: String(productId),
        ...updates,
        updatedAt: Math.floor(Date.now() / 1000)
      });
      
      console.log(`✅ Produit ${productId} mis à jour dans Algolia`);
    } catch (error) {
      console.error(`❌ Erreur mise à jour produit ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Vide complètement un index (DANGER!)
   */
  async clearIndex(useStaging = false) {
    if (!this.isConfigured()) return;

    if (process.env.NODE_ENV === 'production' && !useStaging) {
      throw new Error('Clear index production non autorisé');
    }

    try {
      const index = useStaging ? this.stagingIndex : this.productsIndex;
      await index.clearObjects();
      console.log(`⚠️ Index ${useStaging ? 'staging' : 'production'} vidé complètement`);
    } catch (error) {
      console.error('❌ Erreur vidage index:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de l'index
   */
  async getIndexStats(useStaging = false) {
    if (!this.isConfigured()) {
      return { configured: false };
    }

    try {
      const index = useStaging ? this.stagingIndex : this.productsIndex;
      
      // Recherche vide pour obtenir les stats
      const stats = await index.search('', { 
        facets: ['category', 'nova', 'source'],
        hitsPerPage: 0,
        analytics: false 
      });

      // Récupérer les settings
      const settings = await index.getSettings();

      return {
        configured: true,
        indexName: useStaging ? this.stagingIndexName : this.indexName,
        totalRecords: stats.nbHits,
        facets: stats.facets || {},
        lastBuildTime: stats.processingTimeMS,
        settings: {
          searchableAttributes: settings.searchableAttributes,
          customRanking: settings.customRanking,
          typoTolerance: settings.typoTolerance
        }
      };

    } catch (error) {
      console.error('❌ Erreur stats Algolia:', error);
      return { 
        configured: false, 
        error: error.message 
      };
    }
  }

  /**
   * Test de connexion et de fonctionnement
   */
  async testConnection() {
    if (!this.client) {
      console.error('❌ Client Algolia non initialisé');
      return false;
    }

    try {
      console.log('🔌 Test de connexion Algolia...');
      
      // Test avec l'index staging
      const stats = await this.getIndexStats(true);
      
      if (stats.configured) {
        console.log('✅ Connexion Algolia OK');
        console.log(`📊 Produits dans staging: ${stats.totalRecords || 0}`);
        return true;
      } else {
        console.error('❌ Index non configuré');
        return false;
      }
    } catch (error) {
      console.error('❌ Test connexion Algolia échoué:', error);
      return false;
    }
  }

  /**
   * Copie les données de staging vers production
   */
  async promoteStaging() {
    if (!this.isConfigured()) {
      throw new Error('Algolia non configuré');
    }

    try {
      console.log('📋 Copie staging → production...');
      
      // Utiliser la méthode native Algolia de copie
      await this.client.copyIndex(
        this.stagingIndexName,
        this.indexName,
        {
          scope: ['settings', 'synonyms', 'rules']
        }
      );
      
      console.log('✅ Staging promu en production avec succès');
    } catch (error) {
      console.error('❌ Erreur promotion staging:', error);
      throw error;
    }
  }
}

// Export singleton
module.exports = new AlgoliaService();