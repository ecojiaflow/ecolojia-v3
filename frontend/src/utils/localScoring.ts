// PATH: frontend/src/utils/localScoring.ts
// Scoring local rapide basé sur les algorithmes NOVA V2, INCI V2, ECO V2

export function scoreFromIngredients(ingredients: string[], category: "food" | "cosmetics" | "detergents"): number {
  if (!ingredients.length) return 50; // score neutre si pas d'info

  if (category === "food") {
    // NOVA V2 simplifié : pénalité par additifs E-numbers et ingrédients ultra-transformés
    const additivePattern = /\bE\d{3,4}\b/gi;
    const ultraProcessed = ["sirop de glucose", "maltodextrine", "amidon modifié", "huile de palme", "arôme artificiel"];
    
    let penalty = 0;
    ingredients.forEach(ing => {
      const ingLower = ing.toLowerCase();
      // Additifs E-numbers : -5 points chacun
      const additives = ing.match(additivePattern);
      if (additives) penalty += additives.length * 5;
      
      // Ingrédients ultra-transformés : -10 points chacun
      if (ultraProcessed.some(up => ingLower.includes(up))) penalty += 10;
    });
    
    return Math.max(0, 100 - penalty);
  }
  
  if (category === "cosmetics") {
    // INCI V2 simplifié : détection perturbateurs endocriniens et allergènes
    const badInci = [
      "paraben", "phenoxyethanol", "triclosan", "bht", "bha",
      "phthalate", "formaldehyde", "sulfate", "peg-"
    ];
    const allergens = ["linalool", "limonene", "citronellol", "geraniol", "eugenol"];
    
    let penalty = 0;
    ingredients.forEach(ing => {
      const ingLower = ing.toLowerCase();
      // Perturbateurs : -15 points
      if (badInci.some(bad => ingLower.includes(bad))) penalty += 15;
      // Allergènes : -3 points (moins grave mais à noter)
      if (allergens.some(all => ingLower.includes(all))) penalty += 3;
    });
    
    // Bonus naturalité si peu d'ingrédients
    const naturalBonus = ingredients.length < 10 ? 10 : 0;
    
    return Math.max(0, Math.min(100, 100 - penalty + naturalBonus));
  }
  
  if (category === "detergents") {
    // ECO V2 simplifié : impact environnemental
    const harmful = ["phosphate", "chlore", "ammoniaque", "edta", "nta"];
    const eco = ["biodégradable", "végétal", "naturel", "bio"];
    
    let penalty = 0;
    let bonus = 0;
    
    ingredients.forEach(ing => {
      const ingLower = ing.toLowerCase();
      // Substances nocives : -20 points
      if (harmful.some(h => ingLower.includes(h))) penalty += 20;
      // Labels éco : +10 points
      if (eco.some(e => ingLower.includes(e))) bonus += 10;
    });
    
    return Math.max(0, Math.min(100, 80 - penalty + bonus));
  }
  
  return 50;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#4caf50"; // vert
  if (score >= 60) return "#ff9800"; // orange
  if (score >= 40) return "#f44336"; // rouge clair
  return "#b71c1c"; // rouge foncé
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Acceptable";
  if (score >= 40) return "Médiocre";
  return "À éviter";
}