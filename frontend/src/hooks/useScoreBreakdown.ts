// frontend/src/hooks/useScoreBreakdown.ts
// Génère automatiquement le breakdown des 8 composantes à partir des données produit

export const useScoreBreakdown = (product: any) => {
  if (!product) return null;

  const scores = product.scores || {};
  const foodData = product.foodData || {};
  const nutrition = foodData.nutrition?.per100g || {};

  // Générer le breakdown à partir des données disponibles
  const breakdown = {
    nova: {
      score: scores.novaScore || calculateNovaScore(product),
      weight: 0.15,
      label: getNovaLabel(product.novaGroup || foodData.novaGroup),
      description: 'Niveau de transformation industrielle'
    },
    nutriScore: {
      score: scores.nutriScore || calculateNutriScore(nutrition),
      weight: 0.20,
      label: product.nutriscoreGrade || 'N/A',
      description: 'Qualité nutritionnelle globale'
    },
    additives: {
      score: scores.additivesScore || calculateAdditivesScore(product),
      weight: 0.15,
      label: getAdditivesLabel(product),
      description: 'Présence et dangerosité des additifs'
    },
    sugars: {
      score: scores.sugarsScore || calculateSugarsScore(nutrition.sugars),
      weight: 0.10,
      label: getSugarsLabel(nutrition.sugars),
      description: 'Teneur en sucres'
    },
    saturatedFat: {
      score: scores.saturatedFatScore || calculateSaturatedFatScore(nutrition.saturatedFat),
      weight: 0.10,
      label: getSaturatedFatLabel(nutrition.saturatedFat),
      description: 'Teneur en graisses saturées'
    },
    salt: {
      score: scores.saltScore || calculateSaltScore(nutrition.salt || nutrition.sodium),
      weight: 0.10,
      label: getSaltLabel(nutrition.salt),
      description: 'Teneur en sel'
    },
    ecoScore: {
      score: scores.ecoscore || calculateEcoScore(product),
      weight: 0.15,
      label: product.ecoscoreGrade || 'N/A',
      description: 'Impact environnemental'
    },
    labels: {
      score: scores.labelsScore || calculateLabelsScore(product),
      weight: 0.05,
      label: getLabelsLabel(product),
      description: 'Labels qualité et certifications'
    }
  };

  return breakdown;
};

// === FONCTIONS DE CALCUL ===

function calculateNovaScore(product: any): number {
  const nova = product.novaGroup || product.foodData?.novaGroup || 3;
  const scoreMap = { 1: 100, 2: 75, 3: 50, 4: 25 };
  return scoreMap[nova as keyof typeof scoreMap] || 50;
}

function getNovaLabel(nova: number): string {
  const labels = {
    1: 'Non transformé',
    2: 'Peu transformé',
    3: 'Transformé',
    4: 'Ultra-transformé'
  };
  return labels[nova as keyof typeof labels] || 'N/A';
}

function calculateNutriScore(nutrition: any): number {
  if (!nutrition) return 50;
  let score = 70;
  if (nutrition.sugars > 15) score -= 20;
  if (nutrition.saturatedFat > 5) score -= 15;
  if (nutrition.salt > 1.5) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function calculateAdditivesScore(product: any): number {
  const additives = product.additivesTags || product.foodData?.additivesTags || [];
  if (additives.length === 0) return 100;
  if (additives.length <= 3) return 75;
  if (additives.length <= 6) return 50;
  return 25;
}

function getAdditivesLabel(product: any): string {
  const count = (product.additivesTags || product.foodData?.additivesTags || []).length;
  if (count === 0) return 'Sans additifs';
  return `${count} additif${count > 1 ? 's' : ''}`;
}

function calculateSugarsScore(sugars: number = 0): number {
  if (sugars <= 5) return 100;
  if (sugars <= 10) return 75;
  if (sugars <= 20) return 50;
  return 25;
}

function getSugarsLabel(sugars: number = 0): string {
  return `${sugars.toFixed(1)}g/100g`;
}

function calculateSaturatedFatScore(fat: number = 0): number {
  if (fat <= 2) return 100;
  if (fat <= 5) return 75;
  if (fat <= 10) return 50;
  return 25;
}

function getSaturatedFatLabel(fat: number = 0): string {
  return `${fat.toFixed(1)}g/100g`;
}

function calculateSaltScore(salt: number = 0): number {
  if (salt <= 0.3) return 100;
  if (salt <= 0.9) return 75;
  if (salt <= 1.5) return 50;
  return 25;
}

function getSaltLabel(salt: number = 0): string {
  return `${salt.toFixed(2)}g/100g`;
}

function calculateEcoScore(product: any): number {
  const grade = product.ecoscoreGrade?.toLowerCase();
  const scoreMap = { a: 100, b: 75, c: 50, d: 25, e: 0 };
  return scoreMap[grade as keyof typeof scoreMap] || 50;
}

function calculateLabelsScore(product: any): number {
  const labels = product.labels || product.foodData?.labels || [];
  const goodLabels = ['bio', 'organic', 'ab', 'fair-trade', 'aoc', 'igp'];
  const hasGoodLabel = labels.some((l: string) => 
    goodLabels.some(g => l.toLowerCase().includes(g))
  );
  return hasGoodLabel ? 100 : 50;
}

function getLabelsLabel(product: any): string {
  const labels = product.labels || product.foodData?.labels || [];
  return labels.length > 0 ? `${labels.length} label${labels.length > 1 ? 's' : ''}` : 'Aucun';
}