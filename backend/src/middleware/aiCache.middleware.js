const aiCache = require('../services/aiCache.service');

/**
 * Middleware cache IA - Production Ready
 * Intercepte requêtes chat avec productContext et met en cache
 */
const aiCacheMiddleware = async (req, res, next) => {
  try {
    const { messages = [], productContext } = req.body || {};
    
    // Pas de cache si pas de productContext
    if (!productContext || !productContext._id) {
      return next();
    }
    
    // Extraire dernier message utilisateur
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage || !lastUserMessage.content) {
      return next();
    }
    
    const productId = productContext._id.toString();
    const question = lastUserMessage.content;
    
    // Tenter récupération cache
    const result = await aiCache.getCachedOrGenerate(
      productId,
      question,
      async () => {
        // Intercepter réponse controller
        return await new Promise((resolve, reject) => {
          const originalJson = res.json.bind(res);
          const originalStatus = res.status.bind(res);
          
          // Capturer réponse
          res.json = (data) => {
            resolve(data);
            return res;
          };
          
          // Capturer erreurs
          res.status = (code) => {
            return {
              json: (data) => {
                if (code >= 400) {
                  reject(new Error(JSON.stringify(data)));
                } else {
                  resolve(data);
                }
                return res;
              }
            };
          };
          
          // Passer au controller
          next();
        });
      }
    );
    
    // Si cached, retourner directement
    if (result._cached) {
      console.log('✅ [Cache] Réponse depuis cache');
      return res.json(result);
    }
    
    // Sinon la réponse est déjà envoyée par le controller
    
  } catch (error) {
    console.error('❌ [Cache] Middleware error:', error);
    // En cas d'erreur cache, continuer sans cache
    if (!res.headersSent) {
      next();
    }
  }
};

module.exports = { aiCacheMiddleware };
