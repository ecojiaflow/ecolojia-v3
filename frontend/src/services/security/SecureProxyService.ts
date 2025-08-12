// frontend/src/services/security/SecureProxyService.ts
import api from '../api';

export interface SecureSearchToken {
  token: string;
  expiresIn: number;
  expiresAt: Date;
  allowedIndices: string[];
}

export interface SecureCheckoutSession {
  checkoutUrl: string;
  checkoutId: string;
  plan: 'monthly' | 'annual';
}

export interface SecureUploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  uploadParams: Record<string, any>;
}

export interface AIQuotaInfo {
  response: string;
  quotaRemaining: number;
}

/**
 * Service de proxy sécurisé pour protéger les clés API
 * Toutes les requêtes passent par le backend pour éviter d'exposer les secrets
 */
export class SecureProxyService {
  private static instance: SecureProxyService;
  private searchTokenCache: SecureSearchToken | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SecureProxyService {
    if (!SecureProxyService.instance) {
      SecureProxyService.instance = new SecureProxyService();
    }
    return SecureProxyService.instance;
  }

  // ââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Â
  // ALGOLIA SECURE METHODS
  // ââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Â

  /**
   * Obtient un token de recherche Algolia temporaire et sécurisé
   */
  async getAlgoliaSearchToken(indices?: string[]): Promise<SecureSearchToken> {
    try {
      // Vérifier le cache
      if (this.searchTokenCache && new Date(this.searchTokenCache.expiresAt) > new Date()) {
        return this.searchTokenCache;
      }

      const response = await api.post('/proxy/algolia/search-token', {
        indices: indices || ['ecolojia_products']
      });

      const tokenData: SecureSearchToken = {
        ...response.data,
        expiresAt: new Date(response.data.expiresAt)
      };

      // Mettre en cache
      this.searchTokenCache = tokenData;

      // Programmer le renouvellement automatique
      this.scheduleTokenRefresh(tokenData.expiresIn);

      console.log('âÅ“â€¦ Algolia search token obtained (expires in', tokenData.expiresIn, 'seconds)');
      return tokenData;
    } catch (error) {
      console.error('âÂÅ’ Failed to get Algolia search token:', error);
      throw new Error('Impossible d\'obtenir le token de recherche');
    }
  }

  /**
   * Effectue une recherche Algolia sécurisée côté serveur
   * Alternative au token client pour plus de sécurité
   */
  async searchAlgoliaSecure(query: string, options?: any): Promise<any> {
    try {
      const response = await api.post('/proxy/algolia/search', {
        query,
        indexName: options?.indexName || 'ecolojia_products',
        options: {
          hitsPerPage: options?.hitsPerPage || 20,
          page: options?.page || 0,
          filters: options?.filters,
          facetFilters: options?.facetFilters
        }
      });

      return response.data.results;
    } catch (error) {
      console.error('âÂÅ’ Secure Algolia search failed:', error);
      throw new Error('Erreur lors de la recherche');
    }
  }

  // ââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Â
  // LEMONSQUEEZY SECURE METHODS
  // ââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Â

  /**
   * Crée une session de checkout LemonSqueezy sécurisée
   */
  async createSecureCheckout(plan: 'monthly' | 'annual' = 'monthly'): Promise<SecureCheckoutSession> {
    try {
      const response = await api.post('/proxy/lemonsqueezy/checkout', { plan });
      
      console.log('âÅ“â€¦ Secure checkout session created:', plan);
      return response.data;
    } catch (error: any) {
      console.error('âÂÅ’ Failed to create secure checkout:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Vous devez être connecté pour accéder ÃƒÂ  cette fonctionnalité');
      }
      
      throw new Error(error.response?.data?.error || 'Erreur lors de la création du paiement');
    }
  }

  /**
   * Récupère le statut d'abonnement de manière sécurisée
   */
  async getSubscriptionStatus(): Promise<any> {
    try {
      const response = await api.get('/proxy/lemonsqueezy/subscription');
      return response.data.subscription;
    } catch (error) {
      console.error('âÂÅ’ Failed to get subscription status:', error);
      return null;
    }
  }

  // ââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Â
  // AI SECURE METHODS
  // ââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Â

  /**
   * Envoie un message au chat IA de manière sécurisée avec gestion des quotas
   */
  async sendAIMessage(message: string, context?: any): Promise<AIQuotaInfo> {
    try {
      const response = await api.post('/proxy/ai/chat', {
        message,
        context
      });

      return {
        response: response.data.response,
        quotaRemaining: response.data.quotaRemaining
      };
    } catch (error: any) {
      console.error('âÂÅ’ AI chat error:', error);
      
      if (error.response?.status === 403) {
        throw new Error('Quota de questions IA épuisé. Passez ÃƒÂ  Premium pour des questions illimitées.');
      }
      
      throw new Error(error.response?.data?.error || 'Erreur lors de la communication avec l\'IA');
    }
  }

  // ââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Â
  // CLOUDINARY SECURE METHODS
  // ââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Â

  /**
   * Obtient une signature pour upload sécurisé Cloudinary
   */
  async getUploadSignature(uploadPreset?: string): Promise<SecureUploadSignature> {
    try {
      const response = await api.post('/proxy/upload/signature', {
        uploadPreset
      });

      console.log('âÅ“â€¦ Upload signature obtained');
      return response.data;
    } catch (error) {
      console.error('âÂÅ’ Failed to get upload signature:', error);
      throw new Error('Erreur lors de la préparation de l\'upload');
    }
  }

  /**
   * Upload sécurisé d'une image vers Cloudinary
   */
  async uploadImage(file: File): Promise<string> {
    try {
      // Obtenir la signature
      const signatureData = await this.getUploadSignature();

      // Préparer le FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signatureData.apiKey);
      formData.append('timestamp', signatureData.timestamp.toString());
      formData.append('signature', signatureData.signature);
      
      // Ajouter les paramètres d'upload
      Object.entries(signatureData.uploadParams).forEach(([key, value]) => {
        if (key !== 'timestamp') {
          formData.append(key, value as string);
        }
      });

      // Upload vers Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Upload échoué');
      }

      const data = await response.json();
      console.log('âÅ“â€¦ Image uploaded successfully:', data.secure_url);
      
      return data.secure_url;
    } catch (error) {
      console.error('âÂÅ’ Image upload failed:', error);
      throw new Error('Erreur lors de l\'upload de l\'image');
    }
  }

  // ââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Â
  // HELPER METHODS
  // ââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Âââ€¢Â

  /**
   * Programme le renouvellement automatique du token
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    // Annuler le timer précédent
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // Renouveler 5 minutes avant expiration
    const refreshIn = (expiresIn - 300) * 1000;
    
    if (refreshIn > 0) {
      this.tokenRefreshTimer = setTimeout(() => {
        console.log('Ã°Å¸â€â€ž Auto-refreshing Algolia token...');
        this.searchTokenCache = null;
        this.getAlgoliaSearchToken().catch(console.error);
      }, refreshIn);
    }
  }

  /**
   * Nettoie les ressources (ÃƒÂ  appeler lors du logout)
   */
  cleanup(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    this.searchTokenCache = null;
  }
}

// Export singleton
export const secureProxy = SecureProxyService.getInstance();

// Export types
export type { SecureSearchToken, SecureCheckoutSession, SecureUploadSignature, AIQuotaInfo };
