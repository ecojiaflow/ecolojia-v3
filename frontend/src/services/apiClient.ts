// PATH: frontend/src/services/apiClient.ts
import axios, { AxiosError, AxiosInstance } from "axios";

/** Normalise VITE_API_URL pour que la base se termine TOUJOURS par /api (sans doublon). */
function normalizeApiBase(u?: string): string {
  const fallback = "https://ecolojia-backendvf.onrender.com";
  let base = (u && u.trim().length > 0 ? u.trim() : fallback).replace(/\/+$/, "");
  if (!/\/api$/.test(base)) base = `${base}/api`;
  return base;
}

// ---- Clés de stockage (compatibles avec ton existant)
export const ACCESS_KEY = "ecolojia_token";
export const REFRESH_KEY = "ecolojia_refresh";
export const USER_KEY = "ecolojia_user";

export function getAccessToken() { try { return localStorage.getItem(ACCESS_KEY); } catch { return null; } }
export function setAccessToken(t: string) { try { localStorage.setItem(ACCESS_KEY, t); } catch {} }
export function getRefreshToken() { try { return localStorage.getItem(REFRESH_KEY); } catch { return null; } }
export function setRefreshToken(t: string) { try { localStorage.setItem(REFRESH_KEY, t); } catch {} }
export function setUser(u: any) { try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {} }
export function getUser<T=any>(): T | null { try { const s = localStorage.getItem(USER_KEY); return s ? JSON.parse(s) as T : null; } catch { return null; } }
export function clearAuth() { try { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); localStorage.removeItem(USER_KEY); } catch {} }

// Helper d'erreur pour scanService
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;
    const msg =
      (ax.response?.data && (ax.response.data.message || ax.response.data.error)) ||
      ax.message;
    return typeof msg === "string" ? msg : "Une erreur réseau est survenue";
  }
  if (err instanceof Error) return err.message;
  return "Erreur inconnue";
}

const API_BASE = normalizeApiBase((import.meta as any)?.env?.VITE_API_URL as string | undefined);

async function refreshToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("NO_REFRESH_TOKEN");
  const { data } = await axios.post<{ accessToken: string }>(
    `${API_BASE}/auth/refresh`,
    { refreshToken: refresh },
    { withCredentials: true }
  );
  setAccessToken(data.accessToken);
  return data.accessToken;
}

let refreshing = false;
let waiters: Array<() => void> = [];

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original: any = error.config || {};
    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        await new Promise<void>((resolve) => waiters.push(resolve));
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${getAccessToken()}` };
        original._retry = true;
        return apiClient(original);
      }
      refreshing = true;
      try {
        const newToken = await refreshToken();
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
        original._retry = true;
        waiters.forEach((w) => w());
        waiters = [];
        return apiClient(original);
      } catch (e) {
        clearAuth();
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Export par défaut
export default apiClient;

// Named export pour scanService
export { apiClient };

// Autres exports pour compatibilité
export const api = apiClient;
export const API_BASE_URL = API_BASE;
