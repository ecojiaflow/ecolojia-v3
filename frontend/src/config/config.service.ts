// PATH: frontend/src/config/config.service.ts
// Service de configuration pour basculer entre Demo et Production

import { authService } from '../services/authService';

export const ConfigService = {
  // Vérifier si on est en mode démo
  isDemoMode(): boolean {
    // Mode démo si :
    // 1. Variable d'environnement activée
    // 2. Pas de token d'authentification
    // 3. Forcé par l'utilisateur
    
    if (import.meta.env.VITE_FORCE_DEMO === 'true') {
      return true;
    }
    
    if (import.meta.env.VITE_API_URL?.includes('localhost') && !authService.isAuthenticated()) {
      return true;
    }
    
    return localStorage.getItem('demoMode') === 'true';
  },

  // Activer/désactiver le mode démo
  setDemoMode(enabled: boolean): void {
    if (enabled) {
      localStorage.setItem('demoMode', 'true');
      // Déconnecter l'utilisateur si connecté
      if (authService.isAuthenticated()) {
        authService.logout();
      }
    } else {
      localStorage.removeItem('demoMode');
    }
    
    // Recharger la page pour appliquer les changements
    window.location.reload();
  },

  // Obtenir l'URL de l'API
  getApiUrl(): string {
    if (this.isDemoMode()) {
      return 'demo://'; // URL factice pour le mode démo
    }
    
    return import.meta.env.VITE_API_URL || 'http://localhost:5001';
  },

  // Vérifier si une fonctionnalité est disponible
  isFeatureEnabled(feature: string): boolean {
    const features = {
      'export': !this.isDemoMode() && authService.getUserPlan() === 'premium',
      'unlimited_scans': !this.isDemoMode() && authService.getUserPlan() === 'premium',
      'ai_chat': !this.isDemoMode() && authService.getUserPlan() === 'premium',
      'alternatives': true, // Disponible pour tous
      'basic_analysis': true, // Disponible pour tous
    };
    
    return features[feature] || false;
  },

  // Message pour les fonctionnalités non disponibles
  getFeatureMessage(feature: string): string {
    if (this.isDemoMode()) {
      return 'Cette fonctionnalité n\'est pas disponible en mode démo. Connectez-vous pour y accéder.';
    }
    
    if (!authService.isAuthenticated()) {
      return 'Veuillez vous connecter pour accéder à cette fonctionnalité.';
    }
    
    return 'Cette fonctionnalité est réservée aux utilisateurs Premium.';
  }
};

// Exemple d'utilisation dans analysisService.js :
/*
import { ConfigService } from '../config/config.service';
import { demoMode } from './demoMode';
import { apiClient } from './apiClient';

export const analysisService = {
  analyzeByBarcode: async (barcode) => {
    if (ConfigService.isDemoMode()) {
      return demoMode.analyzeBarcode(barcode);
    }
    
    return apiClient.post('/api/analysis/barcode', { barcode });
  }
};
*/