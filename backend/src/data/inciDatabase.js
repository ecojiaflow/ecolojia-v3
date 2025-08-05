// backend/src/data/inciDatabase.js
// Base de données des ingrédients cosmétiques INCI avec scores de sécurité

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
    description: 'Tensioactif agressif, très irritant'
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
    name: 'Cocamidopropyl bétaïne',
    function: 'surfactant',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    derived_from_natural: true,
    description: 'Tensioactif doux dérivé de la noix de coco'
  },
  {
    inci: 'DECYL GLUCOSIDE',
    name: 'Décyl glucoside',
    function: 'surfactant',
    irritant: 'very_low',
    comedogenic: 0,
    natural: false,
    derived_from_natural: true,
    biodegradable: true,
    description: 'Tensioactif très doux, idéal peaux sensibles'
  },

  // === CONSERVATEURS ===
  {
    inci: 'METHYLPARABEN',
    name: 'Méthylparabène',
    cas: '99-76-3',
    function: 'preservative',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    endocrine_disruptor: true,
    concerns: ['Perturbateur endocrinien suspecté'],
    max_concentration: 0.4
  },
  {
    inci: 'PROPYLPARABEN',
    name: 'Propylparabène',
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
    name: 'Phénoxyéthanol',
    cas: '122-99-6',
    function: 'preservative',
    irritant: 'medium',
    comedogenic: 0,
    natural: false,
    allergen: true,
    concerns: ['Allergisant', 'Toxique à haute dose'],
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
    description: 'Conservateur doux autorisé en bio'
  },

  // === ÉMOLLIENTS & HYDRATANTS ===
  {
    inci: 'GLYCERIN',
    name: 'Glycérine',
    synonyms: ['Glycerol'],
    cas: '56-81-5',
    function: 'humectant',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    vegetable_origin: true,
    description: 'Humectant naturel très sûr'
  },
  {
    inci: 'HYALURONIC ACID',
    name: 'Acide hyaluronique',
    function: 'moisturizer',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    biotechnology: true,
    benefits: ['Hydratation intense', 'Anti-âge'],
    description: 'Actif hydratant haute performance'
  },
  {
    inci: 'DIMETHICONE',
    name: 'Diméthicone',
    function: 'emollient',
    irritant: 'very_low',
    comedogenic: 1,
    natural: false,
    silicone: true,
    environmental_hazard: true,
    concerns: ['Non biodégradable', 'Occlusif'],
    description: 'Silicone controversé mais sûr'
  },
  {
    inci: 'SHEA BUTTER',
    name: 'Beurre de karité',
    inci_official: 'BUTYROSPERMUM PARKII BUTTER',
    function: 'emollient',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    benefits: ['Nourrissant', 'Réparateur'],
    description: 'Beurre végétal très nourrissant'
  },

  // === ACTIFS ===
  {
    inci: 'RETINOL',
    name: 'Rétinol',
    synonyms: ['Vitamin A'],
    function: 'active',
    irritant: 'high',
    comedogenic: 0,
    natural: false,
    pregnancy_warning: true,
    benefits: ['Anti-âge puissant', 'Renouvellement cellulaire'],
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
    benefits: ['Anti-inflammatoire', 'Régulateur sébum', 'Éclaircissant'],
    description: 'Actif polyvalent très bien toléré'
  },
  {
    inci: 'ASCORBIC ACID',
    name: 'Acide ascorbique',
    synonyms: ['Vitamin C'],
    function: 'active',
    irritant: 'medium',
    comedogenic: 0,
    natural: true,
    benefits: ['Antioxydant', 'Éclaircissant', 'Stimule collagène'],
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
    benefits: ['Exfoliant', 'Anti-acné', 'Pénètre les pores'],
    pregnancy_warning: true,
    max_concentration: 2.0
  },

  // === FILTRES UV ===
  {
    inci: 'OCTOCRYLENE',
    name: 'Octocrylène',
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
    concerns: ['Perturbateur endocrinien', 'Détruit coraux']
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
    benefits: ['Filtre minéral sûr', 'Large spectre'],
    description: 'Filtre UV minéral, le plus sûr'
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
    concerns: ['Nanoparticules controversées'],
    description: 'Filtre minéral efficace'
  },

  // === COLORANTS ===
  {
    inci: 'CI 15985',
    name: 'Jaune orangé S',
    synonyms: ['Yellow 6', 'Sunset Yellow'],
    function: 'colorant',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    azo_dye: true,
    allergen: true,
    concerns: ['Colorant azoïque', 'Allergisant']
  },
  {
    inci: 'CI 42090',
    name: 'Bleu brillant FCF',
    synonyms: ['Blue 1'],
    function: 'colorant',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    description: 'Colorant synthétique bleu'
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
    description: 'Pigment blanc minéral'
  },

  // === PARFUMS & ALLERGÈNES ===
  {
    inci: 'PARFUM',
    name: 'Parfum',
    synonyms: ['Fragrance'],
    function: 'fragrance',
    irritant: 'medium',
    comedogenic: 0,
    natural: false,
    allergen: true,
    concerns: ['Mélange non détaillé', 'Allergisant potentiel'],
    description: 'Composition parfumante non détaillée'
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
    description: 'Allergène du parfum à déclarer'
  },
  {
    inci: 'LIMONENE',
    name: 'Limonène',
    cas: '138-86-3',
    function: 'fragrance',
    irritant: 'low',
    comedogenic: 0,
    natural: true,
    allergen: true,
    allergen_type: 'fragrance',
    declaration_required: true,
    description: 'Composant d\'agrumes, allergène'
  },
  {
    inci: 'GERANIOL',
    name: 'Géraniol',
    cas: '106-24-1',
    function: 'fragrance',
    irritant: 'medium',
    comedogenic: 0,
    natural: true,
    allergen: true,
    allergen_type: 'fragrance',
    declaration_required: true,
    description: 'Allergène du parfum, odeur de rose'
  },

  // === SOLVANTS ===
  {
    inci: 'ALCOHOL DENAT.',
    name: 'Alcool dénaturé',
    synonyms: ['Denatured Alcohol'],
    function: 'solvent',
    irritant: 'high',
    comedogenic: 0,
    natural: false,
    concerns: ['Desséchant', 'Irritant'],
    description: 'Alcool asséchant pour la peau'
  },
  {
    inci: 'PROPYLENE GLYCOL',
    name: 'Propylène glycol',
    cas: '57-55-6',
    function: 'solvent',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    concerns: ['Irritant pour certains'],
    description: 'Solvant et humectant controversé'
  },

  // === AGENTS DE TEXTURE ===
  {
    inci: 'CARBOMER',
    name: 'Carbomère',
    function: 'viscosity_agent',
    irritant: 'very_low',
    comedogenic: 0,
    natural: false,
    polymer: true,
    description: 'Gélifiant synthétique sûr'
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
    description: 'Épaississant naturel fermenté'
  },

  // === ANTIOXYDANTS ===
  {
    inci: 'TOCOPHEROL',
    name: 'Tocophérol',
    synonyms: ['Vitamin E'],
    function: 'antioxidant',
    irritant: 'very_low',
    comedogenic: 0,
    natural: true,
    benefits: ['Antioxydant', 'Protège la formule'],
    description: 'Vitamine E naturelle'
  },
  {
    inci: 'BHT',
    name: 'Butylhydroxytoluène',
    cas: '128-37-0',
    function: 'antioxidant',
    irritant: 'low',
    comedogenic: 0,
    natural: false,
    endocrine_disruptor: true,
    concerns: ['Perturbateur endocrinien potentiel'],
    description: 'Antioxydant synthétique controversé'
  }
];

// Fonction pour rechercher un ingrédient
function findIngredient(searchTerm) {
  const normalized = searchTerm.toLowerCase().trim();
  
  return inciDatabase.find(ing => 
    ing.inci.toLowerCase() === normalized ||
    ing.name.toLowerCase() === normalized ||
    (ing.synonyms && ing.synonyms.some(syn => syn.toLowerCase() === normalized)) ||
    ing.cas === searchTerm
  );
}

// Fonction pour obtenir tous les ingrédients d'une catégorie
function getIngredientsByFunction(functionType) {
  return inciDatabase.filter(ing => ing.function === functionType);
}

// Fonction pour obtenir les ingrédients préoccupants
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
