/**
 * learnService.ts — Service API Micro-fiches Educatives
 * Version: 1.0.0
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:10000";

export interface LearnCardSummary {
  id: string;
  title: string;
  subtitle?: string;
  readTime: number;
  icon: string;
  color: string;
  reason?: string;
}

export interface LearnSuggestionsResponse {
  success: boolean;
  product?: {
    barcode: string;
    name: string;
    brand: string;
  };
  context?: {
    sugarLevel: string;
    satFatLevel: string;
    saltLevel: string;
    processingLevel: string;
    additivesLevel: string;
  };
  suggestions: LearnCardSummary[];
}

/**
 * Recuperer les suggestions de fiches pour un produit
 */
export async function getLearnSuggestions(barcode: string): Promise<LearnSuggestionsResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/learn/suggest/${barcode}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[LearnService] Error fetching suggestions:", error);
    return { success: false, suggestions: [] };
  }
}

/**
 * Recuperer toutes les fiches (resume)
 */
export async function getAllLearnCards(): Promise<LearnCardSummary[]> {
  try {
    const response = await fetch(`${API_BASE}/api/learn`);
    const data = await response.json();
    return data.success ? data.cards : [];
  } catch (error) {
    console.error("[LearnService] Error fetching cards:", error);
    return [];
  }
}

/**
 * Recuperer une fiche complete
 */
export async function getLearnCard(id: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/api/learn/${id}`);
    const data = await response.json();
    return data.success ? data.card : null;
  } catch (error) {
    console.error("[LearnService] Error fetching card:", error);
    return null;
  }
}

export default {
  getLearnSuggestions,
  getAllLearnCards,
  getLearnCard
};
