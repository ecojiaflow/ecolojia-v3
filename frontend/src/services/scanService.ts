// frontend/src/services/scanService.ts
import { apiClient, getErrorMessage } from './apiClient';
import { cloudinaryService } from './cloudinaryService';
import { ocrService, OCRResult } from './ocrService';

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
  // Données OCR
  ocrData?: {
    rawText: string;
    ingredients: Array<{ name: string; role?: string }>;
    nutrition: any;
    category: string;
    confidence: number;
    processingTime: number;
  };
  isOCRResult?: boolean;
  // NOUVEAU : Constitution Ecolojia
  constitution?: {
    whatIsIt?: any;
    compositionProcess?: any;
    scienceShows?: any;
    healthReflex?: any;
    possibleActions?: any;
    habitImpact?: any;
  };
  categoryDetection?: any;
  disclaimer?: any;
  cached?: boolean;
  source?: 'cache' | 'ai';
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
      const response = await apiClient.post('/analysis', {
        barcode: code,
        method: 'barcode',
        source: 'web'
      });

      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'BARCODE_SCAN_FAILED');
    }
  }

  /**
   * NOUVEAU : Analyse photo avec nouveau pipeline backend
   * POST /api/vision/analyze-photo
   * Pipeline : Qualité → OCR → Cache → Catégorie → IA → Constitution
   */
  async analyzePhotoNew(file: File, category: string = 'auto'): Promise<ScanResult> {
    try {
      console.log('📸 [ScanService] analyzePhotoNew appelé');
      console.log('📸 [ScanService] Taille fichier:', (file.size / 1024).toFixed(2), 'KB');

      // Créer FormData
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', category);

      console.log('📸 [ScanService] Appel API /vision/analyze-photo...');

      // Appeler nouvelle route backend
      const response = await apiClient.post('/vision/analyze-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ [ScanService] Réponse reçue:', response.data);

      // Vérifier erreurs backend (qualité, catégorie interdite)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Échec analyse photo');
      }

      // Retourner résultat complet
      return {
        product: response.data.product,
        constitution: response.data.constitution,
        categoryDetection: response.data.categoryDetection,
        disclaimer: response.data.disclaimer,
        cached: response.data.cached || false,
        source: response.data.source || 'ai',
        confidence: 1.0,
        isOCRResult: true
      };

    } catch (error: any) {
      console.error('❌ [ScanService] Erreur analyzePhotoNew:', error);

      // Gérer erreurs spécifiques backend
      if (error.response?.data) {
        const errorData = error.response.data;

        // Erreur qualité photo
        if (errorData.error === 'QUALITY_CHECK_FAILED') {
          throw {
            code: 'QUALITY_CHECK_FAILED',
            message: errorData.message,
            issues: errorData.issues || [],
            instructions: errorData.instructions || []
          };
        }

        // Catégorie interdite (médicament)
        if (errorData.error === 'FORBIDDEN_CATEGORY') {
          throw {
            code: 'FORBIDDEN_CATEGORY',
            message: errorData.message,
            suggestion: errorData.suggestion,
            disclaimer: errorData.disclaimer
          };
        }
      }

      throw this.handleError(error, 'PHOTO_ANALYSIS_FAILED');
    }
  }

  /**
   * ANCIEN : Scanner un produit inconnu avec OCR
   * Conservé pour compatibilité
   */
  async scanUnknownProduct(file: File): Promise<ScanResult> {
    try {
      const ocrResult: OCRResult = await ocrService.analyzeImage(file);

      if (!ocrResult.success || !ocrResult.data) {
        throw new Error('Échec analyse OCR');
      }

      return {
        isOCRResult: true,
        confidence: ocrResult.data.confidence / 100,
        ocrData: ocrResult.data,
        extractedData: {
          category: ocrResult.data.category,
          ingredients: ocrResult.data.ingredients.map(i => i.name).join(', ')
        }
      };
    } catch (error: any) {
      throw this.handleError(error, 'OCR_SCAN_FAILED');
    }
  }

  /**
   * ANCIEN : Analyse par photo (legacy)
   * Conservé pour compatibilité
   */
  async analyzePhoto(file: File, useOCR: boolean = false): Promise<ScanResult> {
    try {
      if (useOCR) {
        return await this.scanUnknownProduct(file);
      }

      const imageUrl = await cloudinaryService.uploadImage(file);
      const endpoint = '/vision/analyze-image';

      const response = await apiClient.post(endpoint, {
        imageUrl,
        method: 'photo',
        source: 'web',
        category: 'food',
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

  // Validation code-barres
  static isValidBarcode(code: string): boolean {
    return /^(\d{8}|\d{12}|\d{13})$/.test(code);
  }

  // Détection catégorie
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

    return 'food';
  }
}
