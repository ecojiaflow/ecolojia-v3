  async searchProducts(query = '', filters = {}, options = {}) {
    if (!this.isConfigured()) {
      console.warn('Algolia non configure - recherche impossible');
      return { hits: [], nbHits: 0, facets: {} };
    }

    try {
      const index = options.useStaging ? this.stagingIndex : this.productsIndex;
      
      // Options de recherche de base
      const searchOptions = {
        page: options.page || 0,
        hitsPerPage: options.hitsPerPage || 20,
        facets: ['category', 'brand', 'nova', 'nutriscore', 'ecoscore', 'tags'],
        maxValuesPerFacet: 50
      };
      
      // Si on a directement facetFilters ou numericFilters, les utiliser
      if (options.facetFilters) {
        searchOptions.facetFilters = options.facetFilters;
      }
      
      if (options.numericFilters) {
        searchOptions.numericFilters = options.numericFilters;
      }
      
      // Sinon, utiliser l'ancien format pour la compatibilité
      if (!searchOptions.facetFilters && !searchOptions.numericFilters) {
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
        
        if (algoliaFilters.length > 0) {
          searchOptions.filters = algoliaFilters.join(' AND ');
        }
      }
      
      // Analytics
      if (options.analytics !== false) {
        searchOptions.analytics = true;
        searchOptions.clickAnalytics = true;
      }
      
      const result = await index.search(query, searchOptions);
      
      console.log(`🔍 Recherche "${query}": ${result.nbHits} resultats`);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur recherche Algolia:', error);
      return { hits: [], nbHits: 0, facets: {}, error: error.message };
    }
  }
