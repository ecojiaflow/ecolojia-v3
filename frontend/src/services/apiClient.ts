// PATH: frontend/src/services/apiClient.ts
import axios, { AxiosError } from "axios";
import { ENV } from "../env";

const api = axios.create({
  baseURL: ENV.API_BASE.replace(/\/+$/, ""),
  timeout: ENV.REQUEST_TIMEOUT_MS,
  withCredentials: false,
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const config: any = error.config ?? {};
    if (!config.__retried && (status >= 500 || status === 0)) {
      config.__retried = true;
      return api.request(config);
    }
    return Promise.reject(error);
  }
);

export async function get<T>(url: string, params?: Record<string, any>) {
  const res = await api.get<T>(url, { params });
  return res.data;
}

export async function post<T>(url: string, data?: unknown, headers?: Record<string, string>) {
  const res = await api.post<T>(url, data, { headers });
  return res.data;
}

export { api };
