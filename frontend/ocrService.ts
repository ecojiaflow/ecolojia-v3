// PATH: frontend/src/services/ocrService.ts
import api from './apiClient';

export interface OcrResult {
  text?: string;
  blocks?: Array<{ text: string }>;
  [k: string]: any;
}

export async function ocrPhoto(file: File): Promise<OcrResult> {
  const form = new FormData();
  form.append('image', file);
  // Backend Render: /api/vision/analyze-image
  return await api.post<OcrResult>('/api/vision/analyze-image', form);
}

export const ocrService = { ocrPhoto };
export default ocrService;
