// frontend/src/services/demoService.ts
import { User, DemoSession } from '../auth/types/AuthTypes';

class DemoService {
  private readonly DEMO_MODE_KEY = 'ecolojia_demo_mode';
  private readonly DEMO_USER_KEY = 'ecolojia_demo_user';
  private readonly DEMO_TOKEN_KEY = 'ecolojia_demo_token';
  private readonly DEMO_HISTORY_KEY = 'ecolojia_demo_history';

  // Démarrer une session démo
  startDemoSession(tier: 'free' | 'premium' = 'premium'): DemoSession {
    console.log(`🎭 Starting demo session with ${tier} tier`);

    // Créer utilisateur démo
    const demoUser: User = {
      id: `demo-${Date.now()}`,
      email: tier === 'premium' ? 'demo.premium@ecolojia.com' : 'demo.free@ecolojia.com',
      name: tier === 'premium' ? 'Utilisateur Premium Démo' : 'Utilisateur Gratuit Démo',
      tier,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quotas: tier === 'premium' ? {
        scansPerMonth: -1, // Illimité
        aiQuestionsPerDay: -1, // Illimité
        exportsPerMonth: 10,
        apiCallsPerMonth: 1000
      } : {
        scansPerMonth: 30,
        aiQuestionsPerDay: 0,
        exportsPerMonth: 0,
        apiCallsPerMonth: 0
      },
      currentUsage: {
        scansThisMonth: tier === 'premium' ? 12 : 5,
        aiQuestionsToday: tier === 'premium' ? 3 : 0,
        exportsThisMonth: tier === 'premium' ? 1 : 0,
        apiCallsThisMonth: tier === 'premium' ? 25 : 0
      },
      preferences: {
        language: 'fr',
        notifications: true,
        newsletter: false
      }
    };

    // Créer session démo
    const demoSession: DemoSession = {
      user: demoUser,
      token: `demo-token-${Date.now()}`,
      startedAt: new Date().toISOString(),
      quotas: {
        scans: {
          limit: tier === 'premium' ? -1 : 30,
          used: tier === 'premium' ? 12 : 5
        },
        aiQuestions: {
          limit: tier === 'premium' ? -1 : 0,
          used: tier === 'premium' ? 3 : 0
        },
        exports: {
          limit: tier === 'premium' ? 10 : 0,
          used: tier === 'premium' ? 1 : 0
        },
        apiCalls: {
          limit: tier === 'premium' ? 1000 : 0,
          used: tier === 'premium' ? 25 : 0
        }
      }
    };

    // Sauvegarder en localStorage
    localStorage.setItem(this.DEMO_MODE_KEY, 'true');
    localStorage.setItem(this.DEMO_USER_KEY, JSON.stringify(demoUser));
    localStorage.setItem(this.DEMO_TOKEN_KEY, demoSession.token);

    // Initialiser historique démo
    this.initializeDemoHistory(tier);

    console.log('✅ Demo session started successfully');
    return demoSession;
  }

  // Vérifier si le mode démo est actif
  isDemoActive(): boolean {
    return localStorage.getItem(this.DEMO_MODE_KEY) === 'true';
  }

  // Récupérer la session démo actuelle
  getCurrentSession(): DemoSession | null {
    if (!this.isDemoActive()) {
      return null;
    }

    const userStr = localStorage.getItem(this.DEMO_USER_KEY);
    const token = localStorage.getItem(this.DEMO_TOKEN_KEY);

    if (!userStr || !token) {
      console.warn('⚠️ Invalid demo session data');
      this.endDemoSession();
      return null;
    }

    try {
      const user = JSON.parse(userStr) as User;
      
      // Reconstruire la session
      const session: DemoSession = {
        user,
        token,
        startedAt: user.createdAt,
        quotas: {
          scans: {
            limit: user.quotas.scansPerMonth,
            used: user.currentUsage.scansThisMonth
          },
          aiQuestions: {
            limit: user.quotas.aiQuestionsPerDay,
            used: user.currentUsage.aiQuestionsToday
          },
          exports: {
            limit: user.quotas.exportsPerMonth,
            used: user.currentUsage.exportsThisMonth
          },
          apiCalls: {
            limit: user.quotas.apiCallsPerMonth || 0,
            used: user.currentUsage.apiCallsThisMonth || 0
          }
        }
      };

      return session;
    } catch (error) {
      console.error('❌ Error parsing demo session:', error);
      this.endDemoSession();
      return null;
    }
  }

  // Terminer la session démo
  endDemoSession(): void {
    console.log('🚪 Ending demo session');
    
    localStorage.removeItem(this.DEMO_MODE_KEY);
    localStorage.removeItem(this.DEMO_USER_KEY);
    localStorage.removeItem(this.DEMO_TOKEN_KEY);
    localStorage.removeItem(this.DEMO_HISTORY_KEY);
    
    console.log('✅ Demo session ended');
  }

  // Initialiser l'historique démo
  private initializeDemoHistory(tier: 'free' | 'premium'): void {
    const demoHistory = {
      analyses: tier === 'premium' ? [
        {
          id: 'demo-1',
          productName: 'Nutella',
          category: 'food',
          score: 25,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          novaScore: 4
        },
        {
          id: 'demo-2',
          productName: 'Yaourt Bio Nature',
          category: 'food',
          score: 92,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          novaScore: 1
        },
        {
          id: 'demo-3',
          productName: 'Shampoing L\'Oréal',
          category: 'cosmetics',
          score: 65,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ] : [
        {
          id: 'demo-1',
          productName: 'Coca-Cola',
          category: 'food',
          score: 18,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          novaScore: 4
        },
        {
          id: 'demo-2',
          productName: 'Pomme Bio',
          category: 'food',
          score: 95,
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          novaScore: 1
        }
      ],
      favoriteProducts: tier === 'premium' ? [
        { name: 'Yaourt Bio Nature', score: 92 },
        { name: 'Pommes de terre Bio', score: 88 }
      ] : [],
      healthScore: {
        current: tier === 'premium' ? 73 : 56,
        previousMonth: tier === 'premium' ? 68 : 52,
        trend: 'improving'
      }
    };

    localStorage.setItem(this.DEMO_HISTORY_KEY, JSON.stringify(demoHistory));
  }

  // Récupérer l'historique démo
  getDemoHistory(): any {
    const historyStr = localStorage.getItem(this.DEMO_HISTORY_KEY);
    if (!historyStr) {
      return null;
    }

    try {
      return JSON.parse(historyStr);
    } catch (error) {
      console.error('❌ Error parsing demo history:', error);
      return null;
    }
  }

  // Simuler une analyse en mode démo
  simulateAnalysis(productName: string, category: string): any {
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('No active demo session');
    }

    // Incrémenter l'usage
    if (session.user.tier === 'free' && session.quotas.scans.used >= session.quotas.scans.limit) {
      throw new Error('Quota de scans atteint pour le compte gratuit');
    }

    // Simuler un score aléatoire
    const score = Math.floor(Math.random() * 60) + 40; // Entre 40 et 100
    const novaScore = category === 'food' ? Math.floor(Math.random() * 4) + 1 : undefined;

    // Mettre à jour l'usage
    const user = session.user;
    user.currentUsage.scansThisMonth++;
    localStorage.setItem(this.DEMO_USER_KEY, JSON.stringify(user));

    return {
      productName,
      category,
      score,
      novaScore,
      analysis: {
        healthScore: score,
        recommendation: score > 70 ? 'Bon choix !' : 'Des alternatives existent'
      }
    };
  }

  // Simuler une question IA en mode démo
  simulateAIQuestion(question: string): string {
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('No active demo session');
    }

    if (session.user.tier !== 'premium') {
      throw new Error('Le chat IA est réservé aux membres Premium');
    }

    // Mettre à jour l'usage
    const user = session.user;
    user.currentUsage.aiQuestionsToday++;
    localStorage.setItem(this.DEMO_USER_KEY, JSON.stringify(user));

    // Réponses simulées
    const responses = [
      'D\'après notre analyse, ce produit contient des additifs à éviter. Je recommande de chercher des alternatives biologiques.',
      'Les ingrédients de ce produit sont globalement sains. L\'indice NOVA est faible, ce qui est positif.',
      'Ce type de produit contient souvent des perturbateurs endocriniens. Privilégiez les versions sans parfum.',
      'Pour une alimentation plus saine, limitez les produits ultra-transformés et privilégiez les aliments bruts.'
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Export singleton
export const demoService = new DemoService();