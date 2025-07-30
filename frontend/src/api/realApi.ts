// PATH: frontend/ecolojiaFrontV3/src/api/realApi.ts
import { Product, AnalysisResult, SearchFilters, SearchResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backend-working.onrender.com';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PhotoAnalysisRequest {
  imageBase64: string;
  productName?: string;
  category?: string;
}

interface PhotoAnalysisResponse {
  extractedText?: string;
  confidence?: number;
  ingredients?: string[];
  productInfo?: {
    name?: string;
    brand?: string;
    category?: string;
  };
  analysisResult?: AnalysisResult;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`🌐 API Call: ${config.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 API Response:', data);
    
    return data;
    
  } catch (error) {
    console.error('🚨 API Error:', error);
    throw error;
  }
}

function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Retourner seulement la partie base64 (sans le préfixe data:image/...)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// EXISTING FUNCTIONS
// ============================================================================

export async function fetchRealProducts(category: string): Promise<Product[]> {
  try {
    const response = await apiRequest<ApiResponse<Product[]>>(
      `/api/products?category=${encodeURIComponent(category)}`
    );
    
    return response.data;
    
  } catch (error) {
    console.warn(`⚠️ fetchRealProducts: fallback mock pour catégorie "${category}"`);
    
    // Fallback mock data
    return [
      {
        id: '1',
        title: `Produit démo - ${category}`,
        slug: 'demo-product-1',
        category,
        brand: 'Ecolojia Brand',
        created_at: new Date().toISOString(),
        eco_score: 80,
        ai_confidence: 95,
        confidence_color: 'green',
        verified_status: 'verified',
        image_url: 'https://via.placeholder.com/80'
      }
    ];
  }
}

// ============================================================================
// PRODUCT SEARCH & ANALYSIS
// ============================================================================

export async function searchProducts(
  query: string, 
  filters?: SearchFilters
): Promise<SearchResult> {
  try {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.novaGroup) params.append('nova', filters.novaGroup.toString());
    if (filters?.hasAdditives !== undefined) {
      params.append('additives', filters.hasAdditives.toString());
    }
    
    const response = await apiRequest<ApiResponse<SearchResult>>(
      `/api/products/search?${params.toString()}`
    );
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Search failed:', error);
    return {
      hits: [],
      total: 0,
      query,
      facets: {},
      processingTimeMS: 0
    };
  }
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const response = await apiRequest<ApiResponse<Product>>(
      `/api/products/barcode/${barcode}`
    );
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Product not found:', error);
    return null;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await apiRequest<ApiResponse<Product>>(
      `/api/products/${id}`
    );
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Product not found:', error);
    return null;
  }
}

export async function analyzeProduct(
  productData: any,
  options: { useCustomPrompt?: boolean; customPrompt?: string } = {}
): Promise<AnalysisResult> {
  try {
    const response = await apiRequest<ApiResponse<AnalysisResult>>(
      '/api/products/analyze',
      {
        method: 'POST',
        body: JSON.stringify({
          product: productData,
          options
        })
      }
    );
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  }
}

// ============================================================================
// ✅ NOUVELLE FONCTION: ANALYSE PHOTOS
// ============================================================================

export async function analyzePhotos(
  imageFiles: File[],
  options?: {
    extractText?: boolean;
    analyzeIngredients?: boolean;
    productName?: string;
    category?: string;
  }
): Promise<PhotoAnalysisResponse> {
  try {
    console.log('📸 Starting photo analysis for', imageFiles.length, 'images');
    
    // Validation des fichiers
    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('Aucune image fournie pour l\'analyse');
    }

    // Vérification que ce sont bien des images
    for (const file of imageFiles) {
      if (!file.type.startsWith('image/')) {
        throw new Error(`Le fichier ${file.name} n'est pas une image valide`);
      }
    }
    
    // Conversion des images en base64
    const imagePromises = imageFiles.map(file => convertFileToBase64(file));
    const base64Images = await Promise.all(imagePromises);
    
    // Envoi à l'API
    const response = await apiRequest<ApiResponse<PhotoAnalysisResponse>>(
      '/api/products/analyze-photos',
      {
        method: 'POST',
        body: JSON.stringify({
          images: base64Images,
          options: {
            extractText: options?.extractText ?? true,
            analyzeIngredients: options?.analyzeIngredients ?? true,
            productName: options?.productName,
            category: options?.category || 'food'
          }
        })
      }
    );
    
    console.log('✅ Photo analysis completed:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Photo analysis failed:', error);
    
    // Fallback avec analyse basique simulée
    try {
      const mockAnalysis: PhotoAnalysisResponse = {
        extractedText: "Texte extrait simulé - Service d'analyse photo temporairement indisponible",
        confidence: 0.7,
        ingredients: ['Ingrédient exemple 1', 'Ingrédient exemple 2'],
        productInfo: {
          name: options?.productName || 'Produit analysé par photo',
          brand: 'Marque détectée',
          category: options?.category || 'food'
        }
      };
      
      console.log('🔄 Using fallback mock analysis:', mockAnalysis);
      return mockAnalysis;
      
    } catch (fallbackError) {
      console.error('❌ Fallback analysis also failed:', fallbackError);
      throw new Error('Analyse photo échouée - Service temporairement indisponible');
    }
  }
}

// ============================================================================
// ADDITIONAL API FUNCTIONS
// ============================================================================

export async function getProductSuggestions(query: string): Promise<Product[]> {
  try {
    const response = await apiRequest<ApiResponse<Product[]>>(
      `/api/products/suggestions?q=${encodeURIComponent(query)}`
    );
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Suggestions failed:', error);
    return [];
  }
}

export async function getPopularProducts(limit: number = 10): Promise<Product[]> {
  try {
    const response = await apiRequest<ApiResponse<Product[]>>(
      `/api/products/popular?limit=${limit}`
    );
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Popular products failed:', error);
    return [];
  }
}

export async function reportProduct(productId: string, reason: string, details?: string): Promise<boolean> {
  try {
    await apiRequest<ApiResponse<any>>(
      '/api/products/report',
      {
        method: 'POST',
        body: JSON.stringify({
          productId,
          reason,
          details
        })
      }
    );
    
    return true;
    
  } catch (error) {
    console.error('❌ Report failed:', error);
    return false;
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error('❌ API Health check failed:', error);
    return false;
  }
}

// Export types for external use
export type { PhotoAnalysisResponse, PhotoAnalysisRequest };