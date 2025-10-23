const { lemonSqueezySetup, createCheckout, getSubscription, listSubscriptions, cancelSubscription, getCustomer } = require('@lemonsqueezy/lemonsqueezy.js');
const crypto = require('crypto');

class LemonSqueezyService {
  constructor() {
    // Configuration LemonSqueezy
    lemonSqueezySetup({
      apiKey: process.env.LEMONSQUEEZY_API_KEY,
      onError: (error) => {
        console.error('LemonSqueezy API Error:', error);
        throw new Error(`LemonSqueezy API Error: ${error.message}`);
      }
    });

    this.storeId = process.env.LEMONSQUEEZY_STORE_ID;
    this.productId = process.env.LEMONSQUEEZY_PRODUCT_ID;
    this.webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    this.isTestMode = process.env.LEMONSQUEEZY_TEST_MODE === 'true';
  }

  /**
   * CrÃ©er une session de checkout pour un abonnement
   */
  async createCheckoutSession(userEmail, userId, customData = {}) {
    try {
      console.log('ðŸ›’ CrÃ©ation checkout session pour:', userEmail);

      const checkoutData = {
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: userEmail,
              custom: {
                user_id: userId.toString(),
                ...customData
              }
            },
            product_options: {
              enabled_variants: [parseInt(this.productId)],
              redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/success`,
              receipt_button_text: 'AccÃ©der Ã  ECOLOJIA Premium',
              receipt_link_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
            },
            checkout_options: {
              embed: false,
              media: true,
              logo: true
            },
            expires_at: null // Ne pas expirer
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: this.storeId.toString()
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: this.productId.toString()
              }
            }
          }
        }
      };

      const response = await createCheckout(this.storeId, checkoutData.data);
      
      if (response.error) {
        throw new Error(`Erreur crÃ©ation checkout: ${response.error.message}`);
      }

      console.log('âœ… Checkout crÃ©Ã©:', response.data.attributes.url);
      
      return {
        checkoutUrl: response.data.attributes.url,
        checkoutId: response.data.id
      };
    } catch (error) {
      console.error('âŒ Erreur crÃ©ation checkout:', error);
      throw new Error(`Impossible de crÃ©er la session de paiement: ${error.message}`);
    }
  }

  /**
   * RÃ©cupÃ©rer les dÃ©tails d'un abonnement
   */
  async getSubscriptionDetails(subscriptionId) {
    try {
      console.log('ðŸ“‹ RÃ©cupÃ©ration abonnement:', subscriptionId);
      
      const response = await getSubscription(subscriptionId);
      
      if (response.error) {
        throw new Error(`Erreur rÃ©cupÃ©ration abonnement: ${response.error.message}`);
      }

      return this.formatSubscriptionData(response.data);
    } catch (error) {
      console.error('âŒ Erreur rÃ©cupÃ©ration abonnement:', error);
      throw new Error(`Impossible de rÃ©cupÃ©rer l'abonnement: ${error.message}`);
    }
  }

  /**
   * Lister les abonnements d'un client
   */
  async getUserSubscriptions(customerEmail) {
    try {
      console.log('ðŸ“‹ RÃ©cupÃ©ration abonnements pour:', customerEmail);
      
      const response = await listSubscriptions({
        filter: {
          store_id: this.storeId,
          user_email: customerEmail
        }
      });
      
      if (response.error) {
        throw new Error(`Erreur rÃ©cupÃ©ration abonnements: ${response.error.message}`);
      }

      return response.data.map(sub => this.formatSubscriptionData(sub));
    } catch (error) {
      console.error('âŒ Erreur rÃ©cupÃ©ration abonnements:', error);
      throw new Error(`Impossible de rÃ©cupÃ©rer les abonnements: ${error.message}`);
    }
  }

  /**
   * Annuler un abonnement
   */
  async cancelUserSubscription(subscriptionId) {
    try {
      console.log('âŒ Annulation abonnement:', subscriptionId);
      
      const response = await cancelSubscription(subscriptionId);
      
      if (response.error) {
        throw new Error(`Erreur annulation: ${response.error.message}`);
      }

      console.log('âœ… Abonnement annulÃ© avec succÃ¨s');
      return this.formatSubscriptionData(response.data);
    } catch (error) {
      console.error('âŒ Erreur annulation abonnement:', error);
      throw new Error(`Impossible d'annuler l'abonnement: ${error.message}`);
    }
  }

  /**
   * VÃ©rifier la signature des webhooks
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(payload, 'utf8');
      const digest = hmac.digest('hex');
      const computedSignature = `sha256=${digest}`;

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      console.error('âŒ Erreur vÃ©rification signature webhook:', error);
      return false;
    }
  }

  /**
   * Formater les donnÃ©es d'abonnement pour l'application
   */
  formatSubscriptionData(lemonData) {
    const attrs = lemonData.attributes;
    
    return {
      lemonSqueezyId: lemonData.id,
      lemonSqueezyOrderId: attrs.order_id,
      lemonSqueezyCustomerId: attrs.customer_id,
      lemonSqueezyProductId: attrs.product_id,
      status: this.mapLemonStatus(attrs.status),
      userEmail: attrs.user_email,
      planName: attrs.product_name || 'ECOLOJIA Premium',
      planPrice: {
        amount: parseFloat(attrs.price) / 100, // Convert cents to euros
        currency: attrs.currency?.toUpperCase() || 'EUR',
        interval: attrs.billing_anchor ? 'month' : 'month'
      },
      currentPeriodStart: new Date(attrs.current_period_start),
      currentPeriodEnd: new Date(attrs.current_period_end),
      cancelledAt: attrs.cancelled_at ? new Date(attrs.cancelled_at) : null,
      lastPaymentDate: new Date(attrs.created_at),
      nextPaymentDate: new Date(attrs.renews_at || attrs.current_period_end),
      isTestMode: this.isTestMode
    };
  }

  /**
   * Mapper les statuts LemonSqueezy vers nos statuts internes
   */
  mapLemonStatus(lemonStatus) {
    const statusMap = {
      'active': 'active',
      'cancelled': 'cancelled', 
      'expired': 'expired',
      'paused': 'paused',
      'past_due': 'past_due',
      'unpaid': 'unpaid',
      'on_trial': 'active'
    };

    return statusMap[lemonStatus] || 'expired';
  }

  /**
   * Obtenir les dÃ©tails du client
   */
  async getCustomerDetails(customerId) {
    try {
      const response = await getCustomer(customerId);
      
      if (response.error) {
        throw new Error(`Erreur rÃ©cupÃ©ration client: ${response.error.message}`);
      }

      return {
        id: response.data.id,
        email: response.data.attributes.email,
        name: response.data.attributes.name,
        createdAt: new Date(response.data.attributes.created_at)
      };
    } catch (error) {
      console.error('âŒ Erreur rÃ©cupÃ©ration client:', error);
      throw new Error(`Impossible de rÃ©cupÃ©rer le client: ${error.message}`);
    }
  }
}

module.exports = new LemonSqueezyService();