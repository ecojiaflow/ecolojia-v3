// backend/src/data/inciDatabase.js
// Base de donnees des ingredients cosmetiques INCI avec scores de securite

const inciDatabase = [
  // === TENSIOACTIFS ===
  {
    inci: 'SODIUM LAURYL SULFATE',
    name: 'Lauryl sulfate de sodium',
    synonyms: ['SLS', 'SDS'],
    function: 'surfactant',
    irritant: 'high',
    comedogenic: 0,
    natural: false,
    environmental_hazard: true,
    description: 'Tensioactif agressif, tres irritant'
  },
  {
    inci: 'SODIUM LAURETH SULFATE',
    name: 'Laureth sulfate de sodium',
    synonyms: ['SLES'],
    function: 'surfactant',
    irritant: 'medium',
    comedogenic: 0,
    natural: false,
    description: 'Tensioactif moins agressif que SLS'
  },
  {
    inci: 'COCAMIDOPROPYL BETAINE',
    name: 'Cocamidopropyl betaine',
    function: 'surfactant',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    derived_from_natural: true,
    description: 'Tensioactif doux derive de la noix de coco'
  },
  {
    inci: 'DECYL GLUCOSIDE',
    name: 'Decyl glucoside',
    function: 'surfactant',
    irritant: 'very_low',
    comedogenic: 0,
    natural: false,
    derived_from_natural: true,
    biodegradable: true,
    description: 'Tensioactif tres doux, ideal peaux sensibles'
  },

  // === CONSERVATEURS ===
  {
    inci: 'METHYLPARABEN',
    name: 'Methylparabene',
    cas: '99-76-3',
    function: 'preservative',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    endocrine_disruptor: true,
    concerns: ['Perturbateur endocrinien suspecte'],
    max_concentration: 0.4
  },
  {
    inci: 'PROPYLPARABEN',
    name: 'Propylparabene',
    cas: '94-13-3',
    function: 'preservative',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    endocrine_disruptor: true,
    concerns: ['Perturbateur endocrinien'],
    banned_in: ['Denmark', 'France (for baby products)'],
    max_concentration: 0.14
  },
  {
    inci: 'PHENOXYETHANOL',
    name: 'Phenoxyethanol',
    cas: '122-99-6',
    function: 'preservative',
    irritant: 'medium',
    comedogenic: 0,
    natural: false,
    allergen: true,
    concerns: ['Allergisant', 'Toxique Â  haute dose'],
    max_concentration: 1.0
  },
  {
    inci: 'BENZYL ALCOHOL',
    name: 'Alcool benzylique',
    cas: '100-51-6',
    function: 'preservative',
    irritant: 'medium',
    comedogenic: 0,
    natural: true,
    allergen: true,
    allergen_type: 'fragrance',
    description: 'Conservateur naturel mais allergisant'
  },
  {
    inci: 'SODIUM BENZOATE',
    name: 'Benzoate de sodium',
    cas: '532-32-1',
    function: 'preservative',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    derived_from_natural: true,
    description: 'Conservateur doux autorise en bio'
  },

  // === â€°MOLLIENTS & HYDRATANTS ===
  {
    inci: 'GLYCERIN',
    name: 'Glycerine',
    synonyms: ['Glycerol'],
    cas: '56-81-5',
    function: 'humectant',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    vegetable_origin: true,
    description: 'Humectant naturel tres sur'
  },
  {
    inci: 'HYALURONIC ACID',
    name: 'Acide hyaluronique',
    function: 'moisturizer',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    biotechnology: true,
    benefits: ['Hydratation intense', 'Anti-age'],
    description: 'Actif hydratant haute performance'
  },
  {
    inci: 'DIMETHICONE',
    name: 'Dimethicone',
    function: 'emollient',
    irritant: 'very_low',
    comedogenic: 1,
    natural: false,
    silicone: true,
    environmental_hazard: true,
    concerns: ['Non biodegradable', 'Occlusif'],
    description: 'Silicone controverse mais sur'
  },
  {
    inci: 'SHEA BUTTER',
    name: 'Beurre de karite',
    inci_official: 'BUTYROSPERMUM PARKII BUTTER',
    function: 'emollient',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    benefits: ['Nourrissant', 'Reparateur'],
    description: 'Beurre vegetal tres nourrissant'
  },

  // === ACTIFS ===
  {
    inci: 'RETINOL',
    name: 'Retinol',
    synonyms: ['Vitamin A'],
    function: 'active',
    irritant: 'high',
    comedogenic: 0,
    natural: false,
    pregnancy_warning: true,
    benefits: ['Anti-age puissant', 'Renouvellement cellulaire'],
    concerns: ['Photosensibilisant', 'Irritant'],
    max_concentration: 1.0
  },
  {
    inci: 'NIACINAMIDE',
    name: 'Niacinamide',
    synonyms: ['Vitamin B3', 'Nicotinamide'],
    function: 'active',
    irritant: 'very_low',
    comedogenic: 0,
    natural: false,
    benefits: ['Anti-inflammatoire', 'Regulateur sebum', 'â€°claircissant'],
    description: 'Actif polyvalent tres bien tolere'
  },
  {
    inci: 'ASCORBIC ACID',
    name: 'Acide ascorbique',
    synonyms: ['Vitamin C'],
    function: 'active',
    irritant: 'medium',
    comedogenic: 0,
    natural: true,
    benefits: ['Antioxydant', 'â€°claircissant', 'Stimule collagene'],
    concerns: ['Instable', 'Peut irriter'],
    description: 'Vitamine C pure, puissante mais instable'
  },
  {
    inci: 'SALICYLIC ACID',
    name: 'Acide salicylique',
    synonyms: ['BHA'],
    cas: '69-72-7',
    function: 'active',
    irritant: 'medium',
    comedogenic: 0,
    natural: true,
    benefits: ['Exfoliant', 'Anti-acne', 'Penetre les pores'],
    pregnancy_warning: true,
    max_concentration: 2.0
  },

  // === FILTRES UV ===
  {
    inci: 'OCTOCRYLENE',
    name: 'Octocrylene',
    cas: '6197-30-4',
    function: 'uv_filter',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    environmental_hazard: true,
    coral_toxic: true,
    concerns: ['Toxique pour coraux', 'Allergisant potentiel'],
    max_concentration: 10.0
  },
  {
    inci: 'OXYBENZONE',
    name: 'Oxybenzone',
    synonyms: ['Benzophenone-3'],
    cas: '131-57-7',
    function: 'uv_filter',
    irritant: 'medium',
    comedogenic: 0,
    natural: false,
    endocrine_disruptor: true,
    environmental_hazard: true,
    coral_toxic: true,
    banned_in: ['Hawaii', 'Palau', 'US Virgin Islands'],
    concerns: ['Perturbateur endocrinien', 'Detruit coraux']
  },
  {
    inci: 'ZINC OXIDE',
    name: 'Oxyde de zinc',
    cas: '1314-13-2',
    function: 'uv_filter',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    mineral: true,
    nano: true,
    benefits: ['Filtre mineral sur', 'Large spectre'],
    description: 'Filtre UV mineral, le plus sur'
  },
  {
    inci: 'TITANIUM DIOXIDE',
    name: 'Dioxyde de titane',
    cas: '13463-67-7',
    function: 'uv_filter',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    mineral: true,
    nano: true,
    concerns: ['Nanoparticules controversees'],
    description: 'Filtre mineral efficace'
  },

  // === COLORANTS ===
  {
    inci: 'CI 15985',
    name: 'Jaune orange S',
    synonyms: ['Yellow 6', 'Sunset Yellow'],
    function: 'colorant',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    azo_dye: true,
    allergen: true,
    concerns: ['Colorant azoique', 'Allergisant']
  },
  {
    inci: 'CI 42090',
    name: 'Bleu brillant FCF',
    synonyms: ['Blue 1'],
    function: 'colorant',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    description: 'Colorant synthetique bleu'
  },
  {
    inci: 'CI 77891',
    name: 'Dioxyde de titane',
    synonyms: ['Titanium Dioxide'],
    function: 'colorant',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    mineral: true,
    description: 'Pigment blanc mineral'
  },

  // === PARFUMS & ALLERGË†NES ===
  {
    inci: 'PARFUM',
    name: 'Parfum',
    synonyms: ['Fragrance'],
    function: 'fragrance',
    irritant: 'medium',
    comedogenic: 0,
    natural: false,
    allergen: true,
    concerns: ['Melange non detaille', 'Allergisant potentiel'],
    description: 'Composition parfumante non detaillee'
  },
  {
    inci: 'LINALOOL',
    name: 'Linalol',
    cas: '78-70-6',
    function: 'fragrance',
    irritant: 'low',
    comedogenic: 0,
    natural: true,
    allergen: true,
    allergen_type: 'fragrance',
    declaration_required: true,
    description: 'Allergene du parfum Â  declarer'
  },
  {
    inci: 'LIMONENE',
    name: 'Limonene',
    cas: '138-86-3',
    function: 'fragrance',
    irritant: 'low',
    comedogenic: 0,
    natural: true,
    allergen: true,
    allergen_type: 'fragrance',
    declaration_required: true,
    description: 'Composant d\'agrumes, allergene'
  },
  {
    inci: 'GERANIOL',
    name: 'Geraniol',
    cas: '106-24-1',
    function: 'fragrance',
    irritant: 'medium',
    comedogenic: 0,
    natural: true,
    allergen: true,
    allergen_type: 'fragrance',
    declaration_required: true,
    description: 'Allergene du parfum, odeur de rose'
  },

  // === SOLVANTS ===
  {
    inci: 'ALCOHOL DENAT.',
    name: 'Alcool denature',
    synonyms: ['Denatured Alcohol'],
    function: 'solvent',
    irritant: 'high',
    comedogenic: 0,
    natural: false,
    concerns: ['Dessechant', 'Irritant'],
    description: 'Alcool assechant pour la peau'
  },
  {
    inci: 'PROPYLENE GLYCOL',
    name: 'Propylene glycol',
    cas: '57-55-6',
    function: 'solvent',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    concerns: ['Irritant pour certains'],
    description: 'Solvant et humectant controverse'
  },

  // === AGENTS DE TEXTURE ===
  {
    inci: 'CARBOMER',
    name: 'Carbomere',
    function: 'viscosity_agent',
    irritant: 'very_low',
    comedogenic: 0,
    natural: false,
    polymer: true,
    description: 'Gelifiant synthetique sur'
  },
  {
    inci: 'XANTHAN GUM',
    name: 'Gomme xanthane',
    cas: '11138-66-2',
    function: 'viscosity_agent',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    biotechnology: true,
    description: 'â€°paississant naturel fermente'
  },

  // === ANTIOXYDANTS ===
  {
    inci: 'TOCOPHEROL',
    name: 'Tocopherol',
    synonyms: ['Vitamin E'],
    function: 'antioxidant',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    benefits: ['Antioxydant', 'Protege la formule'],
    description: 'Vitamine E naturelle'
  },
  {
    inci: 'BHT',
    name: 'Butylhydroxytoluene',
    cas: '128-37-0',
    function: 'antioxidant',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    endocrine_disruptor: true,
    concerns: ['Perturbateur endocrinien potentiel'],
    description: 'Antioxydant synthetique controverse'
  }
];

// Fonction pour rechercher un ingredient
function findIngredient(searchTerm) {
  const normalized = searchTerm.toLowerCase().trim();
  
  return inciDatabase.find(ing => 
    ing.inci.toLowerCase() === normalized ||
    ing.name.toLowerCase() === normalized ||
    (ing.synonyms && ing.synonyms.some(syn => syn.toLowerCase() === normalized)) ||
    ing.cas === searchTerm
  );
}

// Fonction pour obtenir tous les ingredients d'une categorie
function getIngredientsByFunction(functionType) {
  return inciDatabase.filter(ing => ing.function === functionType);
}

// Fonction pour obtenir les ingredients preoccupants
function getConcerningIngredients() {
  return inciDatabase.filter(ing => 
    ing.endocrine_disruptor || 
    ing.cmr || 
    ing.environmental_hazard ||
    ing.irritant === 'high' ||
    ing.banned_in?.length > 0
  );
}

module.exports = {
  inciDatabase,
  findIngredient,
  getIngredientsByFunction,
  getConcerningIngredients
};
