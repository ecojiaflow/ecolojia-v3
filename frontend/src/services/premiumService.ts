// PATH: frontend/src/services/premiumService.ts
import { apiClient } from './api';

export interface PremiumInsight {
  id: string;
  type: string;
  icon: string;
  title: string;
  content?: string;
  suggestions?: string[];
  reasoning?: string;
  confidence: number;
}

export interface AIEnrichmentResponse {
  success: boolean;
  barcode: string;
  product: any;
  aiEnrichment: {
    version: string;
    generatedAt: string;
    processingTime: number;
    knownData: any;
    estimatedData: any;
    needsEnrichment: boolean;
    disclaimer: string;
  };
  responseTime: number;
  error?: string;
}

export const premiumService = {
  enrichProduct: async (barcode: string): Promise<AIEnrichmentResponse> => {
    const response = await apiClient.post('/api/ai-enrich/' + barcode);
    return response.data;
  }
};

export default premiumService;

