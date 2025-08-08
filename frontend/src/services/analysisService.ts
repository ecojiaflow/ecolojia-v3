// PATH: frontend/src/services/analysisService.js
// Service d'analyse avec endpoint quota corrigé

import { api } from './apiClient';

class AnalysisService {
  /**
   * Analyse par code-barres
   */
  async analyzeByBarcode(barcode) {
    try {
      console.log('🔍 Analyse par code-barres:', barcode);
      
      const response = await api.post('/api/analysis/barcode', {
        barcode: barcode.trim()
      });

      console.log('✅ Résultat analyse:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur analyse barcode:', error);
      
      if (error.status === 404) {
        throw new Error('Produit non trouvé dans notre base de données');
      }
      
      throw new Error(error.message || 'Impossible d\'analyser ce code-barres');
    }
  }

  /**
   * Vérifier les quotas - ENDPOINT CORRIGÉ
   */
  async checkQuota() {
    try {
      // CORRECTION: /api/quota au lieu de /api/dashboard/quotas
      const response = await api.get('/api/quota');
      console.log('✅ Quotas:', response);
      
      // Adapter la réponse au format attendu
      return {
        used: response.scansUsed || 0,
        limit: response.scansLimit || 30,
        remaining: response.scansRemaining || 30,
        plan: response.plan || 'free'
      };
    } catch (error) {
      console.error('❌ Check quota error:', error);
      // Retourner des valeurs par défaut
      return {
        used: 0,
        limit: 30,
        remaining: 30,
        plan: 'free'
      };
    }
  }

  /**
   * Analyse un produit alimentaire
   */
  async analyzeFood(data) {
    try {
      const response = await api.post('/api/analysis/food', data);
      return response;
    } catch (error) {
      console.error('Food analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Analyse un produit cosmétique
   */
  async analyzeCosmetic(data) {
    try {
      const response = await api.post('/api/analysis/cosmetic', data);
      return response;
    } catch (error) {
      console.error('Cosmetic analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Analyse un détergent
   */
  async analyzeDetergent(data) {
    try {
      const response = await api.post('/api/analysis/detergent', data);
      return response;
    } catch (error) {
      console.error('Detergent analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Analyse générique par catégorie
   */
  async analyzeProduct(category, data) {
    const endpoints = {
      food: 'food',
      cosmetics: 'cosmetic',
      detergents: 'detergent'
    };

    const endpoint = endpoints[category] || 'food';

    try {
      const response = await api.post(`/api/analysis/${endpoint}`, data);
      return response;
    } catch (error) {
      console.error(`${category} analysis error:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer l'historique des analyses
   */
  async getAnalysisHistory(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/api/analyses?${params}`);
      return response;
    } catch (error) {
      console.error('Get history error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Récupérer une analyse par ID
   */
  async getAnalysisById(id) {
    try {
      const response = await api.get(`/api/analyses/${id}`);
      return response;
    } catch (error) {
      console.error('Get analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir des suggestions basées sur l'historique
   */
  async getSuggestions() {
    try {
      const response = await api.get('/api/analysis/suggestions');
      return response;
    } catch (error) {
      console.error('Get suggestions error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Gestion des erreurs
   */
  handleError(error) {
    if (error.response) {
      const { data, status } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/auth';
        return new Error('Session expirée. Veuillez vous reconnecter.');
      }
      if (status === 403) {
        return new Error(data.error || 'Accès refusé. Vérifiez vos quotas.');
      }
      if (status === 429) {
        return new Error('Trop de requêtes. Veuillez patienter.');
      }
      return new Error(data.error || 'Une erreur est survenue');
    }

    if (error.request) {
      return new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    }

    return new Error('Une erreur inattendue est survenue');
  }
}

// Créer l'instance
const analysisService = new AnalysisService();

// Export nommé et par défaut
export { analysisService };
export default analysisService;