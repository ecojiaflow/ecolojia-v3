// PATH: frontend/src/services/apiClient.ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Base URL: env first, fallback to current origin + /api
const ENV_BASE = (typeof import.meta !== 'undefined' && import.met?.env && import.met?.env.VITE_API_URL) ? String(import.met?.env.VITE_API_URL) : '';
const API_BASE = (ENV_BASE && ENV_BASE.replace(/\/+$/,'')) || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  statusCode?: number;
}

export interface ApiError {
  success: false;
  error: string;
  statusCode?: number;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch { return null; }
}

async function request<T = any>(
  path: string,
  options: { method?: HttpMethod; headers?: Record<string, string>; body?: any } = {}
): Promise<ApiResponse<T>> {
  const url = buildUrl(path);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  // Ajouter automatiquement le token si disponible
  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, { method: options.method || 'GET', headers, body });
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errMsg = (payload && (payload.error || payload.message)) || res.statusText || 'HTTP_ERROR';
      return { success: false, error: errMsg, statusCode: res.status };
    }

    // Normaliser: si payload.success existe, renvoyer tel quel; sinon envelopper
    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload as ApiResponse<T>;
    }

    return { success: true, data: payload as T, statusCode: res.status };
  } catch (e: any) {
    return {
      success: false,
      error: e?.message || 'NETWORK_ERROR',
      statusCode: 0,
    };
  }
}

export const api = {
  get: <T = any>(path: string, headers?: Record<string, string>) =>
    request<T>(path, { method: 'GET', headers }),
  post: <T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    request<T>(path, { method: 'POST', body, headers }),
  put:  <T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    request<T>(path, { method: 'PUT', body, headers }),
  patch:<T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    request<T>(path, { method: 'PATCH', body, headers }),
  delete:<T = any>(path: string, headers?: Record<string, string>) =>
    request<T>(path, { method: 'DELETE', headers }),
};

export default api;

