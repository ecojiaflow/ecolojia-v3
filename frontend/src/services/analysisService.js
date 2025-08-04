// frontend/src/services/analysisService.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Récupérer le token depuis le localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

// Configuration axios avec token
const createAuthConfig = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  };
};

class AnalysisService {
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
      const response = await axios.post(
        `${API_URL}/analysis/${endpoint}`,
        data,
        createAuthConfig()
      );
      return response.data;
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
      const response = await axios.get(
        `${API_URL}/analyses?${params}`,
        createAuthConfig()
      );
      return response.data;
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
      const response = await axios.get(
        `${API_URL}/analyses/${id}`,
        createAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Get analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Supprimer une analyse
   */
  async deleteAnalysis(id) {
    try {
      const response = await axios.delete(
        `${API_URL}/analyses/${id}`,
        createAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Delete analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Exporter les analyses
   */
  async exportAnalyses(format = 'pdf', filters = {}) {
    try {
      const params = new URLSearchParams({ ...filters, format }).toString();
      const response = await axios.get(
        `${API_URL}/analyses/export?${params}`,
        {
          ...createAuthConfig(),
          responseType: 'blob'
        }
      );

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ecolojia-analyses.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Export error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir des suggestions basées sur l'historique
   */
  async getSuggestions() {
    try {
      const response = await axios.get(
        `${API_URL}/analysis/suggestions`,
        createAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Get suggestions error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Vérifier les quotas
   */
  async checkQuota() {
    try {
      const response = await axios.get(
        `${API_URL}/dashboard/quotas`,
        createAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Check quota error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Gestion des erreurs
   */
  handleError(error) {
    if (error.response) {
      // Erreur de l'API
      const { data, status } = error.response;
      
      if (status === 401) {
        // Token expiré ou invalide
        localStorage.removeItem('token');
        window.location.href = '/auth';
        return new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (status === 403) {
        // Quota dépassé ou accès refusé
        return new Error(data.error || 'Accès refusé. Vérifiez vos quotas.');
      }
      
      if (status === 429) {
        // Rate limit
        return new Error('Trop de requêtes. Veuillez patienter.');
      }
      
      return new Error(data.error || 'Une erreur est survenue');
    }
    
    if (error.request) {
      // Pas de réponse
      return new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    }
    
    // Autre erreur
    return new Error('Une erreur inattendue est survenue');
  }
}

export const analysisService = new AnalysisService(); // Analyse un produit alimentaire
   
  async analyzeFood(data) {
    try {
      const response = await axios.post(
        `${API_URL}/analysis/food`,
        data,
        createAuthConfig()
      );
      return response.data;
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
      const response = await axios.post(
        `${API_URL}/analysis/cosmetic`,
        data,
        createAuthConfig()
      );
      return response.data;
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
      const response = await axios.post(
        `${API_URL}/analysis/detergent`,
        data,
        createAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Detergent analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Analyse par code-barres
   */
  async analyzeByBarcode(barcode) {
    try {
      const response = await axios.post(
        `${API_URL}/analysis/barcode`,
        { barcode },
        createAuthConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Barcode analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   *