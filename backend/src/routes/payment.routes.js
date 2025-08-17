// backend/src/routes/payment.routes.js
// Routes de paiement utilisant le LemonSqueezyService cree

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const LemonSqueezyService = require('../services/payment/LemonSqueezyService');

/**
 * POST /api/payment/create-checkout
 * Creer une session de checkout
 */
router.post('/create-checkout', authenticateUser, async (req, res) => {
  try {
    const { plan = 'monthly' } = req.body;
    const userId = req.userId;
    const email = req.user.email;
    
    console.log('[Payment] Creating checkout for user:', userId, 'plan:', plan);

    const result = await LemonSqueezyService.createCheckoutSession(userId, email, plan);

    res.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      checkoutId: result.checkoutId,
      expiresAt: result.expiresAt
    });

  } catch (error) {
    console.error('[Payment] Checkout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la creation du paiement'
    });
  }
});

/**
 * POST /api/payment/webhook
 * Webhook LemonSqueezy
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-signature'] || req.headers['x-lemonsqueezy-signature'];
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Signature manquante'
      });
    }

    // Traiter le webhook
    await LemonSqueezyService.handleWebhook(req.body, signature);

    res.json({ success: true });

  } catch (error) {
    console.error('[Payment] Webhook error:', error);
    
    // LemonSqueezy attend un 200 meme en cas d'erreur
    res.status(200).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/payment/cancel-subscription
 * Annuler un abonnement
 */
router.post('/cancel-subscription', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await LemonSqueezyService.cancelSubscription(userId);

    res.json({
      success: true,
      message: result.message,
      endsAt: result.endsAt
    });

  } catch (error) {
    console.error('[Payment] Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'annulation'
    });
  }
});

/**
 * POST /api/payment/resume-subscription
 * Reactiver un abonnement annule
 */
router.post('/resume-subscription', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await LemonSqueezyService.resumeSubscription(userId);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('[Payment] Resume subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la reactivation'
    });
  }
});

/**
 * POST /api/payment/change-plan
 * Changer de plan d'abonnement
 */
router.post('/change-plan', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { newPlan } = req.body;
    
    if (!['monthly', 'annual'].includes(newPlan)) {
      return res.status(400).json({
        success: false,
        error: 'Plan invalide'
      });
    }
    
    const result = await LemonSqueezyService.changeSubscriptionPlan(userId, newPlan);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('[Payment] Change plan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du changement de plan'
    });
  }
});

/**
 * GET /api/payment/subscription-status
 * Obtenir le statut de l'abonnement
 */
router.get('/subscription-status', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.subscription || user.tier !== 'premium') {
      return res.json({
        success: true,
        hasSubscription: false,
        tier: 'free'
      });
    }

    // Si l'abonnement existe, recuperer les details
    let subscriptionDetails = null;
    if (user.subscription.id) {
      try {
        subscriptionDetails = await LemonSqueezyService.getSubscription(user.subscription.id);
      } catch (error) {
        console.warn('Could not fetch subscription details:', error);
      }
    }

    res.json({
      success: true,
      hasSubscription: true,
      tier: 'premium',
      subscription: {
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        planName: user.subscription.planName,
        createdAt: user.subscription.createdAt,
        details: subscriptionDetails
      }
    });

  } catch (error) {
    console.error('[Payment] Get subscription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation du statut'
    });
  }
});

/**
 * GET /api/payment/history
 * Historique des paiements
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10 } = req.query;
    
    const history = await LemonSqueezyService.getPaymentHistory(userId, parseInt(limit));

    res.json({
      success: true,
      payments: history,
      count: history.length
    });

  } catch (error) {
    console.error('[Payment] Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation de l\'historique'
    });
  }
});

/**
 * GET /api/payment/customer-portal
 * Obtenir l'URL du portail client LemonSqueezy
 */
router.get('/customer-portal', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user?.subscription?.customerId) {
      return res.status(404).json({
        success: false,
        error: 'Aucun abonnement trouve'
      });
    }

    // URL du portail client LemonSqueezy
    const portalUrl = `https://app.lemonsqueezy.com/my-orders`;

    res.json({
      success: true,
      portalUrl,
      message: 'Vous allez etre redirige vers le portail client LemonSqueezy'
    });

  } catch (error) {
    console.error('[Payment] Portal error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur acces portail'
    });
  }
});

/**
 * GET /api/payment/stats
 * Statistiques des abonnements (admin only)
 */
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    // Verifier si l'utilisateur est admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acces non autorise'
      });
    }
    
    const stats = await LemonSqueezyService.getSubscriptionStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('[Payment] Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation des statistiques'
    });
  }
});

/**
 * GET /api/payment/health
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'payment',
    status: 'operational',
    lemonSqueezy: {
      configured: !!process.env.LEMONSQUEEZY_API_KEY,
      storeId: !!process.env.LEMONSQUEEZY_STORE_ID,
      webhookSecret: !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET
    },
    timestamp: new Date()
  });
});

module.exports = router;
