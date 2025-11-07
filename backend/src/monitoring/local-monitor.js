const fs = require('fs');
const path = require('path');
const logFile = path.resolve(__dirname, '../../logs/metrics.log');

function logEvent(type, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    ...details
  };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
}

function monitorMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api/ai')) {
      logEvent('AI_REQUEST', { route: req.originalUrl, method: req.method, status: res.statusCode, duration });
    } else if (duration > 1500) {
      logEvent('SLOW_ROUTE', { route: req.originalUrl, method: req.method, status: res.statusCode, duration });
    }
  });
  next();
}

function errorLogger(err, req, res, next) {
  logEvent('ERROR', { route: req.originalUrl, message: err.message, stack: err.stack });
  next(err);
}

module.exports = { monitorMiddleware, errorLogger, logEvent };
