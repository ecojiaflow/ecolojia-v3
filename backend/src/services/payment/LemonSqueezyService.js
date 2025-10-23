// backend/src/services/payment/LemonSqueezyService.js
// Service complet pour la gestion des paiements avec LemonSqueezy

const axios = require('axios');
const crypto = require('crypto');
const User = require('../../models/User');
const Payment = require('../../models/Payment');
const { sendEmail } = require('../emailService');

class LemonSqueezyService {
  constructor() {
    this.apiKey = process.env.LEMONSQUEEZY_API_KEY;
    this.webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    this.storeId = process.env.LEMONSQUEEZY_STORE_ID;
    this.variantMonthly = process.env.LEMONSQUEEZY_VARIANT_MONTHLY;
    this.variantAnnual = process.env.LEMONSQUEEZY_VARIANT_ANNUAL;
    
    // Configuration axios pour l'API LemonSqueezy
    this.api = axios.create({
      baseURL: 'https://api.lemonsqueezy.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }
    });
  }

  /**
   * Cree une session de checkout pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} plan - 'monthly' ou 'annual'
   * @returns {Promise<Object>} URL de checkout et ID de session
   */
  async createCheckoutSession(userId, email, plan = 'monthly') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouve');
      }

      // Verifier si l'utilisateur a dejÂ  un abonnement actif
      if (user.tier === 'premium' && user.subscription?.status === 'active') {
        throw new Error('Vous avez dejÂ  un abonnement actif');
      }

      const variantId = plan === 'annual' ? this.variantAnnual : this.variantMonthly;
      
      // Creer le checkout
      const response = await this.api.post('/checkouts', {
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: email,
              name: `${user.firstName} ${user.lastName}`,
              billing_address: {
                country: 'FR' // Par defaut, Â  adapter
              },
              custom: {
                user_id: userId,
                plan: plan
              }
            },
            checkout_options: {
              embed: false,
              media: true,
              logo: true,
              desc: true,
              discount: true,
              dark: false,
              subscription_preview: true,
              button_color: '#10B981' // Vert ECOLOJIA
            },
            product_options: {
              enabled_variants: [variantId],
              redirect_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
              receipt_button_text: 'Retour Â  ECOLOJIA',
              receipt_link_url: process.env.FRONTEND_URL,
              receipt_thank_you_note: 'Merci de votre confiance ! Vous contribuez Â  une consommation plus responsable.'
            },
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expire dans 24h
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: this.storeId
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId
              }
            }
          }
        }
      });

      const checkoutData = response.data.data;
      
      // Sauvegarder la session de checkout
      await this.saveCheckoutSession({
        userId,
        checkoutId: checkoutData.id,
        checkoutUrl: checkoutData.attributes.url,
        plan,
        status: 'pending',
        expiresAt: checkoutData.attributes.expires_at
      });

      return {
        checkoutUrl: checkoutData.attributes.url,
        checkoutId: checkoutData.id,
        expiresAt: checkoutData.attributes.expires_at
      };

    } catch (error) {
      console.error('Erreur creation checkout:', error.response?.data || error);
      throw new Error('Impossible de creer la session de paiement');
    }
  }

  /**
   * Gere les webhooks de LemonSqueezy
   * @param {Object} payload - Payload du webhook
   * @param {string} signature - Signature du webhook
   * @returns {Promise<void>}
   */
  async handleWebhook(payload, signature) {
    // Verifier la signature
    if (!this.verifyWebhookSignature(JSON.stringify(payload), signature)) {
      throw new Error('Signature webhook invalide');
    }

    const { meta, data } = payload;
    const eventName = meta.event_name;

    console.log(`Ã°Å¸â€œÂ¨ Webhook recu: ${eventName}`);

    try {
      switch (eventName) {
        case 'subscription_created':
          await this.handleSubscriptionCreated(data);
          break;
          
        case 'subscription_updated':
          await this.handleSubscriptionUpdated(data);
          break;
          
        case 'subscription_cancelled':
          await this.handleSubscriptionCancelled(data);
          break;
          
        case 'subscription_resumed':
          await this.handleSubscriptionResumed(data);
          break;
          
        case 'subscription_expired':
          await this.handleSubscriptionExpired(data);
          break;
          
        case 'subscription_paused':
          await this.handleSubscriptionPaused(data);
          break;
          
        case 'subscription_payment_success':
          await this.handlePaymentSuccess(data);
          break;
          
        case 'subscription_payment_failed':
          await this.handlePaymentFailed(data);
          break;
          
        case 'subscription_payment_recovered':
          await this.handlePaymentRecovered(data);
          break;
          
        default:
          console.log(`Event non gere: ${eventName}`);
      }
      
    } catch (error) {
      console.error(`Erreur traitement webhook ${eventName}:`, error);
      throw error;
    }
  }

  /**
   * Verifie la signature d'un webhook
   */
  verifyWebhookSignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    hmac.update(payload);
    const digest = hmac.digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  }

  /**
   * Gere la creation d'un abonnement
   */
  async handleSubscriptionCreated(subscriptionData) {
    const { attributes } = subscriptionData;
    const userId = attributes.custom_data?.user_id;
    
    if (!userId) {
      console.error('User ID manquant dans les donnees custom');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error(`Utilisateur ${userId} non trouve`);
      return;
    }

    // Mettre Â  jour l'utilisateur
    user.tier = 'premium';
    user.subscription = {
      id: subscriptionData.id,
      status: attributes.status,
      currentPeriodEnd: new Date(attributes.renews_at),
      cancelAtPeriodEnd: false,
      planId: attributes.variant_id,
      planName: attributes.variant_name,
      customerId: attributes.customer_id,
      createdAt: new Date(attributes.created_at),
      updatedAt: new Date(attributes.updated_at)
    };
    
    // Mettre Â  jour les quotas
    user.quotas = {
      scansLimit: -1, // Illimite
      scansUsed: user.quotas?.scansUsed || 0,
      aiQuestionsLimit: 500,
      aiQuestionsUsed: 0,
      exportsLimit: -1,
      exportsUsed: 0
    };

    await user.save();

    // Creer un enregistrement de paiement
    await Payment.create({
      userId,
      subscriptionId: subscriptionData.id,
      amount: attributes.subtotal_usd,
      currency: 'USD',
      status: 'completed',
      type: 'subscription_created',
      metadata: {
        variant_name: attributes.variant_name,
        customer_email: attributes.user_email
      }
    });

    // Envoyer email de bienvenue Premium
    await this.sendWelcomeEmail(user);
    
    console.log(`Ã¢Å“â€¦ Abonnement cree pour l'utilisateur ${userId}`);
  }

  /**
   * Gere la mise Â  jour d'un abonnement
   */
  async handleSubscriptionUpdated(subscriptionData) {
    const { attributes } = subscriptionData;
    const userId = attributes.custom_data?.user_id;
    
    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) return;

    // Mettre Â  jour les informations d'abonnement
    user.subscription = {
      ...user.subscription,
      status: attributes.status,
      currentPeriodEnd: new Date(attributes.renews_at),
      cancelAtPeriodEnd: attributes.cancelled,
      planId: attributes.variant_id,
      planName: attributes.variant_name,
      updatedAt: new Date(attributes.updated_at)
    };

    await user.save();
    
    console.log(`Ã¢Å“â€¦ Abonnement mis Â  jour pour l'utilisateur ${userId}`);
  }

  /**
   * Gere l'annulation d'un abonnement
   */
  async handleSubscriptionCancelled(subscriptionData) {
    const { attributes } = subscriptionData;
    const userId = attributes.custom_data?.user_id;
    
    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) return;

    // L'abonnement reste actif jusqu'Â  la fin de la periode
    user.subscription.cancelAtPeriodEnd = true;
    user.subscription.status = 'cancelled';
    user.subscription.cancelledAt = new Date();

    await user.save();

    // Envoyer email de confirmation d'annulation
    await this.sendCancellationEmail(user);
    
    console.log(`Ã¢ÂÅ’ Abonnement annule pour l'utilisateur ${userId}`);
  }

  /**
   * Gere l'expiration d'un abonnement
   */
  async handleSubscriptionExpired(subscriptionData) {
    const { attributes } = subscriptionData;
    const userId = attributes.custom_data?.user_id;
    
    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) return;

    // Retrograder au plan gratuit
    user.tier = 'free';
    user.subscription.status = 'expired';
    user.subscription.expiredAt = new Date();
    
    // Reinitialiser les quotas
    user.quotas = {
      scansLimit: 30,
      scansUsed: 0,
      aiQuestionsLimit: 5,
      aiQuestionsUsed: 0,
      exportsLimit: 0,
      exportsUsed: 0
    };

    await user.save();

    // Envoyer email d'expiration
    await this.sendExpirationEmail(user);
    
    console.log(`Ã¢ÂÂ° Abonnement expire pour l'utilisateur ${userId}`);
  }

  /**
   * Gere un paiement reussi
   */
  async handlePaymentSuccess(paymentData) {
    const { attributes } = paymentData;
    const subscriptionId = attributes.subscription_id;
    
    // Trouver l'utilisateur par ID d'abonnement
    const user = await User.findOne({ 'subscription.id': subscriptionId });
    if (!user) return;

    // Enregistrer le paiement
    await Payment.create({
      userId: user._id,
      subscriptionId,
      amount: attributes.subtotal_usd,
      currency: 'USD',
      status: 'completed',
      type: 'subscription_payment',
      invoiceUrl: attributes.urls?.invoice,
      metadata: {
        billing_reason: attributes.billing_reason,
        card_brand: attributes.card_brand,
        card_last_four: attributes.card_last_four
      }
    });

    // Mettre Â  jour la prochaine date de renouvellement
    if (user.subscription) {
      user.subscription.currentPeriodEnd = new Date(attributes.renews_at);
      await user.save();
    }

    console.log(`Ã°Å¸â€™Â° Paiement reussi pour l'utilisateur ${user._id}`);
  }

  /**
   * Gere un echec de paiement
   */
  async handlePaymentFailed(paymentData) {
    const { attributes } = paymentData;
    const subscriptionId = attributes.subscription_id;
    
    const user = await User.findOne({ 'subscription.id': subscriptionId });
    if (!user) return;

    // Envoyer email d'alerte
    await this.sendPaymentFailedEmail(user);
    
    console.log(`Ã¢ÂÅ’ â€°chec de paiement pour l'utilisateur ${user._id}`);
  }

  /**
   * Recupere les details d'un abonnement
   */
  async getSubscription(subscriptionId) {
    try {
      const response = await this.api.get(`/subscriptions/${subscriptionId}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur recuperation abonnement:', error);
      throw new Error('Impossible de recuperer l\'abonnement');
    }
  }

  /**
   * Annule un abonnement
   */
  async cancelSubscription(userId) {
    const user = await User.findById(userId);
    if (!user || !user.subscription?.id) {
      throw new Error('Aucun abonnement actif');
    }

    try {
      const response = await this.api.delete(`/subscriptions/${user.subscription.id}`);
      
      // L'abonnement reste actif jusqu'Â  la fin de la periode
      user.subscription.cancelAtPeriodEnd = true;
      await user.save();
      
      return {
        success: true,
        message: 'Abonnement annule. Vous conservez l\'acces Premium jusqu\'Â  la fin de votre periode.',
        endsAt: user.subscription.currentPeriodEnd
      };
      
    } catch (error) {
      console.error('Erreur annulation abonnement:', error);
      throw new Error('Impossible d\'annuler l\'abonnement');
    }
  }

  /**
   * Reactive un abonnement annule
   */
  async resumeSubscription(userId) {
    const user = await User.findById(userId);
    if (!user || !user.subscription?.id) {
      throw new Error('Aucun abonnement Â  reactiver');
    }

    try {
      const response = await this.api.patch(`/subscriptions/${user.subscription.id}`, {
        data: {
          type: 'subscriptions',
          id: user.subscription.id,
          attributes: {
            cancelled: false
          }
        }
      });
      
      user.subscription.cancelAtPeriodEnd = false;
      await user.save();
      
      return {
        success: true,
        message: 'Abonnement reactive avec succes'
      };
      
    } catch (error) {
      console.error('Erreur reactivation abonnement:', error);
      throw new Error('Impossible de reactiver l\'abonnement');
    }
  }

  /**
   * Change le plan d'abonnement
   */
  async changeSubscriptionPlan(userId, newPlan) {
    const user = await User.findById(userId);
    if (!user || !user.subscription?.id) {
      throw new Error('Aucun abonnement actif');
    }

    const newVariantId = newPlan === 'annual' ? this.variantAnnual : this.variantMonthly;

    try {
      const response = await this.api.patch(`/subscriptions/${user.subscription.id}`, {
        data: {
          type: 'subscriptions',
          id: user.subscription.id,
          attributes: {
            variant_id: newVariantId
          }
        }
      });
      
      return {
        success: true,
        message: 'Plan modifie avec succes'
      };
      
    } catch (error) {
      console.error('Erreur changement de plan:', error);
      throw new Error('Impossible de changer de plan');
    }
  }

  /**
   * Recupere l'historique des paiements
   */
  async getPaymentHistory(userId, limit = 10) {
    try {
      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
        
      return payments;
    } catch (error) {
      console.error('Erreur recuperation historique:', error);
      return [];
    }
  }

  /**
   * Sauvegarde une session de checkout
   */
  async saveCheckoutSession(sessionData) {
    // Implementer selon votre modele de donnees
    // Par exemple, creer un modele CheckoutSession
    console.log('Session de checkout sauvegardee:', sessionData);
  }

  /**
   * Envoie l'email de bienvenue Premium
   */
  async sendWelcomeEmail(user) {
    await sendEmail({
      to: user.email,
      subject: 'Bienvenue dans ECOLOJIA Premium ! Ã°Å¸Å½â€°',
      template: 'premium-welcome',
      data: {
        firstName: user.firstName,
        features: [
          'Analyses illimitees',
          'Chat avec notre IA nutritionniste',
          'Export de vos donnees',
          'Dashboard personnalise',
          'Sans publicite'
        ]
      }
    });
  }

  /**
   * Envoie l'email d'annulation
   */
  async sendCancellationEmail(user) {
    await sendEmail({
      to: user.email,
      subject: 'Confirmation d\'annulation de votre abonnement ECOLOJIA',
      template: 'subscription-cancelled',
      data: {
        firstName: user.firstName,
        endDate: user.subscription.currentPeriodEnd
      }
    });
  }

  /**
   * Envoie l'email d'expiration
   */
  async sendExpirationEmail(user) {
    await sendEmail({
      to: user.email,
      subject: 'Votre abonnement ECOLOJIA Premium a expire',
      template: 'subscription-expired',
      data: {
        firstName: user.firstName
      }
    });
  }

  /**
   * Envoie l'email d'echec de paiement
   */
  async sendPaymentFailedEmail(user) {
    await sendEmail({
      to: user.email,
      subject: 'â€°chec du paiement - Action requise',
      template: 'payment-failed',
      data: {
        firstName: user.firstName,
        updateUrl: `${process.env.FRONTEND_URL}/account/billing`
      }
    });
  }

  /**
   * Recupere les statistiques d'abonnement
   */
  async getSubscriptionStats() {
    try {
      const totalPremium = await User.countDocuments({ tier: 'premium' });
      const activeSubscriptions = await User.countDocuments({ 
        tier: 'premium',
        'subscription.status': 'active' 
      });
      const cancelledSubscriptions = await User.countDocuments({ 
        'subscription.cancelAtPeriodEnd': true 
      });
      
      const monthlyRevenue = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().setDate(1)) },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      return {
        totalPremium,
        activeSubscriptions,
        cancelledSubscriptions,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        churnRate: (cancelledSubscriptions / activeSubscriptions) * 100
      };
    } catch (error) {
      console.error('Erreur stats abonnements:', error);
      return null;
    }
  }
}

// Export singleton
module.exports = new LemonSqueezyService();
