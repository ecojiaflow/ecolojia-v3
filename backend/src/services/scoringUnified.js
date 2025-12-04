// backend/src/services/scoringUnified.js

// ============================================
// LISTES D'ADDITIFS
// ============================================
const ADDITIVES_RED_LIST = [
  'E250','E251','E252','E621','E622','E623','E150c','E150d',
  'E320','E321','E951','E104','E110','E122','E124','E129',
  'E216','E217','E214','E215'
];

const ADDITIVES_ORANGE_LIST = [
  'E330','E200','E202','E211','E212',
  'E322','E471','E472','E473','E476'
];

// ============================================
// SEUILS DE CONFIANCE ET TRANSPARENCE
// ============================================
const CONFIDENCE_THRESHOLDS = {
  EXCELLENT: 85,      // Données complètes et vérifiées
  GOOD: 70,           // Données suffisantes pour scoring fiable
  ACCEPTABLE: 60,     // Scoring standard
  DEGRADED: 40,       // ✅ Mode dégradé (données partielles / IA)
  INSUFFICIENT: 0     // Impossible de scorer
};

const SCORING_WEIGHTS = {
  // SANTÉ NUTRITIONNELLE (40%)
  sugars: 0.15,          // OMS <10% AET
  saturatedFat: 0.10,    // ANSES <12% AET
  salt: 0.10,            // OMS <5g/jour
  
  // TRANSFORMATION & ADDITIFS (35%)
  nova: 0.20,            // Monteiro 2016
  additives: 0.15,       // Listes rouge/orange
  
  // ENVIRONNEMENT & LABELS (30%)
  ecoScore: 0.20,        // ADEME ACV
  labels: 0.10,          // Bio/certifs
  
  // Nutri-Score = 0 (affiché mais non comptabilisé)
  nutriScore: 0.0        // Évite double comptage
};

// ============================================
// EQUIVALENTS PÉDAGOGIQUES
// ============================================
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
// CALCUL DU NIVEAU DE CONFIANCE (FOOD)
// ============================================
function calculateDataConfidence(product, category = 'food') {
  if (!product) {
    return {
      confidence: 0,
      level: 'INSUFFICIENT',
      missingCritical: ['product_name', 'brands'],
      missingImportant: ['ingredients_text', 'nutriments'],
      availableData: [],
      canScore: false
    };
  }

  const required = REQUIRED_FIELDS_FOR_FOOD;
  let confidence = 0;
  let missingCritical = [];
  let missingImportant = [];
  let availableData = [];

  // Vérifier champs critiques (40 points)
  required.critical.forEach(field => {
    if (product[field] && product[field].length > 0) {
      confidence += 20;
      availableData.push(field);
    } else {
      missingCritical.push(field);
    }
  });

  // Vérifier champs importants (40 points)
  required.important.forEach(field => {
    if (field === 'nutriments' && product.nutriments) {
      const nutriments = product.nutriments;
      const hasNutriments =
        nutriments.sugars_100g !== undefined ||
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

  // Vérifier champs optionnels (20 points)
  required.optional.forEach(field => {
    if (product[field] && product[field].length > 0) {
      confidence += 6.67;
      availableData.push(field);
    }
  });

  // Déterminer le niveau
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
    canScore: confidence >= CONFIDENCE_THRESHOLDS.DEGRADED
  };
}

// ============================================
// CALCUL DES SCORES ALIMENTAIRES (FOOD)
// ============================================
function calculateFoodScores(data) {
  // 🔍 DEBUG TEMPORAIRE - À RETIRER APRÈS
  console.log('[SCORING DEBUG] === DÉBUT calculateFoodScores ===');
  console.log('[SCORING DEBUG] data.nova_group:', data.nova_group);
  console.log('[SCORING DEBUG] data.novaGroup:', data.novaGroup);
  console.log('[SCORING DEBUG] data.nutriments?.sugars_100g:', data.nutriments?.sugars_100g);
  console.log('[SCORING DEBUG] data.ecoscore_grade:', data.ecoscore_grade);
  console.log('[SCORING DEBUG] data.ecoScore:', data.ecoScore);
  console.log('[SCORING DEBUG] Structure complète nutriments:', JSON.stringify(data.nutriments, null, 2));
  console.log('[SCORING DEBUG] Clés racine data:', Object.keys(data).filter(k => !k.startsWith('_')).slice(0, 20));
  // 🔍 FIN DEBUG
  // 1. Vérifier la qualité des données
  const dataConfidence = calculateDataConfidence(data, 'food');

  // 2. Si données insuffisantes, retourner structure spéciale
  if (!dataConfidence.canScore) {
    return {
      version: '3.2.0',
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
      message: 'Données insuffisantes pour calculer un score fiable.',
      recommendation: 'Utilisez le chat IA pour en savoir plus sur ce produit.',
      needsAIEnrichment: true,
      aiSuggestion: 'ask_ai_for_analysis'
    };
  }

  // 3. Calculer les scores (données suffisantes)
  const nutriments = data.nutriments || {};
  const missingData = [];

  if (!(data.novaGroup || data.nova_groups)) missingData.push('nova');
  if (!(data.nutriScore || data.nutriscore_grade)) missingData.push('nutriScore');
  if (!nutriments.sugars_100g && nutriments.sugars === undefined) missingData.push('sugars');
  if (!nutriments['saturated-fat_100g'] && nutriments.saturated_fat === undefined) missingData.push('saturatedFat');
  if (!nutriments.salt_100g && nutriments.salt === undefined) missingData.push('salt');

  const confidence = (8 - missingData.length) / 8;

  // ============================================
  // 1. NOVA (15%) - Monteiro 2016
  // ============================================
  let novaScore = null;
  if (data.novaGroup || data.nova_group || data.nova_groups) {
    const novaMapping = {
      1: 100, // Aliments non transformés
      2: 75,  // Ingrédients culinaires
      3: 40,  // Aliments transformés (réduit)
      4: 10   // Ultra-transformés (réduit)
    };
    const rawNova = data.novaGroup || data.nova_group || data.nova_groups;
    const novaKey = parseInt(rawNova, 10);
    novaScore = Number.isNaN(novaKey) ? null : (novaMapping[novaKey] ?? null);
  }
  const novaContribution = (novaScore || 0) * SCORING_WEIGHTS.nova;

  // ============================================
  // 2. NUTRI-SCORE (20%) - Santé Publique France
  // ============================================
  let nutriScoreValue = null;
  if (data.nutriScore || data.nutriscore_grade) {
    const nutriMapping = {
      a: 100,
      b: 80,
      c: 60,
      d: 40,
      e: 20
    };
    const nutriKey = (data.nutriScore || data.nutriscore_grade)
      ?.toString()
      .trim()
      .toLowerCase();
    nutriScoreValue = nutriKey ? (nutriMapping[nutriKey] ?? null) : null;
  }
  const nutriContribution = (nutriScoreValue || 0) * SCORING_WEIGHTS.nutriScore;

  // ============================================
  // 3. ADDITIFS (15%) - analyse liste E
  // ============================================
  const additivesAnalysis = analyzeAdditives(data.additives || []);
  const additivesContribution = (additivesAnalysis.score || 0) * SCORING_WEIGHTS.additives;

  // ============================================
  // 4. SUCRES (10%) - Reco OMS
  // ============================================
  let sugarsScore = null;
  const sugars =
    nutriments.sugars_100g !== undefined
      ? nutriments.sugars_100g
      : (nutriments.sugars !== undefined ? nutriments.sugars : null);

  if (sugars !== null) {
    // 100–20 avec seuils OMS-friendly
    if (sugars < 5) sugarsScore = 100;          // Excellent
    else if (sugars < 10) sugarsScore = 80;     // Bon
    else if (sugars < 15) sugarsScore = 60;     // Moyen
    else if (sugars < 25) sugarsScore = 40;     // Médiocre
    else sugarsScore = 20;                      // Mauvais
  }
  const sugarsContribution = (sugarsScore || 0) * SCORING_WEIGHTS.sugars;

  // ============================================
  // 5. GRAISSES SATURÉES (10%) - ANSES
  // ============================================
  let fatScore = null;
  const saturatedFat =
    nutriments['saturated-fat_100g'] !== undefined
      ? nutriments['saturated-fat_100g']
      : (nutriments.saturated_fat_100g !== undefined
        ? nutriments.saturated_fat_100g
        : (nutriments.saturated_fat !== undefined ? nutriments.saturated_fat : null));

  if (saturatedFat !== null) {
    if (saturatedFat < 1.5) fatScore = 100;
    else if (saturatedFat < 5) fatScore = 80;
    else if (saturatedFat < 10) fatScore = 60;
    else if (saturatedFat < 15) fatScore = 40;
    else fatScore = 20;
  }
  const fatContribution = (fatScore || 0) * SCORING_WEIGHTS.saturatedFat;

  // ============================================
  // 6. SEL (10%) - OMS <5g/jour
  // ============================================
  let saltScore = null;
  const salt =
    nutriments.salt_100g !== undefined
      ? nutriments.salt_100g
      : (nutriments.salt !== undefined ? nutriments.salt : null);

  if (salt !== null) {
    if (salt < 0.3) saltScore = 100;
    else if (salt < 1) saltScore = 80;
    else if (salt < 1.5) saltScore = 60;
    else if (salt < 2.5) saltScore = 40;
    else saltScore = 20;
  }
  const saltContribution = (saltScore || 0) * SCORING_WEIGHTS.salt;

  // ============================================
  // 7. ECO-SCORE (15%) - ADEME
  // ============================================
  let ecoScore = null;
  if (data.ecoScore || data.ecoscore_grade) {
    const ecoMapping = {
      a: 100,
      b: 80,
      c: 60,
      d: 40,
      e: 20
    };
    const ecoKey = (data.ecoScore || data.ecoscore_grade)
      ?.toString()
      .trim()
      .toLowerCase();
    ecoScore = ecoKey ? (ecoMapping[ecoKey] ?? null) : null;
  }
  const ecoContribution = (ecoScore || 0) * SCORING_WEIGHTS.ecoScore;

  // ============================================
  // 8. LABELS (5%) - Bio & équivalents
  // ============================================
  let labelsBonus = 0;
  const labels = data.labels || data.labels_tags || [];
  const lowerLabels = labels.map(l => (l || '').toLowerCase());
  const isBio = lowerLabels.some(l => l.includes('bio') || l.includes('organic'));

  if (isBio) labelsBonus += 10;
  labelsBonus = Math.min(15, labelsBonus);

  const labelsContribution = labelsBonus * SCORING_WEIGHTS.labels;

  // ============================================
  // CALCUL SCORE GLOBAL PONDÉRÉ ADAPTATIF
  // ============================================
  const contributions = [
    { value: novaContribution, weight: SCORING_WEIGHTS.nova,        available: novaScore !== null },
    { value: additivesContribution, weight: SCORING_WEIGHTS.additives, available: true },
    { value: sugarsContribution, weight: SCORING_WEIGHTS.sugars,    available: sugarsScore !== null },
    { value: fatContribution,   weight: SCORING_WEIGHTS.saturatedFat, available: fatScore !== null },
    { value: saltContribution,  weight: SCORING_WEIGHTS.salt,       available: saltScore !== null },
    { value: ecoContribution,   weight: SCORING_WEIGHTS.ecoScore,   available: ecoScore !== null },
    { value: labelsContribution,weight: SCORING_WEIGHTS.labels,     available: true }
  ];

  const availableComponents = contributions.filter(c => c.available);
  const totalAvailableWeight = availableComponents.reduce((sum, c) => sum + c.weight, 0);
  const totalScore = availableComponents.reduce((sum, c) => sum + c.value, 0);
  const overallScore = totalAvailableWeight > 0
    ? Math.round(totalScore / totalAvailableWeight)
    : 0;

  // Scores santé / environnement
  // SANTÉ - Normalisation adaptative (comme overallScore)
  const healthComponents = [
    { value: novaContribution, weight: SCORING_WEIGHTS.nova, available: novaScore !== null },
    { value: additivesContribution, weight: SCORING_WEIGHTS.additives, available: true },
    { value: sugarsContribution, weight: SCORING_WEIGHTS.sugars, available: sugarsScore !== null },
    { value: fatContribution, weight: SCORING_WEIGHTS.saturatedFat, available: fatScore !== null },
    { value: saltContribution, weight: SCORING_WEIGHTS.salt, available: saltScore !== null }
  ];

  const availableHealthComponents = healthComponents.filter(c => c.available);
  const totalHealthWeight = availableHealthComponents.reduce((sum, c) => sum + c.weight, 0);
  const totalHealthScore = availableHealthComponents.reduce((sum, c) => sum + c.value, 0);

  const healthScore = totalHealthWeight > 0
    ? Math.round(totalHealthScore / totalHealthWeight)
    : null;

  // ENVIRONNEMENT - Normalisation adaptative (comme overallScore)
  const environmentComponents = [
    { value: ecoContribution, weight: SCORING_WEIGHTS.ecoScore, available: ecoScore !== null },
    { value: labelsContribution, weight: SCORING_WEIGHTS.labels, available: true }
  ];

  const availableEnvComponents = environmentComponents.filter(c => c.available);
  const totalEnvWeight = availableEnvComponents.reduce((sum, c) => sum + c.weight, 0);
  const totalEnvScore = availableEnvComponents.reduce((sum, c) => sum + c.value, 0);

  const environmentScore = totalEnvWeight > 0
    ? Math.round(totalEnvScore / totalEnvWeight)
    : null;

  // ============================================
  // STRUCTURE DE RETOUR COMPLÈTE
  // ============================================
  const novaGroupRaw = data.novaGroup || data.nova_group || data.nova_groups || null;
  const nutriRaw = data.nutriScore || data.nutriscore_grade || null;
  const ecoRaw = data.ecoScore || data.ecoscore_grade || null;

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    healthScore: Math.max(0, Math.min(100, healthScore)),
    environmentScore: Math.max(0, Math.min(100, environmentScore)),
    confidence,
    dataQualityInfo: {
      confidence: dataConfidence.confidence,
      level: dataConfidence.level,
      canScore: true,
      availableData: dataConfidence.availableData
    },
    missingData,
    dataCompleteness:
      confidence >= 0.7 ? 'Excellente' :
      confidence >= 0.4 ? 'Partielle' : 'Insuffisante',
    breakdown: {
      nova: {
        score: novaScore,
        weight: SCORING_WEIGHTS.nova,
        group: novaGroupRaw,
        label: novaGroupRaw ? 'Groupe ' + novaGroupRaw : 'Non défini'
      },
      nutriScore: {
        score: nutriScoreValue,
        weight: SCORING_WEIGHTS.nutriScore,
        grade: nutriRaw ? nutriRaw.toString().toUpperCase() : null,
        label: nutriRaw ? 'Nutri-Score ' + nutriRaw.toString().toUpperCase() : 'Non défini'
      },
      additives: {
        score: additivesAnalysis.score,
        weight: SCORING_WEIGHTS.additives,
        count: (data.additives || []).length,
        dangerous: additivesAnalysis.dangerous,
        label: additivesAnalysis.label
      },
      sugars: {
        score: sugarsScore,
        weight: SCORING_WEIGHTS.sugars,
        value: sugars,
        unit: 'g/100g',
        label: sugars !== null ? `${sugars}g/100g` : 'Non spécifié',
        equivalent: getSugarEquivalent(sugars)
      },
      saturatedFat: {
        score: fatScore,
        weight: SCORING_WEIGHTS.saturatedFat,
        value: saturatedFat,
        unit: 'g/100g',
        label: saturatedFat !== null ? `${saturatedFat}g/100g` : 'Non spécifié',
        equivalent: getFatEquivalent(saturatedFat)
      },
      salt: {
        score: saltScore,
        weight: SCORING_WEIGHTS.salt,
        value: salt,
        unit: 'g/100g',
        label: salt !== null ? `${salt}g/100g` : 'Non spécifié',
        equivalent: getSaltEquivalent(salt)
      },
      ecoScore: {
        score: ecoScore,
        weight: SCORING_WEIGHTS.ecoScore,
        grade: ecoRaw ? ecoRaw.toString().toUpperCase() : null,
        label: ecoRaw ? 'Eco-Score ' + ecoRaw.toString().toUpperCase() : 'Non défini'
      },
      labels: {
        score: labelsBonus,
        weight: SCORING_WEIGHTS.labels,
        list: labels,
        isBio,
        label: isBio ? 'Bio / Organic' : 'Aucun label'
      }
    },    // ============================================
    // ============================================
    // MÉTRIQUES DE QUALITÉ ET ALERTES
    // ============================================
    completeness: confidence, // 0-1 : ratio données disponibles
    confidenceIndex: dataConfidence.confidence, // 0-1 : niveau confiance global
    warnings: (() => {
      const warns = [];
      // Avertissement si données insuffisantes
      if (confidence < 0.4) {
        warns.push({
          type: 'data_quality',
          severity: 'high',
          message: 'Données insuffisantes pour un scoring fiable',
          details: `Seulement ${Math.round(confidence * 100)}% des données nécessaires`
        });
      }
      // Avertissement si scores critiques bas
      if (sugarsScore !== null && sugarsScore < 30) {
        warns.push({
          type: 'health_alert',
          severity: 'medium',
          message: 'Teneur en sucres très élevée',
          details: `${sugars}g/100g (OMS recommande <10g)`
        });
      }
      if (novaScore !== null && novaScore <= 10) {
        warns.push({
          type: 'health_alert',
          severity: 'medium',
          message: 'Produit ultra-transformé (NOVA 4)',
          details: 'Privilégier les aliments bruts ou peu transformés'
        });
      }
      if (additivesAnalysis.dangerous.length > 0) {
        warns.push({
          type: 'health_alert',
          severity: 'high',
          message: `${additivesAnalysis.dangerous.length} additif(s) controversé(s) détecté(s)`,
          details: additivesAnalysis.dangerous.join(', ')
        });
      }
      // Avertissement si eco-score faible
      if (ecoScore !== null && ecoScore < 40) {
        warns.push({
          type: 'environment_alert',
          severity: 'low',
          message: 'Impact environnemental élevé',
          details: ecoRaw ? `Eco-Score ${ecoRaw.toUpperCase()}` : 'Empreinte carbone importante'
        });
      }
      return warns;
    })(),
    scoringMetadata: {
      methodology: 'ECOLOJIA V3.2.0 - Scoring scientifique 8 composantes',
      version: '3.2.0',
      calculatedAt: new Date().toISOString()
    },
    category: 'food'
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

  if (redCount > 0)
    return {
      score: 10,
      label: `${additives.length} additifs dont ${redCount} DANGEREUX`,
      dangerous
    };

  if (orangeCount >= 3)
    return {
      score: 35,
      label: `${additives.length} additifs`,
      dangerous: []
    };

  if (orangeCount >= 1)
    return {
      score: 55,
      label: `${additives.length} additifs acceptables`,
      dangerous: []
    };

  if (additives.length <= 3)
    return {
      score: 70,
      label: `${additives.length} additifs`,
      dangerous: []
    };

  return {
    score: 50,
    label: `${additives.length} additifs`,
    dangerous: []
  };
}

// ============================================
// MULTI-CATEGORY ROUTER
// ============================================
function calculateScores(data) {
  const category = data.categoryType || data.category || 'food';

  switch (category) {
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
// (repris de ta version existante, inchangé)
// ============================================
function calculateCosmeticsScores(data) {
  /**
   * SCORING COSMÉTIQUES SCIENTIFIQUE
   * Sources: ANSES, EU 1223/2009, ECHA, ECOCERT/COSMEBIO
   * 4 composantes robustes vérifiables
   */

  const missingData = [];

  // 1. PERTURBATEURS ENDOCRINIENS (40%) - ANSES
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

  // 2. ALLERGÈNES (30%) - EU 1223/2009
  const EU_26_ALLERGENS = [
    'limonene', 'linalool', 'geraniol', 'citronellol',
    'coumarin', 'eugenol', 'cinnamal', 'farnesol',
    'citral', 'benzyl alcohol', 'benzyl salicylate',
    'benzyl benzoate', 'benzyl cinnamate', 'anise alcohol',
    'isoeugenol', 'amyl cinnamal', 'amylcinnamyl alcohol',
    'cinnamyl alcohol', 'hexyl cinnamal',
    'hydroxyisohexyl 3-cyclohexene carboxaldehyde',
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

  // 3. SUBSTANCES CMR (20%) - ECHA
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

  // 4. CERTIFICATIONS (10%) - ECOCERT/COSMEBIO
  const certifications = data.cosmeticsData?.certifications || [];
  let certificationScore = null; // Pas de données = non calculable
  let certificationVerified = false;

  if (certifications.some(c => c.toLowerCase().includes('ecocert'))) {
    certificationScore = 95;
    certificationVerified = true;
  } else if (certifications.some(c => c.toLowerCase().includes('cosmebio'))) {
    certificationScore = 90;
    certificationVerified = true;
  } else if (
    certifications.some(
      c => c.toLowerCase().includes('bio') || c.toLowerCase().includes('organic')
    )
  ) {
    certificationScore = 60;
    certificationVerified = false;
  }

  if (!data.cosmeticsData?.certifications) missingData.push('certifications');

  // CALCUL SCORE GLOBAL ADAPTATIF
  const components = [
    { score: endocrineScore,     weight: 0.40, available: !missingData.includes('endocrineDisruptors') },
    { score: allergensScore,     weight: 0.30, available: !missingData.includes('allergens') },
    { score: cmrScore,           weight: 0.20, available: !missingData.includes('cmrSubstances') },
    { score: certificationScore, weight: 0.10, available: !missingData.includes('certifications') }
  ];

  const availableComponentsCos = components.filter(c => c.available);
  const totalAvailableWeightCos = availableComponentsCos.reduce((sum, c) => sum + c.weight, 0);
  const weightedSumCos = availableComponentsCos.reduce((sum, c) => sum + (c.score * c.weight), 0);

  const overallScoreCos = totalAvailableWeightCos > 0
    ? Math.round(weightedSumCos / totalAvailableWeightCos)
    : null;

  const confidenceCos = totalAvailableWeightCos;

  const healthComponents = components.slice(0, 3).filter(c => c.available);
  const healthWeight = healthComponents.reduce((sum, c) => sum + c.weight, 0);
  const healthSum = healthComponents.reduce((sum, c) => sum + (c.score * c.weight), 0);
  const healthScoreCos = healthWeight > 0 ? Math.round(healthSum / healthWeight) : null;

  return {
    overallScore: overallScoreCos !== null ? Math.max(0, Math.min(100, overallScoreCos)) : null,
    healthScore: healthScoreCos !== null ? Math.max(0, Math.min(100, healthScoreCos)) : null,
    environmentScore: null,
    confidence: confidenceCos,
    missingData: missingData,
    breakdown: {
      endocrineDisruptors: {
        score: endocrineScore,
        weight: 0.40,
        detected: endocrineDisruptors,
        count: endocrineDisruptors.length,
        severity: endocrineSeverity,
        source: 'ANSES - Liste perturbateurs endocriniens',
        explanation:
          endocrineDisruptors.length === 0
            ? 'Aucun perturbateur endocrinien détecté (ANSES)'
            : `${endocrineDisruptors.length} perturbateur(s) endocrinien(s) détecté(s) (ANSES)`,
        recommendation:
          endocrineDisruptors.length === 0
            ? 'Excellent - Aucun perturbateur détecté'
            : endocrineDisruptors.length <= 2
            ? 'Attention - Présence de perturbateurs endocriniens'
            : 'Déconseillé - Forte présence de perturbateurs endocriniens'
      },
      allergens: {
        score: allergensScore,
        weight: 0.30,
        detected: allergens,
        count: allergens.length,
        euMandatory: true,
        source: 'EU Regulation 1223/2009 - 26 allergènes obligatoires',
        explanation:
          allergens.length === 0
            ? 'Aucun allergène EU obligatoire détecté'
            : `${allergens.length} allergène(s) EU détecté(s) sur 26`,
        recommendation:
          allergens.length === 0
            ? 'Excellent - Hypoallergénique'
            : allergens.length <= 2
            ? 'Bon - Peu d’allergènes'
            : allergens.length <= 5
            ? 'Moyen - Plusieurs allergènes'
            : 'Attention - Nombreux allergènes (risque de sensibilisation)'
      },
      cmrSubstances: {
        score: cmrScore,
        weight: 0.20,
        detected: cmrSubstances,
        count: cmrSubstances.length,
        categoryECHA: cmrCategory,
        source: 'ECHA - Substances CMR (Cancérogènes/Mutagènes/Reprotoxiques)',
        explanation:
          cmrSubstances.length === 0
            ? 'Aucune substance CMR détectée (ECHA)'
            : `${cmrSubstances.length} substance(s) CMR détectée(s) - Catégorie ${cmrCategory}`,
        recommendation:
          cmrSubstances.length === 0
            ? 'Excellent - Aucune substance CMR'
            : 'Éviter - Présence de substances cancérogènes/mutagènes/reprotoxiques'
      },
      certifications: {
        score: certificationScore,
        weight: 0.10,
        detected: certifications,
        verified: certificationVerified,
        source: 'ECOCERT/COSMEBIO - Certifications bio officielles',
        explanation: certificationVerified
          ? 'Certification bio officielle vérifiée'
          : certifications.length > 0
          ? 'Claims bio non vérifiés'
          : 'Aucune certification bio',
        recommendation: certificationVerified
          ? 'Excellent - Certification officielle'
          : certifications.length > 0
          ? 'À vérifier - Claims non certifiés'
          : 'Produit conventionnel'
      }
    },
    scoringVersion: '3.1.0',
    category: 'cosmetics'
  };
}

// ============================================
// DETERGENTS SCORING (8 components)
// (repris de ta version existante, inchangé)
// ============================================
function calculateDetergentsScores(data) {
  /**
   * SCORING DÉTERGENTS SCIENTIFIQUE
   * Sources: EU 648/2004, CLP Regulation, EN 62455, ECHA, EU Ecolabel
   * 4 composantes robustes vérifiables
   */

  const missingData = [];

  // 1. BIODEGRADABILITÉ (40%) - EN 62455 / OCDE 301
  const biodegradableData = data.detergentsData?.biodegradability;
  let biodegradabilityScore = null;
  let surfactantsType = 'unknown';
  let biodegradablePercent = 0;
  let standard = 'Unknown';

  if (biodegradableData) {
    biodegradablePercent = biodegradableData.biodegradablePercent || 0;
    surfactantsType = biodegradableData.surfactantsType || 'unknown';
    standard = biodegradableData.standard || 'Unknown';

    if (biodegradablePercent >= 90) {
      biodegradabilityScore = 95;
    } else if (biodegradablePercent >= 60) {
      biodegradabilityScore = 80;
    } else if (biodegradablePercent >= 40) {
      biodegradabilityScore = 60;
    } else if (biodegradablePercent > 0) {
      biodegradabilityScore = 35;
    } else {
      biodegradabilityScore = 50;
    }
  } else {
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

  // 2. TOXICITÉ AQUATIQUE (30%) - CLP Regulation
  const aquaticToxicityData = data.detergentsData?.aquaticToxicity;
  let aquaticScore = null;
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

  // 3. PHOSPHATES (20%) - EU 648/2004
  const phosphatesData = data.detergentsData?.phosphates;
  let phosphatesScore = null;
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
      const contentMatch = phosphatesContent.match(/(\d+\.?\d*)/);
      const grams = contentMatch ? parseFloat(contentMatch[1]) : 0;

      if (grams <= 0.3) {
        phosphatesScore = 85;
        compliantEU = true;
      } else {
        phosphatesScore = 20;
        compliantEU = false;
      }
    }
  } else {
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

  // 4. ECOLABELS (10%) - EU Ecolabel, Nordic Swan, Ecocert
  const ecolabelsData = data.detergentsData?.ecolabels;
  let ecolabelScore = null;
  let ecolabelsDetected = [];
  let ecolabelsVerified = false;

  if (ecolabelsData) {
    ecolabelsDetected = ecolabelsData.detected || [];
    ecolabelsVerified = ecolabelsData.verified || false;

    if (ecolabelsVerified && ecolabelsDetected.length > 0) {
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
      ecolabelScore = 60;
    } else {
      ecolabelScore = 50;
    }
  } else {
    const labelsDet = data.labels_tags || [];
    if (!ecolabelScore) ecolabelScore = 0;

    if (labelsDet.some(l => l.toLowerCase().includes('ecolabel'))) {
      ecolabelScore += 50;
      ecolabelsDetected.push('EU Ecolabel (claim)');
    }
    if (labelsDet.some(l => l.toLowerCase().includes('nordic-swan'))) {
      ecolabelScore += 30;
      ecolabelsDetected.push('Nordic Swan (claim)');
    }
    if (labelsDet.some(l => l.toLowerCase().includes('ecocert'))) {
      ecolabelScore += 20;
      ecolabelsDetected.push('Ecocert (claim)');
    }
    ecolabelScore = Math.min(100, ecolabelScore);
  }

  if (!data.detergentsData?.ecolabels && (!data.labels_tags || data.labels_tags.length === 0)) {
    missingData.push('ecolabels');
  }

  // CALCUL SCORE GLOBAL ADAPTATIF
  const componentsDet = [
    { score: biodegradabilityScore, weight: 0.40, available: !missingData.includes('biodegradability') },
    { score: aquaticScore,         weight: 0.30, available: !missingData.includes('aquaticToxicity') },
    { score: phosphatesScore,      weight: 0.20, available: !missingData.includes('phosphates') },
    { score: ecolabelScore,        weight: 0.10, available: !missingData.includes('ecolabels') }
  ];

  const availableComponentsDet = componentsDet.filter(c => c.available);
  const totalAvailableWeightDet = availableComponentsDet.reduce((sum, c) => sum + c.weight, 0);
  const weightedSumDet = availableComponentsDet.reduce((sum, c) => sum + (c.score * c.weight), 0);

  const overallScoreDet = totalAvailableWeightDet > 0
    ? Math.round(weightedSumDet / totalAvailableWeightDet)
    : null;

  const confidenceDet = totalAvailableWeightDet;

  return {
    overallScore: overallScoreDet !== null ? Math.max(0, Math.min(100, overallScoreDet)) : null,
    environmentScore: overallScoreDet !== null ? Math.max(0, Math.min(100, overallScoreDet)) : null,
    healthScore: null,
    confidence: confidenceDet,
    missingData: missingData,
    breakdown: {
      biodegradability: {
        score: biodegradabilityScore,
        weight: 0.40,
        surfactantsType: surfactantsType,
        biodegradablePercent: biodegradablePercent,
        standard: standard,
        source: 'EN 62455 / OCDE 301 - Biodégradabilité tensioactifs',
        explanation:
          biodegradablePercent >= 60
            ? `Conforme EN 62455 (${biodegradablePercent}% biodégradable en 28 jours)`
            : biodegradablePercent > 0
            ? `Non conforme EN 62455 (${biodegradablePercent}% biodégradable)`
            : 'Biodégradabilité inconnue',
        recommendation:
          biodegradablePercent >= 90
            ? 'Excellent - Très biodégradable'
            : biodegradablePercent >= 60
            ? 'Bon - Conforme norme EU'
            : biodegradablePercent > 0
            ? 'Insuffisant - Non conforme'
            : 'Donnée manquante'
      },
      aquaticToxicity: {
        score: aquaticScore,
        weight: 0.30,
        clpCodes: clpCodes,
        severity: severity,
        source: 'CLP Regulation - Classification toxicité aquatique',
        explanation:
          clpCodes.length === 0
            ? 'Aucun code CLP toxicité aquatique détecté'
            : `Codes CLP: ${clpCodes.join(', ')} - Sévérité: ${severity}`,
        recommendation:
          severity === 'NONE'
            ? 'Excellent - Non toxique pour le milieu aquatique'
            : severity === 'LOW'
            ? 'Bon - Faible toxicité (H413)'
            : severity === 'MEDIUM'
            ? 'Moyen - Toxicité modérée (H412)'
            : severity === 'HIGH'
            ? 'Attention - Toxique (H411)'
            : 'ÉVITER - Très toxique (H400/H410)'
      },
      phosphates: {
        score: phosphatesScore,
        weight: 0.20,
        detected: phosphatesDetected,
        content: phosphatesContent,
        compliantEU: compliantEU,
        source: 'EU Regulation 648/2004 - Limite phosphates 0.3g/dose',
        explanation:
          !phosphatesDetected
            ? 'Aucun phosphate détecté (conforme EU 648/2004)'
            : compliantEU
            ? `Phosphates ${phosphatesContent} (conforme limite 0.3g/dose)`
            : `Phosphates ${phosphatesContent} (NON CONFORME - limite 0.3g/dose)`,
        recommendation:
          !phosphatesDetected
            ? 'Excellent - Sans phosphates'
            : compliantEU
            ? 'Acceptable - Conforme limite EU'
            : 'NON CONFORME - Dépasse limite EU (interdit depuis 2017)'
      },
      ecolabels: {
        score: ecolabelScore,
        weight: 0.10,
        detected: ecolabelsDetected,
        verified: ecolabelsVerified,
        source: 'EU Ecolabel / Nordic Swan / Ecocert - Certifications officielles',
        explanation:
          ecolabelsVerified && ecolabelsDetected.length > 0
            ? `Certification(s) officielle(s): ${ecolabelsDetected.join(', ')}`
            : ecolabelsDetected.length > 0
            ? `Claims non vérifiés: ${ecolabelsDetected.join(', ')}`
            : 'Aucun écolabel détecté',
        recommendation:
          ecolabelsVerified
            ? 'Excellent - Certification officielle vérifiée'
            : ecolabelsDetected.length > 0
            ? 'À vérifier - Claims non certifiés'
            : 'Produit conventionnel'
      }
    },
    scoringVersion: '3.1.0',
    category: 'detergents'
  };
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  calculateFoodScores,
  calculateCosmeticsScores,
  calculateDetergentsScores,
  calculateScores,
  analyzeAdditives,
  calculateDataConfidence
};










