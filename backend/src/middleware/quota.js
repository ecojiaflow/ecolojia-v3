// backend/src/middleware/quota.js
// Wrapper pour utiliser le QuotaService existant comme middleware

const { quotaService } = require('../services/QuotaService');

/**
 * Wrapper pour checkQuota compatible avec analyze.routes.js
 */
const checkQuota = (quotaType = 'scan') => {
  // Utiliser le middleware existant du QuotaService
  return quotaService.checkQuotaMiddleware(quotaType);
};

// Exporter les fonctions nécessaires
module.exports = {
  checkQuota
};