// PATH: frontend/src/services/alternativesService.ts
import { get } from "./apiClient";
import type { ProductInfo } from "../types/api";

export type AlternativeSearchParams = {
  productId?: string;
  category?: string;
  currentScore?: number;
  maxResults?: number;
};

export type Alternative = ProductInfo & {
  matchScore: number; // Score de pertinence 0-100
  improvements: string[]; // Liste des améliorations par rapport au produit original
};

/**
 * Recherche des alternatives plus saines pour un produit
 */
export async function findAlternatives(params: AlternativeSearchParams): Promise<Alternative[]> {
  try {
    // Tentative via l'API
    const response = await get("/products/alternatives", { params });
    return normalizeAlternatives(response);
  } catch {
    // Fallback: suggestions statiques basées sur la catégorie
    return getStaticAlternatives(params);
  }
}

/**
 * Recherche d'alternatives par ID de produit
 */
export async function findAlternativesByProductId(productId: string): Promise<Alternative[]> {
  try {
    const response = await get(`/products/${productId}/alternatives`);
    return normalizeAlternatives(response);
  } catch {
    return [];
  }
}

/**
 * Normalise la réponse de l'API en format Alternative[]
 */
function normalizeAlternatives(data: any): Alternative[] {
  if (Array.isArray(data)) {
    return data.map((item) => ({
      id: item.id,
      ean: item.ean || item.barcode,
      name: item.name,
      brand: item.brand,
      category: item.category,
      ingredients: item.ingredients || [],
      imageUrl: item.imageUrl,
      matchScore: item.matchScore || item.relevance || 80,
      improvements: item.improvements || generateImprovements(item)
    }));
  }
  
  if (data?.alternatives) {
    return normalizeAlternatives(data.alternatives);
  }
  
  return [];
}

/**
 * Génère des améliorations basées sur les caractéristiques du produit
 */
function generateImprovements(product: any): string[] {
  const improvements: string[] = [];
  
  // Analyse basique des scores
  if (product.nutriScore && ["A", "B"].includes(product.nutriScore)) {
    improvements.push("Meilleur Nutri-Score");
  }
  
  if (product.novaGroup && product.novaGroup <= 2) {
    improvements.push("Moins transformé (NOVA ≤ 2)");
  }
  
  if (product.ecoScore && ["A", "B"].includes(product.ecoScore)) {
    improvements.push("Impact environnemental réduit");
  }
  
  // Analyse des ingrédients
  const ingredients = product.ingredients || [];
  if (ingredients.some((i: string) => i.toLowerCase().includes("bio"))) {
    improvements.push("Ingrédients biologiques");
  }
  
  if (!ingredients.some((i: string) => /E\d{3}/.test(i))) {
    improvements.push("Sans additifs");
  }
  
  return improvements.length > 0 ? improvements : ["Alternative recommandée"];
}

/**
 * Fallback: alternatives statiques par catégorie
 */
function getStaticAlternatives(params: AlternativeSearchParams): Alternative[] {
  const { category = "food" } = params;
  
  const alternatives: Record<string, Alternative[]> = {
    food: [
      {
        id: "alt-food-1",
        name: "Biscuits bio complets",
        brand: "Nature & Bio",
        category: "food",
        ingredients: ["Farine complète bio", "Sucre de canne bio", "Huile de tournesol bio"],
        matchScore: 90,
        improvements: ["Ingrédients biologiques", "Sans additifs", "Farine complète"]
      },
      {
        id: "alt-food-2",
        name: "Barres de céréales maison",
        brand: "Fait Maison",
        category: "food",
        ingredients: ["Flocons d'avoine", "Miel", "Fruits secs", "Graines"],
        matchScore: 95,
        improvements: ["Sans conservateurs", "NOVA 1", "Riche en fibres"]
      }
    ],
    cosmetics: [
      {
        id: "alt-cosm-1",
        name: "Crème hydratante naturelle",
        brand: "Pure Nature",
        category: "cosmetics",
        ingredients: ["Aloe vera", "Huile de jojoba", "Vitamine E naturelle"],
        matchScore: 88,
        improvements: ["Sans parabènes", "Ingrédients naturels", "Non testé sur animaux"]
      },
      {
        id: "alt-cosm-2",
        name: "Savon surgras bio",
        brand: "Éco Cosmétiques",
        category: "cosmetics",
        ingredients: ["Huile d'olive bio", "Huile de coco bio", "Beurre de karité"],
        matchScore: 92,
        improvements: ["Certifié bio", "Sans sulfates", "Biodégradable"]
      }
    ],
    detergents: [
      {
        id: "alt-det-1",
        name: "Lessive écologique concentrée",
        brand: "ÉcoClean",
        category: "detergents",
        ingredients: ["Savon végétal", "Bicarbonate de soude", "Acide citrique"],
        matchScore: 85,
        improvements: ["Biodégradable", "Sans phosphates", "Emballage recyclé"]
      },
      {
        id: "alt-det-2",
        name: "Tablettes lave-vaisselle écologiques",
        brand: "Green Wash",
        category: "detergents",
        ingredients: ["Percarbonate de sodium", "Enzymes naturelles", "Citrate de sodium"],
        matchScore: 87,
        improvements: ["Sans chlore", "Film hydrosoluble", "Efficace en eau froide"]
      }
    ]
  };
  
  return alternatives[category] || [];
}

/**
 * Compare deux produits et retourne les différences
 */
export function compareProducts(product1: ProductInfo, product2: ProductInfo) {
  const comparison = {
    betterIngredients: [] as string[],
    worseIngredients: [] as string[],
    improvements: [] as string[],
    downgrades: [] as string[]
  };
  
  // Comparaison basique des ingrédients
  const ingredients1 = new Set(product1.ingredients || []);
  const ingredients2 = new Set(product2.ingredients || []);
  
  // Ingrédients en moins (potentiellement mieux)
  ingredients1.forEach((ing) => {
    if (!ingredients2.has(ing) && /E\d{3}|additif|conservateur/i.test(ing)) {
      comparison.improvements.push(`Sans ${ing}`);
    }
  });
  
  // Ingrédients en plus (vérifier si positifs)
  ingredients2.forEach((ing) => {
    if (!ingredients1.has(ing)) {
      if (/bio|naturel|complet/i.test(ing)) {
        comparison.betterIngredients.push(ing);
      }
    }
  });
  
  return comparison;
}
