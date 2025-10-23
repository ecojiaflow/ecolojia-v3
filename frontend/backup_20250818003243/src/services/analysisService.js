// PATH: frontend/src/services/analysisService.js
import axios from 'axios';

const API_BASE_URL = import.met?.env.VITE_API_URL || 'http://localhost:5001';

// Creer une instance axios configuree
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Intercepteur pour ajouter le token si disponible
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const analysisService = {
  /**
   * Analyse manuelle d'un produit
   * @param {Object} productData - Les donnees du produit
   * @returns {Promise<Object>} Resultat de l'analyse
   */
  async analyzeManual(productData) {
    try {
      console.log('[AnalysisService] Analyse manuelle:', productData);
      const response = await api.post('/api/analysis/manual', productData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AnalysisService] Erreur:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur lors de l\'analyse'
      };
    }
  },

  /**
   * Analyse par code-barres
   * @param {string} barcode - Le code-barres du produit
   * @returns {Promise<Object>} Resultat de l'analyse
   */
  async analyzeByBarcode(barcode) {
    try {
      console.log('[AnalysisService] Analyse par code-barres:', barcode);
      const response = await api.post('/api/analysis/barcode', { barcode });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AnalysisService] Erreur:', error);
      
      // Si le produit n'est pas trouve, renvoyer une erreur specifique
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Produit non trouve. Veuillez utiliser la saisie manuelle.'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur lors de l\'analyse'
      };
    }
  },

  /**
   * Analyse generale (flexible)
   * @param {Object} data - Les donnees Â  analyser
   * @returns {Promise<Object>} Resultat de l'analyse
   */
  async analyzeProduct(data) {
    try {
      console.log('[AnalysisService] Analyse produit:', data);
      const response = await api.post('/api/analysis', data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AnalysisService] Erreur:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur lors de l\'analyse'
      };
    }
  },

  /**
   * Recuperer l'historique des analyses
   * @param {number} page - Numero de page
   * @param {number} limit - Nombre d'elements par page
   * @returns {Promise<Object>} Liste des analyses
   */
  async getHistory(page = 1, limit = 20) {
    try {
      const response = await api.get('/api/analysis/history', {
        params: { page, limit }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AnalysisService] Erreur:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur lors de la recuperation de l\'historique'
      };
    }
  },

  /**
   * Recuperer une analyse par ID
   * @param {string} id - ID de l'analyse
   * @returns {Promise<Object>} Details de l'analyse
   */
  async getAnalysisById(id) {
    try {
      const response = await api.get(`/api/analysis/${id}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AnalysisService] Erreur:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur lors de la recuperation de l\'analyse'
      };
    }
  },

  /**
   * Analyse par lot (batch)
   * @param {Array} products - Liste des produits Â  analyser
   * @returns {Promise<Object>} Resultats des analyses
   */
  async analyzeBatch(products) {
    try {
      console.log('[AnalysisService] Analyse batch:', products.length, 'produits');
      const response = await api.post('/api/analysis/batch', { products });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AnalysisService] Erreur:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur lors de l\'analyse batch'
      };
    }
  },

  /**
   * Verifier le statut du service
   * @returns {Promise<Object>} Statut du service
   */
  async checkStatus() {
    try {
      const response = await api.get('/api/analysis/_service/status');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AnalysisService] Erreur:', error);
      return {
        success: false,
        error: 'Service non disponible'
      };
    }
  },

  /**
   * Ping le service
   * @returns {Promise<Object>} Reponse du ping
   */
  async ping() {
    try {
      const response = await api.post('/api/analysis/ping', { timestamp: Date.now() });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AnalysisService] Erreur:', error);
      return {
        success: false,
        error: 'Service non disponible'
      };
    }
  }
};

// Export par defaut pour compatibilite
export default analysisService;

// Export nomme pour les imports avec accolades
export { analysisService };