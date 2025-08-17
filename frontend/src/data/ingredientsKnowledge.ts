// PATH: frontend/src/data/ingredientsKnowledge.ts
export interface HazardInfo {
  name: string;
  synonyms: string[];
  categories: ('allergen' | 'endocrine' | 'irritant' | 'carcinogen' | 'environmental')[];
  level: 'low' | 'moderate' | 'high' | 'unknown';
  summary: string;
  details: string;
  references: Array<{
    label: string;
    url: string;
  }>;
}

export interface EnrichedIngredient {
  raw: string;
  normalized: string;
  matchScore: number;
  level: 'low' | 'moderate' | 'high' | 'unknown';
  hazarda: HazardInfo;
}

// Base de connaissances des ingredients  risque
export const hazardDatabase: Record<string, HazardInfo> = {
  // Cosmetiques - Perturbateurs endocriniens
  'bht': {
    name: 'BHT (Butylated Hydroxytoluene)',
    synonyms: ['butylhydroxytoluene', 'e321', 'bht'],
    categories: ['endocrine', 'environmental'],
    level: 'high',
    summary: 'Antioxydant synthetique suspecte d\'etre un perturbateur endocrinien',
    details: 'Le BHT est utilise comme conservateur dans les cosmetiques et l\'alimentation. Des etudes suggerent qu\'il pourrait interferer avec le systeme hormonal et s\'accumuler dans l\'environnement.',
    references: [
      { label: 'ECHA - BHT', url: 'https://ech?.europ?.eu/substance-information/-/substanceinfo/100.004.439' },
      { label: 'EWG Skin Deep', url: 'https://www.ewg.org/skindeep/ingredients/700741-BHT/' }
    ]
  },
  
  'triclosan': {
    name: 'Triclosan',
    synonyms: ['triclosan', 'tcs', 'irgasan'],
    categories: ['endocrine', 'environmental'],
    level: 'high',
    summary: 'Antibacterien perturbateur endocrinien, toxique pour l\'environnement',
    details: 'Le triclosan est un agent antibacterien qui peut perturber la fonction thyrodienne et contribuer  la resistance aux antibiotiques. Il est persistant dans l\'environnement.',
    references: [
      { label: 'FDA on Triclosan', url: 'https://www.fd?.gov/consumers/consumer-updates/antibacterial-soap-you-can-skip-it-use-plain-soap-and-water' }
    ]
  },
  
  // Allergenes parfumes
  'limonene': {
    name: 'Limonene',
    synonyms: ['limonene', 'd-limonene', 'dipentene'],
    categories: ['allergen'],
    level: 'moderate',
    summary: 'Allergene de parfum pouvant causer des reactions cutanees',
    details: 'Le limonene est un compose naturel d\'agrumes utilise en parfumerie. Lorsqu\'il s\'oxyde au contact de l\'air, il peut former des composes allergisants.',
    references: [
      { label: 'SCCS Opinion', url: 'https://ec.europ?.eu/health/scientific_committees/consumer_safety/docs/sccs_o_073.pdf' }
    ]
  },
  
  'linalool': {
    name: 'Linalool',
    synonyms: ['linalool', 'linalol'],
    categories: ['allergen'],
    level: 'moderate',
    summary: 'Compose parfume allergisant present dans de nombreuses huiles essentielles',
    details: 'Le linalol est largement utilise en parfumerie. Comme le limonene, il peut s\'oxyder et devenir allergisant. Il est obligatoire de le mentionner sur l\'etiquette au-del de certaines concentrations.',
    references: [
      { label: 'EU Cosmetics Regulation', url: 'https://eur-lex.europ?.eu/legal-content/EN/TXT/auri=CELEX:02009R1223-20220101' }
    ]
  },
  
  // Tensioactifs agressifs
  'sles': {
    name: 'Sodium Laureth Sulfate',
    synonyms: ['sles', 'sodium laureth sulfate', 'sodium lauryl ether sulfate'],
    categories: ['irritant'],
    level: 'moderate',
    summary: 'Tensioactif pouvant etre irritant et contenir des traces de 1,4-dioxane',
    details: 'Le SLES est un tensioactif moussant efficace mais peut etre irritant pour les peaux sensibles. Le processus d\'ethoxylation peut creer des traces de 1,4-dioxane, un cancerogene possible.',
    references: [
      { label: 'CIR Safety Assessment', url: 'https://www.cir-safety.org/ingredients' }
    ]
  },
  
  // Conservateurs problematiques
  'methylisothiazolinone': {
    name: 'Methylisothiazolinone',
    synonyms: ['mit', 'methylisothiazolinone', 'mi'],
    categories: ['allergen', 'irritant'],
    level: 'high',
    summary: 'Conservateur hautement allergisant, interdit dans les produits sans rincage',
    details: 'La MIT est un conservateur puissant mais l\'un des allergenes de contact les plus frequents. Son utilisation est restreinte dans l\'UE.',
    references: [
      { label: 'SCCS Final Opinion', url: 'https://ec.europ?.eu/health/scientific_committees/consumer_safety/docs/sccs_o_178.pdf' }
    ]
  },
  
  // Microplastiques
  'polyethylene': {
    name: 'Polyethylene',
    synonyms: ['polyethylene', 'pe', 'polyethene'],
    categories: ['environmental'],
    level: 'high',
    summary: 'Microplastique polluant les oceans et la chaine alimentaire',
    details: 'Les microbilles de polyethylene sont utilisees comme exfoliants mais persistent dans l\'environnement. Elles sont progressivement interdites dans de nombreux pays.',
    references: [
      { label: 'UNEP Report on Microplastics', url: 'https://www.unep.org/resources/report/marine-plastic-debris-and-microplastics' }
    ]
  },
  
  // Additifs alimentaires
  'e150d': {
    name: 'Caramel au sulfite d\'ammonium',
    synonyms: ['e150d', 'caramel iv', 'sulfite ammonia caramel'],
    categories: ['carcinogen'],
    level: 'moderate',
    summary: 'Colorant caramel pouvant contenir du 4-MEI, potentiellement cancerogene',
    details: 'Ce colorant caramel peut contenir du 4-methylimidazole (4-MEI), classe comme cancerogene possible. Les niveaux sont reglementes mais restent controverses.',
    references: [
      { label: 'IARC Classification', url: 'https://monographs.iarc.fr/list-of-classifications' }
    ]
  },
  
  'e621': {
    name: 'Glutamate monosodique',
    synonyms: ['msg', 'e621', 'glutamate', 'monosodium glutamate'],
    categories: ['allergen'],
    level: 'low',
    summary: 'Exhausteur de got pouvant causer des reactions chez certaines personnes',
    details: 'Le MSG est generalement sr mais peut causer des symptomes (syndrome du restaurant chinois) chez certaines personnes sensibles : maux de tete, transpiration, nausees.',
    references: [
      { label: 'FDA on MSG', url: 'https://www.fd?.gov/food/food-additives-petitions/questions-and-answers-monosodium-glutamate-msg' }
    ]
  }
};

// Fonction d'enrichissement des ingredients
export function enrichIngredients(ingredients: string[]): EnrichedIngredient[] {
  return ingredients.map(ingredient => {
    const normalized = normalizeIngredient(ingredient);
    const hazard = findHazard(normalized);
    
    return {
      raw: ingredient,
      normalized,
      matchScore: hazard ? calculateMatchScore(normalized, hazard) : 0,
      level: hazard?.level || 'unknown',
      hazard
    };
  });
}

// Normalisation des ingredients
function normalizeIngredient(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ');
}

// Recherche de dangers
function findHazard(normalized: string): HazardInfo | undefined {
  // Recherche exacte
  if (hazardDatabase[normalized]) {
    return hazardDatabase[normalized];
  }
  
  // Recherche par synonymes
  for (const [key, hazard] of Object.entries(hazardDatabase)) {
    if (hazard.synonyms.some(syn => normalized.includes(syn))) {
      return hazard;
    }
  }
  
  return undefined;
}

// Calcul du score de correspondance
function calculateMatchScore(ingredient: string, hazard: HazardInfo): number {
  if (ingredient === hazard.name.toLowerCase()) return 1;
  if (hazard.synonyms.includes(ingredient)) return 0.9;
  if (hazard.synonyms.some(syn => ingredient.includes(syn))) return 0.7;
  return 0.5;
}

// Tri des ingredients par niveau de risque
export function sortByRiskLevel(ingredients: EnrichedIngredient[]): EnrichedIngredient[] {
  const levelOrder = { high: 0, moderate: 1, low: 2, unknown: 3 };
  return [...ingredients].sort((a, b) => {
    return levelOrder[?.level] - levelOrder[b.level];
  });
}

