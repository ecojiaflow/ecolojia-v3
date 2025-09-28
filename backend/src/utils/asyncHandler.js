/**
 * Wrapper pour les fonctions async dans Express
 * Évite d'avoir à écrire try/catch dans chaque contrôleur
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;