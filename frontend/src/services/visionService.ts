// frontend/src/services/visionService.ts
import api from './apiClient';

interface VisionResult {
  success: boolean;
  data?: {
    extractedData?: {
      name?: string;
      brand?: string;
      ingredients?: string;
      barcode?: string;
      category?: string;
    };
    text?: string;
    confidence?: number;
    productId?: string;
  };
  error?: string;
}

interface UploadResult {
  success: boolean;
  result?: {
    extractedData?: {
      name?: string;
      brand?: string;
      ingredients?: string;
      barcode?: string;
      category?: string;
    };
    text?: string;
    confidence?: number;
    productId?: string;
  };
  error?: string;
}

class VisionService {
  private apiPath = '/api/vision';

  /**
   * Analyse une image pour extraire les informations produit
   */
  async analyzeImage(file: File): Promise<VisionResult> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(`${this.apiPath}/analyze-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Adapter la réponse au format attendu
      if (response.data) {
        return {
          success: true,
          data: {
            extractedData: response.data.extractedData || response.data,
            text: response.data.text,
            confidence: response.data.confidence,
            productId: response.data.productId
          }
        };
      }

      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      console.error('Vision analysis error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur lors de l\'analyse de l\'image',
      };
    }
  }

  /**
   * Upload et analyse une image avec callback de progression
   */
  async uploadAndAnalyze(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(`${this.apiPath}/analyze-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      // Adapter la réponse au format attendu
      return {
        success: true,
        result: {
          extractedData: response.data?.extractedData || response.data,
          text: response.data?.text,
          confidence: response.data?.confidence,
          productId: response.data?.productId
        }
      };
    } catch (error: any) {
      console.error('Vision upload error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur lors de l\'upload',
      };
    }
  }

  /**
   * Obtenir le statut d'une analyse en cours
   */
  async getAnalysisStatus(jobId: string): Promise<{
    success: boolean;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    result?: any;
    error?: string;
  }> {
    try {
      const response = await api.get(`${this.apiPath}/status/${jobId}`);
      
      return {
        success: true,
        status: response.data?.status || response.status,
        result: response.data?.result || response.result,
      };
    } catch (error: any) {
      console.error('Status check error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur lors de la vérification du statut',
      };
    }
  }

  /**
   * Méthode de test pour vérifier la connexion
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await api.get(`${this.apiPath}/health`);
      return response.status === 200;
    } catch (error) {
      console.error('Vision service health check failed:', error);
      return false;
    }
  }
}

// Créer une instance unique du service
const visionService = new VisionService();

// Export par défaut et export nommé pour compatibilité
export { visionService };
export default visionService;
