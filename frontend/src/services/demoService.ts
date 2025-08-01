import { User } from '../auth/types/AuthTypes';

interface DemoSession {
  user: User;
  token: string;
  quotas: {
    scans: { used: number; limit: number };
    aiQuestions: { used: number; limit: number };
    exports: { used: number; limit: number };
    apiCalls: { used: number; limit: number };
  };
}

class DemoService {
  private readonly DEMO_STORAGE_KEY = 'ecolojia_demo_mode';
  private readonly DEMO_USER_KEY = 'ecolojia_demo_user';
  private readonly DEMO_TOKEN_KEY = 'ecolojia_demo_token';

  startDemoSession(tier: 'free' | 'premium' = 'premium'): DemoSession {
    const demoUser: User = {
      id: `demo-${tier}-${Date.now()}`,
      email: `demo-${tier}@ecolojia.app`,
      name: `Utilisateur Démo ${tier === 'premium' ? 'Premium' : 'Gratuit'}`,
      tier,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      quotas: tier === 'premium' ? {
        scansPerMonth: -1,
        aiQuestionsPerDay: -1,
        aiQuestionsPerMonth: -1,
        exportsPerMonth: 10,
        apiCallsPerMonth: 1000
      } : {
        scansPerMonth: 25,
        aiQuestionsPerDay: 0,
        aiQuestionsPerMonth: 0,
        exportsPerMonth: 0,
        apiCallsPerMonth: 0
      },
      currentUsage: {
        scansThisMonth: 0,
        aiQuestionsToday: 0,
        aiQuestionsThisMonth: 0,
        exportsThisMonth: 0,
        apiCallsThisMonth: 0
      },
      preferences: {
        notifications: true,
        emailUpdates: false,
        language: 'fr',
        theme: 'light'
      },
      metadata: {
        totalAnalysesCount: 0,
        streakDays: 0
      }
    };

    const demoToken = `demo-token-${Date.now()}`;
    
    // Sauvegarder en localStorage
    localStorage.setItem(this.DEMO_STORAGE_KEY, 'true');
    localStorage.setItem(this.DEMO_USER_KEY, JSON.stringify(demoUser));
    localStorage.setItem(this.DEMO_TOKEN_KEY, demoToken);

    return {
      user: demoUser,
      token: demoToken,
      quotas: {
        scans: { used: 0, limit: tier === 'premium' ? -1 : 25 },
        aiQuestions: { used: 0, limit: tier === 'premium' ? -1 : 0 },
        exports: { used: 0, limit: tier === 'premium' ? 10 : 0 },
        apiCalls: { used: 0, limit: tier === 'premium' ? 1000 : 0 }
      }
    };
  }

  getCurrentSession(): DemoSession | null {
    if (!this.isDemoActive()) return null;

    try {
      const userStr = localStorage.getItem(this.DEMO_USER_KEY);
      const token = localStorage.getItem(this.DEMO_TOKEN_KEY);
      
      if (userStr && token) {
        const user = JSON.parse(userStr);
        return {
          user,
          token,
          quotas: {
            scans: { used: user.currentUsage.scansThisMonth, limit: user.quotas.scansPerMonth },
            aiQuestions: { used: user.currentUsage.aiQuestionsThisMonth, limit: user.quotas.aiQuestionsPerMonth },
            exports: { used: user.currentUsage.exportsThisMonth, limit: user.quotas.exportsPerMonth },
            apiCalls: { used: user.currentUsage.apiCallsThisMonth, limit: user.quotas.apiCallsPerMonth }
          }
        };
      }
    } catch (error) {
      console.error('Error parsing demo session:', error);
    }
    
    return null;
  }

  isDemoActive(): boolean {
    return localStorage.getItem(this.DEMO_STORAGE_KEY) === 'true';
  }

  endDemoSession(): void {
    localStorage.removeItem(this.DEMO_STORAGE_KEY);
    localStorage.removeItem(this.DEMO_USER_KEY);
    localStorage.removeItem(this.DEMO_TOKEN_KEY);
    localStorage.removeItem('ecolojia_demo_history');
  }

  updateUsage(type: 'scans' | 'aiQuestions' | 'exports' | 'apiCalls'): void {
    const session = this.getCurrentSession();
    if (!session) return;

    const user = session.user;
    
    // Mettre à jour l'usage
    switch (type) {
      case 'scans':
        user.currentUsage.scansThisMonth++;
        break;
      case 'aiQuestions':
        user.currentUsage.aiQuestionsToday++;
        user.currentUsage.aiQuestionsThisMonth++;
        break;
      case 'exports':
        user.currentUsage.exportsThisMonth++;
        break;
      case 'apiCalls':
        user.currentUsage.apiCallsThisMonth++;
        break;
    }

    // Sauvegarder
    localStorage.setItem(this.DEMO_USER_KEY, JSON.stringify(user));
  }
}

export const demoService = new DemoService();