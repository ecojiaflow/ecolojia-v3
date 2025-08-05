// backend/src/utils/logger.js – version complète & finale
// -------------------------------------------------------------------
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ─── Préparation dossier logs ─────────────────────────────────────────
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// ─── Définition des niveaux & couleurs ───────────────────────────────
const logLevels = {
  levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4, perf: 5 },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
    perf: 'cyan',
  },
};
winston.addColors(logLevels.colors);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`),
);

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels.levels,
  format: fileFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5_242_880,
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5_242_880,
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

if (process.env.NODE_ENV !== 'production' || process.env.LOG_TO_CONSOLE === 'true') {
  winstonLogger.add(new winston.transports.Console({ format: consoleFormat }));
}

// ─── Classe Logger (wrapper) ──────────────────────────────────────────
class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  _log(level, msg, meta = {}) {
    winstonLogger.log(level, msg, { context: this.context, ...meta });
  }

  info(...a) {
    this._log('info', a.join(' '));
  }

  warn(...a) {
    this._log('warn', a.join(' '));
  }

  error(...a) {
    this._log('error', a.join(' '));
  }

  debug(...a) {
    this._log('debug', a.join(' '));
  }

  http(...a) {
    this._log('http', a.join(' '));
  }

  perf(op, dur) {
    this._log('perf', `${op} took ${dur}ms`);
  }

  child(ctx) {
    return new Logger(`${this.context}:${ctx}`);
  }
}

// ─── Middleware Express ──────────────────────────────────────────────
const httpLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    defaultLogger.http(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
};

// ─── Export principal ────────────────────────────────────────────────
const defaultLogger = new Logger('Default');
module.exports = defaultLogger; // permet require('.../logger').info(...)

// Exports complémentaires pour compatibilité
module.exports.Logger = Logger;
module.exports.httpLogger = httpLogger;
module.exports.winstonLogger = winstonLogger;
// Ajout ESM default pour éviter logger.default
module.exports.default = module.exports;
