// PATH: frontend/src/services/ocrService.ts
import apiClient from './apiClient';

export interface OcrResult {
  text?: string;
  blocks?: Array<{ text: string }>;
  [k: string]: any;
}

const ocrService = {
  async extractFromImage(file: File): Promise<OcrResult> {
    const form = new FormData();
    form.append('image', file);
    try {
      // Essayer d'abord l'endpoint vision
      const res = await apiClient.post<OcrResult>('/vision/analyze-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res;
    } catch (error) {
      // Fallback sur un endpoint OCR standard si disponible
      try {
        const res = await apiClient.post<OcrResult>('/ocr/extract', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res;
      } catch {
        // Retourner un résultat vide en cas d'échec
        console.warn('OCR service unavailable');
        return { text: '' };
      }
    }
  },

  async extractBatch(files: File[]): Promise<OcrResult[]> {
    try {
      const form = new FormData();
      files.forEach((f, i) => form.append("files", f, f.name || `img-${i}.jpg`));
      const { data } = await apiClient.post<OcrResult[]>("/ocr/extract-batch", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return Array.isArray(data) ? data : [];
    } catch {
      // fallback : séquentiel
      const res: OcrResult[] = [];
      for (const f of files) res.push(await ocrService.extractFromImage(f));
      return res;
    }
  }
};

export default ocrService;
