// PATH: frontend/src/services/aiService.ts
import { apiClient } from './apiClient';

export const aiService = {
  analyze: (payload: {
    productName: string;
    category: string;
    ingredients?: string[];
    prompt?: string;
  }) => apiClient.post('/ai/analyze', payload).then((r) => r.data.data)
};
// EOF
