const axios = require('axios');

class ImageEnrichmentService {
  async enrichProductImage(barcode) {
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        { timeout: 5000 }
      );
      
      if (response.data.status === 1 && response.data.product) {
        const product = response.data.product;
        return {
          imageUrl: product.image_url || product.image_front_url || null,
          imageFront: product.image_front_small_url || null,
          imageIngredients: product.image_ingredients_url || null,
          imageNutrition: product.image_nutrition_url || null
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Image enrichment failed for ${barcode}:`, error.message);
      return null;
    }
  }
  
  async batchEnrich(products) {
    const enriched = [];
    
    for (const product of products) {
      if (!product.imageUrl || product.imageUrl.includes('placeholder')) {
        const images = await this.enrichProductImage(product.barcode);
        if (images && images.imageUrl) {
          product.imageUrl = images.imageUrl;
          product.imageFront = images.imageFront;
        }
      }
      enriched.push(product);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return enriched;
  }
}

module.exports = new ImageEnrichmentService();
