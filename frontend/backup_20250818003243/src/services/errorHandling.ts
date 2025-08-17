// frontend/src/services/errorHandling.ts
// Service centralise de gestion des erreurs

import { toast } from '@/components/ui/use-toast';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userFriendlyMessage: string;
}

export interface ApiError {
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };
  message?: string;
  statusCode?: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Traite une erreur et retourne un message utilisateur
   */
  handleError(error: any, context?: string): AppError {
    console.error(`[ErrorHandler] ${context || 'Error'}:`, error);
    
    const appError = this.normalizeError(error, context);
    this.errorLog.push(appError);
    
    // Afficher un toast pour l'utilisateur
    this.showUserNotification(appError);
    
    return appError;
  }

  /**
   * Normalise differents types d'erreurs
   */
  private normalizeError(error: any, context?: string): AppError {
    const timestamp = new Date().toISOString();
    
    // Erreur API avec structure standard
    if (error.response?.data?.error) {
      const apiError = error.response.dat?.error;
      return {
        code: apiError.code || 'API_ERROR',
        message: apiError.message || 'Erreur serveur',
        details: apiError.details,
        timestamp,
        userFriendlyMessage: this.getUserFriendlyMessage(apiError.code, apiError.message)
      };
    }
    
    // Erreur reseau
    if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Erreur de connexion reseau',
        timestamp,
        userFriendlyMessage: 'Impossible de se connecter au serveur. Verifiez votre connexion internet.'
      };
    }
    
    // Erreur de timeout
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'Delai d\'attente depasse',
        timestamp,
        userFriendlyMessage: 'La requete ? pris trop de temps. Veuillez reessayer.'
      };
    }
    
    // Erreur 429 - Rate limit
    if (error.response?.status === 429) {
      return {
        code: 'RATE_LIMIT',
        message: 'Trop de requetes',
        timestamp,
        userFriendlyMessage: 'Vous avez effectue trop de requetes. Veuillez patienter quelques instants.'
      };
    }
    
    // Erreur 401 - Non authentifie
    if (error.response?.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Non authentifie',
        timestamp,
        userFriendlyMessage: 'Votre session ? expire. Veuillez vous reconnecter.'
      };
    }
    
    // Erreur 403 - Acces refuse
    if (error.response?.status === 403) {
      return {
        code: 'FORBIDDEN',
        message: 'Acces refuse',
        timestamp,
        userFriendlyMessage: 'Vous n\'avez pas les permissions necessaires pour cette action.'
      };
    }
    
    // Erreur de validation
    if (error.response?.status === 400) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.response?.data?.message || 'Donnees invalides',
        timestamp,
        userFriendlyMessage: 'Les donnees fournies sont invalides. Verifiez votre saisie.'
      };
    }
    
    // Erreur generique
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Erreur inconnue',
      details: { context, originalError: error },
      timestamp,
      userFriendlyMessage: 'Une erreur inattendue s\'est produite. Veuillez reessayer.'
    };
  }

  /**
   * Genere un message utilisateur selon le code d'erreur
   */
  private getUserFriendlyMessage(code?: string, defaultMessage?: string): string {
    const messages: Record<string, string> = {
      // Erreurs d'analyse
      'MISSING_INGREDIENTS': 'Les ingredients sont requis pour analyser ce produit.',
      'INVALID_CATEGORY': 'La categorie de produit selectionnee n\'est pas valide.',
      'ANALYSIS_ERROR': 'Impossible d\'analyser ce produit. Verifiez les informations saisies.',
      'INVALID_BARCODE': 'Le code-barres n\'est pas valide.',
      'PRODUCT_NOT_FOUND': 'Produit introuvable dans notre base de donnees.',
      
      // Erreurs de quota
      'QUOTA_EXCEEDED': 'Vous avez atteint votre limite de scans pour ce mois.',
      'AI_QUOTA_EXCEEDED': 'Vous avez atteint votre limite de questions Â  l\'I?.',
      
      // Erreurs d'authentification
      'INVALID_CREDENTIALS': 'Email ou mot de passe incorrect.',
      'EMAIL_ALREADY_EXISTS': 'Un compte existe dejÂ  avec cet email.',
      'WEAK_PASSWORD': 'Le mot de passe doit contenir au moins 8 caracteres.',
      'INVALID_TOKEN': 'Votre session ? expire. Veuillez vous reconnecter.',
      
      // Erreurs de paiement
      'PAYMENT_FAILED': 'Le paiement ? echoue. Verifiez vos informations bancaires.',
      'SUBSCRIPTION_EXPIRED': 'Votre abonnement ? expire. Renouvelez-le pour continuer.',
      
      // Erreurs de vision/OCR
      'IMAGE_TOO_LARGE': 'L\'image est trop volumineuse. Maximum 5MB.',
      'IMAGE_PROCESSING_ERROR': 'Impossible de traiter cette image. Essayez avec une photo plus nette.',
      'OCR_FAILED': 'Impossible de lire le texte sur l\'image. Prenez une photo plus claire.',
      
      // Erreurs systeme
      'SERVICE_UNAVAILABLE': 'Le service est temporairement indisponible. Reessayez dans quelques instants.',
      'MAINTENANCE_MODE': 'Application en maintenance. Revenez dans quelques minutes.'
    };
    
    return messages[code || ''] || defaultMessage || 'Une erreur s\'est produite.';
  }

  /**
   * Affiche une notification Â  l'utilisateur
   */
  private showUserNotification(error: AppError) {
    const variant = this.getToastVariant(error.code);
    
    toast({
      title: this.getToastTitle(error.code),
      description: error.userFriendlyMessage,
      variant,
      duration: variant === 'destructive' ? 5000 : 3000
    });
  }

  /**
   * Determine le type de toast selon l'erreur
   */
  private getToastVariant(code: string): 'default' | 'destructive' {
    const destructiveCodes = [
      'UNAUTHORIZED',
      'FORBIDDEN',
      'PAYMENT_FAILED',
      'SUBSCRIPTION_EXPIRED',
      'SERVICE_UNAVAILABLE'
    ];
    
    return destructiveCodes.includes(code) ? 'destructive' : 'default';
  }

  /**
   * Genere un titre pour le toast
   */
  private getToastTitle(code: string): string {
    const titles: Record<string, string> = {
      'NETWORK_ERROR': 'Erreur de connexion',
      'VALIDATION_ERROR': 'Donnees invalides',
      'UNAUTHORIZED': 'Session expiree',
      'FORBIDDEN': 'Acces refuse',
      'QUOTA_EXCEEDED': 'Limite atteinte',
      'PAYMENT_FAILED': 'â€°chec du paiement',
      'SERVICE_UNAVAILABLE': 'Service indisponible'
    };
    
    return titles[code] || 'Erreur';
  }

  /**
   * Recupere les dernieres erreurs (pour debug)
   */
  getErrorLog(limit: number = 10): AppError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Nettoie le log d'erreurs
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Wrapper pour les appels async avec gestion d'erreur
   */
  async wrapAsync<T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<{ data?: T; error?: AppError }> {
    try {
      const data = await asyncFn();
      return { data };
    } catch (err) {
      const error = this.handleError(err, context);
      return { error };
    }
  }
}

// Export de l'instance singleton
export const errorHandler = ErrorHandler.getInstance();

// Hook React pour utiliser le gestionnaire d'erreurs
export function useErrorHandler() {
  return {
    handleError: (error: any, context?: string) => errorHandler.handleError(error, context),
    wrapAsync: <T>(asyncFn: () => Promise<T>, context?: string) => 
      errorHandler.wrapAsync(asyncFn, context),
    getErrorLog: () => errorHandler.getErrorLog()
  };
}
