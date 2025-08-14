// PATH: src/services/configService.ts
type AppMode = 'production' | 'demo';

class ConfigService {
  private static mode: AppMode =
    (import.meta as any)?.env?.VITE_APP_MODE === 'demo' ? 'demo' : 'production';

  // Forcer production par défaut (pas de bascule implicite en demo)
  static getMode(): AppMode {
    return this.mode;
  }

  static isDemo(): boolean {
    return this.getMode() === 'demo';
  }

  // Autoriser le setMode uniquement si explicitement demandé
  static setMode(newMode: AppMode) {
    if (newMode === 'demo' || newMode === 'production') {
      this.mode = newMode;
      if (typeof window !== 'undefined' && (window as any).console) {
        console.log('[ConfigService] App mode:', this.mode);
      }
    }
  }
}

export default ConfigService;