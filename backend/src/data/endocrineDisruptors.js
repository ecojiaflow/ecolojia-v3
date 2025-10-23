// backend/src/data/endocrineDisruptors.js
// Base de donnees des perturbateurs endocriniens confirmes et suspectes

const endocrineDisruptors = [
  // === PARABË†NES ===
  {
    name: 'Methylparaben',
    inci: 'METHYLPARABEN',
    cas: '99-76-3',
    category: 'paraben',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Oestrogen-like activity', 'Reproductive toxicity'],
    sources: ['TEDX', 'EU Priority List']
  },
  {
    name: 'Ethylparaben',
    inci: 'ETHYLPARABEN',
    cas: '120-47-8',
    category: 'paraben',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Oestrogen-like activity'],
    sources: ['TEDX', 'Danish EPA']
  },
  {
    name: 'Propylparaben',
    inci: 'PROPYLPARABEN',
    cas: '94-13-3',
    category: 'paraben',
    status: 'confirmed',
    evidence_level: 'high',
    effects: ['Oestrogen-like activity', 'Sperm quality reduction'],
    banned_in: ['Denmark (in products for children under 3)'],
    sources: ['EU Scientific Committee', 'TEDX']
  },
  {
    name: 'Butylparaben',
    inci: 'BUTYLPARABEN',
    cas: '94-26-8',
    category: 'paraben',
    status: 'confirmed',
    evidence_level: 'high',
    effects: ['Strong oestrogenic activity', 'Reproductive toxicity'],
    banned_in: ['EU (in leave-on products)', 'ASEAN'],
    sources: ['EU SCCS', 'TEDX']
  },
  {
    name: 'Isobutylparaben',
    inci: 'ISOBUTYLPARABEN',
    cas: '4247-02-3',
    category: 'paraben',
    status: 'confirmed',
    evidence_level: 'high',
    effects: ['Oestrogenic activity', 'Reproductive toxicity'],
    banned_in: ['EU', 'ASEAN'],
    sources: ['EU Regulation 358/2014']
  },

  // === FILTRES UV ===
  {
    name: 'Benzophenone-3',
    inci: 'OXYBENZONE',
    cas: '131-57-7',
    category: 'uv_filter',
    status: 'confirmed',
    evidence_level: 'high',
    effects: ['Oestrogenic activity', 'Thyroid disruption', 'Coral bleaching'],
    banned_in: ['Hawaii', 'Palau', 'US Virgin Islands', 'Aruba'],
    sources: ['NIEHS', 'TEDX', 'Environmental studies']
  },
  {
    name: 'Benzophenone-1',
    inci: 'BENZOPHENONE-1',
    cas: '131-56-6',
    category: 'uv_filter',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Oestrogenic activity'],
    sources: ['TEDX']
  },
  {
    name: '4-Methylbenzylidene camphor',
    inci: '4-METHYLBENZYLIDENE CAMPHOR',
    cas: '36861-47-9',
    category: 'uv_filter',
    status: 'confirmed',
    evidence_level: 'high',
    effects: ['Thyroid disruption', 'Oestrogenic activity'],
    sources: ['EU Priority List', 'Swiss studies']
  },
  {
    name: 'Octinoxate',
    inci: 'ETHYLHEXYL METHOXYCINNAMATE',
    cas: '5466-77-3',
    category: 'uv_filter',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Thyroid disruption', 'Reproductive effects'],
    banned_in: ['Hawaii', 'Palau'],
    sources: ['Environmental studies']
  },
  {
    name: 'Homosalate',
    inci: 'HOMOSALATE',
    cas: '118-56-9',
    category: 'uv_filter',
    status: 'suspected',
    evidence_level: 'low',
    effects: ['Weak oestrogenic activity'],
    sources: ['In vitro studies']
  },

  // === PHTALATES ===
  {
    name: 'Diethyl phthalate',
    inci: 'DIETHYL PHTHALATE',
    cas: '84-66-2',
    category: 'phthalate',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Anti-androgenic activity'],
    sources: ['TEDX', 'EPA']
  },
  {
    name: 'Dibutyl phthalate',
    inci: 'DIBUTYL PHTHALATE',
    cas: '84-74-2',
    category: 'phthalate',
    status: 'confirmed',
    evidence_level: 'high',
    effects: ['Reproductive toxicity', 'Anti-androgenic'],
    banned_in: ['EU (in cosmetics)'],
    sources: ['EU Regulation', 'REACH']
  },

  // === AUTRES SUBSTANCES ===
  {
    name: 'Triclosan',
    inci: 'TRICLOSAN',
    cas: '3380-34-5',
    category: 'antimicrobial',
    status: 'confirmed',
    evidence_level: 'high',
    effects: ['Thyroid disruption', 'Antibiotic resistance'],
    banned_in: ['EU (in some products)', 'FDA banned in soaps'],
    sources: ['FDA', 'EU SCCS', 'TEDX']
  },
  {
    name: 'BHA',
    inci: 'BHA',
    cas: '25013-16-5',
    category: 'antioxidant',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Thyroid disruption', 'Reproductive effects'],
    sources: ['TEDX', 'California Prop 65']
  },
  {
    name: 'BHT',
    inci: 'BHT',
    cas: '128-37-0',
    category: 'antioxidant',
    status: 'suspected',
    evidence_level: 'low',
    effects: ['Thyroid disruption potential'],
    sources: ['Some animal studies']
  },
  {
    name: 'Resorcinol',
    inci: 'RESORCINOL',
    cas: '108-46-3',
    category: 'hair_dye',
    status: 'confirmed',
    evidence_level: 'moderate',
    effects: ['Thyroid disruption'],
    sources: ['EU Priority List', 'SCCS opinions']
  },
  {
    name: 'Cyclotetrasiloxane',
    inci: 'CYCLOTETRASILOXANE',
    cas: '556-67-2',
    category: 'silicone',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Reproductive toxicity', 'Bioaccumulation'],
    restricted_in: ['EU (wash-off products > 0.1%)'],
    sources: ['ECHA', 'Environment Canada']
  },
  {
    name: 'Cyclopentasiloxane',
    inci: 'CYCLOPENTASILOXANE',
    cas: '541-02-6',
    category: 'silicone',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Reproductive toxicity', 'Bioaccumulation'],
    restricted_in: ['EU (wash-off products > 0.1%)'],
    sources: ['ECHA', 'Environment Canada']
  },

  // === CONSERVATEURS ===
  {
    name: 'Formaldehyde',
    inci: 'FORMALDEHYDE',
    cas: '50-00-0',
    category: 'preservative',
    status: 'confirmed',
    evidence_level: 'high',
    effects: ['Carcinogenic', 'Respiratory sensitizer'],
    banned_in: ['EU (as preservative)', 'Japan', 'Sweden'],
    sources: ['IARC', 'EU CMR']
  },
  {
    name: 'DMDM Hydantoin',
    inci: 'DMDM HYDANTOIN',
    cas: '6440-58-0',
    category: 'preservative',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Formaldehyde releaser'],
    sources: ['Formaldehyde release']
  },
  {
    name: 'Imidazolidinyl urea',
    inci: 'IMIDAZOLIDINYL UREA',
    cas: '39236-46-9',
    category: 'preservative',
    status: 'suspected',
    evidence_level: 'low',
    effects: ['Formaldehyde releaser'],
    sources: ['Formaldehyde release']
  },
  {
    name: 'Quaternium-15',
    inci: 'QUATERNIUM-15',
    cas: '51229-78-8',
    category: 'preservative',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Formaldehyde releaser', 'Contact allergen'],
    sources: ['Formaldehyde release', 'Patch test data']
  },

  // === MUSCS SYNTHâ€°TIQUES ===
  {
    name: 'Galaxolide',
    inci: 'HHCB',
    cas: '1222-05-5',
    category: 'fragrance',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Weak oestrogenic activity', 'Bioaccumulation'],
    sources: ['Environmental studies', 'OSPAR']
  },
  {
    name: 'Tonalide',
    inci: 'AHTN',
    cas: '21145-77-7',
    category: 'fragrance',
    status: 'suspected',
    evidence_level: 'moderate',
    effects: ['Weak oestrogenic activity', 'Bioaccumulation'],
    sources: ['Environmental studies', 'OSPAR']
  },

  // === ETHERS DE GLYCOL ===
  {
    name: 'Phenoxyethanol',
    inci: 'PHENOXYETHANOL',
    cas: '122-99-6',
    category: 'preservative',
    status: 'under_evaluation',
    evidence_level: 'low',
    effects: ['Potential reproductive effects at high doses'],
    restricted_in: ['France (in baby wipes)'],
    sources: ['ANSM', 'Some animal studies']
  }
];

// Fonction pour verifier si un ingredient est un perturbateur endocrinien
function isEndocrineDisruptor(inci, cas) {
  return endocrineDisruptors.some(ed => 
    ed.inci === inci || 
    ed.cas === cas ||
    ed.name.toLowerCase() === inci.toLowerCase()
  );
}

// Fonction pour obtenir les details d'un perturbateur endocrinien
function getDisruptorDetails(inci, cas) {
  return endocrineDisruptors.find(ed => 
    ed.inci === inci || 
    ed.cas === cas ||
    ed.name.toLowerCase() === inci.toLowerCase()
  );
}

// Fonction pour obtenir tous les perturbateurs confirmes
function getConfirmedDisruptors() {
  return endocrineDisruptors.filter(ed => ed.status === 'confirmed');
}

// Fonction pour obtenir les perturbateurs par categorie
function getDisruptorsByCategory(category) {
  return endocrineDisruptors.filter(ed => ed.category === category);
}

// Statistiques sur la base
const stats = {
  total: endocrineDisruptors.length,
  confirmed: endocrineDisruptors.filter(ed => ed.status === 'confirmed').length,
  suspected: endocrineDisruptors.filter(ed => ed.status === 'suspected').length,
  categories: [...new Set(endocrineDisruptors.map(ed => ed.category))]
};

module.exports = {
  endocrineDisruptors,
  isEndocrineDisruptor,
  getDisruptorDetails,
  getConfirmedDisruptors,
  getDisruptorsByCategory,
  stats
};
