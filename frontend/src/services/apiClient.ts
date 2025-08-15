// PATH: frontend/src/services/apiClient.ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// URL directe vers Render - pas de variable d'environnement
const API_BASE = 'https://ecolojia-backendvf.onrender.com/api';

function buildUrl(path: string): string {
  if (path.startsWith('http')) return path;
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

async function request<T = any>(
  path: string,
  options: { method?: HttpMethod; headers?: Record<string, string>; body?: any } = {}
): Promise<ApiResponse<T>> {
  const url = buildUrl(path);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, { method: options.method || 'GET', headers, body });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (res.ok) {
      if (!isJson) return { success: true, data: {} as T, statusCode: res.status };
      const json = await res.json();
      if (json && typeof json === 'object' && ('success' in json || 'data' in json)) {
        return { success: json.success !== false, data: json.data ?? json, statusCode: res.status };
      }
      return { success: true, data: json as T, statusCode: res.status };
    }

    let message = `HTTP ${res.status}`;
    if (isJson) {
      const j = await res.json().catch(() => null);
      if (j?.error) message = String(j.error);
      else if (j?.message) message = String(j.message);
    } else {
      const txt = await res.text().catch(() => '');
      if (txt) message = txt;
    }
    return { success: false, error: message, statusCode: res.status };

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
