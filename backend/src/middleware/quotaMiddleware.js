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
      
      //