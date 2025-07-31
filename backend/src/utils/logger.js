// PATH: backend/src/utils/logger.js
// Logger de production ECOLOJIA V3 - Sans dépendances circulaires

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Niveaux de log personnalisés
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    perf: 5
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
    perf: 'cyan'
  }
};

// Ajouter les couleurs à Winston
winston.addColors(logLevels.colors);

// Format personnalisé pour la console
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, context, ...extra } = info;
    let log = `[${timestamp}] [${level.toUpperCase()}]`;
    if (context) log += ` [${context}]`;
    log += ` ${message}`;
    
    // Ajouter les métadonnées supplémentaires si présentes
    if (Object.keys(extra).length > 0 && process.env.LOG_METADATA === 'true') {
      log += ` ${JSON.stringify(extra, null, 2)}`;
    }
    
    return log;
  })
);

// Format pour les fichiers
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ═══════════════════════════════════════════════════════════════════════
// WINSTON LOGGER INSTANCE
// ═══════════════════════════════════════════════════════════════════════

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels.levels,
  format: fileFormat,
  defaultMeta: { service: 'ecolojia-backend' },
  transports: [
    // Fichier pour toutes les logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Fichier pour les erreurs uniquement
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  // Gestion des exceptions non catchées
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  // Gestion des rejections de promesses
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Ajouter console en développement ou si explicitement demandé
if (process.env.NODE_ENV !== 'production' || process.env.LOG_TO_CONSOLE === 'true') {
  winstonLogger.add(new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// CLASSE LOGGER
// ═══════════════════════════════════════════════════════════════════════

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  /**
   * Log d'information générale
   */
  info(...args) {
    const { message, metadata } = this._parseArgs(args);
    winstonLogger.info(message, { context: this.context, ...metadata });
  }

  /**
   * Log d'avertissement
   */
  warn(...args) {
    const { message, metadata } = this._parseArgs(args);
    winstonLogger.warn(message, { context: this.context, ...metadata });
  }

  /**
   * Log d'erreur
   */
  error(...args) {
    const { message, metadata, error } = this._parseArgs(args);
    
    if (error instanceof Error) {
      winstonLogger.error(message, { 
        context: this.context,
        ...metadata,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });
    } else {
      winstonLogger.error(message, { context: this.context, ...metadata });
    }
  }

  /**
   * Log de debug
   */
  debug(...args) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      const { message, metadata } = this._parseArgs(args);
      winstonLogger.debug(message, { context: this.context, ...metadata });
    }
  }

  /**
   * Log HTTP (requêtes)
   */
  http(...args) {
    const { message, metadata } = this._parseArgs(args);
    winstonLogger.http(message, { context: this.context, ...metadata });
  }

  /**
   * Log de performance
   */
  perf(operation, duration, metadata = {}) {
    const message = `Performance: ${operation} took ${duration}ms`;
    winstonLogger.log('perf', message, { 
      context: this.context, 
      operation, 
      duration, 
      ...metadata 
    });
  }

  /**
   * Log d'audit (actions utilisateur importantes)
   */
  audit(action, userId, details = {}) {
    const message = `Audit: ${action} by user ${userId}`;
    winstonLogger.info(message, {
      context: this.context,
      type: 'audit',
      action,
      userId,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log de sécurité
   */
  security(event, details = {}) {
    const message = `Security: ${event}`;
    winstonLogger.warn(message, {
      context: this.context,
      type: 'security',
      event,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Parser les arguments du logger
   * @private
   */
  _parseArgs(args) {
    let message = '';
    let metadata = {};
    let error = null;

    args.forEach(arg => {
      if (typeof arg === 'string' || typeof arg === 'number') {
        message += (message ? ' ' : '') + arg;
      } else if (arg instanceof Error) {
        error = arg;
        message += (message ? ' ' : '') + arg.message;
      } else if (typeof arg === 'object' && arg !== null) {
        Object.assign(metadata, arg);
      }
    });

    return { message: message || 'No message', metadata, error };
  }

  /**
   * Créer un child logger avec contexte supplémentaire
   */
  child(additionalContext) {
    return new Logger(`${this.context}:${additionalContext}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MIDDLEWARE EXPRESS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Middleware pour logger les requêtes HTTP
 */
const httpLogger = (req, res, next) => {
  const start = Date.now();
  const logger = new Logger('HTTP');

  // Log de la requête entrante
  logger.http(`${req.method} ${req.url}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });

  // Intercepter la fin de la requête
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userId: req.userId || 'anonymous'
    };

    // Log différent selon le status
    if (res.statusCode >= 500) {
      logger.error(`HTTP ${req.method} ${req.url} ${res.statusCode}`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`HTTP ${req.method} ${req.url} ${res.statusCode}`, logData);
    } else {
      logger.http(`HTTP ${req.method} ${req.url} ${res.statusCode}`, logData);
    }

    // Log de performance pour les requêtes lentes
    if (duration > 1000) {
      logger.perf(`${req.method} ${req.url}`, duration, { slow: true });
    }
  });

  next();
};

/**
 * Stream pour Morgan
 */
const morganStream = {
  write: (message) => {
    const logger = new Logger('Morgan');
    logger.http(message.trim());
  }
};

// ═══════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Logger le démarrage de l'application
 */
const logStartup = () => {
  const logger = new Logger('Startup');
  logger.info('════════════════════════════════════════════════════');
  logger.info('🚀 ECOLOJIA Backend Starting...');
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📁 Logs directory: ${logsDir}`);
  logger.info(`🔊 Log level: ${process.env.LOG_LEVEL || 'info'}`);
  logger.info('════════════════════════════════════════════════════');
};

/**
 * Logger l'arrêt de l'application
 */
const logShutdown = () => {
  const logger = new Logger('Shutdown');
  logger.info('════════════════════════════════════════════════════');
  logger.info('🛑 ECOLOJIA Backend Shutting down...');
  logger.info('════════════════════════════════════════════════════');
};

/**
 * Obtenir les statistiques de logs
 */
const getLogStats = async () => {
  const stats = {};
  const logFiles = ['combined.log', 'error.log', 'exceptions.log', 'rejections.log'];
  
  for (const file of logFiles) {
    const filePath = path.join(logsDir, file);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      stats[file] = {
        size: `${(stat.size / 1024 / 1024).toFixed(2)} MB`,
        modified: stat.mtime,
        exists: true
      };
    } else {
      stats[file] = { exists: false };
    }
  }
  
  stats.logsDirectory = logsDir;
  stats.logLevel = process.env.LOG_LEVEL || 'info';
  
  return stats;
};

/**
 * Nettoyer les vieux logs
 */
const cleanOldLogs = (daysToKeep = 30) => {
  const logger = new Logger('LogCleaner');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  fs.readdir(logsDir, (err, files) => {
    if (err) {
      logger.error('Error reading logs directory:', err);
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (stats.mtime < cutoffDate && file.endsWith('.log')) {
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error(`Error deleting old log file ${file}:`, err);
            } else {
              logger.info(`Deleted old log file: ${file}`);
            }
          });
        }
      });
    });
  });
};

// ═══════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════

module.exports = {
  // Classe Logger pour usage normal
  Logger,
  
  // Instance par défaut
  logger: new Logger('Default'),
  
  // Middleware Express
  httpLogger,
  morganStream,
  
  // Fonctions utilitaires
  logStartup,
  logShutdown,
  getLogStats,
  cleanOldLogs,
  
  // Winston pour usage avancé (éviter si possible)
  winstonLogger
};