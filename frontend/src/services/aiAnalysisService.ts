// PATH: frontend/src/services/aiAnalysisService.ts
import axios from 'axios';

const API_BASE_URL = 'https://ecolojia-backend-working.onrender.com/api';

interface AnalysisRequest {
  category: 'food' | 'cosmetics' | 'detergents';
  name: string;
  brand?: string;
  ingredients: string;
  barcode?: string;
  image?: File;
}

interface AnalysisResponse {
  product: {
    id?: string;
    name: string;
    brand?: string;
    category: string;
    barcode?: string;
  };
  analysis: {
    healthScore: number;
    category: string;
    recommendations: string[];
    alternatives?: any[];
    // Category specific fields
    [key: string]: any;
  };
}

class AIAnalysisService {
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(includeAuth: boolean = true): any {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async analyzeProduct(data: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      let endpoint = '';
      let requestBody: any = {
        name: data.name,
        brand: data.brand,
        ingredients: data.ingredients,
        barcode: data.barcode
      };

      // Déterminer l'endpoint selon la catégorie
      switch (data.category) {
        case 'food':
          endpoint = '/ai/quick-analyze';
          break;
        case 'cosmetics':
          endpoint = '/cosmetic/analyze';
          requestBody = {
            productName: data.name,
            brand: data.brand,
            ingredients: data.ingredients
          };
          break;
        case 'detergents':
          endpoint = '/detergent/analyze';
          requestBody = {
            productName: data.name,
            brand: data.brand,
            ingredients: data.ingredients
          };
          break;
      }

      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        requestBody,
        { headers: this.getHeaders() }
      );

      // Normaliser la réponse pour toutes les catégories
      return this.normalizeResponse(response.data, data);
    } catch (error) {
      console.error('Analysis error:', error);
      throw this.handleError(error);
    }
  }

  async analyzeByBarcode(barcode: string): Promise<AnalysisResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/ai/quick-analyze`,
        { barcode },
        { headers: this.getHeaders() }
      );

      return this.normalizeResponse(response.data, { 
        category: 'food', 
        name: response.data.productName || 'Produit',
        ingredients: '',
        barcode 
      });
    } catch (error) {
      console.error('Barcode analysis error:', error);
      throw this.handleError(error);
    }
  }

  async analyzeByImage(image: File, category: 'food' | 'cosmetics' | 'detergents'): Promise<AnalysisResponse> {
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('category', category);

      const response = await axios.post(
        `${API_BASE_URL}/analyze/image`,
        formData,
        { 
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return this.normalizeResponse(response.data, { 
        category, 
        name: response.data.productName || 'Produit',
        ingredients: response.data.ingredients || ''
      });
    } catch (error) {
      console.error('Image analysis error:', error);
      throw this.handleError(error);
    }
  }

  private normalizeResponse(data: any, request: Partial<AnalysisRequest>): AnalysisResponse {
    // Structure unifiée pour toutes les catégories
    const normalized: AnalysisResponse = {
      product: {
        id: data.productId || data.id,
        name: data.productName || request.name || 'Produit',
        brand: data.brand || request.brand,
        category: request.category || 'food',
        barcode: data.barcode || request.barcode
      },
      analysis: {
        healthScore: this.extractHealthScore(data),
        category: this.extractCategory(data),
        recommendations: this.extractRecommendations(data),
        alternatives: data.alternatives || []
      }
    };

    // Ajouter les champs spécifiques selon la catégorie
    switch (request.category) {
      case 'food':
        normalized.analysis.novaScore = data.novaScore;
        normalized.analysis.additives = data.additives || [];
        normalized.analysis.ultraTransformScore = data.ultraTransformationScore;
        break;
      case 'cosmetics':
        normalized.analysis.inciScore = data.inciScore;
        normalized.analysis.endocrineDisruptors = data.endocrineDisruptors || [];
        normalized.analysis.allergens = data.allergens || [];
        break;
      case 'detergents':
        normalized.analysis.ecoScore = data.ecoScore;
        normalized.analysis.biodegradability = data.biodegradability;
        normalized.analysis.aquaticToxicity = data.aquaticToxicity;
        break;
    }

    return normalized;
  }

  private extractHealthScore(data: any): number {
    // Différents champs selon l'API
    return data.healthScore || 
           data.overallScore || 
           data.score || 
           data.globalScore || 
           50; // Score par défaut
  }

  private extractCategory(data: any): string {
    if (data.healthScore >= 80) return 'Excellent';
    if (data.healthScore >= 60) return 'Bon';
    if (data.healthScore >= 40) return 'Moyen';
    return 'À éviter';
  }

  private extractRecommendations(data: any): string[] {
    if (Array.isArray(data.recommendations)) {
      return data.recommendations;
    }
    
    if (data.advice) {
      return Array.isArray(data.advice) ? data.advice : [data.advice];
    }

    // Générer des recommandations par défaut selon le score
    const score = this.extractHealthScore(data);
    if (score >= 80) {
      return ['Excellent choix pour votre santé !', 'Continuez avec ce type de produits.'];
    } else if (score >= 60) {
      return ['Produit convenable avec modération.', 'Recherchez des alternatives plus saines si possible.'];
    } else {
      return ['Consommation occasionnelle recommandée.', 'Privilégiez des alternatives plus naturelles.'];
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        // Token expiré ou invalide
        localStorage.removeItem('token');
        window.location.href = '/login';
        return new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (error.response?.status === 429) {
        return new Error('Limite d\'analyses atteinte. Passez en Premium pour continuer.');
      }

      return new Error(error.response?.data?.message || 'Erreur lors de l\'analyse');
    }
    
    return new Error('Erreur de connexion. Vérifiez votre connexion internet.');
  }

  // Méthode pour vérifier les quotas avant analyse
  async checkQuota(): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/user/quota`,
        { headers: this.getHeaders() }
      );

      return {
        allowed: response.data.allowed,
        remaining: response.data.remaining
      };
    } catch (error) {
      console.error('Quota check error:', error);
      // En cas d'erreur, on permet l'analyse
      return { allowed: true, remaining: -1 };
    }
  }

  // Sauvegarder une analyse dans l'historique
  async saveToHistory(analysisResult: AnalysisResponse): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/user/history`,
        {
          productId: analysisResult.product.id,
          analysisData: analysisResult.analysis,
          category: analysisResult.product.category
        },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Save to history error:', error);
      // Ne pas bloquer l'utilisateur si la sauvegarde échoue
    }
  }

  // Récupérer l'historique des analyses
  async getHistory(limit: number = 20): Promise<AnalysisResponse[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/user/history?limit=${limit}`,
        { headers: this.getHeaders() }
      );

      return response.data.map((item: any) => this.normalizeResponse(item, {
        category: item.category,
        name: item.productName,
        brand: item.brand
      }));
    } catch (error) {
      console.error('Get history error:', error);
      return [];
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();