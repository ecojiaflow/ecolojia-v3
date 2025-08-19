// PATH: frontend/src/config/featureFlags.ts
export const FLAGS = {
  DEMO_MODE: String(import.meta.env.VITE_DEMO_MODE ?? "0") === "1",
  OCR_ENABLED: String(import.meta.env.VITE_OCR_ENABLED ?? "0") === "1",
  // 'auto' => BarcodeDetector si dispo, sinon Quagga. 'quagga' => force Quagga, 'native' => force BarcodeDetector.
  SCANNER_PROVIDER: (import.meta.env.VITE_SCANNER_PROVIDER as "auto" | "native" | "quagga") || "auto",
} as const;