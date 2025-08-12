// =============================
// frontend/src/components/ErrorBoundary.tsx
// =============================

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Met ÃƒÂ  jour le state pour afficher l'UI d'erreur
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('âÂÅ’ ErrorBoundary a capturé une erreur:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-3xl shadow-lg border-2 border-red-200 p-8 text-center">
              {/* Icon et titre */}
              <div className="text-6xl mb-6">Ã°Å¸â€™Â¥</div>
              <h1 className="text-3xl font-bold text-red-800 mb-4">Oops ! Une erreur est survenue</h1>
              <p className="text-red-600 mb-6 text-lg">L'application ECOLOJIA a rencontré un problème inattendu.</p>

              {/* Détails de l'erreur (mode développement) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-left">
                  <h3 className="font-bold text-red-800 mb-2">Détails de l'erreur :</h3>
                  <pre className="text-sm text-red-600 overflow-auto max-h-40">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-2xl transition-colors"
                >
                  Ã°Å¸â€â€ž Réessayer
                </button>
                <button
                  onClick={this.handleReload}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-2xl transition-colors"
                >
                  Ã°Å¸â€Æ’ Recharger la page
                </button>
              </div>

              {/* Message d'aide */}
              <div className="mt-8 pt-6 border-t border-red-200">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">Ã°Å¸Å’Â±</span>
                  </div>
                  <span className="font-bold text-gray-800">ECOLOJIA</span>
                </div>
                <p className="text-sm text-gray-500">
                  Si le problème persiste, notre équipe technique a été automatiquement notifiée.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
