// PATH: backend/src/auth/utils/jwt.ts
import jwt, { SignOptions } from 'jsonwebtoken';

/** Charge la clÃ© et la durÃ©e depuis .env */
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  userId: string;
  email: string;
  tier?: 'free' | 'premium' | string;
}

/** Signe un token avec les rÃ©glages maison */
export function signToken(
  payload: JwtPayload,
  options?: SignOptions
): string {
  // Fix TypeScript: cast explicite ou utilisation directe
  const finalOptions: SignOptions = options || {};
  
  // Si pas d'expiresIn dans les options, on l'ajoute
  if (!finalOptions.expiresIn) {
    finalOptions.expiresIn = JWT_EXPIRES_IN as any; // Cast nÃ©cessaire pour TypeScript
  }
  
  return jwt.sign(payload, JWT_SECRET, finalOptions);
}

/** VÃ©rifie et retourne le payload (lÃ¨ve en cas d'Ã©chec) */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/** DÃ©codage sans vÃ©rification â€“ strictement pour debugging */
export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null;
}
