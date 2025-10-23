// PATH: frontend/src/services/visionService.ts
import api, { ApiResponse } from './apiClient';

export async function analyzeImage(file: File): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const form = new FormData();
  form.append('image', file);

  // Conforme Æ’Ã‚Â  tes logs Render: POST /api/vision/analyze-image
  const res: ApiResponse<any> = await api.post('/api/vision/analyze-image', form);

  if (!res.success) return { success: false, error: res.error || 'VISION_FAILED' };

  const data = (res.data && res.dat?.data) ? res.dat?.data : res.data;
  return { success: true, data };
}

export default { analyzeImage };


