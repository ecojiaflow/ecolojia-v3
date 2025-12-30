/**
 * RISK FLAGS CONFIGURATION V1.0
 * 
 * Système FLAGS pour détermination niveau produit (1/2/3)
 * Architecture : Flag = fait observable + contexte scientifique
 * 
 * Structure d'un flag :
 * - id: identifiant unique
 * - severity: low | medium | high
 * - evidence_tier: A (consensus fort) | B (données convergentes) | C (émergent)
 * - domains: ['health', 'environment', 'exposure']
 * - trigger: fonction (product, context) => boolean
 * - refs: IDs vers Knowledge Base (ANSES, OMS, EFSA)
 * - notes: contexte d'usage
 */

const RISK_FLAGS = {
  // ============================================
  // FLAGS FOOD (12 flags)
  // ============================================
  food: {
    // ----------------
    // FLAGS MAJEURS (severity: high)
    // ----------------
    ultra_processed: {
      id: 'ultra_processed',
      severity: 'high',
      evidence_tier: 'B',
      domains: ['health'],
      trigger: (product, ctx) => {
        return ctx.nova === 4;
      },
      refs: ['ANSES_UPF_ASSOCIATIONS', 'WHO_DIET_NCDS'],
      notes: 'Facteur de risque populationnel en usage régulier. Mécanismes : matrice alimentaire, additifs cumulés, densité énergétique.'
    },

    sugar_sweetened_beverage: {
      id: 'sugar_sweetened_beverage',
      severity: 'high',
      evidence_tier: 'A',
      domains: ['health'],
      trigger: (product, ctx) => {
        // Boisson ET sucre >= 5g/100ml
        return ctx.isBeverage && (ctx.nutrients?.sugars_g_100ml ?? 0) >= 5;
      },
      refs: ['WHO_SUGAR_GUIDELINE', 'ANSES_SUGARS'],
      notes: 'Cas typique Niveau 3A si usage habituel. Absorption rapide, pas de satiété, substituts simples (eau, eau aromatisée).'
    },

    high_added_sugar: {
      id: 'high_added_sugar',
      severity: 'high',
      evidence_tier: 'A',
      domains: ['health'],
      trigger: (product, ctx) => {
        // Aliment solide ET sucres >= 15g/100g
        return ctx.isSolidFood && (ctx.nutrients?.sugars_g_100g ?? 0) >= 15;
      },
      refs: ['WHO_SUGAR_GUIDELINE', 'ANSES_SUGARS'],
      notes: 'Seuil OMS : <10% AET (idéalement <5%). 15g/100g = produit à forte densité sucrée.'
    },

    problematic_additives: {
      id: 'problematic_additives',
      severity: 'high',
      evidence_tier: 'B',
      domains: ['health', 'exposure'],
      trigger: (product, ctx) => {
        // Au moins 1 additif à risque élevé (rouge/orange)
        return (ctx.additivesRiskCount?.high ?? 0) >= 1;
      },
      refs: ['EFSA_ADDITIVES_OVERVIEW', 'ANSES_ADDITIVES'],
      notes: 'Additifs controversés (colorants azoïques, nitrites, etc.). Effet dose-dépendant et exposition cumulée.'
    },

    high_sodium: {
      id: 'high_sodium',
      severity: 'medium',
      evidence_tier: 'A',
      domains: ['health'],
      trigger: (product, ctx) => {
        // Sel >= 1.5g/100g (3.75g sodium/100g)
        return (ctx.nutrients?.salt_g_100g ?? 0) >= 1.5;
      },
      refs: ['WHO_SALT_GUIDELINE', 'ANSES_SODIUM'],
      notes: 'Seuil OMS : <5g sel/jour. Produits >1.5g/100g contributeurs majeurs.'
    },

    high_saturated_fat: {
      id: 'high_saturated_fat',
      severity: 'medium',
      evidence_tier: 'A',
      domains: ['health'],
      trigger: (product, ctx) => {
        // Graisses saturées >= 10g/100g OU >50% des lipides totaux
        const satFat = ctx.nutrients?.saturated_fat_g_100g ?? 0;
        const totalFat = ctx.nutrients?.fat_g_100g ?? 0;
        return satFat >= 10 || (totalFat > 0 && satFat / totalFat > 0.5);
      },
      refs: ['ANSES_LIPIDS', 'WHO_DIET_NCDS'],
      notes: 'Recommandation : <10% AET. Attention sources (huile palme, graisses hydrogénées).'
    },

    low_nutritional_density: {
      id: 'low_nutritional_density',
      severity: 'medium',
      evidence_tier: 'B',
      domains: ['health'],
      trigger: (product, ctx) => {
        const energy = ctx.nutrients?.energy_kcal_100g ?? 0;
        const fiber = ctx.nutrients?.fiber_g_100g ?? 0;
        const protein = ctx.nutrients?.protein_g_100g ?? 0;
        // Haute densité énergétique (>400kcal/100g) + faible en fibres (<2g) + faible en protéines (<3g)
        return energy >= 400 && fiber < 2 && protein < 3;
      },
      refs: ['DIETARY_PATTERNS_EVIDENCE'],
      notes: 'Calories "vides" : énergie sans nutriments essentiels. Favorise déséquilibre si base alimentation.'
    },

    // ----------------
    // FLAGS SECONDAIRES (severity: low)
    // ----------------
    high_energy_density: {
      id: 'high_energy_density',
      severity: 'low',
      evidence_tier: 'B',
      domains: ['health'],
      trigger: (product, ctx) => {
        return (ctx.nutrients?.energy_kcal_100g ?? 0) >= 450;
      },
      refs: ['ENERGY_DENSITY_SATIETY'],
      notes: 'Produits >450kcal/100g : satiété faible, surconsommation facile.'
    },

    palm_oil_present: {
      id: 'palm_oil_present',
      severity: 'low',
      evidence_tier: 'C',
      domains: ['environment', 'health'],
      trigger: (product, ctx) => {
        const ingredientsText = ctx.ingredientsText?.toLowerCase() || '';
        return ingredientsText.includes('huile de palme') || 
               ingredientsText.includes('palm oil') ||
               ingredientsText.includes('graisse de palme');
      },
      refs: ['PALM_OIL_ENVIRONMENT', 'PALM_OIL_HEALTH'],
      notes: 'Double impact : environnemental (déforestation) + santé (graisses saturées).'
    },

    artificial_sweeteners: {
      id: 'artificial_sweeteners',
      severity: 'low',
      evidence_tier: 'C',
      domains: ['health'],
      trigger: (product, ctx) => {
        const sweeteners = ['aspartame', 'acesulfame', 'sucralose', 'saccharine'];
        const ingredientsText = ctx.ingredientsText?.toLowerCase() || '';
        return sweeteners.some(sw => ingredientsText.includes(sw));
      },
      refs: ['SWEETENERS_EVIDENCE'],
      notes: 'Données émergentes sur microbiote et appétence sucré. Débat scientifique en cours.'
    },

    excessive_additives_count: {
      id: 'excessive_additives_count',
      severity: 'low',
      evidence_tier: 'C',
      domains: ['exposure'],
      trigger: (product, ctx) => {
        return (ctx.additivesCount ?? 0) >= 5;
      },
      refs: ['COCKTAIL_EFFECT_ADDITIVES'],
      notes: 'Effet cocktail : exposition cumulée à plusieurs additifs. Principe précaution.'
    },

    no_fiber: {
      id: 'no_fiber',
      severity: 'low',
      evidence_tier: 'B',
      domains: ['health'],
      trigger: (product, ctx) => {
        // Produit glucidique (>30g/100g) SANS fibres (<1g/100g)
        const carbs = ctx.nutrients?.carbohydrates_g_100g ?? 0;
        const fiber = ctx.nutrients?.fiber_g_100g ?? 0;
        return carbs >= 30 && fiber < 1;
      },
      refs: ['FIBER_RECOMMENDATIONS'],
      notes: 'Glucides raffinés sans fibres : pic glycémique, pas de satiété.'
    }
  },

  // ============================================
  // FLAGS COSMETIC (5 flags)
  // ============================================
  cosmetic: {
    high_frequency_use: {
      id: 'high_frequency_use',
      severity: 'medium',
      evidence_tier: 'C',
      domains: ['exposure'],
      trigger: (product, ctx) => {
        // Produits utilisés quotidiennement (crème visage, déo, dentifrice)
        const dailyProducts = ['creme', 'deodorant', 'dentifrice', 'shampooing', 'gel douche'];
        const name = product.name?.toLowerCase() || '';
        return dailyProducts.some(type => name.includes(type));
      },
      refs: ['EXPOSURE_PRINCIPLES'],
      notes: 'Fréquence = facteur clé exposition dermique. Usage quotidien amplifie effet ingrédients.'
    },

    problematic_ingredients: {
      id: 'problematic_ingredients',
      severity: 'high',
      evidence_tier: 'B',
      domains: ['health', 'exposure'],
      trigger: (product, ctx) => {
        return (ctx.ingredientsRiskCount?.high ?? 0) >= 1;
      },
      refs: ['SCCS_OPINIONS', 'COSMETOVIGILANCE'],
      notes: 'Ingrédients controversés : parabens, MIT, certains filtres UV, phtalates.'
    },

    endocrine_disruptors_suspected: {
      id: 'endocrine_disruptors_suspected',
      severity: 'high',
      evidence_tier: 'B',
      domains: ['health'],
      trigger: (product, ctx) => {
        const edList = ['paraben', 'triclosan', 'benzophenone', 'bha', 'bht'];
        const ingredientsText = ctx.ingredientsText?.toLowerCase() || '';
        return edList.some(ed => ingredientsText.includes(ed));
      },
      refs: ['ANSES_ENDOCRINE_DISRUPTORS'],
      notes: 'Perturbateurs endocriniens suspectés. Principe précaution recommandé.'
    },

    fragrance_allergens: {
      id: 'fragrance_allergens',
      severity: 'low',
      evidence_tier: 'B',
      domains: ['health'],
      trigger: (product, ctx) => {
        const allergens = ['linalool', 'limonene', 'citral', 'geraniol'];
        const ingredientsText = ctx.ingredientsText?.toLowerCase() || '';
        return allergens.some(a => ingredientsText.includes(a));
      },
      refs: ['ALLERGEN_LABELING_EU'],
      notes: 'Allergènes de parfum : réaction possible chez sujets sensibles.'
    },

    microplastics: {
      id: 'microplastics',
      severity: 'medium',
      evidence_tier: 'C',
      domains: ['environment'],
      trigger: (product, ctx) => {
        const microplasticsList = ['polyethylene', 'polypropylene', 'polymethyl methacrylate'];
        const ingredientsText = ctx.ingredientsText?.toLowerCase() || '';
        return microplasticsList.some(mp => ingredientsText.includes(mp));
      },
      refs: ['MICROPLASTICS_ENVIRONMENT'],
      notes: 'Impact environnemental : pollution océanique, chaîne alimentaire.'
    }
  },

  // ============================================
  // FLAGS DETERGENT (4 flags)
  // ============================================
  detergent: {
    high_inhalation_exposure: {
      id: 'high_inhalation_exposure',
      severity: 'high',
      evidence_tier: 'B',
      domains: ['exposure', 'health'],
      trigger: (product, ctx) => {
        const forms = ['spray', 'aerosol', 'poudre', 'powder'];
        const name = product.name?.toLowerCase() || '';
        return forms.some(form => name.includes(form));
      },
      refs: ['INHALATION_EXPOSURE_PRINCIPLES'],
      notes: 'Inhalation = voie exposition critique. Irritants respiratoires potentiels.'
    },

    harsh_chemicals: {
      id: 'harsh_chemicals',
      severity: 'high',
      evidence_tier: 'B',
      domains: ['health', 'exposure'],
      trigger: (product, ctx) => {
        const harsh = ['chlore', 'ammonia', 'acide', 'soude', 'javel'];
        const ingredientsText = ctx.ingredientsText?.toLowerCase() || '';
        return harsh.some(h => ingredientsText.includes(h));
      },
      refs: ['HOUSEHOLD_CHEMICALS_SAFETY'],
      notes: 'Produits caustiques : risque irritation, brûlures, inhalation.'
    },

    vocs_present: {
      id: 'vocs_present',
      severity: 'medium',
      evidence_tier: 'B',
      domains: ['health', 'environment'],
      trigger: (product, ctx) => {
        const vocs = ['solvant', 'acetone', 'toluene', 'xylene'];
        const ingredientsText = ctx.ingredientsText?.toLowerCase() || '';
        return vocs.some(v => ingredientsText.includes(v));
      },
      refs: ['VOCS_INDOOR_AIR_QUALITY'],
      notes: 'COV : impact qualité air intérieur + environnement.'
    },

    phosphates: {
      id: 'phosphates',
      severity: 'low',
      evidence_tier: 'A',
      domains: ['environment'],
      trigger: (product, ctx) => {
        const ingredientsText = ctx.ingredientsText?.toLowerCase() || '';
        return ingredientsText.includes('phosphate');
      },
      refs: ['PHOSPHATES_EUTROPHICATION'],
      notes: 'Eutrophisation des eaux. Interdits lessives UE depuis 2013, mais présents autres produits.'
    }
  }
};

module.exports = { RISK_FLAGS };
