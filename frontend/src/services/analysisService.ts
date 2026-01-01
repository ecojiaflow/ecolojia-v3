// PATH: frontend/src/services/analysisService.ts
import apiClient from "./apiClient";
import type { Category, Product } from "./productService";

export type ProductHit = {
  id: string;
  name: string;
  brand?: string;
  score?: number;
  category?: "food" | "cosmetics" | "detergents";
  barcode?: string;
};

export type AnalysisResult = {
  productId?: string;
  productName?: string;
  brand?: string;
  barcode?: string;
  category?: Category;
  score?: number;
  nutriScore?: "A" | "B" | "C" | "D" | "E";
  ecoScore?: "A" | "B" | "C" | "D" | "E";
  novaGroup?: 1 | 2 | 3 | 4;
  risks?: Array<{ name: string; level: "low" | "medium" | "high" }>;
  inci?: Array<{ name: string; function?: string; hazard?: string }>;
  ecoLabels?: string[];
  biodegradability?: string;
  details?: Record<string, any>;
};

export type HistoryItem = {
  _id: string;
  productName: string;
  category?: string;
  date: string;
  score?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
};

export async function analyzeByBarcode(barcode: string, category?: Category): Promise<AnalysisResult> {
  try {
    // Essayer d'abord l'analyse spÃ©cifique par catÃ©gorie
    if (category === "cosmetics") {
      const response = await apiClient.post("/cosmetics/analyze", { barcode, category });
      return response.data || response;
    }
    if (category === "detergents") {
      const response = await apiClient.post("/detergents/analyze", { barcode, category });
      return response.data || response;
    }
    
    // Essayer l'endpoint d'analyse gÃ©nÃ©rique
    try {
      const response = await apiClient.post("/products/analyze", { barcode, category: category || "food" });
      return response.data || response;
    } catch (e) {
      // Si l'endpoint /analysis n'existe pas, essayer une autre variante
      try {
        const response = await apiClient.post(`/analyze/barcode/${encodeURIComponent(barcode)}`, {
          category: category || "food"
        });
        return response.data || response;
      } catch {
        // Fallback final : rÃ©cupÃ©rer le produit et crÃ©er une analyse basique
        const productResponse = await apiClient.get(`/products/scan/${encodeURIComponent(barcode)}`);
        const product = productResponse.data || productResponse;
        
        return {
          productId: product._id || product.id,
          productName: product.productName || product.name || "Produit",
          brand: product.brand,
          barcode: product.barcode || barcode,
          category: product.category || category || "food",
          score: typeof product.score === "number" ? product.score : undefined,
          nutriScore: product.nutriScore,
          ecoScore: product.ecoScore,
          novaGroup: product.novaGroup,
          details: product
        };
      }
    }
  } catch (error) {
    console.error('Error analyzing by barcode:', error);
    throw error;
  }
}

export async function analyzeByProduct(product: Product): Promise<AnalysisResult> {
  try {
    const category = (product.category as Category) || "food";
    const pid = product.id || product._id;
    
    if (category === "cosmetics") {
      const response = await apiClient.post("/cosmetics/analyze", { 
        productId: pid, 
        barcode: product.barcode, 
        category 
      });
      return response.data || response;
    }
    
    if (category === "detergents") {
      const response = await apiClient.post("/detergents/analyze", { 
        productId: pid, 
        barcode: product.barcode, 
        category 
      });
      return response.data || response;
    }
    
    // Par dÃ©faut ou food
    try {
      const response = await apiClient.post("/products/analyze", { 
        productId: pid, 
        barcode: product.barcode, 
        category: "food" 
      });
      return response.data || response;
    } catch {
      // Fallback : crÃ©er une analyse basique depuis les donnÃ©es du produit
      return {
        productId: pid,
        productName: product.productName || product.name,
        brand: product.brand,
        barcode: product.barcode,
        category: category,
        score: product.score,
        nutriScore: product.nutriScore,
        ecoScore: product.ecoScore,
        novaGroup: product.novaGroup,
        details: product
      };
    }
  } catch (error) {
    console.error('Error analyzing product:', error);
    throw error;
  }
}

export async function analyzeManual(payload: { 
  name: string; 
  category: string; 
  ingredients: string[] 
}): Promise<AnalysisResult> {
  try {
    const response = await apiClient.post("/analysis/manual", payload);
    return response.data || response;
  } catch (error) {
    console.error('Error manual analysis:', error);
    throw error;
  }
}

const analysisService = {
  async searchProducts(q: string): Promise<ProductHit[]> {
    try {
      const response = await apiClient.get("/products/search", {
        params: { q },
      });
      
      const items = response.data?.items || response.data?.products || response.items || response.products || [];
      
      return items.map((it: any) => ({
        id: it._id ?? it.id,
        name: it.productName ?? it.name,
        brand: it.brand,
        score: typeof it.score === "number" ? it.score : undefined,
        category: it.category,
        barcode: it.barcode,
      }));
    } catch (error) {
      console.error('Search products error:', error);
      return [];
    }
  },

  async analyzeByBarcode(barcode: string, category?: Category): Promise<AnalysisResult> {
    return analyzeByBarcode(barcode, category);
  },

  async analyzeByProduct(product: Product): Promise<AnalysisResult> {
    return analyzeByProduct(product);
  },

  async analyzeManual(payload: { name: string; category: string; ingredients: string[] }): Promise<AnalysisResult> {
    return analyzeManual(payload);
  },

  async getHistory(page = 1, limit = 20, category?: string): Promise<Paginated<HistoryItem>> {
    try {
      const params: Record<string, any> = { page, limit };
      if (category) params.category = category;
      const response = await apiClient.get("/history", { params });
      return response.data || response || { items: [], total: 0, page: 1, totalPages: 0 };
    } catch (error) {
      console.error('Get history error:', error);
      return { items: [], total: 0, page: 1, totalPages: 0 };
    }
  },
};

export default analysisService;
// Export manquant pour ResultsPage
export const analyzeProduct = analyzeByProduct;

