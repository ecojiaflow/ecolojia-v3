// PATH: frontend/src/services/apiClient.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { API_BASE, ENV } from "../env";

// ---- Cl�s de stockage
export const ACCESS_KEY = "ecolojia_token";
export const REFRESH_KEY = "ecolojia_refresh";
export const USER_KEY = "ecolojia_user";

// ---- Helpers pour les tokens
export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string) {
  try {
    localStorage.setItem(ACCESS_KEY, token);
  } catch {
    console.error("Failed to save access token");
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string) {
  try {
    localStorage.setItem(REFRESH_KEY, token);
  } catch {
    console.error("Failed to save refresh token");
  }
}

export function getUser<T = any>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user: any) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    console.error("Failed to save user data");
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    console.error("Failed to clear auth data");
  }
}

// ---- Helper pour les messages d'erreur
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError<any>;
    const msg =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.response?.data?.detail ||
      axiosError.message;
    return typeof msg === "string" ? msg : "Une erreur r�seau est survenue";
  }
  if (err instanceof Error) return err.message;
  return "Erreur inconnue";
}

// ---- Refresh token
async function refreshToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("NO_REFRESH_TOKEN");
  
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      `${API_BASE}/auth/refresh`,
      { refreshToken: refresh },
      { 
        withCredentials: true,
        timeout: ENV.REQUEST_TIMEOUT_MS 
      }
    );
    
    setAccessToken(data.accessToken);
    console.log("? Token refreshed successfully");
    return data.accessToken;
  } catch (error) {
    console.error("? Token refresh failed:", error);
    throw error;
  }
}

// ---- Queue pour �viter les refresh multiples
let refreshing = false;
let subscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  subscribers.push(cb);
}

function onRefreshed(newToken: string) {
  subscribers.forEach((cb) => cb(newToken));
  subscribers = [];
}

// ---- Cr�ation de l'instance axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  
  withCredentials: true,
  timeout: ENV.REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ---- Intercepteur de requ�te (ajoute le token)
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Intercepteur de r�ponse (g�re le refresh token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Si 401 et pas d�j� en retry
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // Si pas d�j� en train de refresh
      if (!refreshing) {
        refreshing = true;
        
        try {
          const newToken = await refreshToken();
          refreshing = false;
          onRefreshed(newToken);
          
          // Retry la requ�te originale avec le nouveau token
          originalRequest.headers = originalRequest.headers ?? {};
          (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
          
        } catch (refreshError) {
          refreshing = false;
          clearAuth();
          // Redirection vers login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      // Si d�j� en train de refresh, attendre
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest.headers = originalRequest.headers ?? {};
          (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

// ---- Exports
export default apiClient;
export { apiClient };
export const api = apiClient; // Alias pour compatibilit�
export const API_BASE_URL = API_BASE;

