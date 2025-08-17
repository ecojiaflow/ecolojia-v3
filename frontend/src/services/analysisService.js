// frontend/src/services/analysisService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Creer une instance axios configuree
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Service d'analyse unifie
class AnalysisService {
  // Analyse par code-barres
  async analyzeByBarcode(barcode) {
    try {
      const response = await api.post('/analysis/barcode', { barcode });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur analyse barcode:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'analyse'
      };
    }
  }

  // Analyse manuelle
  async analyzeManual(productData) {
    try {
      const response = await api.post('/analysis/manual', productData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur analyse manuelle:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'analyse'
      };
    }
  }

  // Analyse par image
  async analyzeImage(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post('/vision/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur analyse image:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'analyse de l\'image'
      };
    }
  }

  // Analyse produit generique
  async analyzeProduct(data) {
    try {
      const endpoint = data.barcode ? '/analysis/barcode' : '/analysis/manual';
      const response = await api.post(endpoint, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur analyse produit:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'analyse'
      };
    }
  }

  // Obtenir l'historique
  async getHistory(limit = 10) {
    try {
      const response = await api.get(`/analysis/history?limit=${limit}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur recuperation historique:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la recuperation de l\'historique'
      };
    }
  }
}

export default new AnalysisService();
