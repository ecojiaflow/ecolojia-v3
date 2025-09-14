// PATH: frontend/src/config/mock.config.ts
import { ENV } from "../env";

// Mock mode contrôlé par l'environnement
export const MOCK_MODE = false;

// Mock user pour le mode démo
export const MOCK_USER = {
  id: "demo-user",
  email: "demo@ecolojia.app",
  profile: {
    firstName: "Demo",
    lastName: "User"
  },
  plan: "premium" as const,
  subscription: { 
    tier: "premium" as const, 
    status: "active" as const 
  },
  quotas: {
    scansRemaining: 999999,
    aiChatsRemaining: 999999
  }
};

// Mock data pour les tests
export const MOCK_PRODUCTS = [
  {
    id: "mock-1",
    name: "Produit de test",
    barcode: "1234567890",
    scores: {
      healthScore: 85,
      environmentScore: 72
    }
  }
];

if (false) {
  console.warn("⚠️ ECOLOJIA en mode MOCK - Les données sont simulées");
}
