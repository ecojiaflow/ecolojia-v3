// frontend/src/types/mockData.ts

// ===== INTERFACES DE BASE =====
export interface MockUser {
  id: string;
  name: string;
  email: string;
  tier: 'free' | 'premium';
  createdAt: Date;
  lastLoginAt: Date;
  subscription?: {
    id: string;
    status: 'active' | 'canceled';
    currentPeriodEnd: Date;
  };
  quotas: {
    scansPerMonth: number;
    aiQuestionsPerDay: number;
    aiQuestionsPerMonth: number;
    exportsPerMonth: number;
    apiCallsPerMonth: number;
  };
  currentUsage: {
    scansThisMonth: number;
    aiQuestionsToday: number;
    aiQuestionsThisMonth: number;
    exportsThisMonth: number;
    apiCallsThisMonth: number;
  };
  stats: {
    totalScans: number;
    analysesThisMonth: number;
    averageHealthScore: number;
    streak: number;
  };
}

export interface MockQuotas {
  scans: {
    used: number;
    limit: number; // -1 = illimité
    resetDate: Date;
  };
  aiQuestions: {
    used: number;
    limit: number; // -1 = illimité
    resetDate: Date;
  };
  exports: {
    used: number;
    limit: number; // -1 = illimité
    resetDate: Date;
  };
  apiCalls: {
    used: number;
    limit: number; // -1 = illimité
    resetDate: Date;
  };
}

export interface MockAnalysisHistory {
  id: string;
  productName: string;
  brand: string;
  category: 'food' | 'cosmetics' | 'detergents';
  healthScore: number;
  scanDate: Date;
  keyFindings: string[];
}

// ===== CONFIGURATION =====
export const DEMO_CONFIG = {
  STORAGE_KEY: 'ecolojia_demo_user',
  TOKEN_KEY: 'ecolojia_demo_token',
  MODE_KEY: 'ecolojia_demo_mode',
  HISTORY_KEY: 'ecolojia_demo_history',
  SESSION_DURATION_HOURS: 24
};

// ===== DONNÉES FACTICES =====
export const MOCK_ANALYSIS_HISTORY: MockAnalysisHistory[] = [
  {
    id: 'scan-1',
    productName: 'Coca-Cola Original',
    brand: 'Coca-Cola',
    category: 'food',
    healthScore: 15,
    scanDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
    keyFindings: ['NOVA 4 - Ultra-transformé', 'Riche en sucre', '7 additifs E-numbers']
  },
  {
    id: 'scan-2',
    productName: 'Quinoa Bio',
    brand: 'Alter Eco',
    category: 'food',
    healthScore: 92,
    scanDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hier
    keyFindings: ['NOVA 1 - Non transformé', 'Bio certifié', 'Source complète protéines']
  },
  {
    id: 'scan-3',
    productName: 'Crème Hydratante',
    brand: 'Weleda',
    category: 'cosmetics',
    healthScore: 78,
    scanDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // Il y a 3h
    keyFindings: ['Certifié bio', 'Sans sulfates', '95% ingrédients naturels']
  },
  {
    id: 'scan-4',
    productName: 'Lessive Écologique',
    brand: 'Ecover',
    category: 'detergents',
    healthScore: 85,
    scanDate: new Date(Date.now() - 30 * 60 * 1000), // Il y a 30min
    keyFindings: ['Ecolabel Européen', 'Biodégradable 100%', 'Sans phosphates']
  },
  {
    id: 'scan-5',
    productName: 'Plat Préparé Micro-ondes',
    brand: 'Findus',
    category: 'food',
    healthScore: 28,
    scanDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
    keyFindings: ['NOVA 4 - Ultra-transformé', 'Riche en sel', '15 additifs détectés']
  }
];

// ===== FONCTIONS UTILITAIRES =====
export const createDemoSession = (tier: 'free' | 'premium' = 'premium') => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DEMO_CONFIG.SESSION_DURATION_HOURS * 60 * 60 * 1000);
  
  // Configuration quotas selon tier
  const quotaConfig = {
    free: {
      scansPerMonth: 25,
      aiQuestionsPerDay: 0, // Bloqué en free
      aiQuestionsPerMonth: 0,
      exportsPerMonth: 0,
      apiCallsPerMonth: 0
    },
    premium: {
      scansPerMonth: -1, // Illimité
      aiQuestionsPerDay: -1, // Illimité
      aiQuestionsPerMonth: -1,
      exportsPerMonth: 10,
      apiCallsPerMonth: 1000
    }
  };

  const usageConfig = {
    free: {
      scansThisMonth: Math.floor(Math.random() * 15) + 5, // 5-20 déjà utilisés
      aiQuestionsToday: 0,
      aiQuestionsThisMonth: 0,
      exportsThisMonth: 0,
      apiCallsThisMonth: 0
    },
    premium: {
      scansThisMonth: Math.floor(Math.random() * 50) + 20, // 20-70 déjà utilisés
      aiQuestionsToday: Math.floor(Math.random() * 3) + 1, // 1-4 aujourd'hui
      aiQuestionsThisMonth: Math.floor(Math.random() * 25) + 10, // 10-35 ce mois
      exportsThisMonth: Math.floor(Math.random() * 3), // 0-3 ce mois
      apiCallsThisMonth: Math.floor(Math.random() * 200) + 50 // 50-250 ce mois
    }
  };

  const user: MockUser = {
    id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
    name: tier === 'premium' ? 'Utilisateur Démo Premium' : 'Utilisateur Démo',
    email: `demo-${tier}@ecolojia.com`,
    tier,
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Créé il y a 30 jours
    lastLoginAt: now,
    subscription: tier === 'premium' ? {
      id: 'demo-sub-' + Math.random().toString(36).substr(2, 9),
      status: 'active',
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Expire dans 30 jours
    } : undefined,
    quotas: quotaConfig[tier],
    currentUsage: usageConfig[tier],
    stats: {
      totalScans: Math.floor(Math.random() * 100) + 50, // 50-150 scans total
      analysesThisMonth: usageConfig[tier].scansThisMonth,
      averageHealthScore: Math.floor(Math.random() * 30) + 55, // Score moyen 55-85
      streak: Math.floor(Math.random() * 14) + 1 // Streak 1-15 jours
    }
  };

  const quotas: MockQuotas = {
    scans: {
      used: usageConfig[tier].scansThisMonth,
      limit: quotaConfig[tier].scansPerMonth,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1) // Premier du mois prochain
    },
    aiQuestions: {
      used: usageConfig[tier].aiQuestionsThisMonth,
      limit: quotaConfig[tier].aiQuestionsPerMonth,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
    },
    exports: {
      used: usageConfig[tier].exportsThisMonth,
      limit: quotaConfig[tier].exportsPerMonth,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
    },
    apiCalls: {
      used: usageConfig[tier].apiCallsThisMonth,
      limit: quotaConfig[tier].apiCallsPerMonth,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }
  };

  const history = MOCK_ANALYSIS_HISTORY.map(item => ({
    ...item,
    // Ajuster les dates pour qu'elles soient récentes
    scanDate: new Date(item.scanDate.getTime())
  }));

  return {
    user,
    quotas,
    history,
    token: `demo-token-${tier}-${Math.random().toString(36).substr(2, 9)}`,
    isDemo: true as const,
    expiresAt
  };
};