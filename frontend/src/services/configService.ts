// PATH: src/services/configService.ts
type AppMode = 'production' | 'demo';

class ConfigService {
  private static mode: AppMode = "production";

  // Forcer production par dƒÂ©faut (pas de bascule implicite en demo)
  static getMode(): AppMode {
    return this.mode;
  }

  static isDemo(): boolean {
    return this.getMode() === 'demo';
  }

  // Autoriser le setMode uniquement si explicitement demandƒÂ©
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
