// backend/src/data/chemicalDatabase.js

/**
 * Base de donnees des composants chimiques pour detergents
 * Incluant biodegradabilite, toxicite, CDV, etc.
 */

const chemicalDatabase = [
  // ===== TENSIOACTIFS ANIONIQUES =====
  {
    name: "Sodium Lauryl Sulfate",
    inci: "SODIUM LAURYL SULFATE",
    cas: "151-21-3",
    synonyms: ["SLS", "SDS", "Sodium Dodecyl Sulfate"],
    category: "surfactant",
    function: "surfactant",
    biodegradability: 95, // % en 28 jours
    aquaticToxicity: "moderate",
    cdvFactor: 270,
    irritant: "high",
    eyeIrritant: true,
    optimalConcentration: 10,
    description: "Tensioactif anionique tres moussant mais irritant"
  },
  {
    name: "Sodium Laureth Sulfate",
    inci: "SODIUM LAURETH SULFATE",
    cas: "68585-34-2",
    synonyms: ["SLES", "Sodium Lauryl Ether Sulfate"],
    category: "surfactant",
    function: "surfactant",
    biodegradability: 90,
    aquaticToxicity: "low",
    cdvFactor: 150,
    irritant: "moderate",
    optimalConcentration: 15,
    description: "Tensioactif plus doux que SLS"
  },
  {
    name: "Linear Alkylbenzene Sulfonate",
    inci: "SODIUM C10-13 ALKYL BENZENESULFONATE",
    cas: "68411-30-3",
    synonyms: ["LAS", "LABS"],
    category: "surfactant",
    function: "surfactant",
    biodegradability: 98,
    aquaticToxicity: "moderate",
    cdvFactor: 200,
    irritant: "moderate",
    optimalConcentration: 8,
    description: "Tensioactif principal des lessives"
  },
  {
    name: "Sodium Cocoyl Isethionate",
    inci: "SODIUM COCOYL ISETHIONATE",
    cas: "61789-32-0",
    synonyms: ["SCI"],
    category: "surfactant",
    function: "surfactant",
    biodegradability: 85,
    aquaticToxicity: "low",
    cdvFactor: 80,
    irritant: "low",
    optimalConcentration: 5,
    description: "Tensioactif doux d'origine vegetale"
  },

  // ===== TENSIOACTIFS NON-IONIQUES =====
  {
    name: "Alcohol Ethoxylate",
    inci: "C12-15 PARETH-7",
    cas: "68131-39-5",
    synonyms: ["AE", "Fatty Alcohol Ethoxylate"],
    category: "surfactant",
    function: "surfactant",
    biodegradability: 95,
    aquaticToxicity: "low",
    cdvFactor: 100,
    irritant: "low",
    optimalConcentration: 5,
    description: "Tensioactif non-ionique biodegradable"
  },
  {
    name: "Alkyl Polyglucoside",
    inci: "DECYL GLUCOSIDE",
    cas: "68515-73-1",
    synonyms: ["APG", "Decyl Glucoside"],
    category: "surfactant",
    function: "surfactant",
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 50,
    irritant: false,
    optimalConcentration: 8,
    description: "Tensioactif tres doux issu du sucre"
  },
  {
    name: "Cocamidopropyl Betaine",
    inci: "COCAMIDOPROPYL BETAINE",
    cas: "61789-40-0",
    synonyms: ["CAPB"],
    category: "surfactant",
    function: "surfactant",
    biodegradability: 85,
    aquaticToxicity: "low",
    cdvFactor: 120,
    irritant: "low",
    allergen: true,
    optimalConcentration: 3,
    description: "Co-tensioactif amphotere"
  },

  // ===== BUILDERS (AGENTS ANTI-CALCAIRE) =====
  {
    name: "Sodium Carbonate",
    inci: "SODIUM CARBONATE",
    cas: "497-19-8",
    synonyms: ["Soda Ash", "Washing Soda"],
    category: "builder",
    function: "builder",
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 10,
    ph: 11.5,
    irritant: "moderate",
    optimalConcentration: 20,
    description: "Adoucisseur d'eau alcalin"
  },
  {
    name: "Sodium Citrate",
    inci: "SODIUM CITRATE",
    cas: "68-04-2",
    synonyms: ["Trisodium Citrate"],
    category: "builder",
    function: "builder",
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 5,
    irritant: false,
    optimalConcentration: 15,
    description: "Chelateur biodegradable"
  },
  {
    name: "Zeolite A",
    inci: "ZEOLITE",
    cas: "1318-02-1",
    synonyms: ["Sodium Aluminosilicate"],
    category: "builder",
    function: "builder",
    biodegradability: 100, // Inorganique
    aquaticToxicity: "very_low",
    cdvFactor: 1,
    irritant: false,
    optimalConcentration: 25,
    description: "Substitut ecologique des phosphates"
  },
  {
    name: "EDTA",
    inci: "TETRASODIUM EDTA",
    cas: "64-02-8",
    synonyms: ["Ethylenediaminetetraacetic acid"],
    category: "chelating",
    function: "builder",
    biodegradability: 0, // Non biodegradable
    aquaticToxicity: "moderate",
    cdvFactor: 500,
    persistent: true,
    bioaccumulative: true,
    optimalConcentration: 0.5,
    description: "Chelateur puissant mais non biodegradable"
  },

  // ===== PHOSPHATES =====
  {
    name: "Sodium Tripolyphosphate",
    inci: "SODIUM TRIPOLYPHOSPHATE",
    cas: "7758-29-4",
    synonyms: ["STPP", "Pentasodium Triphosphate"],
    category: "phosphate",
    function: "builder",
    phosphateType: "polyphosphate",
    biodegradability: 100, // Mais eutrophisation
    aquaticToxicity: "high", // Eutrophisation
    cdvFactor: 50,
    irritant: "low",
    optimalConcentration: 30,
    banned_eu: true, // Pour lessives domestiques
    description: "Builder efficace mais cause l'eutrophisation"
  },
  {
    name: "Tetrasodium Pyrophosphate",
    inci: "TETRASODIUM PYROPHOSPHATE",
    cas: "7722-88-5",
    synonyms: ["TSPP"],
    category: "phosphate",
    function: "builder",
    phosphateType: "pyrophosphate",
    biodegradability: 100,
    aquaticToxicity: "high",
    cdvFactor: 45,
    irritant: "low",
    optimalConcentration: 10,
    description: "Phosphate pour lave-vaisselle"
  },

  // ===== ENZYMES =====
  {
    name: "Protease",
    inci: "SUBTILISIN",
    cas: "9014-01-1",
    synonyms: ["Alcalase", "Savinase"],
    category: "enzyme",
    function: "enzyme",
    enzyme: true,
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 1,
    respiratorySensitizer: true,
    optimalConcentration: 0.5,
    description: "Enzyme degradant les proteines"
  },
  {
    name: "Amylase",
    inci: "AMYLASE",
    cas: "9000-92-4",
    synonyms: ["Alpha-Amylase"],
    category: "enzyme",
    function: "enzyme",
    enzyme: true,
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 1,
    respiratorySensitizer: true,
    optimalConcentration: 0.3,
    description: "Enzyme degradant l'amidon"
  },
  {
    name: "Lipase",
    inci: "LIPASE",
    cas: "9001-62-1",
    synonyms: ["Triacylglycerol Lipase"],
    category: "enzyme",
    function: "enzyme",
    enzyme: true,
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 1,
    respiratorySensitizer: true,
    optimalConcentration: 0.2,
    description: "Enzyme degradant les graisses"
  },
  {
    name: "Cellulase",
    inci: "CELLULASE",
    cas: "9012-54-8",
    synonyms: [],
    category: "enzyme",
    function: "enzyme",
    enzyme: true,
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 1,
    respiratorySensitizer: true,
    optimalConcentration: 0.1,
    description: "Enzyme anti-boulochage"
  },

  // ===== AGENTS DE BLANCHIMENT =====
  {
    name: "Sodium Percarbonate",
    inci: "SODIUM CARBONATE PEROXIDE",
    cas: "15630-89-4",
    synonyms: ["Oxygen Bleach"],
    category: "bleach",
    function: "bleaching",
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 5,
    irritant: "moderate",
    optimalConcentration: 10,
    description: "Agent blanchissant   l'oxygene actif"
  },
  {
    name: "Sodium Hypochlorite",
    inci: "SODIUM HYPOCHLORITE",
    cas: "7681-52-9",
    synonyms: ["Bleach", "Eau de Javel"],
    category: "bleach",
    function: "bleaching",
    biodegradability: 100, // Se decompose rapidement
    aquaticToxicity: "high",
    cdvFactor: 1000,
    corrosive: true,
    irritant: "high",
    respiratoryIrritant: true,
    optimalConcentration: 2,
    description: "Agent blanchissant chlore puissant"
  },
  {
    name: "TAED",
    inci: "TETRAACETYLETHYLENEDIAMINE",
    cas: "10543-57-4",
    synonyms: ["Bleach Activator"],
    category: "bleach_activator",
    function: "bleaching",
    biodegradability: 90,
    aquaticToxicity: "low",
    cdvFactor: 50,
    irritant: "low",
    optimalConcentration: 2,
    description: "Activateur de blanchiment basse temperature"
  },

  // ===== SOLVANTS =====
  {
    name: "Ethanol",
    inci: "ALCOHOL",
    cas: "64-17-5",
    synonyms: ["Ethyl Alcohol"],
    category: "solvent",
    function: "solvent",
    voc: true,
    vocCategory: "alcohol",
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 10,
    irritant: "low",
    flammable: true,
    optimalConcentration: 5,
    description: "Solvant volatil biodegradable"
  },
  {
    name: "Isopropanol",
    inci: "ISOPROPYL ALCOHOL",
    cas: "67-63-0",
    synonyms: ["IPA", "2-Propanol"],
    category: "solvent",
    function: "solvent",
    voc: true,
    vocCategory: "alcohol",
    biodegradability: 95,
    aquaticToxicity: "very_low",
    cdvFactor: 15,
    irritant: "moderate",
    flammable: true,
    optimalConcentration: 10,
    description: "Solvant degraissant volatil"
  },
  {
    name: "Propylene Glycol",
    inci: "PROPYLENE GLYCOL",
    cas: "57-55-6",
    synonyms: ["1,2-Propanediol"],
    category: "solvent",
    function: "solvent",
    biodegradability: 90,
    aquaticToxicity: "very_low",
    cdvFactor: 5,
    irritant: false,
    optimalConcentration: 5,
    description: "Solvant doux non volatil"
  },
  {
    name: "D-Limonene",
    inci: "LIMONENE",
    cas: "5989-27-5",
    synonyms: ["Orange Terpene"],
    category: "solvent",
    function: "degreaser",
    voc: true,
    vocCategory: "terpene",
    biodegradability: 80,
    aquaticToxicity: "moderate",
    cdvFactor: 200,
    irritant: "moderate",
    allergen: true,
    optimalConcentration: 2,
    description: "Solvant naturel degraissant d'agrumes"
  },

  // ===== ACIDES =====
  {
    name: "Citric Acid",
    inci: "CITRIC ACID",
    cas: "77-92-9",
    synonyms: ["Acide Citrique"],
    category: "acid",
    function: "acid",
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 2,
    ph: 2.2,
    irritant: "low",
    optimalConcentration: 5,
    description: "Acide naturel anti-calcaire"
  },
  {
    name: "Lactic Acid",
    inci: "LACTIC ACID",
    cas: "79-33-4",
    synonyms: ["Acide Lactique"],
    category: "acid",
    function: "acid",
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 3,
    ph: 2.4,
    irritant: "low",
    optimalConcentration: 3,
    description: "Acide naturel doux"
  },
  {
    name: "Phosphoric Acid",
    inci: "PHOSPHORIC ACID",
    cas: "7664-38-2",
    synonyms: ["Acide Phosphorique"],
    category: "acid",
    function: "acid",
    biodegradability: 100,
    aquaticToxicity: "low",
    cdvFactor: 20,
    ph: 1.5,
    corrosive: true,
    irritant: "high",
    optimalConcentration: 2,
    description: "Acide fort anti-rouille"
  },
  {
    name: "Sulfamic Acid",
    inci: "SULFAMIC ACID",
    cas: "5329-14-6",
    synonyms: ["Acide Sulfamique"],
    category: "acid",
    function: "acid",
    biodegradability: 90,
    aquaticToxicity: "low",
    cdvFactor: 30,
    ph: 1.2,
    irritant: "high",
    optimalConcentration: 5,
    description: "Acide detartrant puissant"
  },

  // ===== CONSERVATEURS =====
  {
    name: "Methylisothiazolinone",
    inci: "METHYLISOTHIAZOLINONE",
    cas: "2682-20-4",
    synonyms: ["MIT", "MI"],
    category: "preservative",
    function: "preservative",
    biodegradability: 70,
    aquaticToxicity: "high",
    cdvFactor: 500,
    irritant: "high",
    allergen: true,
    sensitizer: true,
    optimalConcentration: 0.01,
    description: "Conservateur tres allergisant"
  },
  {
    name: "Benzisothiazolinone",
    inci: "BENZISOTHIAZOLINONE",
    cas: "2634-33-5",
    synonyms: ["BIT"],
    category: "preservative",
    function: "preservative",
    biodegradability: 75,
    aquaticToxicity: "moderate",
    cdvFactor: 300,
    irritant: "moderate",
    allergen: true,
    sensitizer: true,
    optimalConcentration: 0.05,
    description: "Conservateur sensibilisant"
  },
  {
    name: "Sodium Benzoate",
    inci: "SODIUM BENZOATE",
    cas: "532-32-1",
    synonyms: ["Benzoate de Sodium"],
    category: "preservative",
    function: "preservative",
    biodegradability: 95,
    aquaticToxicity: "very_low",
    cdvFactor: 10,
    irritant: false,
    optimalConcentration: 0.5,
    description: "Conservateur doux alimentaire"
  },

  // ===== PARFUMS =====
  {
    name: "Fragrance",
    inci: "PARFUM",
    cas: "mixture",
    synonyms: ["Perfume"],
    category: "fragrance",
    function: "fragrance",
    biodegradability: 60, // Variable
    aquaticToxicity: "moderate",
    cdvFactor: 200,
    irritant: "low",
    allergen: true,
    voc: true,
    vocCategory: "fragrance",
    optimalConcentration: 0.5,
    description: "Melange de substances odorantes"
  },

  // ===== COLORANTS =====
  {
    name: "CI 42090",
    inci: "CI 42090",
    cas: "3844-45-9",
    synonyms: ["Blue 1", "Brilliant Blue FCF"],
    category: "colorant",
    function: "colorant",
    biodegradability: 50,
    aquaticToxicity: "low",
    cdvFactor: 100,
    irritant: false,
    optimalConcentration: 0.001,
    description: "Colorant bleu synthetique"
  },

  // ===== AGENTS ANTI-MOUSSE =====
  {
    name: "Simethicone",
    inci: "DIMETHICONE",
    cas: "8050-81-5",
    synonyms: ["Antifoam"],
    category: "antifoam",
    function: "antifoam",
    biodegradability: 0, // Non biodegradable
    aquaticToxicity: "low",
    cdvFactor: 50,
    persistent: true,
    irritant: false,
    optimalConcentration: 0.1,
    description: "Agent anti-mousse silicone"
  },

  // ===== POLYMˆRES =====
  {
    name: "Polycarboxylate",
    inci: "SODIUM POLYACRYLATE",
    cas: "9003-04-7",
    synonyms: ["Acrylic Acid Polymer"],
    category: "polymer",
    function: "anti_redeposition",
    biodegradability: 40,
    aquaticToxicity: "low",
    cdvFactor: 150,
    irritant: false,
    optimalConcentration: 2,
    description: "Polymere anti-redeposition"
  },
  {
    name: "PVP",
    inci: "PVP",
    cas: "9003-39-8",
    synonyms: ["Polyvinylpyrrolidone"],
    category: "polymer",
    function: "dye_transfer_inhibitor",
    biodegradability: 30,
    aquaticToxicity: "low",
    cdvFactor: 100,
    irritant: false,
    optimalConcentration: 0.5,
    description: "Inhibiteur de transfert de couleur"
  },

  // ===== AGENTS ALCALINS =====
  {
    name: "Sodium Hydroxide",
    inci: "SODIUM HYDROXIDE",
    cas: "1310-73-2",
    synonyms: ["Caustic Soda", "Lye", "Soude Caustique"],
    category: "alkali",
    function: "ph_adjuster",
    biodegradability: 100,
    aquaticToxicity: "low", // Apres neutralisation
    cdvFactor: 20,
    ph: 14,
    corrosive: true,
    irritant: "high",
    optimalConcentration: 1,
    description: "Base forte tres caustique"
  },
  {
    name: "Potassium Hydroxide",
    inci: "POTASSIUM HYDROXIDE",
    cas: "1310-58-3",
    synonyms: ["Caustic Potash", "KOH"],
    category: "alkali",
    function: "ph_adjuster",
    biodegradability: 100,
    aquaticToxicity: "low",
    cdvFactor: 25,
    ph: 14,
    corrosive: true,
    irritant: "high",
    optimalConcentration: 1,
    description: "Base forte caustique"
  },
  {
    name: "Ammonia",
    inci: "AMMONIA",
    cas: "1336-21-6",
    synonyms: ["Ammoniac", "Ammonia Solution"],
    category: "alkali",
    function: "cleaner",
    voc: true,
    vocCategory: "ammonia",
    biodegradability: 100,
    aquaticToxicity: "moderate",
    cdvFactor: 100,
    ph: 11.6,
    irritant: "high",
    respiratoryIrritant: true,
    optimalConcentration: 5,
    description: "Nettoyant alcalin volatil"
  },

  // ===== D‰SINFECTANTS =====
  {
    name: "Benzalkonium Chloride",
    inci: "BENZALKONIUM CHLORIDE",
    cas: "68424-85-1",
    synonyms: ["BAC", "Alkyl Dimethyl Benzyl Ammonium Chloride"],
    category: "disinfectant",
    function: "disinfectant",
    biodegradability: 60,
    aquaticToxicity: "high",
    cdvFactor: 1000,
    irritant: "high",
    corrosive: true,
    optimalConcentration: 0.1,
    description: "Desinfectant quaternaire"
  },
  {
    name: "Hydrogen Peroxide",
    inci: "HYDROGEN PEROXIDE",
    cas: "7722-84-1",
    synonyms: ["Peroxyde d'Hydrogene"],
    category: "disinfectant",
    function: "disinfectant",
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 1,
    irritant: "moderate",
    corrosive: true, // € haute concentration
    optimalConcentration: 3,
    description: "Desinfectant oxydant ecologique"
  },

  // ===== CHARGES ET DILUANTS =====
  {
    name: "Sodium Sulfate",
    inci: "SODIUM SULFATE",
    cas: "7757-82-6",
    synonyms: ["Glauber's Salt"],
    category: "filler",
    function: "filler",
    biodegradability: 100,
    aquaticToxicity: "very_low",
    cdvFactor: 1,
    irritant: false,
    optimalConcentration: 40,
    description: "Charge inerte pour poudres"
  },
  {
    name: "Water",
    inci: "AQUA",
    cas: "7732-18-5",
    synonyms: ["Eau"],
    category: "solvent",
    function: "solvent",
    biodegradability: 100,
    aquaticToxicity: "none",
    cdvFactor: 0,
    irritant: false,
    optimalConcentration: 60,
    description: "Solvant universel"
  }
];

// Fonctions d'export
module.exports = {
  chemicalDatabase,
  
  // Recherche par nom
  findByName: (name) => {
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return chemicalDatabase.find(chem => 
      chem.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized ||
      chem.inci.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized ||
      chem.synonyms.some(syn => syn.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized)
    );
  },
  
  // Recherche par CAS
  findByCAS: (cas) => {
    return chemicalDatabase.find(chem => chem.cas === cas);
  },
  
  // Obtenir les substances problematiques
  getProblematicChemicals: () => {
    return chemicalDatabase.filter(chem => 
      chem.biodegradability < 60 ||
      chem.aquaticToxicity === 'high' ||
      chem.cmr ||
      chem.persistent ||
      chem.bioaccumulative
    );
  },
  
  // Obtenir les alternatives ecologiques
  getEcoFriendlyAlternatives: (category) => {
    return chemicalDatabase.filter(chem => 
      chem.category === category &&
      chem.biodegradability >= 90 &&
      (chem.aquaticToxicity === 'very_low' || chem.aquaticToxicity === 'low') &&
      !chem.persistent &&
      !chem.bioaccumulative
    );
  }
};
