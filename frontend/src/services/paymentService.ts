// PATH: frontend/ecolojiaFrontV3/src/services/paymentService.ts
import axios from 'axios';

const API_BASE_URL = 'https://ecolojia-backend-working.onrender.com/api';

interface CheckoutResponse {
  checkoutUrl: string;
}

interface PortalResponse {
  portalUrl: string;
}

interface SubscriptionStatus {
  isActive: boolean;
  status: string;
  currentPeriodEnd?: Date;
  cancelledAt?: Date;
}

class PaymentService {
  private getAuthToken(): string | null {
    // Debug : lister toutes les clés dans localStorage
    console.log('Clés dans localStorage:', Object.keys(localStorage));
    console.log('Clés dans sessionStorage:', Object.keys(sessionStorage));
    
    // Vérifier les différents endroits où le token peut être stocké
    const possibleKeys = ['token', 'authToken', 'auth_token', 'jwt', 'access_token'];
    
    for (const key of possibleKeys) {
      const token = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (token) {
        console.log(`Token trouvé avec la clé: ${key}`);
        return token;
      }
    }
    
    console.warn('Aucun token trouvé dans le storage');
    return null;
  }

  private getHeaders(): any {
    const token = this.getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
    
    console.log('Headers envoyés:', {
      ...headers,
      'Authorization': headers.Authorization ? 'Bearer [TOKEN]' : 'Pas de token'
    });
    
    return headers;
  }

  /**
   * Créer une session de checkout Lemon Squeezy
   */
  async createCheckout(): Promise<string> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Vous devez être connecté pour accéder à cette fonctionnalité. Veuillez vous reconnecter.');
      }

      console.log('Création du checkout avec token présent');
      
      const response = await axios.post<CheckoutResponse>(
        `${API_BASE_URL}/payment/create-checkout`,
        {},
        { 
          headers: this.getHeaders()
        }
      );

      if (!response.data || !response.data.checkoutUrl) {
        console.error('Réponse du serveur:', response.data);
        throw new Error('URL de paiement non reçue du serveur');
      }

      return response.data.checkoutUrl;
    } catch (error) {
      console.error('Create checkout error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        
        if (error.response?.status === 401) {
          throw new Error('Session expirée ou invalide. Veuillez vous déconnecter et vous reconnecter.');
        }
        if (error.response?.status === 403) {
          throw new Error('Accès refusé. Vérifiez vos permissions.');
        }
        if (error.response?.status === 404) {
          throw new Error('Service de paiement non configuré sur le serveur');
        }
        if (error.response?.status === 500) {
          throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
        }
        
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la création du paiement';
        throw new Error(errorMessage);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Erreur inattendue lors de la création du paiement');
    }
  }

  /**
   * Obtenir l'URL du portail client Lemon Squeezy
   */
  async getCustomerPortal(): Promise<string> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Vous devez être connecté pour accéder à cette fonctionnalité');
      }

      const response = await axios.get<PortalResponse>(
        `${API_BASE_URL}/payment/customer-portal`,
        { 
          headers: this.getHeaders()
        }
      );

      if (!response.data || !response.data.portalUrl) {
        throw new Error('URL du portail non reçue');
      }

      return response.data.portalUrl;
    } catch (error) {
      console.error('Get portal error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        if (error.response?.status === 404) {
          throw new Error('Le portail de gestion n\'est pas encore disponible');
        }
        
        const errorMessage = error.response?.data?.message || 'Erreur lors de l\'accès au portail';
        throw new Error(errorMessage);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Erreur inattendue');
    }
  }

  /**
   * Vérifier le statut de l'abonnement
   */
  async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/user/subscription-status`,
        { 
          headers: this.getHeaders()
        }
      );

      return {
        isActive: response.data?.isActive || false,
        status: response.data?.status || 'inactive',
        currentPeriodEnd: response.data?.currentPeriodEnd ? new Date(response.data.currentPeriodEnd) : undefined,
        cancelledAt: response.data?.cancelledAt ? new Date(response.data.cancelledAt) : undefined
      };
    } catch (error) {
      console.error('Check subscription error:', error);
      return {
        isActive: false,
        status: 'inactive'
      };
    }
  }

  /**
   * Méthode de test pour vérifier la connexion
   */
  async testConnection(): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      console.log('Test de connexion - Token présent:', !!token);
      
      if (!token) {
        console.error('Pas de token trouvé pour le test');
        return false;
      }
      
      // Faire un appel simple pour vérifier l'authentification
      const response = await axios.get(
        `${API_BASE_URL}/user/me`,
        { headers: this.getHeaders() }
      );
      
      console.log('Test de connexion réussi:', response.data);
      return true;
    } catch (error) {
      console.error('Test de connexion échoué:', error);
      return false;
    }
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return !!token;
  }

  /**
   * Obtenir des informations de debug
   */
  getDebugInfo(): { hasToken: boolean; tokenKey?: string; storageKeys: string[] } {
    const possibleKeys = ['token', 'authToken', 'auth_token', 'jwt', 'access_token'];
    let foundKey: string | undefined;
    
    for (const key of possibleKeys) {
      if (localStorage.getItem(key) || sessionStorage.getItem(key)) {
        foundKey = key;
        break;
      }
    }
    
    return {
      hasToken: !!foundKey,
      tokenKey: foundKey,
      storageKeys: [...Object.keys(localStorage), ...Object.keys(sessionStorage)]
    };
  }
}

export const paymentService = new PaymentService();

// Export pour debug dans la console
if (typeof window !== 'undefined') {
  (window as any).paymentServiceDebug = {
    getDebugInfo: () => paymentService.getDebugInfo(),
    testConnection: () => paymentService.testConnection(),
    isAuthenticated: () => paymentService.isAuthenticated()
  };
}