// backend/src/middleware/quotaMiddleware.js
const User = require('../models/User');

const checkQuota = (quotaType = 'scan') => {
  return async (req, res, next) => {
    try {
      // IMPORTANT: Ne pas parser le body pour les requetes multipart
      // Multer doit s'executer AVANT ce middleware
      const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
      
      if (isMultipart) {
        console.log('Multipart request detected, skipping body parsing');
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifie' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouve' });
      }

      // Verifier si l'utilisateur est premium
      if (user.subscription?.status === 'active' && user.subscription?.plan === 'premium') {
        // Premium : pas de limite
        return next();
      }

      // Utilisateur gratuit : verifier les quotas
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Reinitialiser le compteur si nouveau mois
      if (!user.quotas.lastReset || user.quotas.lastReset < startOfMonth) {
        user.quotas = {
          scansUsed: 0,
          scansLimit: 30,
          aiChatsUsed: 0,
          aiChatsLimit: 5,
          lastReset: now
        };
        await user.save();
      }

      // Verifier le quota approprie
      let quotaField, limitField, quotaName;
      
      switch (quotaType) {
        case 'scan':
          quotaField = 'scansUsed';
          limitField = 'scansLimit';
          quotaName = 'scans';
          break;
        case 'ai':
          quotaField = 'aiChatsUsed';
          limitField = 'aiChatsLimit';
          quotaName = 'chats IA';
          break;
        default:
          return res.status(400).json({ error: 'Type de quota invalide' });
      }

      if (user.quotas[quotaField] >= user.quotas[limitField]) {
        return res.status(429).json({ 
          error: 'Quota depasse',
          message: `Vous avez atteint votre limite mensuelle de ${user.quotas[limitField]} ${quotaName}`,
          quotas: {
            used: user.quotas[quotaField],
            limit: user.quotas[limitField],
            resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          },
          upgrade: {
            message: 'Passez Â  Premium pour des analyses illimitees',
            url: '/pricing'
          }
        });
      }

      // Incrementer le compteur
      user.quotas[quotaField] += 1;
      await user.save();

      // Ajouter les infos de quota Â  la requete
      req.quotaInfo = {
        type: quotaType,
        used: user.quotas[quotaField],
        limit: user.quotas[limitField],
        remaining: user.quotas[limitField] - user.quotas[quotaField]
      };

      next();
    } catch (error) {
      console.error('Erreur verification quota:', error);
      res.status(500).json({ error: 'Erreur lors de la verification du quota' });
    }
  };
};

// Middleware specifique pour les routes avec upload
const checkQuotaAfterUpload = (quotaType = 'scan') => {
  return async (req, res, next) => {
    // Ce middleware est concu pour etre utilise APRË†S multer
    // Il aura acces Â  req.file
    console.log('CheckQuotaAfterUpload - File present:', !!req.file);
    
    // Appeler la logique de quota normale
    return checkQuota(quotaType)(req, res, next);
  };
};

module.exports = { checkQuota, checkQuotaAfterUpload };
