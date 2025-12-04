// backend/src/config/logger.js
// ====================================================
// FICHIER DE COMPATIBILITÉ - Réexporte utils/logger
// Créé le: 2025-12-04 15:02:15
// ====================================================
// 
// Ce fichier permet de centraliser l'import du logger
// et de supporter les deux patterns d'import:
// - require('../config/logger') [STANDARD]
// - require('../utils/logger')  [LEGACY]
//
// Le logger Winston professionnel est dans utils/logger.js

const logger = require('../utils/logger');

// Export principal (permet require('.../logger').info(...))
module.exports = logger;

// Exports complémentaires pour compatibilité totale
module.exports.Logger = logger.Logger;
module.exports.httpLogger = logger.httpLogger;
module.exports.winstonLogger = logger.winstonLogger;
module.exports.default = logger;
