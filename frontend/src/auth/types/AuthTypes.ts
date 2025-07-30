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
  lastLoginAt?: Date;
  
  // Abonnement (si Premium)
  subscription?: {
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
  
  // Préférences utilisateur
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
    language: string;
    theme: 'light' | 'dark' | 'auto';
    allergies?: string[];
    dietaryRestrictions?: string[];
    healthGoals?: string[];
  };
  
  // Métadonnées
  metadata?: {
    lastAnalysisDate?: Date;
    totalAnalysesCount: number;
    averageHealthScore?: number;
    streakDays: number;
  };
}

// ===== INTERFACES AUTHENTIFICATION =====
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptNewsletter?: boolean;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  preferences?: Partial<User['preferences']>;
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
  // ===== ÉTAT DE BASE =====
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // ===== ÉTAT MODE DÉMO =====
  isDemoMode: boolean;
  
  // ===== ACTIONS AUTHENTIFICATION =====
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  
  // Actions auth avancées (optionnelles)
  resetPassword?: (email: string) => Promise<void>;
  confirmPasswordReset?: (token: string, newPassword: string) => Promise<void>;
  changePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile?: (data: UpdateProfileRequest) => Promise<void>;
  deleteAccount?: () => Promise<void>;
  
  // ===== ACTIONS MODE DÉMO =====
  startDemoSession: (tier: 'free' | 'premium') => Promise<void>;
  
  // Actions démo avancées (optionnelles)
  simulateScan?: (category: 'food' | 'cosmetics' | 'detergents') => boolean;
  simulateAIQuestion?: () => boolean;
  getDemoHistory?: () => any[];
  getDemoStats?: () => any;
  switchDemoTier?: (tier: 'free' | 'premium') => void;
  
  // ===== UTILITAIRES PERMISSIONS =====
  hasPermission: (permission: string) => boolean;
  isFreeTier: () => boolean;
  isPremiumTier: () => boolean;
  
  // ===== UTILITAIRES QUOTAS =====
  getRemainingQuota: (type: 'scans' | 'aiQuestions' | 'exports' | 'apiCalls') => number;
  canPerformAction: (action: 'scan' | 'aiQuestion' | 'export' | 'apiCall') => boolean;
  
  // Gestion quotas avancée (optionnelles)
  incrementUsage?: (type: 'scans' | 'aiQuestions' | 'exports' | 'apiCalls') => Promise<void>;
  getQuotaStatus?: () => QuotaStatus;
  
  // ===== UTILITAIRES DEBUG =====
  debugAuth: () => void;
  getAuthState: () => AuthDebugState;
}

// ===== TYPES D'ERREURS =====
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string) {
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
    scansPerMonth: -1, // Illimité
    aiQuestionsPerDay: -1, // Illimité
    aiQuestionsPerMonth: -1, // Illimité
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