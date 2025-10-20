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
  EXCELLENT: 85,      // Donn�es compl�tes et v�rifi�es
  GOOD: 70,           // Donn�es suffisantes pour scoring fiable
  ACCEPTABLE: 60,     // Minimum pour afficher un score
  INSUFFICIENT: 0     // Donn�es insuffisantes - pas de score
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

  // V�rifier champs critiques (40 points)
  required.critical.forEach(field => {
    if (product[field] && product[field].length > 0) {
      confidence += 20;
      availableData.push(field);
    } else {
      missingCritical.push(field);
    }
  });

  // V�rifier champs importants (40 points)
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

  // V�rifier champs optionnels (20 points)
  required.optional.forEach(field => {
    if (product[field] && product[field].length > 0) {
      confidence += 6.67;
      availableData.push(field);
    }
  });

  // D�terminer le niveau
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
  // 1. V�RIFIER LA QUALIT� DES DONN�ES
  const dataConfidence = calculateDataConfidence(data, 'food');
  
  // 2. SI DONN�ES INSUFFISANTES, RETOURNER STRUCTURE SP�CIALE
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
      message: 'Donn�es insuffisantes pour calculer un score fiable.',
      recommendation: 'Utilisez le chat IA pour en savoir plus sur ce produit.',
      needsAIEnrichment: true,
      aiSuggestion: 'ask_ai_for_analysis'
    };
  }

  // 3. CALCULER LES SCORES (donn�es suffisantes)
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
    else if (sugars < 10) sugarsScore = 70;
    else if (sugars < 15) sugarsScore = 50;
    else if (sugars < 25) sugarsScore = 30;
    else sugarsScore = 15;
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
        label: data.novaGroup ? 'Groupe ' + data.novaGroup : 'Non d�fini'
      },
      nutriScore: { 
        score: nutriScoreValue, 
        weight: 0.20,
        grade: data.nutriScore ? data.nutriScore.toUpperCase() : null,
        label: data.nutriScore ? 'Nutri-Score ' + data.nutriScore.toUpperCase() : 'Non d�fini'
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
        label: sugars !== null ? sugars + 'g/100g' : 'Non sp�cifi�'
      },
      saturatedFat: { 
        score: fatScore, 
        weight: 0.10,
        value: saturatedFat,
        unit: 'g/100g',
        label: saturatedFat !== null ? saturatedFat + 'g/100g' : 'Non sp�cifi�'
      },
      salt: { 
        score: saltScore, 
        weight: 0.10,
        value: salt,
        unit: 'g/100g',
        label: salt !== null ? salt + 'g/100g' : 'Non sp�cifi�'
      },
      ecoScore: { 
        score: ecoScore, 
        weight: 0.15,
        grade: data.ecoScore ? data.ecoScore.toUpperCase() : null,
        label: data.ecoScore ? 'Eco-Score ' + data.ecoScore.toUpperCase() : 'Non d�fini'
      },
      labels: { 
        score: labelsBonus, 
        weight: 0.05,
        list: labels,
        isBio,
        label: isBio ? 'Bio certifi�' : 'Aucun label'
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
// CALCUL COSM�TIQUES (� IMPL�MENTER)
// ============================================
function calculateCosmeticScores(data) {
  return { overallScore: 50, confidence: 0.3, breakdown: {}, scoringMetadata: { version: '3.1.0' } };
}

// ============================================
// CALCUL D�TERGENTS (� IMPL�MENTER)
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
  const missingData = [];
  
  // 1. Endocrine disruptors (30%)
  const endocrineDisruptors = data.cosmeticsData?.endocrineDisruptors || [];
  let endocrineScore = 100;
  if (endocrineDisruptors.length > 0) {
    endocrineScore = Math.max(0, 100 - (endocrineDisruptors.length * 20));
  }
  const endocrineContribution = endocrineScore * 0.30;

  // 2. Allergens (20%)
  const allergens = data.cosmeticsData?.allergens || [];
  let allergensScore = 100;
  if (allergens.length > 0) {
    allergensScore = Math.max(0, 100 - (allergens.length * 15));
  }
  const allergensContribution = allergensScore * 0.20;

  // 3. Controversial substances (20%)
  const ingredients = data.cosmeticsData?.ingredients || [];
  const controversialCount = ingredients.filter(i => 
    i.concerns && i.concerns.length > 0
  ).length;
  let controversialScore = 100;
  if (controversialCount > 0) {
    controversialScore = Math.max(0, 100 - (controversialCount * 10));
  }
  const controversialContribution = controversialScore * 0.20;

  // 4. Certifications (15%)
  const certifications = data.cosmeticsData?.certifications || [];
  let certificationScore = 0;
  if (certifications.some(c => c.toLowerCase().includes('bio') || c.toLowerCase().includes('organic'))) {
    certificationScore += 50;
  }
  if (certifications.some(c => c.toLowerCase().includes('ecocert'))) {
    certificationScore += 30;
  }
  if (certifications.some(c => c.toLowerCase().includes('cosmebio'))) {
    certificationScore += 20;
  }
  certificationScore = Math.min(100, certificationScore);
  const certificationContribution = certificationScore * 0.15;

  // 5-8. Other components (15% total)
  const otherContribution = 50 * 0.15; // Default 50/100

  const contributions = [
    { value: endocrineContribution, weight: 0.30, available: true },
    { value: allergensContribution, weight: 0.20, available: true },
    { value: controversialContribution, weight: 0.20, available: true },
    { value: certificationContribution, weight: 0.15, available: true },
    { value: otherContribution, weight: 0.15, available: true }
  ];

  const availableComponents = contributions.filter(c => c.available);
  const totalAvailableWeight = availableComponents.reduce((sum, c) => sum + c.weight, 0);
  const totalScore = availableComponents.reduce((sum, c) => sum + c.value, 0);
  const overallScore = totalAvailableWeight > 0 ? Math.round(totalScore / totalAvailableWeight) : 0;

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    healthScore: Math.round((endocrineContribution + allergensContribution + controversialContribution) / 0.70),
    confidence: 0.7,
    breakdown: {
      endocrineDisruptors: { score: endocrineScore, weight: 0.30, count: endocrineDisruptors.length },
      allergens: { score: allergensScore, weight: 0.20, count: allergens.length },
      controversial: { score: controversialScore, weight: 0.20, count: controversialCount },
      certifications: { score: certificationScore, weight: 0.15 }
    }
  };
}

// ============================================
// DETERGENTS SCORING (8 components)
// ============================================
function calculateDetergentsScores(data) {
  // 1. Biodegradability (30%)
  const biodegradable = data.detergentsData?.biodegradable || false;
  const biodegradabilityScore = biodegradable ? 85 : 30;
  const biodegradabilityContribution = biodegradabilityScore * 0.30;

  // 2. Aquatic toxicity (25%)
  const aquaticToxicity = data.detergentsData?.aquaticToxicity || 'unknown';
  let aquaticScore = 50;
  if (aquaticToxicity === 'low') aquaticScore = 85;
  if (aquaticToxicity === 'high') aquaticScore = 15;
  const aquaticContribution = aquaticScore * 0.25;

  // 3. Phosphates (20%)
  const hasPhosphates = data.detergentsData?.hasPhosphates || false;
  const phosphatesScore = hasPhosphates ? 20 : 85;
  const phosphatesContribution = phosphatesScore * 0.20;

  // 4. Eco-labels (15%)
  const labels = data.labels_tags || [];
  let ecolabelScore = 0;
  if (labels.some(l => l.toLowerCase().includes('ecolabel'))) {
    ecolabelScore += 50;
  }
  if (labels.some(l => l.toLowerCase().includes('nordic-swan'))) {
    ecolabelScore += 30;
  }
  if (labels.some(l => l.toLowerCase().includes('ecocert'))) {
    ecolabelScore += 20;
  }
  ecolabelScore = Math.min(100, ecolabelScore);
  const ecolabelContribution = ecolabelScore * 0.15;

  // 5-8. Other components (10% total)
  const otherContribution = 50 * 0.10;

  const contributions = [
    { value: biodegradabilityContribution, weight: 0.30, available: true },
    { value: aquaticContribution, weight: 0.25, available: true },
    { value: phosphatesContribution, weight: 0.20, available: true },
    { value: ecolabelContribution, weight: 0.15, available: true },
    { value: otherContribution, weight: 0.10, available: true }
  ];

  const availableComponents = contributions.filter(c => c.available);
  const totalAvailableWeight = availableComponents.reduce((sum, c) => sum + c.weight, 0);
  const totalScore = availableComponents.reduce((sum, c) => sum + c.value, 0);
  const overallScore = totalAvailableWeight > 0 ? Math.round(totalScore / totalAvailableWeight) : 0;

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    environmentScore: overallScore,
    confidence: 0.6,
    breakdown: {
      biodegradability: { score: biodegradabilityScore, weight: 0.30 },
      aquaticToxicity: { score: aquaticScore, weight: 0.25 },
      phosphates: { score: phosphatesScore, weight: 0.20 },
      ecolabels: { score: ecolabelScore, weight: 0.15 }
    }
  };
}

module.exports = { calculateFoodScores, calculateCosmeticScores, calculateDetergentScores };