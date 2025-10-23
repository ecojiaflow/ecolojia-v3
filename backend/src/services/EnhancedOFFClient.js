const { RetryService } = require("../utils/RetryService");

class EnhancedOFFClient {
  constructor() {
    this.baseUrls = [
      'https://world.openfoodfacts.org/api/v0/product',
      'https://fr.openfoodfacts.org/api/v0/product'  
    ];
    this.beautyUrls = [
      'https://world.openbeautyfacts.org/api/v0/product',
      'https://fr.openbeautyfacts.org/api/v0/product'
    ];
    this.detergentUrls = [
      'https://world.openproductsfacts.org/api/v0/product',
      'https://fr.openproductsfacts.org/api/v0/product'
    ];
  }

  async fetchProduct(barcode, domain = 'food') {
    const urls = this.getUrlsByDomain(domain, barcode);
    
    try {
      const results = await RetryService.fetchMultipleSources(urls, {
        retries: 2,
        timeout: 10000,
        delay: 500
      });

      // Retourner le premier résultat valide avec la bonne source
      for (const result of results) {
        if (result.status === 1 && result.product) {
          return {
            success: true,
            product: result.product,
            source: this.identifySourceByDomain(domain), // Fix ici
            domain
          };
        }
      }

      return {
        success: false, 
        error: 'Produit non trouvé dans les bases',
        barcode,
        domain
      };

    } catch (error) {
      console.error(`[EnhancedOFFClient] Erreur pour ${barcode}:`, error.message);
      return {
        success: false,
        error: error.message,
        barcode,
        domain
      };
    }
  }

  getUrlsByDomain(domain, barcode) {
    switch(domain) {
      case 'beauty':
      case 'cosmetic':
        return this.beautyUrls.map(base => `${base}/${barcode}.json`);
      case 'detergent':
      case 'home':
        return this.detergentUrls.map(base => `${base}/${barcode}.json`);
      default:
        return this.baseUrls.map(base => `${base}/${barcode}.json`);
    }
  }

  identifySourceByDomain(domain) {
    switch(domain) {
      case 'beauty':
      case 'cosmetic':
        return 'OpenBeautyFacts';
      case 'detergent':
      case 'home':
        return 'OpenProductsFacts';
      default:
        return 'OpenFoodFacts';
    }
  }
}

module.exports = { EnhancedOFFClient };
