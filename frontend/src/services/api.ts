// PATH: frontend/src/services/api.ts
// Réexporte apiClient pour compatibilité avec code existant
import apiClient from './apiClient';

// Export principal
export const api = apiClient;
export { apiClient };
export default apiClient;

// Services métier (gardés pour compatibilité)
// Note: Ces services utilisent maintenant le client unifié avec refresh token
export const productService = {
  analyze: (payload: {
    barcode?: string;
    category?: "food" | "cosmetics" | "detergents";
    name?: string;
    ingredients?: string;
  }) => api.post("/analysis", payload).then((r) => r.data),

  analyzeCosmetic: (payload: {
    barcode?: string;
    name?: string;
    ingredients?: string;
    photoUrl?: string;
  }) => api.post("/cosmetics/analyze", payload).then((r) => r.data),

  analyzeDetergent: (payload: {
    barcode?: string;
    name?: string;
    ingredients?: string;
  }) => api.post("/detergents/analyze", payload).then((r) => r.data),

  getByBarcode: (barcode: string) =>
    api.get(/products/).then((r) => r.data),

  getById: (id: string) =>
    api.get(/products/).then((r) => r.data),

  search: (query: string, filters?: any) =>
    api.post("/products/search", { query, ...filters }).then((r) => r.data),

  findAlternatives: (productId: string) =>
    api.get(/products//alternatives).then((r) => r.data),
};

export const dashboardService = {
  getStats: () => api.get("/dashboard/stats").then((r) => r.data),
  getRecentScans: () => api.get("/dashboard/recent").then((r) => r.data),
};

export const visionService = {
  analyzeImage: (imageData: string) =>
    api.post("/vision/analyze", { image: imageData }).then((r) => r.data),
};

export const aiService = {
  chat: (message: string, context?: any) =>
    api.post("/ai/chat", { message, context }).then((r) => r.data),
};

export const userService = {
  getProfile: () => api.get("/users/profile").then((r) => r.data),
  updateProfile: (data: any) => api.put("/users/profile", data).then((r) => r.data),
};

export const paymentService = {
  createCheckout: () => api.post("/payments/checkout").then((r) => r.data),
};

export const historyService = {
  getHistory: () => api.get("/history").then((r) => r.data),
};

export const authService = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then((r) => r.data),

  register: (data: any) =>
    api.post("/auth/register", data).then((r) => r.data),

  logout: async () => {
    try { return (await api.post("/auth/logout", {})).data; }
    catch { return { ok: true }; }
  },

  refresh: async () => {
    try { return (await api.post("/auth/refresh", {})).data; }
    catch { return null; }
  },

  requestPasswordReset: async (email: string) => {
    try { return (await api.post("/auth/password/request-reset", { email })).data; }
    catch { return (await api.post("/auth/request-reset", { email })).data; }
  },

  resetPassword: async (payload: { token: string; password: string }) => {
    try { return (await api.post("/auth/password/reset", payload)).data; }
    catch { return (await api.post("/auth/reset", payload)).data; }
  },
};