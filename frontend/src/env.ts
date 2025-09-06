// PATH: frontend/src/env.ts
export const ENV = {
  APP_NAME: (import.meta.env.VITE_APP_NAME as string) || "ECOLOJIA",
  API_URL:
    (import.meta.env.VITE_API_URL as string)?.replace(/\/+$/, "") ||
    "https://ecolojia-backendvf.onrender.com",
  REQUEST_TIMEOUT_MS: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 20000),
  MOCK_MODE: true,
  LS: {
    STORE_ID: (import.meta.env.VITE_LS_STORE_ID as string) || "",
    VARIANT_MONTHLY: (import.meta.env.VITE_LS_VARIANT_ID_MONTHLY as string) || "",
    VARIANT_YEARLY: (import.meta.env.VITE_LS_VARIANT_ID_YEARLY as string) || "",
  },
  ALGOLIA: {
    APP_ID: (import.meta.env.VITE_ALGOLIA_APP_ID as string) || "",
    SEARCH_KEY: (import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string) || "",
  },
} as const;

// Calcul de l'API_BASE avec le suffixe /api
export const API_BASE = `${ENV.API_URL}/api`;

// Export pour debug
if (ENV.MOCK_MODE) {
  console.log("🚨 ECOLOJIA Running in MOCK MODE");
} else {
  console.log("✅ ECOLOJIA Connected to:", ENV.API_URL);
  console.log("📡 API Base URL:", API_BASE);
}

