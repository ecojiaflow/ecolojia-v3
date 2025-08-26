// PATH: frontend/src/services/api.ts
// Hub unique de services HTTP (compatibilité globale).
import apiClient, { API_BASE_URL } from "./apiClient";

export default apiClient;
export const api = apiClient;
export { API_BASE_URL };

export const authService = {
  async login(email: string, password: string) {
    const { data } = await apiClient.post<{ accessToken: string; refreshToken: string; user: any }>(
      "/auth/login",
      { email, password }
    );
    return data;
  },
  async register(email: string, password: string, firstName?: string, lastName?: string) {
    const { data } = await apiClient.post<{ accessToken: string; refreshToken: string; user: any }>(
      "/auth/register",
      { email, password, firstName, lastName }
    );
    return data;
  },
  async refresh(refreshToken: string) {
    const { data } = await apiClient.post<{ accessToken: string }>(
      "/auth/refresh",
      { refreshToken }
    );
    return data;
  },
  async me() {
    const { data } = await apiClient.get<any>("/auth/me");
    return (data && (data.user ?? data)) || null;
  },
  async logout() {
    try { await apiClient.post("/auth/logout"); } catch { }
  },
};

export const chatService = {
  async sendMessage(message: string, context?: any) {
    const payload = context ? { message, context } : { message };
    const { data } = await apiClient.post<{ reply: string; [k: string]: any }>(
      "/ai/chat",
      payload
    );
    return data;
  },
  async history(limit = 20) {
    try {
      const { data } = await apiClient.get<any>(`/ai/history?limit=${encodeURIComponent(String(limit))}`);
      return data;
    } catch {
      return [];
    }
  },
};

export const paymentService = {
  async getPlans() {
    const { data } = await apiClient.get<Array<{ id: string; name: string; price: number; interval?: "month"|"year"; description?: string; [k: string]: any }>>("/payments/plans");
    return data ?? [];
  },
  async startCheckout(planId: string, returnUrl?: string) {
    const { data } = await apiClient.post<{ url: string }>("/payments/checkout", { planId, returnUrl });
    return data;
  },
  async getPortalUrl() {
    const { data } = await apiClient.get<{ url: string }>("/payments/portal");
    return data;
  },
  async getStatus() {
    const { data } = await apiClient.get<{ active: boolean; tier?: string; currentPeriodEnd?: string; [k: string]: any }>("/payments/status");
    return data;
  },
};

export const userService = {
  async updatePreferences(payload: { healthGoals?: string[]; allergies?: string[]; diets?: string[]; notifications?: { email?: boolean; push?: boolean; marketing?: boolean }; [k: string]: any; }) {
    const { data } = await apiClient.put<any>("/users/preferences", payload);
    return data;
  },
  async updateProfile(update: any) {
    const { data } = await apiClient.put<any>("/users/profile", update);
    return data;
  },
  async getProfile() {
    const { data } = await apiClient.get<any>("/users/me");
    return (data && (data.user ?? data)) || null;
  },
};

export * as productService from "./productService";
export * as analysisService from "./analysisService";
export * as visionService from "./visionService";
export * as searchService from "./searchService";
export * as dashboardService from "./dashboardService";
export * as ocrService from "./ocrService";
export * as scanService from "./scanService";
