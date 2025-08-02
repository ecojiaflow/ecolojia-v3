// backend/src/routes/webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const webhookService = require('../services/webhookService');
const User = require('../models/User');

// ═══════════════════════════════════════════════════════════════════════
// MIDDLEWARE DE VÉRIFICATION DE SIGNATURE
// ═══════════════════════════════════════════════════════════════════════

const verifyWebhookSignature = (req, res, next) => {
  try {
    const signature = req.headers['x-signature'];
    const rawBody = req.rawBody; // Nécessite le middleware rawBody

    if (!signature || !rawBody) {
      console.error('[Webhook] Missing signature or body');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Vérifier la signature HMAC
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const digest = hmac.digest('hex');

    if (signature !== digest) {
      console.error('[Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Vérifier l'anti-replay (timestamp)
    const event = JSON.parse(rawBody);
    const eventTime = new Date(event.meta.event_created_at);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    if (now - eventTime > fiveMinutes) {
      console.error('[Webhook] Event too old (replay attack?)');
      return res.status(401).json({ error: 'Event expired' });
    }

    req.webhookEvent = event;
    next();
  } catch (error) {
    console.error('[Webhook] Verification error:', error);
    res.status(400).json({ error: 'Bad request' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// WEBHOOK ENDPOINT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/webhooks/lemonsqueezy
 * Endpoint principal pour tous les webhooks LemonSqueezy
 */
router.post('/lemonsqueezy', verifyWebhookSignature, async (req, res) => {
  const event = req.webhookEvent;
  const eventName = event.meta.event_name;
  const eventId = event.data.id;

  console.log(`[Webhook] Received event: ${eventName} (${eventId})`);

  try {
    // Vérifier l'idempotence
    const isProcessed = await webhookService.checkIdempotency(eventId);
    if (isProcessed) {
      console.log(`[Webhook] Event ${eventId} already processed`);
      return res.json({ status: 'already_processed' });
    }

    // Router vers le bon handler
    let result;
    switch (eventName) {
      // Subscription events
      case 'subscription_created':
        result = await handleSubscriptionCreated(event);
        break;
      case 'subscription_updated':
        result = await handleSubscriptionUpdated(event);
        break;
      case 'subscription_cancelled':
        result = await handleSubscriptionCancelled(event);
        break;
      case 'subscription_resumed':
        result = await handleSubscriptionResumed(event);
        break;
      case 'subscription_expired':
        result = await handleSubscriptionExpired(event);
        break;

      // Payment events
      case 'subscription_payment_success':
        result = await handlePaymentSuccess(event);
        break;
      case 'subscription_payment_failed':
        result = await handlePaymentFailed(event);
        break;
      case 'subscription_payment_recovered':
        result = await handlePaymentRecovered(event);
        break;

      // Order events
      case 'order_created':
        result = await handleOrderCreated(event);
        break;
      case 'order_refunded':
        result = await handleOrderRefunded(event);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${eventName}`);
        result = { status: 'ignored' };
    }

    // Marquer comme traité
    await webhookService.markAsProcessed(eventId, eventName, result);

    res.json({ 
      status: 'success',
      event: eventName,
      result 
    });

  } catch (error) {
    console.error(`[Webhook] Error processing ${eventName}:`, error);
    
    // Log l'erreur pour retry
    await webhookService.logError(eventId, eventName, error);
    
    // Retourner 500 pour que LemonSqueezy retry
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// HANDLERS POUR CHAQUE TYPE D'ÉVÉNEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Subscription créée - Activer le compte Premium
 */
async function handleSubscriptionCreated(event) {
  const { data } = event;
  const attributes = data.attributes;
  const customData = attributes.custom_data || {};
  const userId = customData.user_id;

  if (!userId) {
    throw new Error('No user_id in custom_data');
  }

  // Déterminer le plan
  const variantId = attributes.variant_id;
  const plan = determinePlanFromVariant(variantId);
  
  // Mettre à jour l'utilisateur
  const user = await User.findByIdAndUpdate(userId, {
    $set: {
      'subscription.tier': 'premium',
      'subscription.plan': plan,
      'subscription.status': 'active',
      'subscription.lemonSqueezySubscriptionId': data.id,
      'subscription.lemonSqueezyCustomerId': attributes.customer_id,
      'subscription.lemonSqueezyVariantId': variantId,
      'subscription.currentPeriodStart': new Date(attributes.current_period_start),
      'subscription.currentPeriodEnd': new Date(attributes.current_period_end),
      'subscription.cancelAtPeriodEnd': false,
      
      // Reset les quotas pour Premium
      'quotas.scansPerMonth': 999999,
      'quotas.aiQuestionsPerDay': 999999,
      'quotas.exportsPerMonth': 999999
    }
  }, { new: true });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Envoyer email de bienvenue Premium
  await webhookService.sendPremiumWelcomeEmail(user);

  console.log(`[Webhook] User ${userId} upgraded to Premium (${plan})`);
  
  return {
    userId,
    plan,
    subscriptionId: data.id
  };
}

/**
 * Subscription mise à jour (changement de plan, etc.)
 */
async function handleSubscriptionUpdated(event) {
  const { data } = event;
  const attributes = data.attributes;
  const subscriptionId = data.id;

  const user = await User.findOne({ 
    'subscription.lemonSqueezySubscriptionId': subscriptionId 
  });

  if (!user) {
    throw new Error(`No user found for subscription ${subscriptionId}`);
  }

  // Mettre à jour les infos
  const variantId = attributes.variant_id;
  const plan = determinePlanFromVariant(variantId);

  await User.findByIdAndUpdate(user._id, {
    $set: {
      'subscription.plan': plan,
      'subscription.status': mapLemonSqueezyStatus(attributes.status),
      'subscription.lemonSqueezyVariantId': variantId,
      'subscription.currentPeriodEnd': new Date(attributes.current_period_end),
      'subscription.cancelAtPeriodEnd': attributes.cancelled || false
    }
  });

  console.log(`[Webhook] Subscription ${subscriptionId} updated for user ${user._id}`);

  return {
    userId: user._id,
    plan,
    status: attributes.status
  };
}

/**
 * Subscription annulée
 */
async function handleSubscriptionCancelled(event) {
  const { data } = event;
  const subscriptionId = data.id;

  const user = await User.findOne({ 
    'subscription.lemonSqueezySubscriptionId': subscriptionId 
  });

  if (!user) {
    throw new Error(`No user found for subscription ${subscriptionId}`);
  }

  await User.findByIdAndUpdate(user._id, {
    $set: {
      'subscription.status': 'cancelled',
      'subscription.cancelAtPeriodEnd': true,
      'subscription.cancelledAt': new Date()
    }
  });

  // Envoyer email de confirmation d'annulation
  await webhookService.sendCancellationEmail(user);

  console.log(`[Webhook] Subscription cancelled for user ${user._id}`);

  return {
    userId: user._id,
    endsAt: data.attributes.current_period_end
  };
}

/**
 * Subscription reprise après annulation
 */
async function handleSubscriptionResumed(event) {
  const { data } = event;
  const subscriptionId = data.id;

  const user = await User.findOne({ 
    'subscription.lemonSqueezySubscriptionId': subscriptionId 
  });

  if (!user) {
    throw new Error(`No user found for subscription ${subscriptionId}`);
  }

  await User.findByIdAndUpdate(user._id, {
    $set: {
      'subscription.status': 'active',
      'subscription.cancelAtPeriodEnd': false
    },
    $unset: {
      'subscription.cancelledAt': ''
    }
  });

  console.log(`[Webhook] Subscription resumed for user ${user._id}`);

  return { userId: user._id };
}

/**
 * Subscription expirée - Downgrade vers Free
 */
async function handleSubscriptionExpired(event) {
  const { data } = event;
  const subscriptionId = data.id;

  const user = await User.findOne({ 
    'subscription.lemonSqueezySubscriptionId': subscriptionId 
  });

  if (!user) {
    throw new Error(`No user found for subscription ${subscriptionId}`);
  }

  // Downgrade vers Free
  await User.findByIdAndUpdate(user._id, {
    $set: {
      'subscription.tier': 'free',
      'subscription.status': 'expired',
      
      // Réinitialiser les quotas Free
      'quotas.scansPerMonth': 30,
      'quotas.aiQuestionsPerDay': 0,
      'quotas.exportsPerMonth': 0,
      
      // Reset les compteurs
      'currentUsage.scansThisMonth': 0,
      'currentUsage.aiQuestionsToday': 0,
      'currentUsage.exportsThisMonth': 0
    }
  });

  // Envoyer email de downgrade
  await webhookService.sendDowngradeEmail(user);

  console.log(`[Webhook] User ${user._id} downgraded to Free`);

  return { userId: user._id };
}

/**
 * Paiement réussi
 */
async function handlePaymentSuccess(event) {
  const { data } = event;
  const subscriptionId = data.attributes.subscription_id;

  const user = await User.findOne({ 
    'subscription.lemonSqueezySubscriptionId': subscriptionId 
  });

  if (!user) {
    throw new Error(`No user found for subscription ${subscriptionId}`);
  }

  // Log le paiement
  await webhookService.logPayment(user._id, {
    amount: data.attributes.amount,
    currency: data.attributes.currency,
    status: 'success',
    invoiceUrl: data.attributes.invoice_url
  });

  // Mettre à jour la période si nécessaire
  if (data.attributes.current_period_end) {
    await User.findByIdAndUpdate(user._id, {
      $set: {
        'subscription.currentPeriodEnd': new Date(data.attributes.current_period_end),
        'subscription.status': 'active'
      }
    });
  }

  console.log(`[Webhook] Payment success for user ${user._id}`);

  return { 
    userId: user._id,
    amount: data.attributes.amount 
  };
}

/**
 * Paiement échoué
 */
async function handlePaymentFailed(event) {
  const { data } = event;
  const subscriptionId = data.attributes.subscription_id;

  const user = await User.findOne({ 
    'subscription.lemonSqueezySubscriptionId': subscriptionId 
  });

  if (!user) {
    throw new Error(`No user found for subscription ${subscriptionId}`);
  }

  // Mettre à jour le statut
  await User.findByIdAndUpdate(user._id, {
    $set: {
      'subscription.status': 'past_due'
    }
  });

  // Log le paiement échoué
  await webhookService.logPayment(user._id, {
    amount: data.attributes.amount,
    currency: data.attributes.currency,
    status: 'failed',
    error: data.attributes.error
  });

  // Envoyer email d'alerte
  await webhookService.sendPaymentFailedEmail(user);

  console.log(`[Webhook] Payment failed for user ${user._id}`);

  return { userId: user._id };
}

/**
 * Paiement récupéré après échec
 */
async function handlePaymentRecovered(event) {
  const { data } = event;
  const subscriptionId = data.attributes.subscription_id;

  const user = await User.findOne({ 
    'subscription.lemonSqueezySubscriptionId': subscriptionId 
  });

  if (!user) {
    throw new Error(`No user found for subscription ${subscriptionId}`);
  }

  // Réactiver
  await User.findByIdAndUpdate(user._id, {
    $set: {
      'subscription.status': 'active'
    }
  });

  console.log(`[Webhook] Payment recovered for user ${user._id}`);

  return { userId: user._id };
}

/**
 * Commande créée (achat one-time)
 */
async function handleOrderCreated(event) {
  // Pour le futur : achats ponctuels, crédits, etc.
  console.log('[Webhook] Order created:', event.data.id);
  return { orderId: event.data.id };
}

/**
 * Remboursement
 */
async function handleOrderRefunded(event) {
  const { data } = event;
  const orderId = data.id;
  const customData = data.attributes.custom_data || {};
  const userId = customData.user_id;

  if (userId) {
    // Log le remboursement
    await webhookService.logRefund(userId, {
      orderId,
      amount: data.attributes.refund_amount,
      reason: data.attributes.refund_reason
    });

    console.log(`[Webhook] Order refunded for user ${userId}`);
  }

  return { orderId, userId };
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function determinePlanFromVariant(variantId) {
  if (variantId === process.env.LEMONSQUEEZY_VARIANT_MONTHLY) {
    return 'monthly';
  } else if (variantId === process.env.LEMONSQUEEZY_VARIANT_ANNUAL) {
    return 'annual';
  } else if (variantId === process.env.LEMONSQUEEZY_VARIANT_FAMILY_MONTHLY) {
    return 'family_monthly';
  }
  return 'unknown';
}

function mapLemonSqueezyStatus(status) {
  const statusMap = {
    'active': 'active',
    'paused': 'paused',
    'past_due': 'past_due',
    'unpaid': 'past_due',
    'cancelled': 'cancelled',
    'expired': 'expired'
  };
  return statusMap[status] || 'unknown';
}

// ═══════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/webhooks/health
 * Vérifier que les webhooks fonctionnent
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    webhook_url: `${process.env.API_URL}/api/webhooks/lemonsqueezy`,
    signature_configured: !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  });
});

/**
 * POST /api/webhooks/test
 * Endpoint de test pour vérifier la configuration (dev only)
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test', verifyWebhookSignature, (req, res) => {
    console.log('[Webhook] Test webhook received:', req.webhookEvent);
    res.json({ 
      status: 'success', 
      message: 'Webhook test successful',
      event: req.webhookEvent 
    });
  });
}

module.exports = router;