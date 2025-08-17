// PATH: frontend/src/types/user.ts
export interface AIPreferences {
  tone?: 'concise' | 'detailed' | 'educational' | 'friendly';
  detailLevel?: 'minimal' | 'moderate' | 'comprehensive';
  language?: 'fr' | 'en' | 'es' | 'de';
  foodRestrictions?: string[];
  allergens?: string[];
  cosmeticPreferences?: {
    avoidIngredients?: string[];
    skinType?: 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive';
  };
  notificationPreferences?: {
    emailAlerts?: boolean;
    productRecalls?: boolean;
    weeklyDigest?: boolean;
  };
}

export interface UserPlan {
  code: 'free' | 'premium' | 'family';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  periodEnd?: string;
  customerId?: string;
  subscriptionId?: string;
}

export interface UserLimits {
  scansPerMonth: number;
  aiChatsPerMonth: number;
  exportPerMonth: number;
  favoritesMax: number;
}

export interface UserUsage {
  scans: string;
  aiChats: string;
  exports: string;
  favorites: string;
  lastReset: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface User {
  profile: UserProfile;
  plan: UserPlan;
  limits: UserLimits;
  usage: UserUsage;
  aiPreferences: AIPreferences;
}
