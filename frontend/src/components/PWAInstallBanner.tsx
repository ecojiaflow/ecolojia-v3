import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

const PWAInstallBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Détecter mode standalone
    const checkStandalone = () => {
      const isStandaloneCSS = window.matchMedia('(display-mode: standalone)').matches;
      const isStandaloneNav = (window.navigator as any).standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      
      const standalone = isStandaloneCSS || isStandaloneNav || isAndroidApp;
      
      setIsStandalone(standalone);
      
      if (standalone) {
        console.log('📱 Mode Standalone - Banner désactivé');
        setShowBanner(false);
        return false;
      }
      
      return true;
    };

    const shouldContinue = checkStandalone();
    
    if (shouldContinue) {
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const dismissed = sessionStorage.getItem('ecolojia-banner-dismissed');

      if (isMobile && !dismissed) {
        const timer = setTimeout(() => {
          if (!isStandalone) {
            setShowBanner(true);
          }
        }, 3000);

        return () => clearTimeout(timer);
      }
    }

    // Écouter changements display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      if (mediaQuery.matches) {
        setIsStandalone(true);
        setShowBanner(false);
      }
    };
    
    mediaQuery.addListener(handleDisplayModeChange);
    return () => mediaQuery.removeListener(handleDisplayModeChange);
  }, []);

  const handleInstall = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isAndroid) {
      alert(`📱 Installation Android :

1️⃣ Appuyez sur le menu ⋮ (3 points) en haut
2️⃣ Cherchez "Installer l'application" 
3️⃣ Confirmez l'installation

💡 L'app apparaîtra sur votre écran d'accueil !`);
    } else if (isIOS) {
      alert(`🍎 Installation iOS :

1️⃣ Appuyez sur Partager ⎁ en bas
2️⃣ Sélectionnez "Sur l'écran d'accueil"
3️⃣ Appuyez sur "Ajouter"

💡 L'icône ECOLOJIA apparaîtra !`);
    } else {
      alert("💻 Pour installer l'application, utilisez le menu de votre navigateur.");
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('ecolojia-banner-dismissed', 'true');
  };

  const resetBanner = () => {
    sessionStorage.removeItem('ecolojia-banner-dismissed');
    if (!isStandalone) {
      setShowBanner(true);
    }
  };

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Ne jamais afficher en mode standalone
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {showBanner && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {/* Icône standard téléchargement */}
                <div className="w-12 h-12 bg-[#7DDE4A] rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Installer ECOLOJIA
                  </h3>
                  <p className="text-xs text-gray-600">
                    Ajouter à l'écran d'accueil
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleInstall}
                  className="bg-[#7DDE4A] hover:bg-[#6BCF3A] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Installer
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showBanner && isMobile && !isStandalone && (
        <div className="fixed bottom-6 left-4 z-50 md:hidden">
          <button
            onClick={resetBanner}
            className="bg-[#7DDE4A] text-white p-3 rounded-full shadow-lg hover:bg-[#6BCF3A] transition-colors"
            title="Réafficher banner PWA"
          >
            <Smartphone className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;