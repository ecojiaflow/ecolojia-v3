// PATH: src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import "./index.css";
import App from "./App";

// Active les mocks UNIQUEMENT si VITE_MOCKS === '1'
try {
  if ((import.meta as any)?.env?.VITE_MOCKS === '1') {
    import("./utils/setupMocks")
      .then((m) => m?.enableMocks?.())
      .catch(() => {});
  }
} catch {}

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) =>
    console.error("Erreur JS:", e.message, e.error)
  );
  window.addEventListener("unhandledrejection", (e) =>
    console.error("Promesse non gérée:", e.reason)
  );
}

// Outils dev seulement en DEV (non bundlé en prod)
if (import.meta.env.DEV) {
  import("./dev/devTools")
    .then((m) => m?.registerDevTools?.())
    .catch(() => {});
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Élément #root introuvable");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
