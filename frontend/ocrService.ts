// PATH: src/services/ocrService.ts
import api from './apiClient';

export interface OcrResult {
  text?: string;
  blocks?: Array<{ text: string }>;
}

export async function ocrPhoto(file: File): Promise<OcrResult> {
  const form = new FormData();
  form.append('image', file);
  return await api.post<OcrResult>('/api/ocr/photo', form);
}

export const ocrService = { ocrPhoto };
export default ocrService;
