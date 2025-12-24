// backend/src/config/database.js
// ====================================================
// FICHIER DE COMPATIBILITÉ - Réexporte db.js
// Créé le: 2025-12-04 15:02:15
// ====================================================
//
// Ce fichier standardise le nom "database.js" pour la suite
// du projet tout en préservant la compatibilité avec db.js
//
// La logique de connexion MongoDB est dans db.js

const db = require('./db');

// Export principal avec tous les helpers
module.exports = {
  connectMongo: db.connectMongo,
  isConnected: db.isConnected,
  getConnectionStats: db.getConnectionStats,
  
  // Alias pour compatibilité
  connect: db.connectMongo,
  checkConnection: db.isConnected,
  stats: db.getConnectionStats
};

// Export default pour import ESM éventuel
module.exports.default = module.exports;
