// PATH: frontend/src/config/featureFlags.ts
export const FLAGS = {
  // OCR activé par défaut en production, désactivable en dev
  OCR_ENABLED: import.meta.env.VITE_OCR_ENABLED !== '0',
  
  // Détection de code-barres en temps réel
  BARCODE_LIVE_DETECTION: true,
  
  // Scanner multi-photos
  MULTI_PHOTO_SCAN: true,
  
  // Chat IA
  AI_CHAT_ENABLED: import.meta.env.VITE_AI_CHAT_ENABLED !== '0',
  
  // Mode démo
  DEMO_MODE: import.meta.env.VITE_DEMO_MODE === '1',
  
  // Scoring local
  LOCAL_SCORING: true,
  
  // Export PDF
  PDF_EXPORT: import.meta.env.VITE_PDF_EXPORT_ENABLED !== '0',
  
  // Affiliate links
  AFFILIATE_ENABLED: true
} as const;