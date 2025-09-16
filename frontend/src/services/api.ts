import axios from "axios";
import axiosRetry from "axios-retry";

// Base URL: .env > fallback prod
const API_URL =
  import.meta?.env?.VITE_API_URL?.toString() ||
  "https://ecolojia-backendvf.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Retry réseau + 5xx
axiosRetry(api, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) =>
    axiosRetry.isNetworkError(err) ||
    !!(err.response && err.response.status >= 500),
});

// Auth header depuis localStorage si présent
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// 🔴 IMPORTANT : toutes les méthodes retournent .data
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
    category?: string;
  }) => api.post("/detergents/analyze", payload).then((r) => r.data),
  byBarcode: (barcode: string) =>
    api.get(`/products/barcode/${barcode}`).then((r) => r.data),

  search: (q: string, filters?: any) =>
    api.get("/products/search", { params: { q, ...filters } }).then((r) => r.data),

  trending: () => api.get("/products/trending").then((r) => r.data),

  alternatives: (productId: string) =>
    api
      .get(`/products/${productId}/alternatives`)
      .then((r) => r.data)
      .catch(() => api.get("/products/trending").then((r) => r.data)),
};

export const dashboardService = {
  getStats: (period: "week" | "month" | "year" = "month") =>
    api.get("/dashboard/stats", { params: { period } }).then((r) => ({
      totalScans: r.data.data?.totals?.scans || 0,
      uniqueUsers: r.data.data?.totals?.products || 0,
      avgGlobalScore: r.data.data?.averages?.health || 0,
      scansByDay: r.data.data?.weeklyTrend?.map((item: any) => ({
        date: item.day,
        count: item.scans
      })) || [],
      topProducts: r.data.data?.topProducts?.slice(0, 5) || [],
      topCategories: []
    })),
};

export const visionService = {
  analyzeImage: (base64Image: string) =>
    api.post("/vision/analyze-image", { image: base64Image }).then((r) => r.data),
};

export const aiService = {
  chat: (message: string, context?: any) =>
    api.post("/ai/chat", { message, context }).then((r) => r.data),
};

/** ---------- User Service (profil & compte) ---------- */
export const userService = {
  // Récupérer le profil courant
  getProfile: async () => {
    try { return (await api.get("/users/me")).data; }
    catch { return (await api.get("/auth/me")).data; }
  },

  // Mettre à jour le profil (nom, email, préférences…)
  updateProfile: async (payload: any) => {
    try { return (await api.put("/users/me", payload)).data; }
    catch { return (await api.put("/auth/profile", payload)).data; }
  },

  // Changer le mot de passe
  changePassword: async (oldPassword: string, newPassword: string) => {
    try { return (await api.post("/users/me/password", { oldPassword, newPassword })).data; }
    catch { return (await api.post("/auth/change-password", { oldPassword, newPassword })).data; }
  },

  // Upload avatar (multipart)
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    try { return (await api.post("/users/me/avatar", form, { headers: { "Content-Type": "multipart/form-data" } })).data; }
    catch { return (await api.post("/auth/avatar", form, { headers: { "Content-Type": "multipart/form-data" } })).data; }
  },

  // Supprimer avatar
  deleteAvatar: async () => {
    try { return (await api.delete("/users/me/avatar")).data; }
    catch { return (await api.delete("/auth/avatar")).data; }
  },

  // Supprimer le compte
  deleteAccount: async () => {
    try { return (await api.delete("/users/me")).data; }
    catch { return (await api.delete("/auth/me")).data; }
  },
};
/** ---------- Payment / Billing Service ---------- */
export const paymentService = {
  // Créer une session de paiement (Stripe Checkout)
  createCheckoutSession: async (payload: { priceId: string; successUrl?: string; cancelUrl?: string }) => {
    try { return (await api.post("/payments/checkout-session", payload)).data; }
    catch { return (await api.post("/billing/checkout-session", payload)).data; }
  },

  // Lien vers le portail client (Stripe Customer Portal)
  getPortalUrl: async () => {
    try { return (await api.get("/payments/customer-portal")).data; }
    catch { return (await api.get("/billing/customer-portal")).data; }
  },

  // Statut d'abonnement courant (active, trialing, canceled…)
  getSubscription: async () => {
    try { return (await api.get("/payments/subscription")).data; }
    catch { return (await api.get("/billing/subscription")).data; }
  },

  // Liste des plans/offres disponibles
  getPlans: async () => {
    try { return (await api.get("/payments/plans")).data; }
    catch { return (await api.get("/billing/plans")).data; }
  },

  // Annuler l'abonnement (fin de période en général)
  cancelSubscription: async () => {
    try { return (await api.post("/payments/subscription/cancel", {})).data; }
    catch { return (await api.post("/billing/subscription/cancel", {})).data; }
  },

  // Réactiver l'abonnement si supporté
  resumeSubscription: async () => {
    try { return (await api.post("/payments/subscription/resume", {})).data; }
    catch { return (await api.post("/billing/subscription/resume", {})).data; }
  },
};
/** ---------- History Service (analyses récentes) ---------- */
export const historyService = {
  // Liste paginée des analyses (avec filtres optionnels)
  list: async (params?: { page?: number; limit?: number; q?: string }) => {
    return (await api.get("/history", { params })).data;
  },

  // Derniers items (ex: pour un widget dashboard)
  recent: async (limit: number = 10) => {
    return (await api.get("/history/recent", { params: { limit } })).data;
  },

  // Ajouter une entrée d'historique manuellement
  add: async (payload: { barcode?: string; productId?: string; category?: "food"|"cosmetics"|"detergents"; meta?: any }) => {
    return (await api.post("/history", payload)).data;
  },

  // Supprimer une entrée
  remove: async (id: string) => {
    return (await api.delete(`/history/${id}`)).data;
  },

  // Tout effacer
  clear: async () => {
    return (await api.delete("/history")).data;
  },

  // Statistiques simples (si exposées par le backend)
  stats: async () => {
    try { return (await api.get("/history/stats")).data; }
    catch { return { count: 0 }; }
  },
};
/** ---------- Auth Service ---------- */
export const authService = {
  // Connexion
  login: async (payload: { email: string; password: string }) => {
    // endpoints courants: /auth/login
    return (await api.post("/auth/login", payload)).data;
  },

  // Inscription
  register: async (payload: { name: string; email: string; password: string }) => {
    return (await api.post("/auth/register", payload)).data;
  },

  // Profil courant
  me: async () => {
    try { return (await api.get("/auth/me")).data; }
    catch { return (await api.get("/users/me")).data; } // fallback si backend expose /users/me
  },

  // Mise à jour profil
  updateProfile: async (payload: { name?: string; avatarUrl?: string }) => {
    try { return (await api.put("/auth/me", payload)).data; }
    catch { return (await api.put("/users/me", payload)).data; }
  },

  // Déconnexion
  logout: async () => {
    try { return (await api.post("/auth/logout", {})).data; }
    catch { return { ok: true }; }
  },

  // Rafraîchir le token (si dispo)
  refresh: async () => {
    try { return (await api.post("/auth/refresh", {})).data; }
    catch { return null; }
  },

  // Demande de reset mot de passe
  requestPasswordReset: async (email: string) => {
    try { return (await api.post("/auth/password/request-reset", { email })).data; }
    catch { return (await api.post("/auth/request-reset", { email })).data; }
  },

  // Réinitialisation mot de passe
  resetPassword: async (payload: { token: string; password: string }) => {
    try { return (await api.post("/auth/password/reset", payload)).data; }
    catch { return (await api.post("/auth/reset", payload)).data; }
  },
};
export { api as apiClient };





