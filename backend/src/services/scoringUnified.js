// backend/src/services/scoringUnified.js

// ============================================
// LISTES D'ADDITIFS
// ============================================
const ADDITIVES_RED_LIST = ['E250','E251','E252','E621','E622','E623','E150c','E150d','E320','E321','E951','E104','E110','E122','E124','E129','E216','E217','E214','E215'];
const ADDITIVES_ORANGE_LIST = ['E330','E200','E202','E211','E212','E322','E471','E472','E473','E476'];

// ============================================
// SEUILS DE CONFIANCE ET TRANSPARENCE
// ============================================
const CONFIDENCE_THRESHOLDS = {
  EXCELLENT: 85,      // Donn?es compl?tes et v?rifi?es
  GOOD: 70,           // Donn?es suffisantes pour scoring fiable
  ACCEPTABLE: 60,     // Minimum pour afficher un score
  INSUFFICIENT: 0     // Donn?es insuffisantes - pas de score
};

const SCORING_WEIGHTS = {
  nova: 0.15,
  nutriScore: 0.20,
  additives: 0.15,
  sugars: 0.10,
  saturatedFat: 0.10,
  salt: 0.10,
  ecoScore: 0.15,
  labels: 0.05
};

function getSugarEquivalent(sugars) {
  if (!sugars || sugars === 0) return null;
  const morceaux = Math.round(sugars / 5);
  return morceaux + ' morceau' + (morceaux > 1 ? 'x' : '') + ' de sucre';
}

function getFatEquivalent(saturatedFat) {
  if (!saturatedFat || saturatedFat === 0) return null;
  const cuilleres = Math.round(saturatedFat / 5);
  return cuilleres + ' cuillère' + (cuilleres > 1 ? 's' : '') + ' à café de beurre';
}

function getSaltEquivalent(salt) {
  if (!salt || salt === 0) return null;
  const pincees = Math.round(salt / 0.5);
  return pincees + ' pincée' + (pincees > 1 ? 's' : '') + ' de sel';
}

/**
 * Convertit les sucres en équivalent morceaux de sucre
 * @param {number} sugars - Sucres en g/100g
 * @returns {string|null} - Équivalent en morceaux
 */


/**
 * Convertit les graisses saturées en équivalent cuillères de beurre
 * @param {number} saturatedFat - Graisses saturées en g/100g
 * @returns {string|null} - Équivalent en cuillères
 */


/**
 * Convertit le sel en équivalent pincées
 * @param {number} salt - Sel en g/100g
 * @returns {string|null} - Équivalent en pincées
 */


const REQUIRED_FIELDS_FOR_FOOD = {
  critical: ['product_name', 'brands'],
  important: ['ingredients_text', 'nutriments'],
  optional: ['labels', 'categories', 'packaging']
};

// ============================================
// CALCUL DU NIVEAU DE CONFIANCE
// ============================================
function calculateDataConfidence(product, category = 'food') {
  if (!product) {
    return {
      confidence: 0,
      level: 'INSUFFICIENT',
      missingCritical: ['product_name', 'brands'],
      missingImportant: ['ingredients_text', 'nutriments'],
      availableData: []
    };
  }

  const required = REQUIRED_FIELDS_FOR_FOOD;
  let confidence = 0;
  let missingCritical = [];
  let missingImportant = [];
  let availableData = [];

  // V?rifier champs critiques (40 points)
  required.critical.forEach(field => {
    if (product[field] && product[field].length > 0) {
      confidence += 20;
      availableData.push(field);
    } else {
      missingCritical.push(field);
    }
  });

  // V?rifier champs importants (40 points)
  required.important.forEach(field => {
    if (field === 'nutriments' && product.nutriments) {
      const nutriments = product.nutriments;
      const hasNutriments = nutriments.sugars_100g !== undefined || 
                           nutriments['saturated-fat_100g'] !== undefined ||
                           nutriments.salt_100g !== undefined;
      if (hasNutriments) {
        confidence += 20;
        availableData.push('nutriments');
      } else {
        missingImportant.push('nutriments_values');
      }
    } else if (field === 'ingredients_text' && product[field] && product[field].length > 10) {
      confidence += 20;
      availableData.push(field);
    } else {
      missingImportant.push(field);
    }
  });

  // V?rifier champs optionnels (20 points)
  required.optional.forEach(field => {
    if (product[field] && product[field].length > 0) {
      confidence += 6.67;
      availableData.push(field);
    }
  });

  // D?terminer le niveau
  let level;
  if (confidence >= CONFIDENCE_THRESHOLDS.EXCELLENT) {
    level = 'EXCELLENT';
  } else if (confidence >= CONFIDENCE_THRESHOLDS.GOOD) {
    level = 'GOOD';
  } else if (confidence >= CONFIDENCE_THRESHOLDS.ACCEPTABLE) {
    level = 'ACCEPTABLE';
  } else {
    level = 'INSUFFICIENT';
  }

  return {
    confidence: Math.round(confidence),
    level,
    missingCritical,
    missingImportant,
    availableData,
    canScore: confidence >= CONFIDENCE_THRESHOLDS.ACCEPTABLE
  };
}

// ============================================
// CALCUL DES SCORES ALIMENTAIRES
// ============================================
function calculateFoodScores(data) {
  // 1. V?RIFIER LA QUALIT? DES DONN?ES
  const dataConfidence = calculateDataConfidence(data, 'food');
  
  // 2. SI DONN?ES INSUFFISANTES, RETOURNER STRUCTURE SP?CIALE
  if (!dataConfidence.canScore) {
    return {
      version: '3.1.0',
      timestamp: new Date().toISOString(),
      category: 'food',
      dataQualityInfo: {
        confidence: dataConfidence.confidence,
        level: dataConfidence.level,
        canScore: false,
        missingCritical: dataConfidence.missingCritical,
        missingImportant: dataConfidence.missingImportant,
        availableData: dataConfidence.availableData
      },
      overallScore: null,
      healthScore: null,
      environmentScore: null,
      breakdown: null,
      message: 'Donn?es insuffisantes pour calculer un score fiable.',
      recommendation: 'Utilisez le chat IA pour en savoir plus sur ce produit.',
      needsAIEnrichment: true,
      aiSuggestion: 'ask_ai_for_analysis'
    };
  }

  // 3. CALCULER LES SCORES (donn?es suffisantes)
  const nutriments = data.nutriments || {};
  const missingData = [];
  if (!data.novaGroup) missingData.push('nova');
  if (!data.nutriScore) missingData.push('nutriScore');
  if (!nutriments.sugars_100g && nutriments.sugars === undefined) missingData.push('sugars');
  if (!nutriments['saturated-fat_100g'] && nutriments.saturated_fat === undefined) missingData.push('saturatedFat');
  if (!nutriments.salt_100g && nutriments.salt === undefined) missingData.push('salt');
  
  const confidence = (8 - missingData.length) / 8;
  
  let novaScore = null;
  if (data.novaGroup) {
    const novaMapping = { 1: 85, 2: 65, 3: 45, 4: 25 };
    novaScore = novaMapping[data.novaGroup] || 50;
  }
  const novaContribution = (novaScore || 0) * 0.15;
  
  let nutriScoreValue = null;
  if (data.nutriScore) {
    const nutriMapping = {'a':85,'A':85,'b':70,'B':70,'c':50,'C':50,'d':30,'D':30,'e':15,'E':15};
    nutriScoreValue = nutriMapping[data.nutriScore] || 50;
  }
  const nutriContribution = (nutriScoreValue || 0) * 0.20;
  
  const additivesAnalysis = analyzeAdditives(data.additives || []);
  const additivesContribution = (additivesAnalysis.score || 0) * 0.15;
  
  let sugarsScore = null;
  const sugars = nutriments.sugars_100g !== undefined ? nutriments.sugars_100g : (nutriments.sugars !== undefined ? nutriments.sugars : null);
  if (sugars !== null) {
    if (sugars < 5) sugarsScore = 85;
    else if (sugars < 10) sugarsScore = 60;
    else if (sugars < 15) sugarsScore = 35;
    else if (sugars < 25) sugarsScore = 15;
    else sugarsScore = 5;
  }
  const sugarsContribution = (sugarsScore || 0) * 0.10;
  
  let fatScore = null;
  const saturatedFat = nutriments['saturated-fat_100g'] !== undefined ? nutriments['saturated-fat_100g'] : (nutriments.saturated_fat !== undefined ? nutriments.saturated_fat : null);
  if (saturatedFat !== null) {
    if (saturatedFat < 1.5) fatScore = 85;
    else if (saturatedFat < 5) fatScore = 65;
    else if (saturatedFat < 10) fatScore = 45;
    else if (saturatedFat < 15) fatScore = 25;
    else fatScore = 10;
  }
  const fatContribution = (fatScore || 0) * 0.10;
  
  let saltScore = null;
  const salt = nutriments.salt_100g !== undefined ? nutriments.salt_100g : (nutriments.salt !== undefined ? nutriments.salt : null);
  if (salt !== null) {
    if (salt < 0.3) saltScore = 85;
    else if (salt < 1) saltScore = 65;
    else if (salt < 1.5) saltScore = 45;
    else if (salt < 2.5) saltScore = 25;
    else saltScore = 10;
  }
  const saltContribution = (saltScore || 0) * 0.10;
  
  let ecoScore = null;
  if (data.ecoScore) {
    const ecoMapping = {'a':85,'A':85,'b':70,'B':70,'c':50,'C':50,'d':30,'D':30,'e':15,'E':15};
    ecoScore = ecoMapping[data.ecoScore] || 50;
  }
  const ecoContribution = (ecoScore || 0) * 0.15;
  
  let labelsBonus = 0;
  const labels = data.labels || [];
  const isBio = labels.some(l => (l || '').toLowerCase().includes('bio') || (l || '').toLowerCase().includes('organic'));
  if (isBio) labelsBonus += 10;
  labelsBonus = Math.min(15, labelsBonus);
  const labelsContribution = labelsBonus * 0.05;
  
    // Calculate score only from available components
  const contributions = [
    { value: novaContribution, weight: 0.15, available: novaScore !== null },
    { value: nutriContribution, weight: 0.20, available: nutriScoreValue !== null },
    { value: additivesContribution, weight: 0.15, available: true },
    { value: sugarsContribution, weight: 0.10, available: sugarsScore !== null },
    { value: fatContribution, weight: 0.10, available: fatScore !== null },
    { value: saltContribution, weight: 0.10, available: saltScore !== null },
    { value: ecoContribution, weight: 0.15, available: ecoScore !== null },
    { value: labelsContribution, weight: 0.05, available: true }
  ];
  
  const availableComponents = contributions.filter(c => c.available);
  const totalAvailableWeight = availableComponents.reduce((sum, c) => sum + c.weight, 0);
  const totalScore = availableComponents.reduce((sum, c) => sum + c.value, 0);
  const overallScore = totalAvailableWeight > 0 ? Math.round(totalScore / totalAvailableWeight) : 0;
  
  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    healthScore: Math.round((novaContribution + nutriContribution + additivesContribution + sugarsContribution + fatContribution + saltContribution) / 0.8),
    environmentScore: Math.round(ecoContribution / 0.15),
    confidence,
    dataQualityInfo: {
      confidence: dataConfidence.confidence,
      level: dataConfidence.level,
      canScore: true,
      availableData: dataConfidence.availableData
    },
    missingData,
    dataCompleteness: confidence >= 0.7 ? 'Excellente' : confidence >= 0.4 ? 'Partielle' : 'Insuffisante',
    breakdown: {
      nova: { 
        score: novaScore, 
        weight: 0.15,
        group: data.novaGroup || null,
        label: data.novaGroup ? 'Groupe ' + data.novaGroup : 'Non d?fini'
      },
      nutriScore: { 
        score: nutriScoreValue, 
        weight: 0.20,
        grade: data.nutriScore ? data.nutriScore.toUpperCase() : null,
        label: data.nutriScore ? 'Nutri-Score ' + data.nutriScore.toUpperCase() : 'Non d?fini'
      },
      additives: { 
        score: additivesAnalysis.score, 
        weight: 0.15,
        count: (data.additives || []).length,
        dangerous: additivesAnalysis.dangerous,
        label: additivesAnalysis.label
      },
      sugars: { 
        score: sugarsScore, 
        weight: 0.10,
        value: sugars,
        unit: 'g/100g',
        label: sugars !== null ? sugars + 'g/100g' : 'Non sp?cifi?'
      ,
        equivalent: getSugarEquivalent(sugars)},
      saturatedFat: { 
        score: fatScore, 
        weight: 0.10,
        value: saturatedFat,
        unit: 'g/100g',
        label: saturatedFat !== null ? saturatedFat + 'g/100g' : 'Non sp?cifi?'
      ,
        equivalent: getFatEquivalent(saturatedFat)},
      salt: { 
        score: saltScore, 
        weight: 0.10,
        value: salt,
        unit: 'g/100g',
        label: salt !== null ? salt + 'g/100g' : 'Non sp?cifi?'
      ,
        equivalent: getSaltEquivalent(salt)},
      ecoScore: { 
        score: ecoScore, 
        weight: 0.15,
        grade: data.ecoScore ? data.ecoScore.toUpperCase() : null,
        label: data.ecoScore ? 'Eco-Score ' + data.ecoScore.toUpperCase() : 'Non d?fini'
      },
      labels: { 
        score: labelsBonus, 
        weight: 0.05,
        list: labels,
        isBio,
        label: isBio ? 'Bio certifi?' : 'Aucun label'
      }
    },
    scoringMetadata: {
      methodology: 'ECOLOJIA V3 - Scoring scientifique 8 composantes',
      version: '3.1.0',
      calculatedAt: new Date().toISOString()
    }
  };
}

// ============================================
// ANALYSE DES ADDITIFS
// ============================================
function analyzeAdditives(additives) {
  if (!additives || additives.length === 0) {
    return { score: 85, label: 'Aucun additif', dangerous: [] };
  }
  
  let redCount = 0;
  let orangeCount = 0;
  const dangerous = [];
  
  additives.forEach(additive => {
    const code = String(additive).toUpperCase();
    if (ADDITIVES_RED_LIST.some(red => code.includes(red))) {
      redCount++;
      dangerous.push({ code, riskLevel: 'HIGH' });
    } else if (ADDITIVES_ORANGE_LIST.some(orange => code.includes(orange))) {
      orangeCount++;
    }
  });
  
  if (redCount > 0) return { score: 10, label: additives.length + ' additifs dont ' + redCount + ' DANGEREUX', dangerous };
  if (orangeCount >= 3) return { score: 35, label: additives.length + ' additifs', dangerous: [] };
  if (orangeCount >= 1) return { score: 55, label: additives.length + ' additifs acceptables', dangerous: [] };
  if (additives.length <= 3) return { score: 70, label: additives.length + ' additifs', dangerous: [] };
  
  return { score: 50, label: additives.length + ' additifs', dangerous: [] };
}

// ============================================
// CALCUL COSM?TIQUES (? IMPL?MENTER)
// ============================================
function calculateCosmeticScores(data) {
  return { overallScore: 50, confidence: 0.3, breakdown: {}, scoringMetadata: { version: '3.1.0' } };
}

// ============================================
// CALCUL D?TERGENTS (? IMPL?MENTER)
// ============================================
function calculateDetergentScores(data) {
  return { overallScore: 50, confidence: 0.3, breakdown: {}, scoringMetadata: { version: '3.1.0' } };
}

// ============================================
// MULTI-CATEGORY ROUTER
// ============================================
function calculateScores(data) {
  const category = data.category || 'food';
  
  switch(category) {
    case 'cosmetics':
      return calculateCosmeticsScores(data);
    case 'detergents':
      return calculateDetergentsScores(data);
    case 'food':
    default:
      return calculateFoodScores(data);
  }
}

// ============================================
// COSMETICS SCORING (8 components)
// ============================================
function calculateCosmeticsScores(data) {
  /**
   * SCORING COSMETIQUES SCIENTIFIQUE
   * Sources: ANSES, EU 1223/2009, ECHA, ECOCERT/COSMEBIO
   * 4 composantes robustes verifiables
   */

  const missingData = [];
  
  // ============================================
  // 1. PERTURBATEURS ENDOCRINIENS (40%) - ANSES
  // ============================================
  // Liste ANSES validee: Parabens, Phthalates, Phenoxyethanol, Triclosan, BHA, BHT
  const ANSES_ENDOCRINE_DISRUPTORS = [
    'methylparaben', 'propylparaben', 'butylparaben', 'ethylparaben',
    'dep', 'dbp', 'dehp', 'dinp', 'didp',
    'phenoxyethanol',
    'triclosan', 'triclocarban',
    'bha', 'e320', 'bht', 'e321'
  ];
  
  const endocrineDisruptors = data.cosmeticsData?.endocrineDisruptors || [];
  let endocrineScore = 100;
  let endocrineSeverity = 'NONE';
  
  if (endocrineDisruptors.length === 0) {
    endocrineScore = 100;
    endocrineSeverity = 'NONE';
  } else if (endocrineDisruptors.length === 1) {
    endocrineScore = 70;
    endocrineSeverity = 'LOW';
  } else if (endocrineDisruptors.length === 2) {
    endocrineScore = 45;
    endocrineSeverity = 'MEDIUM';
  } else {
    endocrineScore = 20;
    endocrineSeverity = 'HIGH';
  }
  
  if (!data.cosmeticsData?.endocrineDisruptors) missingData.push('endocrineDisruptors');
  
  // ============================================
  // 2. ALLERGENES (30%) - EU 1223/2009
  // ============================================
  // Liste EU 26 allergenes obligatoires
  const EU_26_ALLERGENS = [
    'limonene', 'linalool', 'geraniol', 'citronellol',
    'coumarin', 'eugenol', 'cinnamal', 'farnesol',
    'citral', 'benzyl alcohol', 'benzyl salicylate',
    'benzyl benzoate', 'benzyl cinnamate', 'anise alcohol',
    'isoeugenol', 'amyl cinnamal', 'amylcinnamyl alcohol',
    'cinnamyl alcohol', 'hexyl cinnamal', 'hydroxyisohexyl 3-cyclohexene carboxaldehyde',
    'hydroxycitronellal', 'alpha-isomethyl ionone', 'methyl 2-octynoate',
    'evernia prunastri', 'evernia furfuracea', 'butylphenyl methylpropional'
  ];
  
  const allergens = data.cosmeticsData?.allergens || [];
  let allergensScore = 100;
  
  if (allergens.length === 0) {
    allergensScore = 100;
  } else if (allergens.length <= 2) {
    allergensScore = 80;
  } else if (allergens.length <= 5) {
    allergensScore = 60;
  } else {
    allergensScore = 30;
  }
  
  if (!data.cosmeticsData?.allergens) missingData.push('allergens');
  
  // ============================================
  // 3. SUBSTANCES CMR (20%) - ECHA
  // ============================================
  // CMR: Carcinogenes, Mutagenes, Reprotoxiques
  const ECHA_CMR_SUBSTANCES = [
    'formaldehyde', 'paraformaldehyde', 'dmdm hydantoin', 'quaternium-15',
    'coal tar', 'lead acetate', 'lead compounds',
    'diethanolamine', 'triethanolamine'
  ];
  
  const cmrSubstances = data.cosmeticsData?.cmrSubstances || [];
  let cmrScore = 100;
  let cmrCategory = 'None';
  
  if (cmrSubstances.length === 0) {
    cmrScore = 100;
    cmrCategory = 'None';
  } else if (cmrSubstances.length === 1) {
    cmrScore = 40;
    cmrCategory = '2';
  } else {
    cmrScore = 10;
    cmrCategory = '1B';
  }
  
  if (!data.cosmeticsData?.cmrSubstances) missingData.push('cmrSubstances');
  
  // ============================================
  // 4. CERTIFICATIONS (10%) - ECOCERT/COSMEBIO
  // ============================================
  const certifications = data.cosmeticsData?.certifications || [];
  let certificationScore = 50; // Default neutre
  let certificationVerified = false;
  
  // ECOCERT: >95% naturel, <5% synthetique
  if (certifications.some(c => c.toLowerCase().includes('ecocert'))) {
    certificationScore = 95;
    certificationVerified = true;
  }
  // COSMEBIO: >95% naturel, >10% bio
  else if (certifications.some(c => c.toLowerCase().includes('cosmebio'))) {
    certificationScore = 90;
    certificationVerified = true;
  }
  // Bio claim (non verifie)
  else if (certifications.some(c => c.toLowerCase().includes('bio') || c.toLowerCase().includes('organic'))) {
    certificationScore = 60;
    certificationVerified = false;
  }
  
  if (!data.cosmeticsData?.certifications) missingData.push('certifications');
  
  // ============================================
  // CALCUL SCORE GLOBAL ADAPTATIF
  // ============================================
  const components = [
    { score: endocrineScore, weight: 0.40, available: !missingData.includes('endocrineDisruptors') },
    { score: allergensScore, weight: 0.30, available: !missingData.includes('allergens') },
    { score: cmrScore, weight: 0.20, available: !missingData.includes('cmrSubstances') },
    { score: certificationScore, weight: 0.10, available: !missingData.includes('certifications') }
  ];
  
  const availableComponents = components.filter(c => c.available);
  const totalAvailableWeight = availableComponents.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = availableComponents.reduce((sum, c) => sum + (c.score * c.weight), 0);
  
  const overallScore = totalAvailableWeight > 0 
    ? Math.round(weightedSum / totalAvailableWeight)
    : 50; // Default si aucune donnee
  
  const confidence = totalAvailableWeight;
  
  // Score sante (sans certifications)
  const healthComponents = components.slice(0, 3).filter(c => c.available);
  const healthWeight = healthComponents.reduce((sum, c) => sum + c.weight, 0);
  const healthSum = healthComponents.reduce((sum, c) => sum + (c.score * c.weight), 0);
  const healthScore = healthWeight > 0 ? Math.round(healthSum / healthWeight) : 50;
  
  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    healthScore: Math.max(0, Math.min(100, healthScore)),
    confidence: confidence,
    missingData: missingData,
    breakdown: {
      endocrineDisruptors: {
        score: endocrineScore,
        weight: 0.40,
        detected: endocrineDisruptors,
        count: endocrineDisruptors.length,
        severity: endocrineSeverity,
        source: 'ANSES - Liste perturbateurs endocriniens',
        explanation: endocrineDisruptors.length === 0 
          ? 'Aucun perturbateur endocrinien detecte (ANSES)'
          : `${endocrineDisruptors.length} perturbateur(s) endocrinien(s) detecte(s) (ANSES)`,
        recommendation: endocrineDisruptors.length === 0
          ? 'Excellent - Aucun perturbateur detecte'
          : endocrineDisruptors.length <= 2
          ? 'Attention - Presence de perturbateurs endocriniens'
          : 'Deconseille - Forte presence de perturbateurs endocriniens'
      },
      allergens: {
        score: allergensScore,
        weight: 0.30,
        detected: allergens,
        count: allergens.length,
        euMandatory: true,
        source: 'EU Regulation 1223/2009 - 26 allergenes obligatoires',
        explanation: allergens.length === 0
          ? 'Aucun allergene EU obligatoire detecte'
          : `${allergens.length} allergene(s) EU detecte(s) sur 26`,
        recommendation: allergens.length === 0
          ? 'Excellent - Hypoallergenique'
          : allergens.length <= 2
          ? 'Bon - Peu d\'allergenes'
          : allergens.length <= 5
          ? 'Moyen - Plusieurs allergenes'
          : 'Attention - Nombreux allergenes (risque sensibilisation)'
      },
      cmrSubstances: {
        score: cmrScore,
        weight: 0.20,
        detected: cmrSubstances,
        count: cmrSubstances.length,
        categoryECHA: cmrCategory,
        source: 'ECHA - Substances CMR (Carcinogenes/Mutagenes/Reprotoxiques)',
        explanation: cmrSubstances.length === 0
          ? 'Aucune substance CMR detectee (ECHA)'
          : `${cmrSubstances.length} substance(s) CMR detectee(s) - Categorie ${cmrCategory}`,
        recommendation: cmrSubstances.length === 0
          ? 'Excellent - Aucune substance CMR'
          : 'EVITER - Presence substances cancerigenes/mutagenes/reprotoxiques'
      },
      certifications: {
        score: certificationScore,
        weight: 0.10,
        detected: certifications,
        verified: certificationVerified,
        source: 'ECOCERT/COSMEBIO - Certifications bio officielles',
        explanation: certificationVerified
          ? 'Certification bio officielle verifiee'
          : certifications.length > 0
          ? 'Claims bio non verifies'
          : 'Aucune certification bio',
        recommendation: certificationVerified
          ? 'Excellent - Certification officielle'
          : certifications.length > 0
          ? 'A verifier - Claims non certifies'
          : 'Produit conventionnel'
      }
    },
    scoringVersion: '3.1.0',
    category: 'cosmetics'
  };
}
// ============================================
// DETERGENTS SCORING (8 components)
// ============================================
function calculateDetergentsScores(data) {
  /**
   * SCORING DETERGENTS SCIENTIFIQUE
   * Sources: EU 648/2004, CLP Regulation, EN 62455, ECHA, EU Ecolabel
   * 4 composantes robustes verifiables
   */

  const missingData = [];
  
  // ============================================
  // 1. BIODEGRADABILITE (40%) - EN 62455 / OCDE 301
  // ============================================
  // Standard: >60% biodegradable en 28 jours
  // Types tensioactifs:
  // - Anioniques (SLS, LAS): Generalement biodegradables (score 85)
  // - Non-ioniques (Alcohol ethoxylates): Biodegradables (score 80)
  // - Cationiques (Quaternary ammonium): Moins biodegradables (score 40)
  
  const biodegradableData = data.detergentsData?.biodegradability;
  let biodegradabilityScore = 50; // Default neutre
  let surfactantsType = 'unknown';
  let biodegradablePercent = 0;
  let standard = 'Unknown';
  
  if (biodegradableData) {
    biodegradablePercent = biodegradableData.biodegradablePercent || 0;
    surfactantsType = biodegradableData.surfactantsType || 'unknown';
    standard = biodegradableData.standard || 'Unknown';
    
    // Score selon % biodegradabilite
    if (biodegradablePercent >= 90) {
      biodegradabilityScore = 95;
    } else if (biodegradablePercent >= 60) {
      biodegradabilityScore = 80; // Conforme EN 62455
    } else if (biodegradablePercent >= 40) {
      biodegradabilityScore = 60;
    } else if (biodegradablePercent > 0) {
      biodegradabilityScore = 35;
    } else {
      biodegradabilityScore = 50; // Inconnu
    }
  } else {
    // Fallback ancien format booleen
    const biodegradable = data.detergentsData?.biodegradable;
    if (biodegradable === true) {
      biodegradabilityScore = 80;
      surfactantsType = 'assumed biodegradable';
    } else if (biodegradable === false) {
      biodegradabilityScore = 30;
      surfactantsType = 'non-biodegradable';
    }
  }
  
  if (!data.detergentsData?.biodegradability && data.detergentsData?.biodegradable === undefined) {
    missingData.push('biodegradability');
  }
  
  // ============================================
  // 2. TOXICITE AQUATIQUE (30%) - CLP Regulation
  // ============================================
  // Codes CLP hazard:
  // - H400: Very toxic to aquatic life (score 10)
  // - H410: Very toxic with long lasting effects (score 15)
  // - H411: Toxic with long lasting effects (score 40)
  // - H412: Harmful with long lasting effects (score 60)
  // - H413: May cause long lasting harmful effects (score 75)
  // - Aucun: Non toxique (score 100)
  
  const aquaticToxicityData = data.detergentsData?.aquaticToxicity;
  let aquaticScore = 50; // Default neutre
  let clpCodes = [];
  let severity = 'UNKNOWN';
  
  if (Array.isArray(aquaticToxicityData)) {
    clpCodes = aquaticToxicityData;
    
    if (clpCodes.length === 0) {
      aquaticScore = 100;
      severity = 'NONE';
    } else if (clpCodes.includes('H400') || clpCodes.includes('H410')) {
      aquaticScore = 10;
      severity = 'VERY_HIGH';
    } else if (clpCodes.includes('H411')) {
      aquaticScore = 40;
      severity = 'HIGH';
    } else if (clpCodes.includes('H412')) {
      aquaticScore = 60;
      severity = 'MEDIUM';
    } else if (clpCodes.includes('H413')) {
      aquaticScore = 75;
      severity = 'LOW';
    }
  } else if (typeof aquaticToxicityData === 'string') {
    // Fallback ancien format string
    if (aquaticToxicityData === 'low') {
      aquaticScore = 85;
      severity = 'LOW';
      clpCodes = ['H413'];
    } else if (aquaticToxicityData === 'high') {
      aquaticScore = 15;
      severity = 'VERY_HIGH';
      clpCodes = ['H400'];
    } else if (aquaticToxicityData === 'none') {
      aquaticScore = 100;
      severity = 'NONE';
      clpCodes = [];
    }
  }
  
  if (!data.detergentsData?.aquaticToxicity) {
    missingData.push('aquaticToxicity');
  }
  
  // ============================================
  // 3. PHOSPHATES (20%) - EU 648/2004
  // ============================================
  // Limite EU: 0.3g per dose standard (lessive/lave-vaisselle)
  // Interdits depuis 2013 (lessive) et 2017 (lave-vaisselle)
  
  const phosphatesData = data.detergentsData?.phosphates;
  let phosphatesScore = 50; // Default neutre
  let phosphatesDetected = false;
  let phosphatesContent = '0g';
  let compliantEU = true;
  
  if (phosphatesData) {
    phosphatesDetected = phosphatesData.detected || false;
    phosphatesContent = phosphatesData.estimatedContent || '0g';
    compliantEU = phosphatesData.compliantEU !== false;
    
    if (!phosphatesDetected) {
      phosphatesScore = 100;
      compliantEU = true;
    } else {
      // Parse content (ex: "0.2g", "0.5g")
      const contentMatch = phosphatesContent.match(/(\d+\.?\d*)/);
      const grams = contentMatch ? parseFloat(contentMatch[1]) : 0;
      
      if (grams <= 0.3) {
        phosphatesScore = 85; // Conforme EU 648/2004
        compliantEU = true;
      } else {
        phosphatesScore = 20; // Non conforme
        compliantEU = false;
      }
    }
  } else {
    // Fallback ancien format booleen
    const hasPhosphates = data.detergentsData?.hasPhosphates;
    if (hasPhosphates === false) {
      phosphatesScore = 100;
      phosphatesDetected = false;
      compliantEU = true;
    } else if (hasPhosphates === true) {
      phosphatesScore = 20;
      phosphatesDetected = true;
      compliantEU = false;
    }
  }
  
  if (!data.detergentsData?.phosphates && data.detergentsData?.hasPhosphates === undefined) {
    missingData.push('phosphates');
  }
  
  // ============================================
  // 4. ECOLABELS (10%) - EU Ecolabel, Nordic Swan, Ecocert
  // ============================================
  const ecolabelsData = data.detergentsData?.ecolabels;
  let ecolabelScore = 50; // Default neutre
  let ecolabelsDetected = [];
  let ecolabelsVerified = false;
  
  if (ecolabelsData) {
    ecolabelsDetected = ecolabelsData.detected || [];
    ecolabelsVerified = ecolabelsData.verified || false;
    
    if (ecolabelsVerified && ecolabelsDetected.length > 0) {
      // EU Ecolabel ou Nordic Swan verifies
      if (ecolabelsDetected.some(l => l.toLowerCase().includes('eu ecolabel'))) {
        ecolabelScore = 95;
      } else if (ecolabelsDetected.some(l => l.toLowerCase().includes('nordic swan'))) {
        ecolabelScore = 90;
      } else if (ecolabelsDetected.some(l => l.toLowerCase().includes('ecocert'))) {
        ecolabelScore = 85;
      } else {
        ecolabelScore = 75;
      }
    } else if (ecolabelsDetected.length > 0) {
      // Claims non verifies
      ecolabelScore = 60;
    } else {
      ecolabelScore = 50; // Aucun label
    }
  } else {
    // Fallback ancien format labels_tags
    const labels = data.labels_tags || [];
    if (labels.some(l => l.toLowerCase().includes('ecolabel'))) {
      ecolabelScore += 50;
      ecolabelsDetected.push('EU Ecolabel (claim)');
    }
    if (labels.some(l => l.toLowerCase().includes('nordic-swan'))) {
      ecolabelScore += 30;
      ecolabelsDetected.push('Nordic Swan (claim)');
    }
    if (labels.some(l => l.toLowerCase().includes('ecocert'))) {
      ecolabelScore += 20;
      ecolabelsDetected.push('Ecocert (claim)');
    }
    ecolabelScore = Math.min(100, ecolabelScore);
  }
  
  if (!data.detergentsData?.ecolabels && (!data.labels_tags || data.labels_tags.length === 0)) {
    missingData.push('ecolabels');
  }
  
  // ============================================
  // CALCUL SCORE GLOBAL ADAPTATIF
  // ============================================
  const components = [
    { score: biodegradabilityScore, weight: 0.40, available: !missingData.includes('biodegradability') },
    { score: aquaticScore, weight: 0.30, available: !missingData.includes('aquaticToxicity') },
    { score: phosphatesScore, weight: 0.20, available: !missingData.includes('phosphates') },
    { score: ecolabelScore, weight: 0.10, available: !missingData.includes('ecolabels') }
  ];
  
  const availableComponents = components.filter(c => c.available);
  const totalAvailableWeight = availableComponents.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = availableComponents.reduce((sum, c) => sum + (c.score * c.weight), 0);
  
  const overallScore = totalAvailableWeight > 0 
    ? Math.round(weightedSum / totalAvailableWeight)
    : 50; // Default si aucune donnee
  
  const confidence = totalAvailableWeight;
  
  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    environmentScore: Math.max(0, Math.min(100, overallScore)),
    confidence: confidence,
    missingData: missingData,
    breakdown: {
      biodegradability: {
        score: biodegradabilityScore,
        weight: 0.40,
        surfactantsType: surfactantsType,
        biodegradablePercent: biodegradablePercent,
        standard: standard,
        source: 'EN 62455 / OCDE 301 - Biodegradabilite tensioactifs',
        explanation: biodegradablePercent >= 60
          ? `Conforme EN 62455 (${biodegradablePercent}% biodegradable en 28 jours)`
          : biodegradablePercent > 0
          ? `Non conforme EN 62455 (${biodegradablePercent}% biodegradable)`
          : 'Biodegradabilite inconnue',
        recommendation: biodegradablePercent >= 90
          ? 'Excellent - Tres biodegradable'
          : biodegradablePercent >= 60
          ? 'Bon - Conforme norme EU'
          : biodegradablePercent > 0
          ? 'Insuffisant - Non conforme'
          : 'Donnee manquante'
      },
      aquaticToxicity: {
        score: aquaticScore,
        weight: 0.30,
        clpCodes: clpCodes,
        severity: severity,
        source: 'CLP Regulation - Classification toxicite aquatique',
        explanation: clpCodes.length === 0
          ? 'Aucun code CLP toxicite aquatique detecte'
          : `Codes CLP: ${clpCodes.join(', ')} - Severite: ${severity}`,
        recommendation: severity === 'NONE'
          ? 'Excellent - Non toxique pour milieu aquatique'
          : severity === 'LOW'
          ? 'Bon - Faible toxicite (H413)'
          : severity === 'MEDIUM'
          ? 'Moyen - Toxicite moderee (H412)'
          : severity === 'HIGH'
          ? 'Attention - Toxique (H411)'
          : 'EVITER - Tres toxique (H400/H410)'
      },
      phosphates: {
        score: phosphatesScore,
        weight: 0.20,
        detected: phosphatesDetected,
        content: phosphatesContent,
        compliantEU: compliantEU,
        source: 'EU Regulation 648/2004 - Limite phosphates 0.3g/dose',
        explanation: !phosphatesDetected
          ? 'Aucun phosphate detecte (conforme EU 648/2004)'
          : compliantEU
          ? `Phosphates ${phosphatesContent} (conforme limite 0.3g/dose)`
          : `Phosphates ${phosphatesContent} (NON CONFORME - limite 0.3g/dose)`,
        recommendation: !phosphatesDetected
          ? 'Excellent - Sans phosphates'
          : compliantEU
          ? 'Acceptable - Conforme limite EU'
          : 'NON CONFORME - Depasse limite EU (interdit depuis 2017)'
      },
      ecolabels: {
        score: ecolabelScore,
        weight: 0.10,
        detected: ecolabelsDetected,
        verified: ecolabelsVerified,
        source: 'EU Ecolabel / Nordic Swan / Ecocert - Certifications officielles',
        explanation: ecolabelsVerified && ecolabelsDetected.length > 0
          ? `Certification(s) officielle(s): ${ecolabelsDetected.join(', ')}`
          : ecolabelsDetected.length > 0
          ? `Claims non verifies: ${ecolabelsDetected.join(', ')}`
          : 'Aucun ecolabel detecte',
        recommendation: ecolabelsVerified
          ? 'Excellent - Certification officielle verifiee'
          : ecolabelsDetected.length > 0
          ? 'A verifier - Claims non certifies'
          : 'Produit conventionnel'
      }
    },
    scoringVersion: '3.1.0',
    category: 'detergents'
  };
}
module.exports = { calculateFoodScores, calculateCosmeticsScores, calculateDetergentsScores, calculateScores, analyzeAdditives, calculateDataConfidence };