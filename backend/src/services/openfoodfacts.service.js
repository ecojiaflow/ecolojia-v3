// OpenFoodFacts Service - Fetch and enrich product data
const axios = require('axios');

class OpenFoodFactsService {
  constructor() {
    // Utiliser v0 au lieu de v2
    this.offBaseUrl = 'https://world.openfoodfacts.org/api/v0';
    this.obfBaseUrl = 'https://world.openbeautyfacts.org/api/v0';
    this.timeout = 5000;
  }

  /**
   * Determine if barcode is for beauty product
   */
  isBeautyProduct(barcode) {
    // Produits beauté commencent souvent par ces préfixes
    // Nutella (301...) n'est PAS un produit beauté
    const beautyPrefixes = ['326', '327', '328', '329', '330'];
    const prefix = barcode.substring(0, 3);
    return beautyPrefixes.includes(prefix);
  }

  /**
   * Fetch product from OpenFoodFacts or OpenBeautyFacts
   */
  async fetchProduct(barcode) {
    try {
      console.log(`Fetching product data for barcode: ${barcode}`);
      
      // Determine which API to use
      const isBeauty = this.isBeautyProduct(barcode);
      const baseUrl = isBeauty ? this.obfBaseUrl : this.offBaseUrl;
      const source = isBeauty ? 'OpenBeautyFacts' : 'OpenFoodFacts';
      
      const response = await axios.get(
        `${baseUrl}/product/${barcode}.json`,
        { timeout: this.timeout }
      );

      if (response.data.status === 1) {
        console.log(`✅ Product found on ${source}`);
        return {
          found: true,
          source,
          data: response.data.product
        };
      }

      // If not found on primary source, try the other
      if (!isBeauty) {
        console.log('Product not found on OFF, trying OBF...');
        const obfResponse = await axios.get(
          `${this.obfBaseUrl}/product/${barcode}.json`,
          { timeout: this.timeout }
        );
        
        if (obfResponse.data.status === 1) {
          console.log('✅ Product found on OpenBeautyFacts');
          return {
            found: true,
            source: 'OpenBeautyFacts',
            data: obfResponse.data.product
          };
        }
      }

      console.log('❌ Product not found on OFF/OBF');
      return { found: false, source: null, data: null };
      
    } catch (error) {
      console.error('Error fetching from OFF/OBF:', error.message);
      return { found: false, source: null, data: null, error: error.message };
    }
  }

  /**
   * Extract relevant fields from OFF/OBF data
   */
  extractProductData(offData) {
    return {
      // Basic info
      name: offData.product_name || offData.product_name_fr || 'Produit sans nom',
      brand: offData.brands || 'Marque inconnue',
      categories: offData.categories || '',
      
      // Nutritional info
      nutriscore_grade: offData.nutriscore_grade || null,
      ecoscore_grade: offData.ecoscore_grade || null,
      nova_group: offData.nova_group || null,
      
      // Images
      image_url: offData.image_url || offData.image_front_url || null,
      image_small_url: offData.image_small_url || offData.image_front_small_url || null,
      image_thumb_url: offData.image_thumb_url || offData.image_front_thumb_url || null,
      
      // Ingredients
      ingredients_text: offData.ingredients_text || offData.ingredients_text_fr || '',
      ingredients: offData.ingredients || [],
      allergens: offData.allergens || '',
      traces: offData.traces || '',
      
      // Packaging
      packaging: offData.packaging || '',
      packaging_tags: offData.packaging_tags || [],
      
      // Nutritional values per 100g
      nutriments: offData.nutriments || {},
      
      // Additional info
      countries: offData.countries || '',
      stores: offData.stores || '',
      
      // Meta
      off_url: offData.url || `https://world.openfoodfacts.org/product/${offData.code}`,
      last_modified_time: offData.last_modified_t || Date.now() / 1000
    };
  }

  /**
   * Enrich existing product with OFF/OBF data
   */
  enrichProduct(existingProduct, offData) {
    const extractedData = this.extractProductData(offData);
    
    // Merge with existing data (existing data takes precedence for user-modified fields)
    const enrichedProduct = {
      ...existingProduct,
      
      // Update only if not already set
      name: existingProduct.name || extractedData.name,
      brand: existingProduct.brand || extractedData.brand,
      
      // Always update from OFF/OBF
      category: existingProduct.category || 'food',
      categories: extractedData.categories,
      nutriscore_grade: extractedData.nutriscore_grade,
      ecoscore_grade: extractedData.ecoscore_grade,
      nova_group: extractedData.nova_group,
      
      // Images
      image_url: extractedData.image_url || existingProduct.image_url,
      image_small_url: extractedData.image_small_url,
      image_thumb_url: extractedData.image_thumb_url,
      
      // Detailed info
      ingredients_text: extractedData.ingredients_text,
      ingredients: extractedData.ingredients,
      allergens: extractedData.allergens,
      traces: extractedData.traces,
      packaging: extractedData.packaging,
      packaging_tags: extractedData.packaging_tags,
      nutriments: extractedData.nutriments,
      
      // Meta
      off_data: {
        url: extractedData.off_url,
        last_sync: new Date(),
        source: offData.source || 'OpenFoodFacts'
      },
      
      // Keep timestamps
      createdAt: existingProduct.createdAt,
      updatedAt: new Date()
    };
    
    return enrichedProduct;
  }

  /**
   * Main method to fetch and enrich a product
   */
  async fetchAndEnrich(barcode, existingProduct = {}) {
    const result = await this.fetchProduct(barcode);
    
    if (!result.found) {
      return {
        success: false,
        message: 'Product not found on OpenFoodFacts/OpenBeautyFacts',
        product: existingProduct
      };
    }
    
    const enrichedProduct = this.enrichProduct(existingProduct, {
      ...result.data,
      source: result.source
    });
    
    return {
      success: true,
      message: `Product enriched from ${result.source}`,
      source: result.source,
      product: enrichedProduct
    };
  }
}

// Export singleton instance
module.exports = new OpenFoodFactsService();

