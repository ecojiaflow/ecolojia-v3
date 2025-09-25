const { EnhancedOFFClient } = require("./EnhancedOFFClient");

class OFFClientWrapper {
  constructor() {
    this.enhancedClient = new EnhancedOFFClient();
  }

  async getProduct(barcode, domain = 'food') {
    return await this.enhancedClient.fetchProduct(barcode, domain);
  }

  // Mantient compatibilité avec l'ancien client si nécessaire
  async fetchProductByBarcode(barcode) {
    return await this.enhancedClient.fetchProduct(barcode, 'food');
  }
}

module.exports = OFFClientWrapper;
