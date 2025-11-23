export const ENV = {
  APP_NAME: import.meta.env.VITE_APP_NAME || "ECOLOJIA",
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:10000',
  REQUEST_TIMEOUT_MS: 20000,
  MOCK_MODE: false,
  LS: {
    STORE_ID: import.meta.env.VITE_LS_STORE_ID || "",
    VARIANT_ID: import.meta.env.VITE_LS_VARIANT_ID || "",
  },
  ALGOLIA: {
    APP_ID: import.meta.env.VITE_ALGOLIA_APP_ID || "",
    SEARCH_KEY: import.meta.env.VITE_ALGOLIA_SEARCH_KEY || "",
    INDEX_NAME: import.meta.env.VITE_ALGOLIA_INDEX_NAME || "ecolojia-products",
  },
  DEEPSEEK_ENABLED: import.meta.env.VITE_DEEPSEEK_ENABLED === "true",
};

export const API_BASE = ENV.API_URL;
