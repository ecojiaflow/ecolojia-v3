// PATH: frontend/src/services/visionService.ts
import apiClient from "./apiClient";

/**
 * On réutilise ton ocrService s'il existe (meilleure intégration).
 * Sinon, on tombe en fallback vers /ocr/extract (multipart).
 */
let ocrSvc:
  | null
  | {
      extractFromImage: (file: File) => Promise<{ text?: string; barcode?: string; confidence?: number }>;
    } = null;

// Fonction pour charger ocrService de manière asynchrone
async function loadOcrService() {
  if (!ocrSvc) {
    try {
      const mod = await import("./ocrService");
      if (mod.default && typeof mod.default.extractFromImage === "function") {
        ocrSvc = mod.default;
      }
    } catch {
      // pas grave : on utilisera le fallback REST
    }
  }
  return ocrSvc;
}

/** Helpers de capabilities */
export function cameraSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// @ts-ignore
export function barcodeLiveSupported(): boolean {
  // @ts-ignore
  return typeof window.BarcodeDetector !== "undefined";
}

/** Détection code-barres locale sur image (si BarcodeDetector disponible) */
async function detectBarcodeFromBlob(blob: Blob): Promise<string | null> {
  try {
    // @ts-ignore
    if (typeof window.BarcodeDetector === "undefined") return null;
    // @ts-ignore
    const BarcodeDetector = window.BarcodeDetector;
    const detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
    });

    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);

    const codes = await detector.detect(canvas as any);
    if (codes && codes.length) {
      const code = (codes[0] as any)?.rawValue;
      return code || null;
    }
    return null;
  } catch {
    return null;
  }
}

/** OCR depuis un Blob : priorise ocrService local, sinon fallback /ocr/extract */
async function ocrFromBlob(blob: Blob): Promise<{ text?: string; barcode?: string; confidence?: number }> {
  const file = blob instanceof File ? blob : new File([blob], "photo.jpg", { type: "image/jpeg" });

  // 1) Service local s'il existe
  const service = await loadOcrService();
  if (service) {
    try {
      const res = await service.extractFromImage(file);
      return res ?? {};
    } catch {
      // on passera au fallback REST
    }
  }

  // 2) Fallback REST
  try {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<{ text?: string; barcode?: string; confidence?: number }>(
      "/ocr/extract",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data ?? {};
  } catch {
    return {};
  }
}

/**
 * 👉 Fonction attendue par PhotoCapture.tsx
 * Retourne au minimum { ingredients: string[], barcode?: string, text?: string }
 * (on ne fait PAS de parsing d'ingrédients côté front pour éviter toute régression ;
 *  tu pourras brancher un extracteur plus tard si souhaité).
 */
export async function analyzeImage(input: Blob | File): Promise<{
  ingredients: string[];
  barcode?: string;
  text?: string;
}> {
  const blob = input instanceof Blob ? input : new Blob([input], { type: input.type || "image/jpeg" });

  // Essai 1 : détection code-barres locale
  const detectedBarcode = await detectBarcodeFromBlob(blob);

  // Essai 2 : OCR (texte + éventuel code-barres extrait côté backend OCR)
  const { text, barcode: ocrBarcode } = await ocrFromBlob(blob);

  const barcode = detectedBarcode || ocrBarcode || undefined;
  const ingredients: string[] = []; // volontairement vide pour compat 100% (pas de parsing local ici)

  return { ingredients, barcode, text };
}

/**
 * Optionnel : si tu fais de l'analyse en lot depuis une page de scan multi-photos,
 * cette fonction peut être utile. Elle reste volontairement simple.
 */
export type VisionShotResult = {
  index: number;
  barcode?: string | null;
  text?: string | null;
  error?: string | null;
};

export async function processShots(blobs: Blob[]): Promise<VisionShotResult[]> {
  const out: VisionShotResult[] = [];
  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i];
    const r: VisionShotResult = { index: i, barcode: null, text: null, error: null };
    try {
      const detected = await detectBarcodeFromBlob(b);
      const ocr = await ocrFromBlob(b);
      r.barcode = detected || ocr.barcode || null;
      r.text = (ocr.text || null) as string | null;
    } catch (e: any) {
      r.error = e?.message || "Analyse indisponible";
    }
    out.push(r);
  }
  return out;
}