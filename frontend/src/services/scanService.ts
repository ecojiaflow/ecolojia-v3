// frontend/src/services/scanService.ts
import { apiClient, getErrorMessage } from './apiClient';
import { cloudinaryService } from './cloudinaryService';

// Types
export interface ScanResult {
  productId?: string;
  product?: any;
  analysis?: any;
  products?: any[]; // Pour la recherche manuelle
  confidence?: number;
  extractedData?: {
    name?: string;
    ingredients?: string;
    brand?: string;
    category?: string;
  };
}

export interface ScanError {
  code: string;
  message: string;
  details?: any;
}

// Service principal
export class ScanService {
  private static instance: ScanService;

  static getInstance(): ScanService {
    if (!ScanService.instance) {
      ScanService.instance = new ScanService();
    }
    return ScanService.instance;
  }

  // Scan par code-barres
  async scanBarcode(code: string): Promise<ScanResult> {
    try {
      // Essayer d'abord de recuperer le produit
      const response = await apiClient.get(`/products/barcode/${code}`);
      
      if (response.data?.product) {
        return {
          productId: response.data?.product._id,
          product: response.data?.product,
          confidence: 1.0
        };
      }
      
      // Si pas trouve, lancer une analyse
      const analysisResponse = await apiClient.post('/analysis', {
        barcode: code,
        method: 'barcode',
        source: 'web'
      });
      
      return analysisResponse.data;
    } catch (error: any) {
      throw this.handleError(error, 'BARCODE_SCAN_FAILED');
    }
  }

  // Analyse par photo
  async analyzePhoto(file: File, useOCR: boolean = false): Promise<ScanResult> {
    try {
      // 1. Upload vers Cloudinary
      const imageUrl = await cloudinaryService.uploadImage(file);
      
      // 2. Choisir l'endpoint selon le mode
      const endpoint = useOCR ? '/vision/analyze-image' : '/analysis';
      
      // 3. Analyser l'image
      const response = await apiClient.post(endpoint, {
        imageUrl,
        method: 'photo',
        source: 'web',
        category: 'food', // Æ’Ã†â€™â€ Ã¢â‚¬â„¢aÃ¢â‚¬Å¡Ã‚Â¬ detecter automatiquement plus tard
        extractText: useOCR
      });
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'PHOTO_ANALYSIS_FAILED');
    }
  }

  // Recherche manuelle
  async searchProducts(query: string, options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ScanResult> {
    try {
      const response = await apiClient.get('/products/search', {
        params: {
          q: query,
          ...options
        }
      });
      
      return {
        products: response.data?.products || [],
        confidence: response.data?.confidence || 0.8
      };
    } catch (error: any) {
      throw this.handleError(error, 'SEARCH_FAILED');
    }
  }

  // Gestion des erreurs
  private handleError(error: any, code: string): ScanError {
    return {
      code,
      message: getErrorMessage(error),
      details: error.response?.data
    };
  }

  // Methode pour valider un code-barres
  static isValidBarcode(code: string): boolean {
    // Validation basique : 8, 12 ou 13 chiffres
    return /^(\d{8}|\d{12}|\d{13})$/.test(code);
  }

  // Methode pour detecter la categorie d'un produit Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  partir de son nom
  static detectCategory(productName: string): string {
    const categories = {
      food: ['yaourt', 'lait', 'pain', 'pates', 'riz', 'chocolat', 'biscuit', 'cereales'],
      cosmetic: ['creme', 'shampoing', 'savon', 'dentifrice', 'deodorant', 'parfum'],
      detergent: ['lessive', 'liquide vaisselle', 'nettoyant', 'javel']
    };
    
    const lowerName = productName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    
    return 'food'; // Par defaut
  }
}



