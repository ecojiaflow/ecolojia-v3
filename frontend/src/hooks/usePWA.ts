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
    // Detecter si PWA est dej installee
    const checkInstallation = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      
      console.log('aa PWA installee ? (SANS SW):', standalone);
      setIsStandalone(standalone);
      
      if (!standalone) {
        console.log('aaa PWA pas installee - Banner active');
        setShowInstallBanner(true);
      }
    };

    checkInstallation();

    // aacouter l'evenement custom depuis index.html
    const handleCustomInstallEvent = (e: CustomEvent) => {
      console.log(' pwa-install-available event recu (SANS SW)');
      setInstallPrompt(e.detail.prompt);
      setShowInstallBanner(true);
    };

    // aacouter l'evenement de force banner
    const handleForceBanner = () => {
      console.log('a Force banner PWA (SANS SW)');
      setShowInstallBanner(true);
    };

    // aacouter l'installation reussie
    const handleAppInstalled = () => {
      console.log('aa PWA installee avec succes! (SANS SW)');
      setInstallPrompt(null);
      setShowInstallBanner(false);
      setIsStandalone(true);
    };

    // Ajouter les listeners
    window.addEventListener('pwa-install-available', handleCustomInstallEvent as EventListener);
    window.addEventListener('pwa-force-banner', handleForceBanner);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Test de detection mobile ameliore
    const isMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isMobileScreen = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window;
      
      console.log('aa Detection mobile:', {
        userAgent: userAgent.substring(0, 50),
        isMobileUA,
        isMobileScreen,
        isTouchDevice,
        finalResult: isMobileUA || (isMobileScreen && isTouchDevice)
      });
      
      return isMobileUA || (isMobileScreen && isTouchDevice);
    };

    // Forcer affichage sur mobile apres 2 secondes
    if (isMobileDevice() && !isStandalone) {
      const timer = setTimeout(() => {
        console.log('a Timer mobile - Force affichage banner (SANS SW)');
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

  // Declencher l'installation avec debug
  const triggerInstall = async () => {
    console.log('aa triggerInstall appele (SANS SW), installPrompt:', !!installPrompt);
    
    if (!installPrompt) {
      console.log('aa Pas de prompt d\'installation disponible (SANS SW)');
      console.log('aaa Test manuel: Verifiez menu navigateur aaaaaa "Installer l\'application"');
      return false;
    }

    try {
      console.log('a Declenchement du prompt d\'installation... (SANS SW)');
      await installPrompt.prompt();
      
      const choiceResult = await installPrompt.userChoice;
      console.log('aa Choix utilisateur (SANS SW):', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('aaaa Installation acceptee par l\'utilisateur (SANS SW)');
        setInstallPrompt(null);
        setShowInstallBanner(false);
        return true;
      } else {
        console.log('aa Installation refusee par l\'utilisateur (SANS SW)');
        return false;
      }
    } catch (error) {
      console.error('aa Erreur lors de l\'installation (SANS SW):', error);
      return false;
    }
  };

  const dismissBanner = () => {
    console.log('aaa Banner PWA ferme (SANS SW)');
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

