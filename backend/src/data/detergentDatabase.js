// backend/src/data/detergentDatabase.js
// Base de donnees de vrais produits detergents du marche francais

const detergentProducts = [
  // === LESSIVES ===
  {
    barcode: '3178041320584',
    name: 'Ariel Original Lessive Liquide',
    brand: 'Ariel',
    category: 'laundry_detergent',
    composition: '5-15% tensioactifs anioniques, <5% tensioactifs non-ioniques, phosphonates, savon, enzymes, azurants optiques, parfum',
    labels: [],
    packaging: 'Flacon plastique 1.815L (33 lavages)',
    dosage: '55ml pour 4-5kg de linge'
  },
  {
    barcode: '8001090310798',
    name: 'Skip Ultimate Active Clean',
    brand: 'Skip',
    category: 'laundry_detergent',
    composition: '5-15% tensioactifs anioniques, <5% tensioactifs non-ioniques, phosphonates, enzymes, azurants optiques, parfum, limonene, benzisothiazolinone',
    labels: [],
    packaging: 'Flacon 1.98L (36 lavages)'
  },
  {
    barcode: '3600540289643',
    name: 'Le Chat Eco-Efficacite',
    brand: 'Le Chat',
    category: 'laundry_detergent',
    composition: '5-15% tensioactifs anioniques d\'origine vegetale, <5% tensioactifs non-ioniques, savon, enzymes, parfum',
    labels: ['eco_friendly'],
    packaging: 'Flacon 2L (40 lavages)'
  },
  {
    barcode: '7613036261418',
    name: 'X-Tra Total Lessive Liquide',
    brand: 'X-Tra',
    category: 'laundry_detergent',
    composition: '5-15% tensioactifs anioniques, <5% tensioactifs non-ioniques, savon, phosphonates, enzymes, parfum',
    labels: [],
    packaging: 'Bidon 3L (60 lavages)'
  },
  {
    barcode: '3450601044366',
    name: 'L\'Arbre Vert Lessive Liquide Peaux Sensibles',
    brand: "L'Arbre Vert",
    category: 'laundry_detergent',
    composition: '5-15% tensioactifs anioniques et non-ioniques d\'origine vegetale, <5% savon, citrate de sodium',
    labels: ['eu_ecolabel', 'hypoallergenic'],
    packaging: 'Flacon 1.5L (25 lavages)',
    certifications: ['EU Ecolabel']
  },

  // === LIQUIDES VAISSELLE ===
  {
    barcode: '8718114824666',
    name: 'Paic Excel+ Citron',
    brand: 'Paic',
    category: 'dish_soap',
    composition: '15-30% tensioactifs anioniques, 5-15% tensioactifs amphoteres, conservateurs (methylchloroisothiazolinone, methylisothiazolinone), parfum, limonene, colorant',
    labels: [],
    packaging: 'Flacon 750ml'
  },
  {
    barcode: '8001090305312',
    name: 'Mir Vaisselle Secret de Brillance',
    brand: 'Mir',
    category: 'dish_soap',
    composition: '15-30% tensioactifs anioniques, 5-15% tensioactifs amphoteres, conservateurs, parfum, colorant',
    labels: [],
    packaging: 'Flacon 500ml'
  },
  {
    barcode: '3178041325077',
    name: 'Fairy Original',
    brand: 'Fairy',
    category: 'dish_soap',
    composition: '15-30% tensioactifs anioniques, 5-15% tensioactifs amphoteres, conservateurs (phenoxyethanol), parfum',
    labels: [],
    packaging: 'Flacon 625ml'
  },
  {
    barcode: '3450601035821',
    name: 'L\'Arbre Vert Vaisselle Main Amande Douce',
    brand: "L'Arbre Vert",
    category: 'dish_soap',
    composition: '5-15% tensioactifs anioniques et amphoteres d\'origine vegetale, conservateurs, parfum',
    labels: ['eu_ecolabel', 'tested_dermatologically'],
    packaging: 'Flacon 500ml',
    certifications: ['EU Ecolabel']
  },

  // === TABLETTES LAVE-VAISSELLE ===
  {
    barcode: '4015000965163',
    name: 'Finish Quantum Ultimate',
    brand: 'Finish',
    category: 'dishwasher_detergent',
    composition: 'Sodium Carbonate, Sodium Citrate, Sodium Percarbonate, TAED, enzymes (protease, amylase), Sodium Silicate, polycarboxylates, tensioactifs non-ioniques, parfum',
    labels: ['phosphate_free'],
    packaging: 'Boite 40 tablettes'
  },
  {
    barcode: '8001090310835',
    name: 'Sun Tout-en-1 Expert',
    brand: 'Sun',
    category: 'dishwasher_detergent',
    composition: '15-30% phosphates, 5-15% agents de blanchiment oxygenes, <5% tensioactifs non-ioniques, phosphonates, polycarboxylates, enzymes, parfum',
    labels: [],
    packaging: 'Boite 52 tablettes'
  },
  {
    barcode: '3450601055577',
    name: 'L\'Arbre Vert Tablettes Lave-Vaisselle',
    brand: "L'Arbre Vert",
    category: 'dishwasher_detergent',
    composition: 'Carbonate de sodium, citrate de sodium, percarbonate de sodium, silicate de sodium, enzymes',
    labels: ['eu_ecolabel', 'phosphate_free'],
    packaging: 'Boite 30 tablettes',
    certifications: ['EU Ecolabel']
  },

  // === NETTOYANTS MULTI-SURFACES ===
  {
    barcode: '3178041360445',
    name: 'Mr. Propre Fraicheur du Matin',
    brand: 'Mr. Propre',
    category: 'all_purpose_cleaner',
    composition: '<5% tensioactifs anioniques, tensioactifs non-ioniques, savon, conservateurs (methylchloroisothiazolinone, methylisothiazolinone), parfum, hexyl cinnamal, limonene',
    labels: [],
    packaging: 'Flacon 1.3L'
  },
  {
    barcode: '8001090305268',
    name: 'Ajax Fete des Fleurs',
    brand: 'Ajax',
    category: 'all_purpose_cleaner',
    composition: '<5% tensioactifs anioniques, tensioactifs non-ioniques, conservateurs, parfum, colorant',
    labels: [],
    packaging: 'Flacon 1.25L'
  },
  {
    barcode: '8710908950223',
    name: 'Cif Creme Original',
    brand: 'Cif',
    category: 'all_purpose_cleaner',
    composition: '<5% tensioactifs anioniques, tensioactifs non-ioniques, savon, conservateurs, parfum',
    labels: [],
    packaging: 'Flacon 750ml'
  },

  // === NETTOYANTS WC ===
  {
    barcode: '5410091744120',
    name: 'Harpic Power Plus Original',
    brand: 'Harpic',
    category: 'toilet_cleaner',
    composition: 'Acide chlorhydrique 9%, tensioactifs anioniques <5%, parfum, colorant',
    labels: ['kills_99_9_germs'],
    packaging: 'Flacon 750ml'
  },
  {
    barcode: '3600540932181',
    name: 'Canard WC Fresh Disc Marine',
    brand: 'Canard',
    category: 'toilet_cleaner',
    composition: '<5% tensioactifs anioniques, tensioactifs non-ioniques, acide citrique, conservateurs, parfum, colorant',
    labels: [],
    packaging: 'Applicateur gel 55ml x 6'
  },
  {
    barcode: '3450601039881',
    name: 'L\'Arbre Vert Gel WC',
    brand: "L'Arbre Vert",
    category: 'toilet_cleaner',
    composition: 'Acide citrique 5-15%, tensioactifs anioniques <5%, epaississant naturel',
    labels: ['eu_ecolabel'],
    packaging: 'Flacon 740ml',
    certifications: ['EU Ecolabel']
  }
];

// Fonction pour trouver un produit par code-barres
function findByBarcode(barcode) {
  return detergentProducts.find(p => p.barcode === barcode);
}

// Fonction pour rechercher des produits
function searchProducts(query) {
  const searchTerm = query.toLowerCase();
  return detergentProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm) ||
    p.brand.toLowerCase().includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm)
  );
}

// Fonction pour obtenir des produits par categorie
function getByCategory(category) {
  return detergentProducts.filter(p => p.category === category);
}

// Fonction pour obtenir des produits certifies
function getCertifiedProducts() {
  return detergentProducts.filter(p => 
    p.labels?.includes('eu_ecolabel') || 
    p.certifications?.includes('EU Ecolabel')
  );
}

module.exports = {
  detergentProducts,
  findByBarcode,
  searchProducts,
  getByCategory,
  getCertifiedProducts
};
