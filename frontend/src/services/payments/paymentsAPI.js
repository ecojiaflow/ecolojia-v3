const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

class PaymentsAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Obtenir le token d'authentification depuis le localStorage
   */
  getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  /**
   * Headers par défaut avec authentification
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Gérer les erreurs de réponse API
   */
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Créer une session de checkout LemonSqueezy
   */
  async createCheckoutSession(userEmail, userId, customData = {}) {
    try {
      const response = await fetch(`${this.baseURL}/api/payments/create-checkout`, {
        method: 'POST',
        headers: this.getHeaders(false), // Pas d'auth requise
        body: JSON.stringify({
          userEmail,
          userId,
          customData
        })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur création checkout:', error);
      throw error;
    }
  }

  /**
   * Récupérer le statut d'abonnement d'un utilisateur
   */
  async getSubscriptionStatus(userId) {
    try {
      const response = await fetch(`${this.baseURL}/api/payments/subscription/${userId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur récupération abonnement:', error);
      throw error;
    }
  }

  /**
   * Vérifier l'accès premium d'un utilisateur
   */
  async checkPremiumAccess(userId) {
    try {
      const response = await fetch(`${this.baseURL}/api/payments/check-premium/${userId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur vérification premium:', error);
      throw error;
    }
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(userId, reason = '') {
    try {
      const response = await fetch(`${this.baseURL}/api/payments/cancel-subscription`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          userId,
          reason
        })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur annulation abonnement:', error);
      throw error;
    }
  }

  /**
   * Synchroniser un abonnement avec LemonSqueezy
   */
  async syncSubscription(lemonSqueezyId) {
    try {
      const response = await fetch(`${this.baseURL}/api/payments/sync-subscription`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          lemonSqueezyId
        })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      throw error;
    }
  }

  /**
   * Enregistrer l'utilisation d'une fonctionnalité
   */
  async trackUsage(userId, usageType, amount = 1) {
    try {
      const response = await fetch(`${this.baseURL}/api/payments/track-usage`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          userId,
          usageType,
          amount
        })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur tracking usage:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques d'abonnements (admin)
   */
  async getSubscriptionStats() {
    try {
      const response = await fetch(`${this.baseURL}/api/payments/admin/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      throw error;
    }
  }

  /**
   * Vérifier la santé du service payments
   */
  async checkPaymentsHealth() {
    try {
      const response = await fetch(`${this.baseURL}/api/webhooks/health`, {
        method: 'GET',
        headers: this.getHeaders(false)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erreur health check:', error);
      throw error;
    }
  }
}

// Export singleton
export default new PaymentsAPI();