// PATH: src/services/apiClient.ts
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') || '';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T = any>(
  path: string,
  options: { method?: HttpMethod; headers?: Record<string, string>; body?: any } = {}
): Promise<T> {
  const url = path.startsWith('http')
    ? path
    : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

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

  const res = await fetch(url, { method: options.method || 'GET', headers, body });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return {} as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T = any>(path: string, headers?: Record<string, string>) =>
    request<T>(path, { method: 'GET', headers }),
  post: <T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    request<T>(path, { method: 'POST', body, headers }),
  put: <T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    request<T>(path, { method: 'PUT', body, headers }),
  patch: <T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    request<T>(path, { method: 'PATCH', body, headers }),
  delete: <T = any>(path: string, headers?: Record<string, string>) =>
    request<T>(path, { method: 'DELETE', headers }),
};

export default api;
