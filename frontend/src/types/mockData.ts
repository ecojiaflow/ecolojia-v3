// frontend/src/types/mockdata?.ts

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
    limit: number; // -1 = illimite
    resetDate: Date;
  };
  aiQuestions: {
    used: number;
    limit: number; // -1 = illimite
    resetDate: Date;
  };
  exports: {
    used: number;
    limit: number; // -1 = illimite
    resetDate: Date;
  };
  apiCalls: {
    used: number;
    limit: number; // -1 = illimite
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

// ===== DONNÃ†'Ãƒ' Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢'šÂ¬Ã¢'žÂ¢aaÃƒÂ¢Ã¢'šÂ¬Ã…Â¡Ãƒ'šÃ‚Â¬Ã¢â‚¬Å¡Ãƒ'šÃ‚Â°ES FACTICES =====
export const MOCK_ANALYSIS_HISTORY: MockAnalysisHistory[] = [
  {
    id: 'scan-1',
    productName: 'Coca-Cola Original',
    brand: 'Coca-Cola',
    category: 'food',
    healthScore: 15,
    scanDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y ? 2 jours
    keyFindings: ['NOVA 4 - Ultra-transforme', 'Riche en sucre', '7 additifs E-numbers']
  },
  {
    id: 'scan-2',
    productName: 'Quinoa Bio',
    brand: 'Alter Eco',
    category: 'food',
    healthScore: 92,
    scanDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hier
    keyFindings: ['NOVA 1 - Non transforme', 'Bio certifie', 'Source complete proteines']
  },
  {
    id: 'scan-3',
    productName: 'Creme Hydratante',
    brand: 'Weleda',
    category: 'cosmetics',
    healthScore: 78,
    scanDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // Il y ? 3h
    keyFindings: ['Certifie bio', 'Sans sulfates', '95% ingredients naturels']
  },
  {
    id: 'scan-4',
    productName: 'Lessive Ã†'Ãƒ' Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢'šÂ¬Ã¢'žÂ¢aaÃƒÂ¢Ã¢'šÂ¬Ã…Â¡Ãƒ'šÃ‚Â¬Ã¢â‚¬Å¡Ãƒ'šÃ‚Â°cologique',
    brand: 'Ecover',
    category: 'detergents',
    healthScore: 85,
    scanDate: new Date(Date.now() - 30 * 60 * 1000), // Il y ? 30min
    keyFindings: ['Ecolabel Europeen', 'Biodegradable 100%', 'Sans phosphates']
  },
  {
    id: 'scan-5',
    productName: 'Plat Prepare Micro-ondes',
    brand: 'Findus',
    category: 'food',
    healthScore: 28,
    scanDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y ? 5 jours
    keyFindings: ['NOVA 4 - Ultra-transforme', 'Riche en sel', '15 additifs detectes']
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
      aiQuestionsPerDay: 0, // Bloque en free
      aiQuestionsPerMonth: 0,
      exportsPerMonth: 0,
      apiCallsPerMonth: 0
    },
    premium: {
      scansPerMonth: -1, // Illimite
      aiQuestionsPerDay: -1, // Illimite
      aiQuestionsPerMonth: -1,
      exportsPerMonth: 10,
      apiCallsPerMonth: 1000
    }
  };

  const usageConfig = {
    free: {
      scansThisMonth: Math.floor(Math.random() * 15) + 5, // 5-20 dejÃ†'Ãƒ' Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢'šÂ¬Ã¢'žÂ¢Ã†'ÃƒÂ¢Ã¢'šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒ'šÃ‚Â  utilises
      aiQuestionsToday: 0,
      aiQuestionsThisMonth: 0,
      exportsThisMonth: 0,
      apiCallsThisMonth: 0
    },
    premium: {
      scansThisMonth: Math.floor(Math.random() * 50) + 20, // 20-70 dejÃ†'Ãƒ' Ã¢â‚¬â„¢Ã¢â‚¬Â ÃƒÂ¢Ã¢'šÂ¬Ã¢'žÂ¢Ã†'ÃƒÂ¢Ã¢'šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒ'šÃ‚Â  utilises
      aiQuestionsToday: Math.floor(Math.random() * 3) + 1, // 1-4 aujourd'hui
      aiQuestionsThisMonth: Math.floor(Math.random() * 25) + 10, // 10-35 ce mois
      exportsThisMonth: Math.floor(Math.random() * 3), // 0-3 ce mois
      apiCallsThisMonth: Math.floor(Math.random() * 200) + 50 // 50-250 ce mois
    }
  };

  const user: MockUser = {
    id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
    name: tier === 'premium' ? 'Utilisateur Demo Premium' : 'Utilisateur Demo',
    email: `demo-${tier}@ecoloji?.com`,
    tier,
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Cree il y ? 30 jours
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
    // Ajuster les dates pour qu'elles soient recentes
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




