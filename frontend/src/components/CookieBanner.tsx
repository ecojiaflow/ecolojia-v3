import React, { useState, useEffect } from 'react';

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fait un choix
    const cookieConsent = localStorage.getItem('ecolojia-cookie-consent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('ecolojia-cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem('ecolojia-cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleCustomize = () => {
    setShowDetails(!showDetails);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-eco-leaf shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Texte principal */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-6 h-6 bg-eco-leaf rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🍃</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-eco-text mb-1">
                  Respect de votre vie privée
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic de manière anonyme. 
                  Aucune donnée personnelle n'est partagée avec des tiers.
                </p>
                
                {showDetails && (
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked disabled className="w-3 h-3" />
                      <span className="text-gray-700">
                        <strong>Cookies nécessaires</strong> - Fonctionnement du site (toujours actifs)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-3 h-3" />
                      <span className="text-gray-700">
                        <strong>Analytics</strong> - Plausible Analytics (respectueux de la vie privée)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
            <button
              onClick={handleCustomize}
              className="px-3 py-2 text-xs font-medium text-eco-text hover:text-eco-leaf transition-colors"
            >
              {showDetails ? 'Masquer détails' : 'Personnaliser'}
            </button>
            
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Refuser tout
            </button>
            
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-xs font-medium text-white bg-eco-leaf hover:bg-eco-leaf/90 rounded-lg transition-colors"
            >
              Accepter tout
            </button>
          </div>
        </div>

        {/* Liens légaux */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <a href="/privacy" className="hover:text-eco-leaf transition-colors">
              Politique de confidentialité
            </a>
            <a href="/terms" className="hover:text-eco-leaf transition-colors">
              Conditions d'utilisation
            </a>
            <a href="/legal" className="hover:text-eco-leaf transition-colors">
              Mentions légales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;