// frontend/src/services/ocrService.ts
import { apiClient, getErrorMessage } from './apiClient';

/**
 * Types OCR
 */
export interface OCRIngredient {
  name: string;
  role?: string;
}

export interface OCRNutrition {
  energy?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  fiber?: number;
  proteins?: number;
  salt?: number;
}

export interface OCRResult {
  success: boolean;
  data?: {
    rawText: string;
    ingredients: OCRIngredient[];
    nutrition: OCRNutrition;
    category: 'food' | 'cosmetic' | 'detergent';
    confidence: number;
    processingTime: number;
  };
  error?: string;
}

export interface OCRError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Service OCR avec Google Cloud Vision
 */
export class OCRService {
  private static instance: OCRService;

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Analyser une image avec Google Vision OCR
   * @param file - Fichier image à analyser
   * @returns Résultat de l'analyse OCR
   */
  async analyzeImage(file: File): Promise<OCRResult> {
    try {
      // 1. Convertir le fichier en base64
      const imageBase64 = await this.fileToBase64(file);

      // 2. Appeler l'API OCR backend
      const response = await apiClient.post('/ai/ocr', {
        imageBase64
      });

      // 3. Valider et retourner le résultat
      if (response.data?.success) {
        return response.data as OCRResult;
      }

      throw new Error(response.data?.error || 'Erreur OCR inconnue');
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Convertir un fichier en base64
   * @param file - Fichier à convertir
   * @returns Promise<string> - Image en base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64 = reader.result as string;
        // Retirer le préfixe data:image/...;base64,
        const base64Data = base64.split(',')[1] || base64;
        resolve(base64Data);
      };

      reader.onerror = () => {
        reject(new Error('Erreur lecture fichier'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Gérer les erreurs OCR
   */
  private handleError(error: any): OCRError {
    return {
      code: 'OCR_FAILED',
      message: getErrorMessage(error),
      details: error.response?.data
    };
  }

  /**
   * Vérifier si l'OCR a détecté du texte
   */
  static hasText(result: OCRResult): boolean {
    return !!(result.data?.rawText && result.data.rawText.length > 0);
  }

  /**
   * Vérifier si l'OCR a détecté des ingrédients
   */
  static hasIngredients(result: OCRResult): boolean {
    return !!(result.data?.ingredients && result.data.ingredients.length > 0);
  }
}

// Export singleton
export const ocrService = OCRService.getInstance();