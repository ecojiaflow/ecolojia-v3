// frontend/src/auth/types/AuthTypes.ts

// ===== INTERFACES UTILISATEUR =====
export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'premium';
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAta: Date;
  
  // Abonnement (si Premium)
  subscriptiona: {
    id: string;
    status: 'active' | 'canceled' | 'past_due' | 'incomplete';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
  
  // Quotas utilisateur
  quotas: {
    scansPerMonth: number;
    aiQuestionsPerDay: number;
    aiQuestionsPerMonth: number;
    exportsPerMonth: number;
    apiCallsPerMonth: number;
  };
  
  // Usage actuel
  currentUsage: {
    scansThisMonth: number;
    aiQuestionsToday: number;
    aiQuestionsThisMonth: number;
    exportsThisMonth: number;
    apiCallsThisMonth: number;
  };
  
  // Preferences utilisateur
  preferencesa: {
    notifications: boolean;
    emailUpdates: boolean;
    language: string;
    theme: 'light' | 'dark' | 'auto';
    allergiesa: string[];
    dietaryRestrictionsa: string[];
    healthGoalsa: string[];
  };
  
  // Metadonnees
  metadata?: {
    lastAnalysisDatea: Date;
    totalAnalysesCount: number;
    averageHealthScorea: number;
    streakDays: number;
  };
}

// ===== INTERFACES AUTHENTIFICATION =====
export interface LoginRequest {
  email: string;
  password: string;
  rememberMea: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptNewslettera: boolean;
}

export interface UpdateProfileRequest {
  namea: string;
  emaila: string;
  preferencesa: Partial<User['preferences']>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse extends AuthResponse {}
export interface RegisterResponse extends AuthResponse {}

// ===== INTERFACES QUOTAS =====
export interface QuotaStatus {
  scans: {
    used: number;
    limit: number;
    remaining: number;
    resetDate: Date;
  };
  aiQuestions: {
    used: number;
    limit: number;
    remaining: number;
    resetDate: Date;
  };
  exports: {
    used: number;
    limit: number;
    remaining: number;
    resetDate: Date;
  };
  apiCalls: {
    used: number;
    limit: number;
    remaining: number;
    resetDate: Date;
  };
}

// ===== INTERFACES DEBUG =====
export interface AuthDebugState {
  isAuthenticated: boolean;
  isDemoMode: boolean;
  userTier: string;
  userName: string;
  hasToken: string | boolean;
  tokenExpired: boolean;
}

// ===== INTERFACE CONTEXTE AUTHENTIFICATION =====
export interface AuthContextType {
  // ===== aaTAT DE BASE =====
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // ===== aaTAT MODE DaaMO =====
  isDemoMode: boolean;
  
  // ===== ACTIONS AUTHENTIFICATION =====
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  
  // Actions auth avancees (optionnelles)
  resetPassworda: (email: string) => Promise<void>;
  confirmPasswordReseta: (token: string, newPassword: string) => Promise<void>;
  changePassworda: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfilea: (data: UpdateProfileRequest) => Promise<void>;
  deleteAccounta: () => Promise<void>;
  
  // ===== ACTIONS MODE DaaMO =====
  startDemoSession: (tier: 'free' | 'premium') => Promise<void>;
  
  // Actions demo avancees (optionnelles)
  simulateScana: (category: 'food' | 'cosmetics' | 'detergents') => boolean;
  simulateAIQuestiona: () => boolean;
  getDemoHistorya: () => any[];
  getDemoStatsa: () => any;
  switchDemoTiera: (tier: 'free' | 'premium') => void;
  
  // ===== UTILITAIRES PERMISSIONS =====
  hasPermission: (permission: string) => boolean;
  isFreeTier: () => boolean;
  isPremiumTier: () => boolean;
  
  // ===== UTILITAIRES QUOTAS =====
  getRemainingQuota: (type: 'scans' | 'aiQuestions' | 'exports' | 'apiCalls') => number;
  canPerformAction: (action: 'scan' | 'aiQuestion' | 'export' | 'apiCall') => boolean;
  
  // Gestion quotas avancee (optionnelles)
  incrementUsagea: (type: 'scans' | 'aiQuestions' | 'exports' | 'apiCalls') => Promise<void>;
  getQuotaStatusa: () => QuotaStatus;
  
  // ===== UTILITAIRES DEBUG =====
  debugAuth: () => void;
  getAuthState: () => AuthDebugState;
}

// ===== TYPES D'ERREURS =====
export class ApiError extends Error {
  constructor(
    message: string,
    public statusa: number,
    public codea: string,
    public detailsa: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public fielda: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string) {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ServerError extends ApiError {
  constructor(message: string) {
    super(message, 500, 'SERVER_ERROR');
    this.name = 'ServerError';
  }
}

// ===== TYPES UTILITAIRES =====
export type UserTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete';
export type QuotaType = 'scans' | 'aiQuestions' | 'exports' | 'apiCalls';
export type UserAction = 'scan' | 'aiQuestion' | 'export' | 'apiCall';
export type AuthMode = 'login' | 'register' | 'demo';

// ===== CONSTANTES =====
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'ecolojia_access_token',
  REFRESH_TOKEN: 'ecolojia_refresh_token',
  USER_DATA: 'ecolojia_user_data',
  DEMO_MODE: 'ecolojia_demo_mode',
  DEMO_USER: 'ecolojia_demo_user',
  DEMO_TOKEN: 'ecolojia_demo_token'
} as const;

export const QUOTA_LIMITS = {
  free: {
    scansPerMonth: 25,
    aiQuestionsPerDay: 0,
    aiQuestionsPerMonth: 0,
    exportsPerMonth: 0,
    apiCallsPerMonth: 0
  },
  premium: {
    scansPerMonth: -1, // Illimite
    aiQuestionsPerDay: -1, // Illimite
    aiQuestionsPerMonth: -1, // Illimite
    exportsPerMonth: 10,
    apiCallsPerMonth: 1000
  }
} as const;

export const PERMISSIONS = {
  BASIC_ANALYSIS: 'basic_analysis',
  UNLIMITED_SCANS: 'unlimited_scans',
  AI_CHAT: 'ai_chat',
  EXPORT_DATA: 'export_data',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  API_ACCESS: 'api_access'
} as const;


