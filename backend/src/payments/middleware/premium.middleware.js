const Subscription = require('../models/subscription.model');
const asyncHandler = require('../../utils/asyncHandler');

class PremiumMiddleware {
  /**
   * Vérifier si l'utilisateur a un abonnement premium actif
   * Utilisation: requirePremium('chatAI')
   */
  requirePremium = (requiredFeature = null) => {
    return asyncHandler(async (req, res, next) => {
      try {
        // Récupérer l'ID utilisateur depuis le token JWT (ajouté par authMiddleware)
        const userId = req.user?.id || req.user?._id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentification requise',
            code: 'AUTHENTICATION_REQUIRED'
          });
        }

        // Vérifier l'abonnement actif
        const subscription = await Subscription.findActiveByUserId(userId);
        
        if (!subscription) {
          return res.status(403).json({
            success: false,
            message: 'Abonnement Premium requis pour accéder à cette fonctionnalité',
            code: 'PREMIUM_REQUIRED',
            data: {
              feature: requiredFeature,
              upgradeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`
            }
          });
        }

        // Vérifier si l'abonnement n'est pas expiré
        if (!subscription.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Votre abonnement Premium a expiré',
            code: 'SUBSCRIPTION_EXPIRED',
            data: {
              expiredAt: subscription.currentPeriodEnd,
              renewUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/renew`
            }
          });
        }

        // Vérifier la fonctionnalité spécifique si demandée
        if (requiredFeature && !subscription.hasFeature(requiredFeature)) {
          return res.status(403).json({
            success: false,
            message: `La fonctionnalité ${requiredFeature} n'est pas incluse dans votre plan`,
            code: 'FEATURE_NOT_INCLUDED',
            data: {
              feature: requiredFeature,
              currentPlan: subscription.planName,
              upgradeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`
            }
          });
        }

        // Ajouter les informations de l'abonnement à la requête
        req.subscription = subscription;
        req.isPremium = true;

        console.log(`✅ Accès premium autorisé pour user ${userId} - feature: ${requiredFeature || 'any'}`);
        next();

      } catch (error) {
        console.error('❌ Erreur middleware premium:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification de l\'abonnement',
          code: 'SUBSCRIPTION_CHECK_ERROR'
        });
      }
    });
  };

  /**
   * Vérifier les limites d'utilisation
   * Utilisation: checkUsageLimit('scans')
   */
  checkUsageLimit = (usageType) => {
    return asyncHandler(async (req, res, next) => {
      try {
        const subscription = req.subscription;
        
        if (!subscription) {
          return res.status(403).json({
            success: false,
            message: 'Abonnement Premium requis',
            code: 'PREMIUM_REQUIRED'
          });
        }

        // Vérifier les limites
        if (!subscription.isWithinLimits(usageType)) {
          const currentUsage = subscription.usage[`currentMonth${usageType.charAt(0).toUpperCase() + usageType.slice(1)}`];
          const limit = subscription.limits[usageType];
          
          return res.status(429).json({
            success: false,
            message: `Limite mensuelle atteinte pour ${usageType}`,
            code: 'USAGE_LIMIT_EXCEEDED',
            data: {
              usageType,
              currentUsage,
              limit,
              resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
            }
          });
        }

        next();

      } catch (error) {
        console.error('❌ Erreur vérification limites:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification des limites',
          code: 'USAGE_CHECK_ERROR'
        });
      }
    });
  };

  /**
   * Middleware optionnel: enrichir la requête avec les infos premium
   * Utilisation: enrichWithPremiumInfo() - n'bloque pas si pas premium
   */
  enrichWithPremiumInfo = () => {
    return asyncHandler(async (req, res, next) => {
      try {
        const userId = req.user?.id || req.user?._id;
        
        if (userId) {
          const subscription = await Subscription.findActiveByUserId(userId);
          
          req.isPremium = subscription && subscription.isActive;
          req.subscription = subscription;
          req.premiumFeatures = subscription ? subscription.features : {};
          req.usageLimits = subscription ? subscription.limits : {};
          req.currentUsage = subscription ? subscription.usage : {};
        } else {
          req.isPremium = false;
          req.subscription = null;
          req.premiumFeatures = {};
          req.usageLimits = {};
          req.currentUsage = {};
        }

        next();

      } catch (error) {
        console.error('⚠️ Erreur enrichissement premium (non-bloquant):', error);
        // Ne pas bloquer en cas d'erreur, juste passer sans enrichissement
        req.isPremium = false;
        req.subscription = null;
        next();
      }
    });
  };

  /**
   * Incrémenter automatiquement l'usage après une action réussie
   * Utilisation: trackUsageAfter('scans', 1)
   */
  trackUsageAfter = (usageType, amount = 1) => {
    return asyncHandler(async (req, res, next) => {
      // Stocker la fonction de tracking pour l'exécuter après la réponse
      const originalSend = res.send;
      
      res.send = function(data) {
        // Appeler la méthode send originale
        originalSend.call(this, data);
        
        // Tracker l'usage de manière asynchrone (ne pas attendre)
        if (req.subscription && this.statusCode < 400) {
          req.subscription.incrementUsage(usageType, amount)
            .then(() => {
              console.log(`📊 Usage tracké: ${usageType} +${amount} pour user ${req.user?.id}`);
            })
            .catch(error => {
              console.error('❌ Erreur tracking usage:', error);
            });
        }
      };

      next();
    });
  };

  /**
   * Middleware de validation pour les routes admin
   */
  requireAdminAccess = () => {
    return asyncHandler(async (req, res, next) => {
      const userRole = req.user?.role;
      
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Accès administrateur requis',
          code: 'ADMIN_ACCESS_REQUIRED'
        });
      }

      next();
    });
  };

  /**
   * Rate limiting spécifique pour les actions premium
   */
  premiumRateLimit = (maxRequests = 100, windowMs = 60 * 1000) => {
    const requestCounts = new Map();
    
    return asyncHandler(async (req, res, next) => {
      const userId = req.user?.id || req.user?._id;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Nettoyer les anciens compteurs
      for (const [key, data] of requestCounts.entries()) {
        if (data.timestamp < windowStart) {
          requestCounts.delete(key);
        }
      }
      
      // Vérifier le compteur pour cet utilisateur
      const userKey = `${userId}`;
      const userData = requestCounts.get(userKey);
      
      if (userData && userData.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Trop de requêtes. Veuillez patienter.',
          code: 'RATE_LIMIT_EXCEEDED',
          data: {
            retryAfter: Math.ceil((userData.timestamp + windowMs - now) / 1000)
          }
        });
      }
      
      // Incrémenter le compteur
      requestCounts.set(userKey, {
        count: (userData?.count || 0) + 1,
        timestamp: now
      });
      
      next();
    });
  };
}

module.exports = new PremiumMiddleware();