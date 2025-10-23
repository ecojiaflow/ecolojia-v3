// PATH: frontend/src/services/productSaveService.ts
import { productService } from './api';

export const productSaveService = {
  async saveAnalyzedProduct(analysisResult: any, productData: any): Promise<any> {
    try {
      const productToSave = {
        barcode: productData.barcode || '',
        name: productData.name || 'Produit analyse',
        brand: productData.brand || '',
        category: productData.category || 'food',
        scores: {
          healthScore: analysisResult.healthScore || 50,
          environmentScore: analysisResult.environmentScore || 50
        },
        ingredients: productData.ingredients || '',
        images: productData.images || {},
        source: 'user_analysis',
        status: 'active'
      };
      
      // Utiliser la methode create si elle existe, sinon faire un POST direct
      if (productService.create) {
        return await productService.create(productToSave);
      } else {
        // Fallback - utiliser analyze qui existe deja
        return await productService.analyze(productToSave);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      return null;
    }
  }
};
