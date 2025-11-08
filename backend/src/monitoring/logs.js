// === ECOLOJIA V3 - LOGGING SYSTEM ===
// Système de logs structurés pour développement et production

const fs = require('fs');
const path = require('path');

// Dossier des logs
const logsDir = path.resolve(__dirname, '../../logs');

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Fichiers de logs
const logFiles = {
  info: path.join(logsDir, 'info.log'),
  error: path.join(logsDir, 'error.log'),
  http: path.join(logsDir, 'http.log')
};

// Niveaux de log
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Configuration
let loggingEnabled = false;

/**
 * Initialiser le système de logging
 */
function initLogging() {
  loggingEnabled = process.env.LOGGING_ENABLED === 'true' || process.env.NODE_ENV === 'production';
  
  if (loggingEnabled) {
    console.log('✅ [LOGGING] Système de logs activé');
    console.log('📁 [LOGGING] Dossier logs:', logsDir);
  } else {
    console.log('🟡 [LOGGING] Système de logs désactivé (mode console uniquement)');
  }
  
  return loggingEnabled;
}

/**
 * Formater un message de log
 */
function formatLogEntry(level, message, context = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };
}

/**
 * Écrire dans un fichier de log
 */
function writeToFile(filename, entry) {
  if (!loggingEnabled) return;
  
  try {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(filename, line, 'utf8');
  } catch (error) {
    console.error('❌ [LOGGING] Erreur écriture fichier:', error.message);
  }
}

/**
 * Logger une information
 * @param {string} message - Message à logger
 * @param {object} context - Contexte additionnel
 */
function logInfo(message, context = {}) {
  const entry = formatLogEntry(LOG_LEVELS.INFO, message, context);
  
  // Toujours afficher en console
  console.log(`ℹ️  [INFO] ${message}`, Object.keys(context).length > 0 ? context : '');
  
  // Écrire dans fichier si activé
  writeToFile(logFiles.info, entry);
}

/**
 * Logger une erreur
 * @param {string} message - Message d'erreur
 * @param {Error|object} error - Erreur ou contexte
 */
function logError(message, error = {}) {
  const context = error instanceof Error ? {
    error: error.message,
    stack: error.stack,
    code: error.code
  } : error;
  
  const entry = formatLogEntry(LOG_LEVELS.ERROR, message, context);
  
  // Toujours afficher en console
  console.error(`❌ [ERROR] ${message}`, context);
  
  // Écrire dans fichier si activé
  writeToFile(logFiles.error, entry);
}

/**
 * Logger un avertissement
 * @param {string} message - Message d'avertissement
 * @param {object} context - Contexte additionnel
 */
function logWarn(message, context = {}) {
  const entry = formatLogEntry(LOG_LEVELS.WARN, message, context);
  
  // Toujours afficher en console
  console.warn(`⚠️  [WARN] ${message}`, Object.keys(context).length > 0 ? context : '');
  
  // Écrire dans fichier si activé
  writeToFile(logFiles.info, entry);
}

/**
 * Logger en mode debug (seulement si NODE_ENV=development)
 * @param {string} message - Message de debug
 * @param {object} context - Contexte additionnel
 */
function logDebug(message, context = {}) {
  if (process.env.NODE_ENV !== 'development') return;
  
  const entry = formatLogEntry(LOG_LEVELS.DEBUG, message, context);
  console.log(`🔍 [DEBUG] ${message}`, Object.keys(context).length > 0 ? context : '');
  
  writeToFile(logFiles.info, entry);
}

/**
 * Middleware pour logger les requêtes HTTP
 */
function httpLogger(req, res, next) {
  if (!loggingEnabled && process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  const start = Date.now();
  
  // Logger la requête entrante
  const requestEntry = {
    timestamp: new Date().toISOString(),
    type: 'HTTP_REQUEST',
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  };
  
  // Logger la réponse quand elle est terminée
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const responseEntry = {
      ...requestEntry,
      type: 'HTTP_RESPONSE',
      status: res.statusCode,
      duration: duration + 'ms'
    };
    
    // Logger dans fichier
    writeToFile(logFiles.http, responseEntry);
    
    // Logger en console seulement si erreur ou requête lente
    if (res.statusCode >= 400) {
      console.warn(`⚠️  [HTTP] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
    } else if (duration > 2000) {
      console.warn(`🐌 [HTTP] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms) SLOW`);
    }
  });
  
  next();
}

/**
 * Nettoyer les anciens logs (garder 7 jours)
 */
function cleanOldLogs() {
  if (!loggingEnabled) return;
  
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours en ms
  const now = Date.now();
  
  try {
    Object.values(logFiles).forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const age = now - stats.mtime.getTime();
        
        if (age > maxAge) {
          fs.unlinkSync(file);
          console.log(`🗑️  [LOGGING] Ancien fichier log supprimé: ${path.basename(file)}`);
        }
      }
    });
  } catch (error) {
    console.error('❌ [LOGGING] Erreur nettoyage logs:', error.message);
  }
}

// Nettoyer les logs au démarrage
if (loggingEnabled) {
  cleanOldLogs();
}

module.exports = {
  initLogging,
  httpLogger,
  logInfo,
  logError,
  logWarn,
  logDebug,
  LOG_LEVELS,
  logFiles
};
