// PATH: frontend/src/services/visionService.ts
import { demoMode } from './demoMode';

export interface VisionAnalysisResponse {
  success: boolean;
  message?: string;
  result?: {
    text?: string;
    barcode?: string;
    productName?: string;
    confidence: number;
    extractedData: any;
  };
}

export async function analyzeProductImage(imageFile: File): Promise<VisionAnalysisResponse> {
  console.log("📸 Analyse image (MODE DEMO):", imageFile.name);
  
  // TOUJOURS utiliser le mode démo - PAS D'API !
  return demoMode.analyzeImage(imageFile);
}

export const visionService = {
  analyzeProductImage,
  uploadAndAnalyze: async (file: File, onProgress?: (progress: number) => void) => {
    console.log("📸 Upload image (MODE DEMO):", file.name);
    if (onProgress) {
      onProgress(50);
      await new Promise(r => setTimeout(r, 500));
      onProgress(100);
    }
    return demoMode.analyzeImage(file);
  }
};

export default visionService;
