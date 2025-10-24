/**
 * Wrapper pour les fonctions async dans Express
 * Ã‰vite d'avoir Ã  écrire try/catch dans chaque contrôleur
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;