// src/services/analyticsService.ts
class AnalyticsService {
  track(event: string, data?: any) {
    console.log(`[Analytics] ${event}:`, data);
  }
  
  identify(userId: string, traits?: any) {
    console.log(`[Analytics] Identify user: ${userId}`);
  }
  
  page(name?: string, properties?: any) {
    console.log(`[Analytics] Page view: ${name || 'unknown'}`);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;

