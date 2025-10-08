const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

export interface OCRAnalysisRequest {
  frontImage: string;
  ingredientsImage: string;
  barcodeImage?: string;
}

export interface OCRAnalysisResult {
  success: boolean;
  product: {
    _id: string;
    name: string;
    brand?: string;
    barcode: string;
    category: string;
    scores: any;
    confidence: number;
    isNew: boolean;
  };
}

export async function analyzeWithOCR(photos: OCRAnalysisRequest): Promise<OCRAnalysisResult> {
  const response = await fetch(`${API_URL}/api/ocr/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(photos)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Erreur analyse OCR');
  }

  return response.json();
}
