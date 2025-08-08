// PATH: frontend/src/services/dashboardService.ts
import { demoMode } from './demoMode';

export interface DashboardStats {
  totalScans: number;
  monthlyScans: number;
  averageScore: number;
  healthScoreAverage?: number;
  categoriesAnalyzed: any;
  categoryBreakdown?: any;
  recentAnalyses: any[];
  quotaUsage: any;
  weeklyTrend?: any[];
}

class DashboardService {
  async getStats(range: string = "month"): Promise<DashboardStats> {
    console.log("🎭 DEMO: Dashboard stats");
    return demoMode.getDashboardStats();
  }

  async getQuotas() {
    console.log("🎭 DEMO: Get quotas");
    const quota = await demoMode.getQuota();
    return {
      scansUsed: quota.used,
      scansLimit: quota.limit,
      scansRemaining: quota.remaining,
      plan: quota.plan
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
