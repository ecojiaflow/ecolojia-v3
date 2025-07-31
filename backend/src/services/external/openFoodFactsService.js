// backend/src/services/external/openFoodFactsService.js
const axios = require('axios');

class OpenFoodFactsService {
  static BASE_URL = 'https://world.openfoodfacts.org/api/v0/product';
  
  static async getProduct(barcode) {
    try {
      console.log(`🔍 Recherche OpenFoodFacts: ${barcode}`);
      
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
          name: product.product_name || `Produit ${barcode}`,
          category: 'food',
          composition: product.ingredients_text || undefined,
          brand: product.brands || undefined,
          image_url: product.image_url || undefined,
          found: true,
          
          // Données supplémentaires
          nova_group: product.nova_group,
          nutriscore_grade: product.nutrition_grades,
          ecoscore_grade: product.ecoscore_grade,
          
          // Ingrédients
          ingredients: this.parseIngredients(product),
          
          // Nutriments
          nutriments: product.nutriments || {},
          
          // Allergènes
          allergens: product.allergens_tags || [],
          
          // Additifs
          additives: product.additives_tags || [],
          
          // Labels
          labels: product.labels_tags || [],
          
          // Catégories
          categories: product.categories_tags || []
        };
      }

      console.log(`❌ Produit non trouvé dans OpenFoodFacts: ${barcode}`);
      return null;

    } catch (error) {
      console.error('Erreur OpenFoodFacts:', error.message);
      return null;
    }
  }

  static async searchProducts(query, limit = 20) {
    try {
      const response = await axios.get(
        'https://world.openfoodfacts.org/cgi/search.pl',
        {
          params: {
            search_terms: query,
            json: 1,
            page_size: limit,
            sort_by: 'unique_scans_n',
            fields: 'code,product_name,brands,image_url,nutrition_grades,nova_group,ecoscore_grade'
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
          category: 'food',
          composition: product.ingredients_text,
          brand: product.brands,
          image_url: product.image_url,
          nova_group: product.nova_group,
          nutriscore_grade: product.nutrition_grades,
          ecoscore_grade: product.ecoscore_grade,
          found: true
        }));
      }

      return [];
    } catch (error) {
      console.error('Erreur recherche OpenFoodFacts:', error.message);
      return [];
    }
  }

  static parseIngredients(product) {
    if (!product.ingredients) return [];
    
    return product.ingredients.map(ing => ({
      text: ing.text || ing.id,
      percent: ing.percent_estimate || null,
      vegan: ing.vegan === 'yes',
      vegetarian: ing.vegetarian === 'yes',
      from_palm_oil: ing.from_palm_oil === 'yes'
    }));
  }

  static formatNutriments(nutriments) {
    return {
      energy_kcal: nutriments['energy-kcal_100g'] || 0,
      fat: nutriments.fat_100g || 0,
      saturated_fat: nutriments['saturated-fat_100g'] || 0,
      carbohydrates: nutriments.carbohydrates_100g || 0,
      sugars: nutriments.sugars_100g || 0,
      fiber: nutriments.fiber_100g || 0,
      proteins: nutriments.proteins_100g || 0,
      salt: nutriments.salt_100g || 0,
      sodium: nutriments.sodium_100g || 0
    };
  }

  static calculateHealthScore(product) {
    let score = 50; // Score de base
    
    // NOVA score impact
    if (product.nova_group) {
      const novaImpact = {
        1: 25,   // Non transformé
        2: 10,   // Peu transformé
        3: -10,  // Transformé
        4: -25   // Ultra-transformé
      };
      score += novaImpact[product.nova_group] || 0;
    }
    
    // Nutri-Score impact
    if (product.nutriscore_grade) {
      const nutriscoreImpact = {
        'a': 20,
        'b': 10,
        'c': 0,
        'd': -10,
        'e': -20
      };
      score += nutriscoreImpact[product.nutriscore_grade.toLowerCase()] || 0;
    }
    
    // Eco-Score impact
    if (product.ecoscore_grade) {
      const ecoscoreImpact = {
        'a': 5,
        'b': 2,
        'c': 0,
        'd': -2,
        'e': -5
      };
      score += ecoscoreImpact[product.ecoscore_grade.toLowerCase()] || 0;
    }
    
    // S'assurer que le score est entre 0 et 100
    return Math.max(0, Math.min(100, score));
  }
}

module.exports = {
  OpenFoodFactsService,
  searchOpenFoodFacts: OpenFoodFactsService.getProduct.bind(OpenFoodFactsService)
};