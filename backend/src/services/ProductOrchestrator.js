// PATH: backend/src/services/ProductOrchestrator.js
const Product = require('../models/Product');
const scoringUnified = require('./scoringUnified');

const logger = {
  info: (...args) => console.log('[ProductOrchestrator]', ...args),
  warn: (...args) => console.warn('[ProductOrchestrator WARN]', ...args),
  error: (...args) => console.error('[ProductOrchestrator ERROR]', ...args)
};

class ProductOrchestrator {
  
  static async getOrCreateProduct(params) {
    const { barcode, source = 'OFF', forceRefresh = false } = params;

    if (!barcode) {
      throw new Error('Barcode requis');
    }

    logger.info(`getOrCreateProduct - barcode: ${barcode}`);

    try {
      // 1. Chercher en DB
      if (!forceRefresh) {
        const existingProduct = await Product.findOne({ barcode });
        
        if (existingProduct) {
          logger.info('✅ Produit trouvé en DB');
          return {
            product: existingProduct,
            source: 'DATABASE',
            cached: true
          };
        }
      }

      // 2. Fetch Open Food Facts
      logger.info('🔍 Fetch Open Food Facts...');
      const offProduct = await this.fetchFromOpenFoodFacts(barcode);

      // CAS 1 : OFF a trouvé le produit
      if (offProduct && offProduct.product) {
        logger.info('✅ Produit trouvé sur OFF');
        
        const normalizedProduct = this.normalizeOpenFoodFactsProduct(offProduct.product, barcode);
        const detectedCategory = this.detectCategory(normalizedProduct, barcode);
        normalizedProduct.categoryType = detectedCategory;

        // Scoring SYNCHRONE (pas async)
        logger.info('📊 Calcul score...');
        const scores = scoringUnified.calculateScores(normalizedProduct);
        
        // Merger produit + scores
        const productWithScores = {
          ...normalizedProduct,
          scores: scores || { overallScore: 50, global: 50, confidence: 0.5 }
        };

        // Sauvegarder
        const savedProduct = await this.saveProduct(productWithScores);

        return {
          product: savedProduct,
          source: 'OFF',
          cached: false
        };
      }

      // CAS 2 : OFF N'A PAS TROUVÉ
      logger.info('❌ Produit non trouvé sur OFF');
      return {
        product: null,
        source: 'NOT_FOUND',
        barcode: barcode
      };

    } catch (error) {
      logger.error('❌ Erreur:', error.message);
      throw error;
    }
  }

  static async fetchFromOpenFoodFacts(barcode) {
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Ecolojia/3.1 (contact@ecolojia.com)'
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      return (data.status === 1 && data.product) ? data : null;
    } catch (error) {
      logger.error('Erreur fetch OFF:', error.message);
      return null;
    }
  }

  static normalizeOpenFoodFactsProduct(offProduct, barcode) {
    return {
      barcode: barcode,
      name: offProduct.product_name || offProduct.generic_name || offProduct.brands || 'Produit inconnu',
      brand: offProduct.brands || 'Marque inconnue',
      categoryType: 'food',
      
      imageUrl: offProduct.image_url || offProduct.image_front_url || null,
      images: {
        front: offProduct.image_front_url || null,
        ingredients: offProduct.image_ingredients_url || null,
        nutrition: offProduct.image_nutrition_url || null
      },

      foodData: {
        ingredients: offProduct.ingredients_text || '',
        ingredientsTags: offProduct.ingredients_tags || [],
        allergens: offProduct.allergens_tags || [],
        additivesTags: offProduct.additives_tags || [],
        
        nova: offProduct.nova_group || null,
        nutriscore: offProduct.nutriscore_grade?.toUpperCase() || null,
        ecoscore: offProduct.ecoscore_grade?.toUpperCase() || null,
        
        nutritionFacts: {
          energy: offProduct.nutriments?.['energy-kcal_100g'] || null,
          fat: offProduct.nutriments?.fat_100g || null,
          saturatedFat: offProduct.nutriments?.['saturated-fat_100g'] || null,
          carbohydrates: offProduct.nutriments?.carbohydrates_100g || null,
          sugars: offProduct.nutriments?.sugars_100g || null,
          fiber: offProduct.nutriments?.fiber_100g || null,
          proteins: offProduct.nutriments?.proteins_100g || null,
          salt: offProduct.nutriments?.salt_100g || null
        },
        
        labels: offProduct.labels_tags || []
      },

      source: 'OFF',
      lastUpdated: new Date(),
      dataQuality: this.assessDataQuality(offProduct)
    };
  }

  static detectCategory(product, barcode) {
    const prefix = barcode.substring(0, 2);
    
    const cosmeticPrefixes = ['30', '31', '32', '33', '34', '35', '36', '37'];
    const detergentPrefixes = ['40', '41', '42', '43', '44'];

    if (cosmeticPrefixes.includes(prefix)) return 'cosmetic';
    if (detergentPrefixes.includes(prefix)) return 'detergent';

    return 'food';
  }

  static assessDataQuality(offProduct) {
    const checks = [
      offProduct.product_name,
      offProduct.brands,
      offProduct.ingredients_text,
      offProduct.nutriscore_grade,
      offProduct.nova_group,
      offProduct.image_url
    ];

    const score = checks.filter(Boolean).length;

    if (score >= 5) return 'excellent';
    if (score >= 3) return 'good';
    return 'partial';
  }

  static async saveProduct(productData) {
    try {
      // Validation scores
      if (!productData.scores || !productData.scores.overallScore) {
        logger.warn('⚠️ Score manquant, application défaut');
        productData.scores = {
          overallScore: 50,
          global: 50,
          confidence: 0.5,
          dataCompleteness: 'partial'
        };
      }

      const existingProduct = await Product.findOne({ barcode: productData.barcode });

      if (existingProduct) {
        Object.assign(existingProduct, productData);
        existingProduct.lastUpdated = new Date();
        await existingProduct.save();
        
        logger.info(`✅ Produit mis à jour: ${productData.name}`);
        return existingProduct;
      } else {
        const newProduct = new Product(productData);
        await newProduct.save();
        
        logger.info(`✅ Nouveau produit créé: ${productData.name}`);
        return newProduct;
      }

    } catch (error) {
      logger.error('❌ Erreur sauvegarde:', error.message);
      throw error;
    }
  }
}

module.exports = ProductOrchestrator;