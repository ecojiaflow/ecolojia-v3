/**
 * nutritionReferences.js
 * Knowledge Base - Reperes Nutritionnels Generaux
 * Version: 2.0.0
 *
 * DISTINCTION IMPORTANTE:
 * - EU RI (Reference Intakes) = reperes etiquetage EU (Reglement 1169/2011)
 * - OMS = recommandations sante publique (plus strictes)
 *
 * Sources officielles: EU RI, OMS, ANSES, EFSA
 *
 * PRINCIPE ECOLOJIA:
 * - Reperes GENERAUX (pas personnels)
 * - Pourcentages INDICATIFS (pas prescriptifs)
 * - Ton PEDAGOGIQUE (pas medical)
 * - Sources OFFICIELLES uniquement
 */

const DAILY_REFERENCES = {
  // Energie
  energy: {
    value: 2000,
    unit: "kcal",
    source: "EU RI",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169",
    interpretation: "Repere moyen adulte. Varie selon age, sexe, activite physique.",
    disclaimer: "Valeur indicative, pas un objectif personnel."
  },

  // Sucres - CORRIGE avec distinction EU RI vs OMS
  sugars: {
    // EU RI = 90g (etiquetage officiel EU)
    value: 90,
    unit: "g",
    source: "EU RI",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169",
    // OMS = recommandations sante (sucres libres)
    oms: {
      ideal: 25,
      max: 50,
      source: "OMS 2015",
      sourceUrl: "https://www.who.int/publications/i/item/9789241549028",
      note: "Sucres libres = sucres ajoutes + sucres naturellement presents dans jus, sirops, miel. Ne s'applique PAS aux fruits entiers."
    },
    interpretation: "EU RI: 90g/jour (etiquetage). OMS: idealement <25g, maximum 50g (sucres libres).",
    disclaimer: "Le % RI est base sur 90g. Le repere OMS (25-50g) concerne les sucres libres/ajoutes.",
    thresholds: {
      low: 5,
      medium: 12.5,
      high: 22.5
    }
  },

  // Graisses saturees
  saturatedFat: {
    value: 20,
    unit: "g",
    source: "EU RI",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169",
    interpretation: "Moins de 10% de apport energetique total.",
    disclaimer: "Privilegier les graisses insaturees (huile olive, poissons gras).",
    thresholds: {
      low: 1.5,
      medium: 2.5,
      high: 5
    }
  },

  // Sel - CORRIGE avec distinction EU RI vs OMS
  salt: {
    // EU RI = 6g (etiquetage officiel EU)
    value: 6,
    unit: "g",
    source: "EU RI",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169",
    // OMS = recommandation sante
    oms: {
      max: 5,
      source: "OMS 2012",
      sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/salt-reduction",
      note: "Equivalent a 2g de sodium."
    },
    interpretation: "EU RI: 6g/jour (etiquetage). OMS: maximum 5g/jour (sante).",
    disclaimer: "Le sel cache dans les produits transformes represente environ 80% de apport.",
    thresholds: {
      low: 0.3,
      medium: 0.6,
      high: 1.5
    }
  },

  // Fibres
  fiber: {
    value: 25,
    ideal: 30,
    unit: "g",
    source: "EU RI + ANSES",
    sourceUrl: "https://www.anses.fr/fr/content/les-fibres-alimentaires",
    interpretation: "EU RI: 25g/jour. ANSES recommande 30g ou plus.",
    disclaimer: "Associees a un meilleur transit et une meilleure satiete.",
    thresholds: {
      low: 1.5,
      medium: 3,
      high: 6
    },
    isPositive: true
  },

  // Proteines
  proteins: {
    value: 50,
    unit: "g",
    source: "EU RI",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169",
    interpretation: "0.83g par kg de poids corporel minimum pour un adulte.",
    disclaimer: "Besoins plus eleves pour sportifs, personnes agees, croissance.",
    thresholds: {
      low: 5,
      medium: 10,
      high: 20
    },
    isPositive: true
  },

  // Matieres grasses totales
  fat: {
    value: 70,
    unit: "g",
    source: "EU RI",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169",
    interpretation: "20-35% de apport energetique total.",
    disclaimer: "La qualite des graisses compte autant que la quantite.",
    thresholds: {
      low: 3,
      medium: 10,
      high: 17.5
    }
  }
};

/**
 * Portions de reference par categorie de produit
 * Permet de calculer "une portion de X g apporte..."
 */
const PORTION_REFERENCES = {
  "chocolate-spread": { value: 30, unit: "g", context: "tartine" },
  "breakfast-cereals": { value: 30, unit: "g", context: "bol" },
  "biscuits": { value: 30, unit: "g", context: "2-3 biscuits" },
  "yogurts": { value: 125, unit: "g", context: "1 pot" },
  "cheese": { value: 30, unit: "g", context: "1 portion" },
  "bread": { value: 50, unit: "g", context: "2 tranches" },
  "juices": { value: 200, unit: "ml", context: "1 verre" },
  "sodas": { value: 330, unit: "ml", context: "1 canette" },
  "chips": { value: 30, unit: "g", context: "1 poignee" },
  "ice-cream": { value: 100, unit: "g", context: "2 boules" },
  "pizza": { value: 200, unit: "g", context: "1/4 pizza" },
  "ready-meals": { value: 300, unit: "g", context: "1 portion" },
  "fruits": { value: 150, unit: "g", context: "1 fruit moyen" },
  "default": { value: 100, unit: "g", context: "pour 100g" }
};

/**
 * Detecte si un produit contient des sucres libres ou naturels
 * @param {Object} product - Produit avec category/subcategory/ingredients
 * @returns {string} "free" | "natural" | "mixed" | "unknown"
 */
function detectSugarType(product) {
  const category = (product?.category || "").toLowerCase();
  const subcategory = (product?.subcategory || "").toLowerCase();
  const ingredients = (product?.ingredients_text || "").toLowerCase();
  
  // Fruits entiers = sucres naturels (OMS non applicable)
  const naturalSugarCategories = ["fruits", "legumes", "fruit", "vegetable"];
  if (naturalSugarCategories.some(cat => category.includes(cat) || subcategory.includes(cat))) {
    // Verifier que ce n'est pas un jus ou compote sucree
    if (!ingredients.includes("sucre") && !ingredients.includes("sirop") && !subcategory.includes("jus")) {
      return "natural";
    }
  }
  
  // Produits avec sucres ajoutes evidents
  const freeSugarIndicators = ["sucre", "glucose", "fructose", "sirop", "miel", "dextrose", "maltose"];
  if (freeSugarIndicators.some(indicator => ingredients.includes(indicator))) {
    return "free";
  }
  
  // Jus de fruits = sucres libres selon OMS
  if (subcategory.includes("jus") || subcategory.includes("juice")) {
    return "free";
  }
  
  // Lait, yaourt nature = sucres naturels (lactose)
  if ((subcategory.includes("lait") || subcategory.includes("yaourt")) && !ingredients.includes("sucre")) {
    return "natural";
  }
  
  return "unknown";
}

/**
 * Calcule le contexte nutritionnel d un produit
 * @param {Object} product - Produit avec nutritionalInfo
 * @returns {Object} Contexte nutritionnel pour affichage
 */
function calculateNutritionContext(product) {
  const nutrition = product?.foodData?.nutritionalInfo || product?.nutritionalInfo || {};
  const subcategory = product?.subcategory || "default";

  // Portion de reference
  const portionRef = PORTION_REFERENCES[subcategory] || PORTION_REFERENCES["default"];
  const portionMultiplier = portionRef.value / 100;

  // Detection type de sucres
  const sugarType = detectSugarType(product);

  const context = {
    version: "2.0.0",
    references: {},
    portion: {
      size: portionRef.value,
      unit: portionRef.unit,
      context: portionRef.context
    },
    insights: [],
    disclaimer: "Reperes nutritionnels EU RI (etiquetage) et OMS (sante publique). Ils servent a situer un produit, pas a calculer une ration personnelle."
  };

  // Sucres - avec distinction EU RI vs OMS
  if (nutrition.sugars !== undefined && nutrition.sugars !== null) {
    const per100g = parseFloat(nutrition.sugars) || 0;
    const perPortion = per100g * portionMultiplier;
    const ref = DAILY_REFERENCES.sugars;
    
    // % EU RI (base 90g)
    const percentOfRI = Math.round((per100g / ref.value) * 100);
    
    // % OMS (base 25g ideal) - seulement si sucres libres
    const percentOfOMSIdeal = Math.round((per100g / ref.oms.ideal) * 100);
    const percentOfOMSMax = Math.round((per100g / ref.oms.max) * 100);

    context.references.sugars = {
      per100g,
      perPortion: Math.round(perPortion * 10) / 10,
      // EU RI
      dailyReference: ref.value,
      percentOfDaily: percentOfRI,
      // OMS (sucres libres)
      oms: {
        ideal: ref.oms.ideal,
        max: ref.oms.max,
        percentOfIdeal: percentOfOMSIdeal,
        percentOfMax: percentOfOMSMax,
        applicable: sugarType === "free" || sugarType === "mixed" || sugarType === "unknown",
        sugarType: sugarType,
        note: sugarType === "natural" 
          ? "Sucres naturellement presents (fruit entier). Le repere OMS sucres libres ne s'applique pas."
          : sugarType === "free"
            ? "Sucres libres/ajoutes. Le repere OMS s'applique."
            : "Type de sucres non determine. Repere OMS donne a titre indicatif."
      },
      level: getLevel(per100g, ref.thresholds),
      source: ref.source,
      unit: ref.unit
    };

    // Insight si sucres eleves ET sucres libres
    if (per100g > ref.thresholds.high && sugarType !== "natural") {
      context.insights.push({
        type: "sugars",
        severity: "high",
        message: "Une portion de " + portionRef.value + portionRef.unit + " apporte environ " + Math.round(perPortion) + "g de sucres, soit " + Math.round((perPortion / ref.oms.ideal) * 100) + "% du repere OMS ideal (sucres libres)."
      });
    }
  }

  // Graisses saturees
  if (nutrition.saturatedFat !== undefined && nutrition.saturatedFat !== null) {
    const per100g = parseFloat(nutrition.saturatedFat) || 0;
    const perPortion = per100g * portionMultiplier;
    const ref = DAILY_REFERENCES.saturatedFat;
    const percentOfDaily = Math.round((per100g / ref.value) * 100);

    context.references.saturatedFat = {
      per100g,
      perPortion: Math.round(perPortion * 10) / 10,
      dailyReference: ref.value,
      percentOfDaily,
      level: getLevel(per100g, ref.thresholds),
      source: ref.source,
      unit: ref.unit
    };
  }

  // Sel - avec distinction EU RI vs OMS
  if (nutrition.salt !== undefined && nutrition.salt !== null) {
    const per100g = parseFloat(nutrition.salt) || 0;
    const perPortion = per100g * portionMultiplier;
    const ref = DAILY_REFERENCES.salt;
    
    // % EU RI (base 6g)
    const percentOfRI = Math.round((per100g / ref.value) * 100);
    // % OMS (base 5g)
    const percentOfOMS = Math.round((per100g / ref.oms.max) * 100);

    context.references.salt = {
      per100g,
      perPortion: Math.round(perPortion * 10) / 10,
      // EU RI
      dailyReference: ref.value,
      percentOfDaily: percentOfRI,
      // OMS
      oms: {
        max: ref.oms.max,
        percentOfMax: percentOfOMS
      },
      level: getLevel(per100g, ref.thresholds),
      source: ref.source,
      unit: ref.unit
    };

    // Insight si sel eleve
    if (per100g > ref.thresholds.high) {
      context.insights.push({
        type: "salt",
        severity: "high",
        message: "Ce produit contient " + per100g + "g de sel pour 100g, soit " + percentOfRI + "% du repere EU RI (" + percentOfOMS + "% du repere OMS)."
      });
    }
  }

  // Fibres (positif)
  if (nutrition.fiber !== undefined && nutrition.fiber !== null) {
    const per100g = parseFloat(nutrition.fiber) || 0;
    const perPortion = per100g * portionMultiplier;
    const ref = DAILY_REFERENCES.fiber;
    const percentOfDaily = Math.round((per100g / ref.value) * 100);

    context.references.fiber = {
      per100g,
      perPortion: Math.round(perPortion * 10) / 10,
      dailyReference: ref.value,
      percentOfDaily,
      level: getLevelPositive(per100g, ref.thresholds),
      source: ref.source,
      unit: ref.unit,
      isPositive: true
    };

    // Insight si riche en fibres
    if (per100g >= ref.thresholds.high) {
      context.insights.push({
        type: "fiber",
        severity: "positive",
        message: "Riche en fibres : " + per100g + "g pour 100g, contribue a objectif de " + ref.value + "g/jour."
      });
    }
  }

  // Proteines (positif)
  if (nutrition.proteins !== undefined && nutrition.proteins !== null) {
    const per100g = parseFloat(nutrition.proteins) || 0;
    const perPortion = per100g * portionMultiplier;
    const ref = DAILY_REFERENCES.proteins;
    const percentOfDaily = Math.round((per100g / ref.value) * 100);

    context.references.proteins = {
      per100g,
      perPortion: Math.round(perPortion * 10) / 10,
      dailyReference: ref.value,
      percentOfDaily,
      level: getLevelPositive(per100g, ref.thresholds),
      source: ref.source,
      unit: ref.unit,
      isPositive: true
    };
  }

  // Energie
  if (nutrition.energy_kcal !== undefined && nutrition.energy_kcal !== null) {
    const per100g = parseFloat(nutrition.energy_kcal) || 0;
    const perPortion = per100g * portionMultiplier;
    const ref = DAILY_REFERENCES.energy;
    const percentOfDaily = Math.round((per100g / ref.value) * 100);

    context.references.energy = {
      per100g,
      perPortion: Math.round(perPortion),
      dailyReference: ref.value,
      percentOfDaily,
      source: ref.source,
      unit: ref.unit
    };
  }

  // Graisses totales
  if (nutrition.fat !== undefined && nutrition.fat !== null) {
    const per100g = parseFloat(nutrition.fat) || 0;
    const perPortion = per100g * portionMultiplier;
    const ref = DAILY_REFERENCES.fat;
    const percentOfDaily = Math.round((per100g / ref.value) * 100);

    context.references.fat = {
      per100g,
      perPortion: Math.round(perPortion * 10) / 10,
      dailyReference: ref.value,
      percentOfDaily,
      level: getLevel(per100g, ref.thresholds),
      source: ref.source,
      unit: ref.unit
    };
  }

  // Confiance du contexte
  const fieldsPresent = Object.keys(context.references).length;
  context.confidence = fieldsPresent >= 5 ? "high" : fieldsPresent >= 3 ? "medium" : "low";

  return context;
}

/**
 * Determine le niveau (low/medium/high) pour nutriments a limiter
 */
function getLevel(value, thresholds) {
  if (value <= thresholds.low) return "low";
  if (value <= thresholds.medium) return "medium";
  return "high";
}

/**
 * Determine le niveau pour nutriments positifs (fibres, proteines)
 */
function getLevelPositive(value, thresholds) {
  if (value >= thresholds.high) return "high";
  if (value >= thresholds.medium) return "medium";
  return "low";
}

/**
 * Retourne les reperes de reference (pour documentation/UI)
 */
function getDailyReferences() {
  return DAILY_REFERENCES;
}

/**
 * Retourne les portions de reference
 */
function getPortionReferences() {
  return PORTION_REFERENCES;
}

module.exports = {
  calculateNutritionContext,
  getDailyReferences,
  getPortionReferences,
  detectSugarType,
  DAILY_REFERENCES,
  PORTION_REFERENCES
};
