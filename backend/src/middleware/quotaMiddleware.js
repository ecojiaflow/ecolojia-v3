// backend/src/middleware/quotaMiddleware.js
const quotaService = require('../services/quotaService');

/**
 * Middleware pour vérifier et consommer les quotas
 * @param {string} quotaType - Type de quota ('scan', 'aiChat', 'export')
 */
const checkQuota = (quotaType) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      
      // Vérifier et consommer le quota
      const quotaResult = await quotaService.checkAndConsumeQuota(userId, quotaType);
      
      // Ajouter les infos de quota à la requête
      req.quotaInfo = quotaResult;
      
      // Si quota épuisé
      if (!quotaResult.allowed) {
        return res.status(403).json({
          success: false,
          error: 'Quota épuisé',
          quotaInfo: {
            type: quotaType,
            limit: quotaResult.limit,
            remaining: 0,
            resetDate: quotaResult.resetDate,
            requiresUpgrade: true
          },
          upgrade: {
            message: 'Passez à Premium pour débloquer cette fonctionnalité',
            benefits: getQuotaBenefits(quotaType),
            upgradeUrl: `${process.env.FRONTEND_URL}/premium`
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Erreur middleware quota:', error);
      // En cas d'erreur, on laisse passer pour ne pas bloquer le service
      next();
    }
  };
};

/**
 * Obtenir les bénéfices selon le type de quota
 */
function getQuotaBenefits(quotaType) {
  const benefits = {
    scan: [
      'Scans illimités',
      'Historique complet',
      'Analyses détaillées',
      'Recommandations personnalisées'
    ],
    aiChat: [
      '500 conversations IA par mois',
      'Réponses détaillées',
      'Conseils nutritionnels personnalisés',
      'Accès prioritaire'
    ],
    export: [
      'Export PDF illimité',
      'Rapports détaillés',
      'Historique complet',
      'Partage familial'
    ]
  };
  
  return benefits[quotaType] || benefits.scan;
}

/**
 * Middleware simplifié pour les routes qui utilisent checkQuota sans paramètre
 */
const checkQuotaMiddleware = async (req, res, next) => {
  // Déterminer le type de quota selon la route
  let quotaType = 'scan';
  
  if (req.path.includes('/ai/') || req.path.includes('/chat')) {
    quotaType = 'aiChat';
  } else if (req.path.includes('/export')) {
    quotaType = 'export';
  }
  
  // Appeler checkQuota avec le bon type
  return checkQuota(quotaType)(req, res, next);
};

module.exports = {
  checkQuota,
  checkQuotaMiddleware
};