import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Configuration Sentry pour ECOLOJIA V3 Frontend
 * Module M12 - Monitoring & Production
 */

interface SentryConfig {
  dsn?: string;
  environment: string;
  release: string;
  enabled: boolean;
}

const getSentryConfig = (): SentryConfig => {
  return {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    release: import.meta.env.VITE_SENTRY_RELEASE || 'v3.0.0',
    enabled: import.meta.env.VITE_SENTRY_ENABLED === 'true'
  };
};

export const initSentry = (): boolean => {
  const config = getSentryConfig();
  
  if (!config.enabled) {
    console.log('🟡 Sentry désactivé (VITE_SENTRY_ENABLED=false)');
    return false;
  }

  if (!config.dsn || config.dsn.includes('your-frontend-dsn')) {
    console.log('🟡 Sentry DSN non configuré - mode développement');
    return false;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      
      // Performance Monitoring
      tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
      
      // Intégrations
      integrations: [
        new BrowserTracing({
          // Tracer les navigations automatiquement
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          ),
        }),
      ],

      // Filtrage des erreurs
      beforeSend(event, hint) {
        // Ne pas envoyer en développement (optionnel)
        if (config.environment === 'development') {
          console.log('🔍 Sentry Event (dev):', event.exception?.values?.[0]?.value);
        }

        // Filtrer les erreurs non critiques
        const error = hint.originalException;
        if (error instanceof Error) {
          // Ignorer les erreurs de réseau courantes
          if (error.message.includes('NetworkError') ||
              error.message.includes('fetch') ||
              error.message.includes('AbortError')) {
            return null;
          }
          
          // Ignorer les erreurs de permission (microphone, caméra)
          if (error.message.includes('Permission denied') ||
              error.message.includes('NotAllowedError')) {
            return null;
          }
        }

        return event;
      },

      // Tags globaux
      initialScope: {
        tags: {
          component: 'frontend',
          version: 'v3.0.0',
          module: 'M12'
        },
        context: {
          app: {
            name: 'ecolojia-frontend',
            version: '3.0.0'
          }
        }
      }
    });

    console.log('✅ Sentry frontend initialisé avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation Sentry frontend:', error);
    return false;
  }
};

// Hook React pour capturer les erreurs
export const useSentryErrorBoundary = () => {
  return Sentry.withErrorBoundary;
};

// Fonctions utilitaires
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (getSentryConfig().enabled) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  } else {
    console.error('Exception captured:', error, context);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
  if (getSentryConfig().enabled) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureMessage(message, level);
    });
  } else {
    console.log([${level.toUpperCase()}] ${message}, context);
  }
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  if (getSentryConfig().enabled) {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

// Composant ErrorBoundary avec Sentry
export const SentryErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Sentry.ErrorBoundary 
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833-.23 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Une erreur est survenue
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Nous avons été notifiés de cette erreur et travaillons à la corriger.
              </p>
              {error && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Détails techniques
                  </summary>
                  <pre className="mt-1 text-xs text-gray-600 overflow-auto max-h-32">
                    {error.message}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={resetError}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

// Performance tracking
export const trackPerformance = (name: string, duration: number, context?: Record<string, any>) => {
  if (getSentryConfig().enabled) {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: Performance: ${name} took ${duration}ms,
      level: 'info',
      data: context
    });
  }
};

export default Sentry;
