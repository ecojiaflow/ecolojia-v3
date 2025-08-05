// backend/src/services/external/openBeautyFactsService.js
const axios = require('axios');

class OpenBeautyFactsService {
  static BASE_URL = 'https://world.openbeautyfacts.org/api/v0/product';
  
  /**
   * Récupère un produit cosmétique par code-barres
   */
  static async getProduct(barcode) {
    try {
      console.log(`🔍 Recherche OpenBeautyFacts: ${barcode}`);
      
      const response = await axios.get(
        `${this.BASE_URL}/${barcode}.json`,
        {
          timeout: 5000,
          headers: {
            'User-Agent': 'ECOLOJIA/3.0 (contact@ecolojia.app)'
          }
        }
      );

      if (response.data.status === 1 && response.data.product) {
        const product = response.data.product;
        
        return {
          barcode,
          name: product.product_name || `Produit cosmétique ${barcode}`,
          category: 'cosmetic',
          brand: product.brands || undefined,
          image_url: product.image_url || undefined,
          found: true,
          
          // Ingrédients
          ingredients: product.ingredients_text || '',
          ingredients_tags: product.ingredients_tags || [],
          
          // Labels et certifications
          labels: product.labels_tags || [],
          
          // Catégories
          categories: product.categories_tags || [],
          
          // Données spécifiques cosmétiques
          period_after_opening: product.period_after_opening || '12M',
          
          // Images
          images: {
            front: product.image_url,
            ingredients: product.image_ingredients_url,
            packaging: product.image_packaging_url
          }
        };
      }

      console.log(`❌ Produit cosmétique non trouvé dans OpenBeautyFacts: ${barcode}`);
      return null;

    } catch (error) {
      console.error('Erreur OpenBeautyFacts:', error.message);
      return null;
    }
  }

  /**
   * Recherche de produits cosmétiques
   */
  static async searchProducts(query, limit = 20) {
    try {
      const response = await axios.get(
        'https://world.openbeautyfacts.org/cgi/search.pl',
        {
          params: {
            search_terms: query,
            json: 1,
            page_size: limit,
            sort_by: 'unique_scans_n'
          },
          timeout: 10000,
          headers: {
            'User-Agent': 'ECOLOJIA/3.0 (contact@ecolojia.app)'
          }
        }
      );

      if (response.data.products) {
        return response.data.products.map(product => ({
          barcode: product.code,
          name: product.product_name || 'Produit sans nom',
          category: 'cosmetic',
          brand: product.brands,
          image_url: product.image_url,
          ingredients: product.ingredients_text,
          found: true
        }));
      }

      return [];
    } catch (error) {
      console.error('Erreur recherche OpenBeautyFacts:', error.message);
      return [];
    }
  }

  /**
   * Récupère des produits populaires par catégorie
   */
  static async getPopularProducts(category = 'shampoos', limit = 10) {
    try {
      const categories = {
        'shampoos': 'shampoings',
        'face-creams': 'cremes-visage',
        'shower-gels': 'gels-douche',
        'deodorants': 'deodorants',
        'makeup': 'maquillage',
        'sunscreen': 'produits-solaires'
      };

      const categoryPath = categories[category] || category;
      const url = `https://world.openbeautyfacts.org/category/${categoryPath}.json`;

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'ECOLOJIA/3.0 (contact@ecolojia.app)'
        }
      });

      if (response.data.products) {
        return response.data.products
          .slice(0, limit)
          .map(product => ({
            barcode: product.code,
            name: product.product_name,
            brand: product.brands,
            ingredients: product.ingredients_text,
            image_url: product.image_url,
            category: 'cosmetic'
          }));
      }

      return [];
    } catch (error) {
      console.error('Erreur récupération produits populaires:', error.message);
      return [];
    }
  }
}

module.exports = OpenBeautyFactsService;
