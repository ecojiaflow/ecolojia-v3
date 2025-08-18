// PATH: frontend/src/env.ts
export const ENV = {
  API_BASE: (import.meta.env.VITE_API_BASE as string) || "https://ecolojia-backendvf.onrender.com",
  APP_NAME: (import.meta.env.VITE_APP_NAME as string) || "ECOLOJIA",
  REQUEST_TIMEOUT_MS: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 12000),
} as const;
