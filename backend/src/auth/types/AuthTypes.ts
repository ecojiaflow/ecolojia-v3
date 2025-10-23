// Ã€ REMPLACER dans backend/src/auth/types/AuthTypes.ts

// Interface Session complÃ¨te
export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;  // AjoutÃ©
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
}

// Interface User complÃ¨te
export interface User {
  id: string;
  email: string;
  password: string;
  passwordHash?: string;  // AjoutÃ© comme alias
  name: string;
  tier: 'free' | 'premium';
  isEmailVerified: boolean;
  emailVerified?: boolean;  // AjoutÃ© comme alias
  lastLoginAt?: Date;  // AjoutÃ©
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}
