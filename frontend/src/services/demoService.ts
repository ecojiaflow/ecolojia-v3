// PATH: frontend/src/services/demoService.ts

interface DemoUser {
  _id: string;
  email: string;
  name: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
  tier: 'free' | 'premium';
  emailVerified: boolean;
}

interface DemoSession {
  user: DemoUser;
  token: string;
  quotas: {
    scans: { limit: number; used: number };
    aiQuestions: { limit: number; used: number };
    exports: { limit: number; used: number };
    apiCalls: { limit: number; used: number };
  };
}

class DemoService {
  private currentSession: DemoSession | null = null;

  isDemoActive(): boolean {
    const demoMode = localStorage.getItem('ecolojia_demo_mode');
    return demoMode === 'true';
  }

  startDemoSession(tier: 'free' | 'premium' = 'premium'): DemoSession {
    const demoUser: DemoUser = {
      _id: `demo-${tier}-${Date.now()}`,
      email: `demo-${tier}@ecolojia.app`,
      name: `Utilisateur Démo ${tier === 'premium' ? 'Premium' : 'Gratuit'}`,
      profile: {
        firstName: 'Demo',
        lastName: tier === 'premium' ? 'Premium' : 'Free'
      },
      tier: tier,
      emailVerified: true
    };

    const quotas = tier === 'premium' ? {
      scans: { limit: -1, used: 0 }, // -1 = illimité
      aiQuestions: { limit: -1, used: 0 },
      exports: { limit: 10, used: 0 },
      apiCalls: { limit: 1000, used: 0 }
    } : {
      scans: { limit: 30, used: 0 },
      aiQuestions: { limit: 5, used: 0 },
      exports: { limit: 0, used: 0 },
      apiCalls: { limit: 0, used: 0 }
    };

    this.currentSession = {
      user: demoUser,
      token: `demo-token-${Date.now()}`,
      quotas
    };

    // Sauvegarder en localStorage
    localStorage.setItem('ecolojia_demo_mode', 'true');
    localStorage.setItem('ecolojia_demo_user', JSON.stringify(demoUser));
    localStorage.setItem('ecolojia_demo_token', this.currentSession.token);

    return this.currentSession;
  }

  getCurrentSession(): DemoSession | null {
    if (!this.isDemoActive()) return null;

    if (!this.currentSession) {
      // Récupérer depuis localStorage
      const demoUserStr = localStorage.getItem('ecolojia_demo_user');
      const demoToken = localStorage.getItem('ecolojia_demo_token');

      if (demoUserStr && demoToken) {
        try {
          const demoUser = JSON.parse(demoUserStr);
          this.currentSession = {
            user: demoUser,
            token: demoToken,
            quotas: demoUser.tier === 'premium' ? {
              scans: { limit: -1, used: 0 },
              aiQuestions: { limit: -1, used: 0 },
              exports: { limit: 10, used: 0 },
              apiCalls: { limit: 1000, used: 0 }
            } : {
              scans: { limit: 30, used: 0 },
              aiQuestions: { limit: 5, used: 0 },
              exports: { limit: 0, used: 0 },
              apiCalls: { limit: 0, used: 0 }
            }
          };
        } catch (error) {
          console.error('Erreur parsing demo user:', error);
          this.endDemoSession();
          return null;
        }
      }
    }

    return this.currentSession;
  }

  endDemoSession(): void {
    this.currentSession = null;
    localStorage.removeItem('ecolojia_demo_mode');
    localStorage.removeItem('ecolojia_demo_user');
    localStorage.removeItem('ecolojia_demo_token');
    localStorage.removeItem('ecolojia_demo_history');
  }

  updateQuota(type: 'scans' | 'aiQuestions' | 'exports' | 'apiCalls', increment: number = 1): boolean {
    if (!this.currentSession) return false;

    const quota = this.currentSession.quotas[type];
    if (quota.limit !== -1 && quota.used + increment > quota.limit) {
      return false; // Quota dépassé
    }

    quota.used += increment;
    return true;
  }
}

export const demoService = new DemoService();