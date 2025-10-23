// PATH: backend/src/routes/payment.routes.js
const express = require('express');
const router = express.Router();

// Flags
const ENABLE_PAYMENTS = process.env.ENABLE_PAYMENTS === '1';

// Auth (no-op si indispo)
let authenticateUser = null;
try {
  const mw = require('../middleware/auth');
  authenticateUser = typeof mw.authenticateUser === 'function' ? mw.authenticateUser : null;
} catch (_) {
  try {
    const mw2 = require('../middleware'); // parfois exportÃ© ici
    authenticateUser = typeof mw2.authenticateUser === 'function' ? mw2.authenticateUser : null;
  } catch (_) {}
}
const authMw = authenticateUser || ((req, res, next) => next());

// Service LemonSqueezy (peut Ãªtre absent en dev)
let LS = null;
try {
  LS = require('../services/payment/LemonSqueezyService');
} catch (_) {
  LS = null;
}

const has = (fn) => LS && typeof LS[fn] === 'function';

// Health: toujours dispo
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'payment',
    enabled: ENABLE_PAYMENTS,
    handlers: {
      createCheckoutSession: has('createCheckoutSession'),
      handleWebhook: has('handleWebhook'),
      cancelSubscription: has('cancelSubscription'),
      resumeSubscription: has('resumeSubscription'),
      changeSubscriptionPlan: has('changeSubscriptionPlan'),
      getSubscription: has('getSubscription'),
      getPaymentHistory: has('getPaymentHistory'),
      getSubscriptionStats: has('getSubscriptionStats'),
    },
    env: {
      apiKey: !!process.env.LEMONSQUEEZY_API_KEY,
      storeId: !!process.env.LEMONSQUEEZY_STORE_ID,
      webhookSecret: !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
    },
    timestamp: new Date().toISOString(),
  });
});

// Si paiements OFF ou handlers manquants -> stubs
if (!ENABLE_PAYMENTS || !has('createCheckoutSession') || !has('handleWebhook')) {
  console.warn('âš ï¸ Paiements dÃ©sactivÃ©s ou handlers indisponibles â€” montage des stubs /api/payment/*');

  router.post('/create-checkout', authMw, (req, res) => {
    return res.status(501).json({
      success: false,
      message:
        'Paiements indisponibles en dev. Activez ENABLE_PAYMENTS=1 et implÃ©mentez LemonSqueezyService pour utiliser cette route.',
    });
  });

  router.post('/webhook', (req, res) => {
    // LemonSqueezy prÃ©fÃ¨re un 2xx pour Ã©viter des retries agressifs
    return res.status(200).json({ success: false, message: 'Webhook stub (paiements off).' });
  });

  router.post('/cancel-subscription', authMw, (req, res) => {
    return res.status(501).json({ success: false, message: 'Non disponible en dev (paiements off).' });
  });

  router.post('/resume-subscription', authMw, (req, res) => {
    return res.status(501).json({ success: false, message: 'Non disponible en dev (paiements off).' });
  });

  router.post('/change-plan', authMw, (req, res) => {
    return res.status(501).json({ success: false, message: 'Non disponible en dev (paiements off).' });
  });

  router.get('/subscription-status', authMw, (req, res) => {
    return res.json({ success: true, hasSubscription: false, tier: 'free' });
  });

  router.get('/history', authMw, (req, res) => {
    return res.json({ success: true, payments: [], count: 0 });
  });

  router.get('/customer-portal', authMw, (req, res) => {
    return res.status(404).json({ success: false, message: 'Portail indisponible en dev.' });
  });

  router.get('/stats', authMw, (req, res) => {
    return res.status(403).json({ success: false, message: 'Stats indisponibles en dev.' });
  });
} else {
  // Version rÃ©elle quand tout est prÃªt
  router.post('/create-checkout', authMw, async (req, res) => {
    try {
      const { plan = 'monthly' } = req.body || {};
      const userId = req.userId;
      const email = req.user?.email;
      const result = await LS.createCheckoutSession(userId, email, plan);
      res.json({ success: true, checkoutUrl: result.checkoutUrl, checkoutId: result.checkoutId, expiresAt: result.expiresAt });
    } catch (e) {
      res.status(500).json({ success: false, error: e?.message || 'Erreur crÃ©ation checkout' });
    }
  });

  router.post('/webhook', async (req, res) => {
    try {
      const signature = req.headers['x-lemonsqueezy-signature'] || req.headers['x-signature'];
      if (!signature) return res.status(400).json({ success: false, error: 'Signature manquante' });
      await LS.handleWebhook(req.body, signature);
      res.json({ success: true });
    } catch (e) {
      // LemonSqueezy tolÃ¨re un 200
      res.status(200).json({ success: false, error: e?.message });
    }
  });

  router.post('/cancel-subscription', authMw, async (req, res) => {
    try {
      const result = await LS.cancelSubscription(req.userId);
      res.json({ success: true, message: result.message, endsAt: result.endsAt });
    } catch (e) {
      res.status(500).json({ success: false, error: e?.message || 'Erreur annulation' });
    }
  });

  router.post('/resume-subscription', authMw, async (req, res) => {
    try {
      const result = await LS.resumeSubscription(req.userId);
      res.json({ success: true, message: result.message });
    } catch (e) {
      res.status(500).json({ success: false, error: e?.message || 'Erreur rÃ©activation' });
    }
  });

  router.post('/change-plan', authMw, async (req, res) => {
    try {
      const { newPlan } = req.body || {};
      if (!['monthly', 'annual'].includes(newPlan)) {
        return res.status(400).json({ success: false, error: 'Plan invalide' });
      }
      const result = await LS.changeSubscriptionPlan(req.userId, newPlan);
      res.json({ success: true, message: result.message });
    } catch (e) {
      res.status(500).json({ success: false, error: e?.message || 'Erreur changement de plan' });
    }
  });

  router.get('/subscription-status', authMw, async (req, res) => {
    try {
      const user = req.user;
      if (!user?.subscription || user?.tier !== 'premium') {
        return res.json({ success: true, hasSubscription: false, tier: 'free' });
      }
      let details = null;
      try { if (user.subscription.id && has('getSubscription')) details = await LS.getSubscription(user.subscription.id); } catch (_) {}
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
          details,
        },
      });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Erreur rÃ©cupÃ©ration statut' });
    }
  });

  router.get('/history', authMw, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit || '10', 10);
      const history = has('getPaymentHistory') ? await LS.getPaymentHistory(req.userId, limit) : [];
      res.json({ success: true, payments: history, count: history.length });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Erreur rÃ©cupÃ©ration historique' });
    }
  });

  router.get('/customer-portal', authMw, (req, res) => {
    if (!req.user?.subscription?.customerId) return res.status(404).json({ success: false, error: 'Aucun abonnement' });
    res.json({ success: true, portalUrl: 'https://app.lemonsqueezy.com/my-orders' });
  });

  router.get('/stats', authMw, async (req, res) => {
    try {
      if (!req.user?.isAdmin) return res.status(403).json({ success: false, error: 'AccÃ¨s non autorisÃ©' });
      const stats = has('getSubscriptionStats') ? await LS.getSubscriptionStats() : {};
      res.json({ success: true, stats });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Erreur rÃ©cupÃ©ration statistiques' });
    }
  });
}

module.exports = router;
