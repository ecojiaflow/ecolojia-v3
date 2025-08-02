// backend/src/routes/proxy.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const redis = require('redis');
const algoliasearch = require('algoliasearch');
const axios = require('axios');

// Clients
let redisClient;
let algoliaClient;

// Configuration
const SEARCH_TOKEN_TTL = 3600; // 1 heure
const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

// Initialisation
async function initClients() {
  try {
    // Redis
    if (process.env.REDIS_URL) {
      redisClient = redis.createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      console.log('[Proxy] Redis connected for rate limiting');
    }

    // Algolia
    if (process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_ADMIN_KEY) {
      algoliaClient = algoliasearch(
        process.env.ALGOLIA_APP_ID,
        process.env.ALGOLIA_ADMIN_KEY
      );
      console.log('[Proxy] Algolia client initialized');
    }
  } catch (error) {
    console.error('[Proxy] Init error:', error);
  }
}

initClients();

// ═══════════════════════════════════════════════════════════════════════
// MIDDLEWARE DE RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════

const rateLimitMiddleware = async (req, res, next) => {
  if (!redisClient?.isReady) {
    return next(); // Pas de rate limiting sans Redis
  }

  const key = `rate_limit:${req.userId || req.ip}:${req.path}`;
  
  try {
    const count = await redisClient.incr(key);
    
    if (count === 1) {
      await redisClient.expire(key, RATE_LIMIT_WINDOW);
    }
    
    if (count > RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter: RATE_LIMIT_WINDOW
      });
    }
    
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - count));
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + RATE_LIMIT_WINDOW * 1000).toISOString());
    
    next();
  } catch (error) {
    console.error('[RateLimit] Error:', error);
    next(); // Continue en cas d'erreur
  }
};

// ═══════════════════════════════════════════════════════════════════════
// ALGOLIA SECURE PROXY
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/proxy/algolia/search-token
 * Génère un token de recherche Algolia sécurisé et temporaire
 */
router.post('/algolia/search-token', auth, rateLimitMiddleware, async (req, res) => {
  try {
    if (!algoliaClient) {
      return res.status(503).json({
        success: false,
        error: 'Service de recherche non disponible'
      });
    }

    const userId = req.userId;
    const { indices = ['ecolojia_products'], filters = {} } = req.body;

    // Générer un token sécurisé avec restrictions
    const searchKey = algoliaClient.generateSecuredApiKey(
      process.env.ALGOLIA_SEARCH_KEY,
      {
        validUntil: Math.floor(Date.now() / 1000) + SEARCH_TOKEN_TTL,
        restrictIndices: indices,
        userToken: userId,
        filters: `userToken:${userId}`,
        restrictSources: req.ip
      }
    );

    // Stocker le token en cache si Redis disponible
    if (redisClient?.isReady) {
      const tokenKey = `algolia_token:${userId}`;
      await redisClient.setex(tokenKey, SEARCH_TOKEN_TTL, searchKey);
    }

    console.log(`[Proxy] Algolia token generated for user ${userId}`);

    res.json({
      success: true,
      token: searchKey,
      expiresIn: SEARCH_TOKEN_TTL,
      expiresAt: new Date(Date.now() + SEARCH_TOKEN_TTL * 1000),
      allowedIndices: indices
    });

  } catch (error) {
    console.error('[Proxy] Algolia token error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du token'
    });
  }
});

/**
 * POST /api/proxy/algolia/search
 * Recherche sécurisée côté serveur (alternative au token)
 */
router.post('/algolia/search', auth, rateLimitMiddleware, async (req, res) => {
  try {
    if (!algoliaClient) {
      return res.status(503).json({
        success: false,
        error: 'Service de recherche non disponible'
      });
    }

    const { query, indexName = 'ecolojia_products', options = {} } = req.body;
    const userId = req.userId;

    // Validation
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Requête trop courte (minimum 2 caractères)'
      });
    }

    // Recherche avec restrictions utilisateur
    const index = algoliaClient.initIndex(indexName);
    const results = await index.search(query, {
      ...options,
      userToken: userId,
      hitsPerPage: Math.min(options.hitsPerPage || 20, 50), // Max 50 résultats
      attributesToRetrieve: [
        'objectID', 'name', 'brand', 'category', 
        'image', 'scores', 'barcode'
      ] // Limiter les attributs retournés
    });

    console.log(`[Proxy] Algolia search for user ${userId}: "${query}" - ${results.nbHits} results`);

    res.json({
      success: true,
      results: {
        hits: results.hits,
        nbHits: results.nbHits,
        page: results.page,
        nbPages: results.nbPages,
        query: results.query
      }
    });

  } catch (error) {
    console.error('[Proxy] Algolia search error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// LEMONSQUEEZY SECURE PROXY
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/proxy/lemonsqueezy/checkout
 * Crée une session de checkout sécurisée
 */
router.post('/lemonsqueezy/checkout', auth, rateLimitMiddleware, async (req, res) => {
  try {
    const { plan = 'monthly' } = req.body;
    const userId = req.userId;

    // Validation du plan
    const validPlans = ['monthly', 'annual'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Plan invalide'
      });
    }

    // Configuration des variants LemonSqueezy
    const variantId = plan === 'annual' 
      ? process.env.LEMONSQUEEZY_VARIANT_ANNUAL 
      : process.env.LEMONSQUEEZY_VARIANT_MONTHLY;

    if (!variantId) {
      return res.status(503).json({
        success: false,
        error: 'Service de paiement non configuré'
      });
    }

    // Créer la session checkout via API LemonSqueezy
    const response = await axios.post(
      'https://api.lemonsqueezy.com/v1/checkouts',
      {
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              custom: {
                user_id: userId,
                plan: plan
              }
            },
            checkout_options: {
              embed: true,
              media: false,
              logo: true,
              desc: true,
              discount: false,
              dark: false,
              subscription_preview: true
            },
            product_options: {
              enabled_variants: [variantId],
              redirect_url: `${process.env.FRONTEND_URL}/payment-success`,
              receipt_button_text: 'Retour à ECOLOJIA',
              receipt_thank_you_note: 'Merci pour votre abonnement Premium!'
            }
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: process.env.LEMONSQUEEZY_STORE_ID
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
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      }
    );

    const checkoutUrl = response.data.data.attributes.url;
    const checkoutId = response.data.data.id;

    // Stocker l'info de checkout si Redis disponible
    if (redisClient?.isReady) {
      const checkoutKey = `checkout:${userId}:${checkoutId}`;
      await redisClient.setex(checkoutKey, 3600, JSON.stringify({
        plan,
        createdAt: new Date(),
        status: 'pending'
      }));
    }

    console.log(`[Proxy] LemonSqueezy checkout created for user ${userId}, plan: ${plan}`);

    res.json({
      success: true,
      checkoutUrl,
      checkoutId,
      plan
    });

  } catch (error) {
    console.error('[Proxy] LemonSqueezy checkout error:', error.response?.data || error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du paiement'
    });
  }
});

/**
 * GET /api/proxy/lemonsqueezy/subscription
 * Récupère le statut d'abonnement de manière sécurisée
 */
router.get('/lemonsqueezy/subscription', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = req.user;

    // Si l'utilisateur n'a pas d'ID subscription LemonSqueezy
    if (!user.subscription?.lemonSqueezySubscriptionId) {
      return res.json({
        success: true,
        subscription: null,
        active: false
      });
    }

    // Récupérer les infos de l'abonnement
    const response = await axios.get(
      `https://api.lemonsqueezy.com/v1/subscriptions/${user.subscription.lemonSqueezySubscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
          'Accept': 'application/vnd.api+json'
        }
      }
    );

    const subscription = response.data.data;
    const attributes = subscription.attributes;

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: attributes.status,
        active: attributes.status === 'active',
        currentPeriodEnd: attributes.current_period_end,
        cancelledAt: attributes.cancelled_at,
        productName: attributes.product_name,
        variantName: attributes.variant_name,
        price: attributes.variant_price,
        updatePaymentUrl: attributes.update_payment_method_url,
        customerPortalUrl: attributes.customer_portal_url
      }
    });

  } catch (error) {
    console.error('[Proxy] LemonSqueezy subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'abonnement'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// DEEPSEEK AI SECURE PROXY
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/proxy/ai/chat
 * Chat IA sécurisé avec quotas
 */
router.post('/ai/chat', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.userId;
    const user = req.user;

    // Vérifier les quotas IA
    if (user.tier !== 'premium' && user.quotas.aiChatsRemaining <= 0) {
      return res.status(403).json({
        success: false,
        error: 'Quota de questions IA épuisé',
        requiresUpgrade: true
      });
    }

    // Validation
    if (!message || message.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Message trop court'
      });
    }

    // Limiter la longueur du message
    const truncatedMessage = message.substring(0, 1000);

    // Appel à DeepSeek
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Tu es l'assistant IA d'ECOLOJIA, expert en nutrition et santé. 
                     Tu analyses les produits selon la classification NOVA et fournis des conseils personnalisés.
                     Réponds de manière concise et bienveillante.`
          },
          ...(context ? [{
            role: 'assistant',
            content: `Contexte: ${JSON.stringify(context)}`
          }] : []),
          {
            role: 'user',
            content: truncatedMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 500, // Limiter la réponse
        user: userId // Pour tracking DeepSeek
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    // Décrémenter le quota si pas premium
    if (user.tier !== 'premium') {
      await req.user.constructor.findByIdAndUpdate(userId, {
        $inc: { 'quotas.aiChatsRemaining': -1 }
      });
    }

    console.log(`[Proxy] AI chat for user ${userId} (${user.tier})`);

    res.json({
      success: true,
      response: aiResponse,
      quotaRemaining: user.tier === 'premium' ? -1 : user.quotas.aiChatsRemaining - 1
    });

  } catch (error) {
    console.error('[Proxy] AI chat error:', error.response?.data || error);
    
    // Si erreur DeepSeek, fallback sur réponse générique
    if (error.response?.status === 401) {
      return res.status(503).json({
        success: false,
        error: 'Service IA temporairement indisponible'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération de la réponse'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// CLOUDINARY SECURE UPLOAD
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/proxy/upload/signature
 * Génère une signature pour upload sécurisé Cloudinary
 */
router.post('/upload/signature', auth, rateLimitMiddleware, async (req, res) => {
  try {
    const { uploadPreset = 'ecolojia_products' } = req.body;
    const userId = req.userId;

    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      timestamp,
      upload_preset: uploadPreset,
      folder: `users/${userId}`,
      allowed_formats: 'jpg,jpeg,png,webp',
      max_file_size: 5000000, // 5MB
      eager: 'w_400,h_400,c_limit'
    };

    // Générer la signature
    const paramsToSign = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const signature = crypto
      .createHash('sha256')
      .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
      .digest('hex');

    console.log(`[Proxy] Cloudinary signature generated for user ${userId}`);

    res.json({
      success: true,
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      uploadParams: params
    });

  } catch (error) {
    console.error('[Proxy] Cloudinary signature error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération de la signature'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'proxy',
    timestamp: new Date(),
    services: {
      algolia: !!algoliaClient,
      redis: redisClient?.isReady || false,
      lemonsqueezy: !!process.env.LEMONSQUEEZY_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      cloudinary: !!process.env.CLOUDINARY_API_KEY
    }
  });
});

module.exports = router;