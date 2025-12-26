const crypto = require('crypto');
const Product = require('../models/Product');

const logger = {
  info: (...args) => console.log('[CACHE-RESOLVER]', ...args),
  warn: (...args) => console.warn('[CACHE-RESOLVER ⚠️]', ...args),
  error: (...args) => console.error('[CACHE-RESOLVER ❌]', ...args),
  debug: (...args) => {
    if (process.env.DEBUG_CACHE === '1') {
      console.log('[CACHE-RESOLVER DEBUG]', ...args);
    }
  }
};

class CacheResolver {
  
  static async resolve(params) {
    const startTime = Date.now();
    
    try {
      const { barcode, name, brand, photoBuffer } = params;
      
      logger.info('🔍 Résolution cache...', {
        hasBarcode: !!barcode,
        hasName: !!name,
        hasBrand: !!brand,
        hasPhoto: !!photoBuffer
      });
      
      if (barcode) {
        const result = await this.checkBarcodeCache(barcode);
        if (result.cached) {
          const duration = Date.now() - startTime;
          logger.info(`✅ CACHE HIT Niveau 1 (barcode) - ${duration}ms`);
          return result;
        }
      }
      
      if (name && brand) {
        const result = await this.checkFuzzyCache(name, brand);
        if (result.cached) {
          const duration = Date.now() - startTime;
          logger.info(`✅ CACHE HIT Niveau 2 (fuzzy ${result.similarity}%) - ${duration}ms`);
          return result;
        }
      }
      
      if (photoBuffer) {
        const result = await this.checkPhotoHashCache(photoBuffer);
        if (result.cached) {
          const duration = Date.now() - startTime;
          logger.info(`✅ CACHE HIT Niveau 3 (photoHash) - ${duration}ms`);
          return result;
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info(`❌ CACHE MISS - ${duration}ms`);
      
      return {
        cached: false,
        source: 'none',
        product: null,
        requiresAI: true
      };
      
    } catch (error) {
      logger.error('Erreur résolution cache:', error.message);
      return {
        cached: false,
        source: 'error',
        product: null,
        error: error.message
      };
    }
  }
  
  static async checkBarcodeCache(barcode) {
    try {
      logger.debug('Recherche barcode...', { barcode });
      
      const product = await Product.findOne({ barcode })
        .select('-__v')
        .lean();
      
      if (product) {
        await Product.updateOne(
          { _id: product._id },
          { 
            $inc: { scanCount: 1 },
            $set: { lastScannedAt: new Date() }
          }
        );
        
        return {
          cached: true,
          source: 'barcode-exact',
          confidence: 100,
          product
        };
      }
      
      return { cached: false };
      
    } catch (error) {
      logger.error('Erreur cache barcode:', error.message);
      return { cached: false };
    }
  }
  
  static async checkFuzzyCache(name, brand) {
    try {
      logger.debug('Recherche fuzzy...', { name, brand });
      
      const query = `${name} ${brand}`.trim();
      const candidates = await Product.find({
        $text: { $search: query }
      })
        .select('-__v')
        .limit(10)
        .lean();
      
      if (candidates.length === 0) {
        return { cached: false };
      }
      
      const scored = candidates.map(product => {
        const similarity = this.calculateSimilarity(
          `${name} ${brand}`.toLowerCase(),
          `${product.name} ${product.brand || ''}`.toLowerCase()
        );
        
        return { product, similarity };
      });
      
      scored.sort((a, b) => b.similarity - a.similarity);
      const best = scored[0];
      
      logger.debug('Meilleur match fuzzy', {
        similarity: best.similarity,
        product: best.product.name
      });
      
      if (best.similarity >= 90) {
        await Product.updateOne(
          { _id: best.product._id },
          { 
            $inc: { scanCount: 1 },
            $set: { lastScannedAt: new Date() }
          }
        );
        
        return {
          cached: true,
          source: 'fuzzy-high',
          confidence: best.similarity,
          similarity: best.similarity,
          product: best.product
        };
      } else if (best.similarity >= 75) {
        return {
          cached: true,
          source: 'fuzzy-medium',
          confidence: best.similarity,
          similarity: best.similarity,
          product: best.product,
          requiresConfirmation: true
        };
      } else {
        return { cached: false };
      }
      
    } catch (error) {
      logger.error('Erreur cache fuzzy:', error.message);
      return { cached: false };
    }
  }
  
  static async checkPhotoHashCache(photoBuffer) {
    try {
      const photoHash = crypto
        .createHash('sha256')
        .update(photoBuffer)
        .digest('hex');
      
      logger.debug('Recherche photoHash...', { photoHash: photoHash.substring(0, 16) + '...' });
      
      const product = await Product.findOne({ photoHash })
        .select('-__v')
        .lean();
      
      if (product) {
        await Product.updateOne(
          { _id: product._id },
          { 
            $inc: { scanCount: 1 },
            $set: { lastScannedAt: new Date() }
          }
        );
        
        return {
          cached: true,
          source: 'photo-hash',
          confidence: 100,
          photoHash,
          product
        };
      }
      
      return { cached: false, photoHash };
      
    } catch (error) {
      logger.error('Erreur cache photoHash:', error.message);
      return { cached: false };
    }
  }
  
  static calculateSimilarity(str1, str2) {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLen = Math.max(str1.length, str2.length);
    
    if (maxLen === 0) return 100;
    
    const similarity = ((maxLen - distance) / maxLen) * 100;
    return Math.round(similarity);
  }
  
  static levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  static async saveEnrichedProduct(productData, cacheMetadata) {
    try {
      const { photoHash, extractedBy, ocrData, ocrConfidence } = cacheMetadata;
      
      const product = new Product({
        ...productData,
        photoHash,
        extractedBy,
        extractedAt: new Date(),
        ocrData,
        ocrConfidence,
        scanCount: 1,
        lastScannedAt: new Date()
      });
      
      await product.save();
      
      logger.info('✅ Produit enrichi sauvegardé', {
        productId: product._id,
        name: product.name,
        extractedBy
      });
      
      return product;
      
    } catch (error) {
      logger.error('❌ Erreur sauvegarde produit enrichi:', error.message);
      throw error;
    }
  }
}

module.exports = CacheResolver;