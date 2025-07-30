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
    // Détecter si PWA est déjà installée
    const checkInstallation = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      
      console.log('📱 PWA installée ? (SANS SW):', standalone);
      setIsStandalone(standalone);
      
      if (!standalone) {
        console.log('💡 PWA pas installée - Banner activé');
        setShowInstallBanner(true);
      }
    };

    checkInstallation();

    // Écouter l'événement custom depuis index.html
    const handleCustomInstallEvent = (e: CustomEvent) => {
      console.log('🎯 pwa-install-available event reçu (SANS SW)');
      setInstallPrompt(e.detail.prompt);
      setShowInstallBanner(true);
    };

    // Écouter l'événement de force banner
    const handleForceBanner = () => {
      console.log('⚡ Force banner PWA (SANS SW)');
      setShowInstallBanner(true);
    };

    // Écouter l'installation réussie
    const handleAppInstalled = () => {
      console.log('🎉 PWA installée avec succès! (SANS SW)');
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
      
      console.log('📱 Détection mobile:', {
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
        console.log('⏰ Timer mobile - Force affichage banner (SANS SW)');
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
    console.log('🔧 triggerInstall appelé (SANS SW), installPrompt:', !!installPrompt);
    
    if (!installPrompt) {
      console.log('❌ Pas de prompt d\'installation disponible (SANS SW)');
      console.log('💡 Test manuel: Vérifiez menu navigateur → "Installer l\'application"');
      return false;
    }

    try {
      console.log('🚀 Déclenchement du prompt d\'installation... (SANS SW)');
      await installPrompt.prompt();
      
      const choiceResult = await installPrompt.userChoice;
      console.log('👤 Choix utilisateur (SANS SW):', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Installation acceptée par l\'utilisateur (SANS SW)');
        setInstallPrompt(null);
        setShowInstallBanner(false);
        return true;
      } else {
        console.log('❌ Installation refusée par l\'utilisateur (SANS SW)');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'installation (SANS SW):', error);
      return false;
    }
  };

  const dismissBanner = () => {
    console.log('🙈 Banner PWA fermé (SANS SW)');
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