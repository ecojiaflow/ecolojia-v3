const Sentry = require('@sentry/node');

const initSentry = () => {
  const sentryEnabled = process.env.SENTRY_ENABLED === 'true';
  
  if (!sentryEnabled) {
    console.log('🟡 Sentry désactivé (SENTRY_ENABLED=false)');
    return false;
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn || dsn.includes('your-dsn')) {
    console.log('🟡 Sentry DSN non configuré - mode développement');
    return false;
  }

  try {
    Sentry.init({
      dsn: dsn,
      environment: process.env.SENTRY_ENVIRONMENT || 'development',
      release: process.env.SENTRY_RELEASE || 'v3.0.0',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
    });

    console.log('✅ Sentry initialisé avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation Sentry:', error.message);
    return false;
  }
};

const sentryMiddleware = () => {
  return [
    Sentry.Handlers.requestHandler(),
    Sentry.Handlers.tracingHandler(),
  ];
};

const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      return error.status >= 400;
    }
  });
};

const captureException = (error, context = {}) => {
  if (process.env.SENTRY_ENABLED === 'true') {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  } else {
    console.error('Exception captured:', error.message, context);
  }
};

const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_ENABLED === 'true') {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureMessage(message, level);
    });
  } else {
    console.log('[' + level.toUpperCase() + '] ' + message, context);
  }
};

const addBreadcrumb = (breadcrumb) => {
  if (process.env.SENTRY_ENABLED === 'true') {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

module.exports = {
  initSentry,
  sentryMiddleware,
  sentryErrorHandler,
  captureException,
  captureMessage,
  addBreadcrumb,
  Sentry
};
