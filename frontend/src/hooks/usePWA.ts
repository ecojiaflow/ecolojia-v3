import { useState, useEffect } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Détecter si PWA est déjÃƒÂ  installée
    const checkInstallation = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      
      console.log('Ã°Å¸â€œÂ± PWA installée ? (SANS SW):', standalone);
      setIsStandalone(standalone);
      
      if (!standalone) {
        console.log('Ã°Å¸â€™Â¡ PWA pas installée - Banner activé');
        setShowInstallBanner(true);
      }
    };

    checkInstallation();

    // Ãƒâ€°couter l'événement custom depuis index.html
    const handleCustomInstallEvent = (e: CustomEvent) => {
      console.log('Ã°Å¸Å½Â¯ pwa-install-available event reçu (SANS SW)');
      setInstallPrompt(e.detail.prompt);
      setShowInstallBanner(true);
    };

    // Ãƒâ€°couter l'événement de force banner
    const handleForceBanner = () => {
      console.log('âÅ¡Â¡ Force banner PWA (SANS SW)');
      setShowInstallBanner(true);
    };

    // Ãƒâ€°couter l'installation réussie
    const handleAppInstalled = () => {
      console.log('Ã°Å¸Å½â€° PWA installée avec succès! (SANS SW)');
      setInstallPrompt(null);
      setShowInstallBanner(false);
      setIsStandalone(true);
    };

    // Ajouter les listeners
    window.addEventListener('pwa-install-available', handleCustomInstallEvent as EventListener);
    window.addEventListener('pwa-force-banner', handleForceBanner);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Test de détection mobile amélioré
    const isMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isMobileScreen = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window;
      
      console.log('Ã°Å¸â€œÂ± Détection mobile:', {
        userAgent: userAgent.substring(0, 50),
        isMobileUA,
        isMobileScreen,
        isTouchDevice,
        finalResult: isMobileUA || (isMobileScreen && isTouchDevice)
      });
      
      return isMobileUA || (isMobileScreen && isTouchDevice);
    };

    // Forcer affichage sur mobile après 2 secondes
    if (isMobileDevice() && !isStandalone) {
      const timer = setTimeout(() => {
        console.log('âÂÂ° Timer mobile - Force affichage banner (SANS SW)');
        setShowInstallBanner(true);
      }, 2000);
      
      return () => {
        window.removeEventListener('pwa-install-available', handleCustomInstallEvent as EventListener);
        window.removeEventListener('pwa-force-banner', handleForceBanner);
        window.removeEventListener('appinstalled', handleAppInstalled);
        clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener('pwa-install-available', handleCustomInstallEvent as EventListener);
      window.removeEventListener('pwa-force-banner', handleForceBanner);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  // Déclencher l'installation avec debug
  const triggerInstall = async () => {
    console.log('Ã°Å¸â€Â§ triggerInstall appelé (SANS SW), installPrompt:', !!installPrompt);
    
    if (!installPrompt) {
      console.log('âÂÅ’ Pas de prompt d\'installation disponible (SANS SW)');
      console.log('Ã°Å¸â€™Â¡ Test manuel: Vérifiez menu navigateur ââ€ â€™ "Installer l\'application"');
      return false;
    }

    try {
      console.log('Ã°Å¸Å¡€ Déclenchement du prompt d\'installation... (SANS SW)');
      await installPrompt.prompt();
      
      const choiceResult = await installPrompt.userChoice;
      console.log('Ã°Å¸â€˜Â¤ Choix utilisateur (SANS SW):', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('âÅ“â€¦ Installation acceptée par l\'utilisateur (SANS SW)');
        setInstallPrompt(null);
        setShowInstallBanner(false);
        return true;
      } else {
        console.log('âÂÅ’ Installation refusée par l\'utilisateur (SANS SW)');
        return false;
      }
    } catch (error) {
      console.error('âÂÅ’ Erreur lors de l\'installation (SANS SW):', error);
      return false;
    }
  };

  const dismissBanner = () => {
    console.log('Ã°Å¸â„¢Ë† Banner PWA fermé (SANS SW)');
    setShowInstallBanner(false);
  };

  return {
    installPrompt,
    showInstallBanner,
    isStandalone,
    triggerInstall,
    dismissBanner
  };
};
