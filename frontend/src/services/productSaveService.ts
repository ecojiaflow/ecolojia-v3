// PATH: frontend/src/services/productSaveService.ts
import { apiClient } from './api';

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
      const response = await apiClient.post('/products', productToSave);
      return response.data;
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      return null;
    }
  }
};
