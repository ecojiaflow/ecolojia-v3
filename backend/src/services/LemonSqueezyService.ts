// PATH: backend/src/services/LemonSqueezyService.ts

import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
  variantId: string;
  webhookSecret: string;
}

interface CheckoutData {
  email: string;
  name: string;
  customData: {
    userId: string;
  };
}

interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_id: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      customer_id: number;
      variant_id: number;
      variant_name: string;
      user_email: string;
      user_name: string;
      ends_at?: string;
      renews_at?: string;
      created_at: string;
      updated_at: string;
    };
  };
}

export class LemonSqueezyService {
  private config: LemonSqueezyConfig;
  private baseUrl = 'https://api.lemonsqueezy.com/v1';

  constructor() {
    // Debug pour voir les variables
    console.log('ðŸ” VÃ©rification variables Lemon Squeezy:', {
      API_KEY: process.env.LEMONSQUEEZY_API_KEY ? 'âœ… PrÃ©sent' : 'âŒ Manquant',
      STORE_ID: process.env.LEMONSQUEEZY_STORE_ID ? 'âœ… PrÃ©sent' : 'âŒ Manquant',
      VARIANT_ID: process.env.LEMONSQUEEZY_VARIANT_ID ? 'âœ… PrÃ©sent' : 'âŒ Manquant',
      WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET ? 'âœ… PrÃ©sent' : 'âŒ Manquant'
    });

    // Configuration avec valeurs par dÃ©faut pour Ã©viter le crash
    this.config = {
      apiKey: process.env.LEMONSQUEEZY_API_KEY || '',
      storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
      variantId: process.env.LEMONSQUEEZY_VARIANT_ID || '',
      webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || ''
    };

    // Avertissement si des variables manquent
    if (!this.config.apiKey || !this.config.storeId || !this.config.variantId || !this.config.webhookSecret) {
      console.warn('âš ï¸ ATTENTION: Variables Lemon Squeezy manquantes ou incomplÃ¨tes');
      console.warn('Assurez-vous que le fichier .env est correctement configurÃ©');
      console.warn('Les fonctionnalitÃ©s de paiement seront dÃ©sactivÃ©es');
    }
  }

  /**
   * VÃ©rifie si le service est correctement configurÃ©
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.storeId && this.config.variantId && this.config.webhookSecret);
  }

  /**
   * CrÃ©e une URL de checkout Lemon Squeezy
   */
  async createCheckoutUrl(data: CheckoutData): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Service Lemon Squeezy non configurÃ©. VÃ©rifiez vos variables d\'environnement.');
    }

    try {
      const checkoutData = {
        data: {
          type: 'checkouts',
          attributes: {
            variant_id: parseInt(this.config.variantId),
            custom_data: {
              user_id: data.customData.userId
            }
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: this.config.storeId
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: this.config.variantId
              }
            }
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/checkouts`,
        checkoutData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json'
          }
        }
      );

      return response.data.data.attributes.url;
    } catch (error) {
      console.error('Erreur crÃ©ation checkout Lemon Squeezy:', error);
      throw new Error('Impossible de crÃ©er la session de paiement');
    }
  }

  /**
   * VÃ©rifie la signature du webhook
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('âš ï¸ Webhook secret manquant, impossible de vÃ©rifier la signature');
      return false;
    }

    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    const digest = hmac.update(rawBody).digest('hex');
    return digest === signature;
  }

  /**
   * RÃ©cupÃ¨re les dÃ©tails d'un abonnement
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Service Lemon Squeezy non configurÃ©');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/subscriptions/${subscriptionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Accept': 'application/vnd.api+json'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Erreur rÃ©cupÃ©ration subscription:', error);
      throw error;
    }
  }

  /**
   * Annule un abonnement
   */
  async cancelSubscription(subscriptionId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Service Lemon Squeezy non configurÃ©');
    }

    try {
      const response = await axios.delete(
        `${this.baseUrl}/subscriptions/${subscriptionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Accept': 'application/vnd.api+json'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Erreur annulation subscription:', error);
      throw error;
    }
  }

  /**
   * RÃ©cupÃ¨re l'URL du portail client
   */
  async getCustomerPortalUrl(customerId: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Service Lemon Squeezy non configurÃ©');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/customers/${customerId}/portal`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Accept': 'application/vnd.api+json'
          }
        }
      );

      return response.data.data.attributes.url;
    } catch (error) {
      console.error('Erreur crÃ©ation portail client:', error);
      throw error;
    }
  }
}

export const lemonSqueezyService = new LemonSqueezyService();
