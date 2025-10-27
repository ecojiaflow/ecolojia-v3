// PATH: frontend/src/services/quotaService.ts
import apiClient from './apiClient';

// Ajouter la définition de MOCK_MODE
const MOCK_MODE = false;

export interface Quota {
  scansRemaining: number;
  scansLimit: number;
  aiChatsRemaining: number;
  aiChatsLimit: number;
  exportsRemaining: number;
  exportsLimit: number;
  resetDate: string;
  tier: 'free' | 'premium';
  
  // Format alternatif pour compatibilité
  aiQuestions?: {
    dailyRemaining: number;
    monthlyRemaining: number;
    dailyLimit: number;
    monthlyLimit: number;
    nextReset: string;
  };
}

class QuotaService {
  private quotas: Quota = {
    scansRemaining: 30,
    scansLimit: 30,
    aiChatsRemaining: 5,
    aiChatsLimit: 5,
    exportsRemaining: 0,
    exportsLimit: 0,
    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    tier: 'free'
  };

  private quotaKey = 'ecolojia_quotas';
  private lastResetKey = 'ecolojia_last_reset';

  constructor() {
    this.loadQuotas();
    this.checkMonthlyReset();
  }

  /**
   * Charger les quotas depuis le localStorage ou l'API
   */
  private async loadQuotas() {
    if (MOCK_MODE) {
      // En mode mock, quotas illimités
      this.quotas = {
        scansRemaining: 999999,
        scansLimit: 999999,
        aiChatsRemaining: 999999,
        aiChatsLimit: 999999,
        exportsRemaining: 999999,
        exportsLimit: 999999,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tier: 'premium'
      };
      return;
    }

    // Charger depuis localStorage
    const savedQuotas = localStorage.getItem(this.quotaKey);
    if (savedQuotas) {
      try {
        this.quotas = JSON.parse(savedQuotas);
      } catch (error) {
        console.error('Erreur lors du chargement des quotas:', error);
      }
    }

    // Synchroniser avec l'API si connecté
    const token = localStorage.getItem('ecolojia_token');
    if (token) {
      try {
        const response = await apiClient.get('auth/profile');
        if (response.data) {
          // Extraire les quotas depuis la réponse user
          const user = response.data.user || response.data;
          if (user?.quotas) {
            this.quotas = { ...this.quotas, ...user.quotas };
          }
          this.saveQuotas();
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation des quotas:', error);
      }
    }
  }

  /**
   * Sauvegarder les quotas dans le localStorage
   */
  private saveQuotas() {
    localStorage.setItem(this.quotaKey, JSON.stringify(this.quotas));
  }

  /**
   * Vérifier si on doit réinitialiser les quotas mensuellement
   */
  private checkMonthlyReset() {
    const lastReset = localStorage.getItem(this.lastResetKey);
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + (now.getMonth() + 1);

    if (lastReset !== currentMonth) {
      this.resetQuotas();
      localStorage.setItem(this.lastResetKey, currentMonth);
    }
  }

  /**
   * Réinitialiser les quotas
   */
  private resetQuotas() {
    if (MOCK_MODE) return;

    const tier = this.quotas.tier;
    
    if (tier === 'free') {
      this.quotas.scansRemaining = 30;
      this.quotas.aiChatsRemaining = 5;
      this.quotas.exportsRemaining = 0;
    } else {
      this.quotas.scansRemaining = 999999;
      this.quotas.aiChatsRemaining = 500;
      this.quotas.exportsRemaining = 999999;
    }

    this.quotas.resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    this.saveQuotas();
  }

  /**
   * Obtenir les quotas actuels - MÉTHODE ATTENDUE PAR useQuota
   */
  async getQuotas(): Promise<Quota> {
    await this.loadQuotas();
    
    // Ajouter le format alternatif pour compatibilité
    return {
      ...this.quotas,
      aiQuestions: {
        dailyRemaining: this.quotas.aiChatsRemaining,
        monthlyRemaining: this.quotas.aiChatsRemaining,
        dailyLimit: this.quotas.aiChatsLimit,
        monthlyLimit: this.quotas.aiChatsLimit,
        nextReset: this.quotas.resetDate
      }
    };
  }

  /**
   * Vérifier si on peut scanner
   */
  canScan(): boolean {
    if (MOCK_MODE || this.quotas.tier === 'premium') return true;
    return this.quotas.scansRemaining > 0;
  }

  /**
   * Vérifier si on peut utiliser le chat IA
   */
  canUseAI(): boolean {
    if (MOCK_MODE || this.quotas.tier === 'premium') return true;
    return this.quotas.aiChatsRemaining > 0;
  }

  /**
   * Vérifier si on peut exporter
   */
  canExport(): boolean {
    if (MOCK_MODE || this.quotas.tier === 'premium') return true;
    return this.quotas.exportsRemaining > 0;
  }

  /**
   * MÉTHODE ATTENDUE PAR useQuota - consume générique
   */
  async consume(type: 'scan' | 'chat'): Promise<any> {
    if (type === 'scan') {
      return this.consumeScan();
    } else if (type === 'chat') {
      return this.consumeAIChat();
    }
    throw new Error(`Type de quota inconnu: ${type}`);
  }

  /**
   * Consommer un scan
   */
  async consumeScan() {
    if (MOCK_MODE || this.quotas.tier === 'premium') {
      return { success: true, quotas: this.quotas };
    }

    if (this.quotas.scansRemaining <= 0) {
      throw new Error('Quota de scans épuisé');
    }

    this.quotas.scansRemaining--;
    this.saveQuotas();

    // Synchroniser avec l'API si connecté
    const token = localStorage.getItem('ecolojia_token');
    if (token) {
      try {
        const response = await apiClient.post('quotas/consume', { type: 'scan' });
        return response.data;
      } catch (error: any) {
        // Si l'endpoint n'existe pas, continuer quand même
        if (error.response?.status === 404) {
          console.log('Endpoint quota/consume not found, continuing anyway');
          return { success: true, quotas: this.quotas };
        }
        console.warn('Quota endpoint not available'); return { success: true };
      }
    }

    return { success: true, quotas: this.quotas };
  }

  /**
   * Consommer un chat IA
   */
  async consumeAIChat() {
    if (MOCK_MODE || this.quotas.tier === 'premium') {
      return { success: true, quotas: this.quotas };
    }

    if (this.quotas.aiChatsRemaining <= 0) {
      throw new Error('Quota de chats IA épuisé');
    }

    this.quotas.aiChatsRemaining--;
    this.saveQuotas();

    // Synchroniser avec l'API si connecté
    const token = localStorage.getItem('ecolojia_token');
    if (token) {
      try {
        const response = await apiClient.post('quotas/consume', { type: 'ai_chat' });
        return response.data;
      } catch (error: any) {
        // Si l'endpoint n'existe pas, continuer quand même
        if (error.response?.status === 404) {
          console.log('Endpoint quota/consume not found, continuing anyway');
          return { success: true, quotas: this.quotas };
        }
        console.warn('Quota endpoint not available'); return { success: true };
      }
    }

    return { success: true, quotas: this.quotas };
  }

  /**
   * Consommer un export
   */
  async consumeExport() {
    if (MOCK_MODE || this.quotas.tier === 'premium') return true;

    if (this.quotas.exportsRemaining <= 0) {
      throw new Error('Quota d\'exports épuisé');
    }

    this.quotas.exportsRemaining--;
    this.saveQuotas();

    // Synchroniser avec l'API si connecté
    const token = localStorage.getItem('ecolojia_token');
    if (token) {
      try {
        await apiClient.post('quotas/consume', { type: 'export' });
      } catch (error) {
        console.error('Erreur lors de la consommation du quota:', error);
      }
    }

    return true;
  }

  /**
   * Mettre à jour le tier de l'utilisateur
   */
  updateTier(tier: 'free' | 'premium') {
    this.quotas.tier = tier;
    
    if (tier === 'premium') {
      this.quotas.scansLimit = 999999;
      this.quotas.scansRemaining = 999999;
      this.quotas.aiChatsLimit = 500;
      this.quotas.aiChatsRemaining = 500;
      this.quotas.exportsLimit = 999999;
      this.quotas.exportsRemaining = 999999;
    } else {
      this.quotas.scansLimit = 30;
      this.quotas.scansRemaining = Math.min(this.quotas.scansRemaining, 30);
      this.quotas.aiChatsLimit = 5;
      this.quotas.aiChatsRemaining = Math.min(this.quotas.aiChatsRemaining, 5);
      this.quotas.exportsLimit = 0;
      this.quotas.exportsRemaining = 0;
    }
    
    this.saveQuotas();
  }

  /**
   * Obtenir le pourcentage d'utilisation d'un quota
   */
  getUsagePercentage(type: 'scans' | 'ai' | 'exports'): number {
    switch (type) {
      case 'scans':
        return ((this.quotas.scansLimit - this.quotas.scansRemaining) / this.quotas.scansLimit) * 100;
      case 'ai':
        return ((this.quotas.aiChatsLimit - this.quotas.aiChatsRemaining) / this.quotas.aiChatsLimit) * 100;
      case 'exports':
        return this.quotas.exportsLimit > 0 
          ? ((this.quotas.exportsLimit - this.quotas.exportsRemaining) / this.quotas.exportsLimit) * 100
          : 0;
      default:
        return 0;
    }
  }

  /**
   * Obtenir le texte d'affichage des quotas
   */
  getQuotaDisplay(type: 'scans' | 'ai' | 'exports'): string {
    if (MOCK_MODE || this.quotas.tier === 'premium') {
      return 'Illimité';
    }

    switch (type) {
      case 'scans':
        return `${this.quotas.scansRemaining}/${this.quotas.scansLimit}`;
      case 'ai':
        return `${this.quotas.aiChatsRemaining}/${this.quotas.aiChatsLimit}`;
      case 'exports':
        return `${this.quotas.exportsRemaining}/${this.quotas.exportsLimit}`;
      default:
        return '0/0';
    }
  }

  /**
   * Obtenir le nombre de jours avant reset
   */
  getDaysUntilReset(): number {
    const resetDate = new Date(this.quotas.resetDate);
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * MÉTHODE ATTENDUE PAR useQuota - vérifier si on peut utiliser une fonctionnalité
   */
  async canUse(type: 'scan' | 'chat'): Promise<boolean> {
    if (type === 'scan') {
      return this.canScan();
    } else if (type === 'chat') {
      return this.canUseAI();
    }
    return true;
  }
}

export default new QuotaService();
