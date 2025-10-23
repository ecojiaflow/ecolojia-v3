// Middleware d'auth désactivé pour les tests
const authDisabled = (req, res, next) => {
  // Simuler un utilisateur authentifié
  req.user = {
    id: "demo-user",
    email: "demo@ecolojia.fr",
    plan: "premium"
  };
  next();
};

// Pour les routes qui nécessitent l'auth
const authenticateUser = authDisabled;
const requirePremium = authDisabled;
const checkQuota = (req, res, next) => next();

module.exports = {
  authenticateUser,
  requirePremium,
  checkQuota,
  authDisabled
};
