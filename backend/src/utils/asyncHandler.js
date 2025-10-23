/**
 * Wrapper pour les fonctions async dans Express
 * Ã‰vite d'avoir Ã  Ã©crire try/catch dans chaque contrÃ´leur
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;