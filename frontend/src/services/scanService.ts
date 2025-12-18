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
  // Nouveau : données OCR
  ocrData?: {
    rawText: string;
    ingredients: Array<{ name: string; role?: string }>;
    nutrition: any;
    category: string;
    confidence: number;
    processingTime: number;
  };
  isOCRResult?: boolean; // Flag pour savoir si c'est un résultat OCR
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
      // Appeler directement /analysis qui retourne les scores calculés
      const response = await apiClient.post('/analysis', {
        barcode: code,
        method: 'barcode',
        source: 'web'
      });

      // L'API /analysis retourne déjà la bonne structure
      // { product: { name, barcode, ... }, scores: { overallScore, ... } }
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'BARCODE_SCAN_FAILED');
    }
  }

  /**
   * NOUVEAU : Scanner un produit inconnu avec OCR
   * Utilisé quand le code-barres n'est pas trouvé
   */
  async scanUnknownProduct(file: File): Promise<ScanResult> {
    try {
      // 1. Analyser avec Google Vision OCR
      const ocrResult: OCRResult = await ocrService.analyzeImage(file);

      if (!ocrResult.success || !ocrResult.data) {
        throw new Error('Échec analyse OCR');
      }

      // 2. Convertir le résultat OCR en ScanResult
      return {
        isOCRResult: true,
        confidence: ocrResult.data.confidence / 100, // Convertir % en 0-1
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

  // Analyse par photo (améliorée avec OCR)
  async analyzePhoto(file: File, useOCR: boolean = false): Promise<ScanResult> {
    try {
      // Si OCR explicitement demandé, utiliser la nouvelle méthode
      if (useOCR) {
        return await this.scanUnknownProduct(file);
      }

      // Sinon, utiliser l'ancien flux (Cloudinary + vision/analyze-image)
      // 1. Upload vers Cloudinary
      const imageUrl = await cloudinaryService.uploadImage(file);

      // 2. Choisir l'endpoint selon le mode
      const endpoint = '/vision/analyze-image';

      // 3. Analyser l'image
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

  // Methode pour valider un code-barres
  static isValidBarcode(code: string): boolean {
    // Validation basique : 8, 12 ou 13 chiffres
    return /^(\d{8}|\d{12}|\d{13})$/.test(code);
  }

  // Methode pour detecter la categorie d'un produit à partir de son nom
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

