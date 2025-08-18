// backend/src/data/detergentsFormulas.js
// Base de donnees formules et ingredients detergents

class DetergentsFormulasDatabase {
  constructor() {
    this.surfactants = this.initializeSurfactantsDatabase();
    this.additives = this.initializeAdditivesDatabase();
    this.diyRecipes = this.initializeDIYRecipes();
    this.ecoStandards = this.initializeEcoStandards();
  }

  initializeSurfactantsDatabase() {
    return {
      // === TENSIOACTIFS ANIONIQUES ===
      'linear alkylbenzene sulfonate': {
        name: 'Linear Alkylbenzene Sulfonate (LAS)',
        type: 'anionic',
        performance: 'excellent',
        biodegradability: 'good',
        aquatic_toxicity: 'moderate',
        safety_score: 70,
        concerns: ['Irritation cutanee', 'Toxicite poissons'],
        benefits: ['Excellent degraissant', 'Efficace eau dure', '‰conomique'],
        alternatives: ['Alkyl polyglucosides', 'Sodium cocoyl isethionate']
      },

      'sodium lauryl sulfate': {
        name: 'Sodium Lauryl Sulfate (SLS)',
        type: 'anionic',
        performance: 'good',
        biodegradability: 'good',
        aquatic_toxicity: 'moderate',
        safety_score: 55,
        concerns: ['Irritation cutanee forte', 'Irritation yeux'],
        benefits: ['Mousse abondante', 'Bon degraissant'],
        alternatives: ['Coco glucoside', 'Decyl glucoside']
      },

      'sodium laureth sulfate': {
        name: 'Sodium Laureth Sulfate (SLES)',
        type: 'anionic',
        performance: 'good',
        biodegradability: 'good',
        aquatic_toxicity: 'moderate',
        safety_score: 65,
        concerns: ['Contamination 1,4-dioxane possible', 'Irritation moderee'],
        benefits: ['Moins irritant que SLS', 'Mousse stable'],
        alternatives: ['Alkyl ether carboxylates']
      },

      // === TENSIOACTIFS NON-IONIQUES ===
      'alkyl polyglucosides': {
        name: 'Alkyl Polyglucosides (APG)',
        type: 'nonionic',
        performance: 'excellent',
        biodegradability: 'excellent',
        aquatic_toxicity: 'low',
        safety_score: 90,
        concerns: [],
        benefits: ['Tres doux', 'Biodegradable 100%', 'Origine vegetale', 'Non irritant'],
        certifications: ['Ecocert', 'Nordic Swan', 'EU Ecolabel']
      },

      'coco glucoside': {
        name: 'Coco Glucoside',
        type: 'nonionic',
        performance: 'good',
        biodegradability: 'excellent',
        aquatic_toxicity: 'very_low',
        safety_score: 95,
        concerns: [],
        benefits: ['Tres doux', 'Hypoallergenique', 'Biodegradable rapide'],
        suitable_for: ['Peaux sensibles', 'Produits bebe']
      },

      'alcohol ethoxylates': {
        name: 'Alcohol Ethoxylates (AE)',
        type: 'nonionic',
        performance: 'excellent',
        biodegradability: 'good',
        aquatic_toxicity: 'moderate',
        safety_score: 75,
        concerns: ['Residus d\'ethoxylation possibles'],
        benefits: ['Excellent dans eau froide', 'Faible mousse']
      },

      // === TENSIOACTIFS AMPHOTˆRES ===
      'cocamidopropyl betaine': {
        name: 'Cocamidopropyl Betaine',
        type: 'amphoteric',
        performance: 'good',
        biodegradability: 'good',
        aquatic_toxicity: 'low',
        safety_score: 80,
        concerns: ['Allergies rares', 'Impuretes fabrication'],
        benefits: ['Doux', 'Conditionneur', 'Compatible autres tensioactifs']
      },

      'cocoamphoacetate': {
        name: 'Cocoamphoacetate',
        type: 'amphoteric',
        performance: 'moderate',
        biodegradability: 'excellent',
        aquatic_toxicity: 'very_low',
        safety_score: 85,
        concerns: [],
        benefits: ['Tres doux', 'Hypoallergenique', 'Biodegradable']
      }
    };
  }

  initializeAdditivesDatabase() {
    return {
      // === BUILDERS (ANTI-CALCAIRE) ===
      'phosphates': {
        name: 'Phosphates',
        function: 'Builder/Anti-calcaire',
        safety_score: 30,
        environmental_impact: 'very_high',
        concerns: ['Eutrophisation', 'Proliferation algues', 'Appauvrissement oxygene'],
        benefits: ['Tres efficace eau dure', '‰conomique'],
        regulatory_status: 'Interdit lessives EU depuis 2013',
        alternatives: ['Zeolites', 'Polycarboxylates', 'MGDA']
      },

      'zeolites': {
        name: 'Zeolites',
        function: 'Builder/Anti-calcaire',
        safety_score: 85,
        environmental_impact: 'low',
        concerns: ['Residus textiles possibles'],
        benefits: ['Non toxique', 'Naturel', 'Biodegradable', '‰change ionique'],
        certifications: ['EU Ecolabel compatible']
      },

      'sodium carbonate': {
        name: 'Sodium Carbonate (Soude)',
        function: 'Builder/Alcalinisant',
        safety_score: 70,
        environmental_impact: 'low',
        concerns: ['Irritation cutanee', 'Corrosif concentre'],
        benefits: ['Naturel', 'Degraissant', 'Anticalcaire'],
        usage: 'Precautions manipulation'
      },

      'polycarboxylates': {
        name: 'Polycarboxylates',
        function: 'Builder/Dispersant',
        safety_score: 75,
        environmental_impact: 'moderate',
        concerns: ['Biodegradabilite lente'],
        benefits: ['Efficace eau tres dure', 'Faible dosage'],
        alternatives: ['MGDA', 'Citrates']
      },

      // === ENZYMES ===
      'protease': {
        name: 'Protease',
        function: 'Enzyme proteolytique',
        safety_score: 90,
        environmental_impact: 'very_low',
        concerns: ['Allergies respiratoires (manipulation poudre)'],
        benefits: ['Biodegradable 100%', 'Efficace eau froide', 'Specifique proteines'],
        targets: ['Sang', 'Transpiration', 'Å’uf', 'Lait'],
        temperature_optimum: '40-60Â°C'
      },

      'lipase': {
        name: 'Lipase',
        function: 'Enzyme lipolytique',
        safety_score: 90,
        environmental_impact: 'very_low',
        concerns: [],
        benefits: ['Decompose graisses', '‰cologique', 'Eau froide'],
        targets: ['Huiles', 'Beurre', 'Mayonnaise', 'Maquillage'],
        temperature_optimum: '30-50Â°C'
      },

      'amylase': {
        name: 'Amylase',
        function: 'Enzyme amylolytique',
        safety_score: 90,
        environmental_impact: 'very_low',
        concerns: [],
        benefits: ['Decompose amidon', 'Efficace', 'Naturel'],
        targets: ['Amidon', 'Pates', 'Pommes de terre', 'Riz'],
        temperature_optimum: '60-70Â°C'
      },

      'cellulase': {
        name: 'Cellulase',
        function: 'Enzyme cellulolytique',
        safety_score: 90,
        environmental_impact: 'very_low',
        concerns: [],
        benefits: ['Anti-boulochage', 'Renovation textile', 'Adoucissant'],
        targets: ['Fibres coton', 'Peluches', 'Aspect vieilli'],
        temperature_optimum: '50-60Â°C'
      },

      // === AGENTS BLANCHISSANTS ===
      'sodium percarbonate': {
        name: 'Sodium Percarbonate',
        function: 'Agent blanchissant oxygene',
        safety_score: 80,
        environmental_impact: 'low',
        concerns: ['Irritation yeux/peau', 'Oxydant'],
        benefits: ['Blanchiment doux', 'Se decompose en oxygene + eau', 'Desinfectant'],
        alternatives: ['Hydrogen peroxide', 'Ozone']
      },

      'sodium hypochlorite': {
        name: 'Sodium Hypochlorite (Eau de Javel)',
        function: 'Agent blanchissant chlore',
        safety_score: 40,
        environmental_impact: 'high',
        concerns: ['Toxique aquatique', 'Corrosif', 'Chloramines', 'Dioxines'],
        benefits: ['Blanchiment puissant', 'Desinfectant', 'Rapide'],
        precautions: 'Ne jamais melanger avec autres produits'
      },

      'optical brighteners': {
        name: 'Azurants Optiques',
        function: 'Agent de blanchiment optique',
        safety_score: 40,
        environmental_impact: 'high',
        concerns: ['Bioaccumulation', 'Persistance environnement', 'Toxicite aquatique'],
        benefits: ['Effet blancheur visuel', 'Efficace'],
        alternatives: ['Percarbonate', 'Soleil naturel']
      },

      // === PARFUMS & ADDITIFS ===
      'parfum': {
        name: 'Parfum/Fragrance',
        function: 'Parfum',
        safety_score: 60,
        environmental_impact: 'moderate',
        concerns: ['Allergenes', 'COV', 'Sensibilisation respiratoire'],
        benefits: ['Experience utilisateur', 'Masque odeurs'],
        alternatives: ['Huiles essentielles', 'Parfums hypoallergeniques']
      },

      'edta': {
        name: 'EDTA (Acide ethylenediaminetetraacetique)',
        function: 'Chelateur/Sequestrant',
        safety_score: 50,
        environmental_impact: 'moderate',
        concerns: ['Biodegradabilite tres lente', 'Mobilise metaux lourds'],
        benefits: ['Efficace eau dure', 'Stabilise formule'],
        alternatives: ['MGDA', 'Citrates', 'Gluconates']
      },

      // === CONSERVATEURS ===
      'methylisothiazolinone': {
        name: 'Methylisothiazolinone (MIT)',
        function: 'Conservateur',
        safety_score: 30,
        environmental_impact: 'moderate',
        concerns: ['Allergene contact fort', 'Sensibilisation cutanee'],
        benefits: ['Tres efficace', 'Large spectre'],
        regulatory_status: 'Concentration limitee EU',
        alternatives: ['Phenoxyethanol', 'Benzyl alcohol']
      }
    };
  }

  initializeDIYRecipes() {
    return {
      'all_purpose_cleaner': {
        name: 'Nettoyant Multi-Usage Maison',
        category: 'nettoyant_general',
        difficulty: 'facile',
        time: '5 minutes',
        cost: '2,50â‚¬ pour 1L',
        improvement_score: 35,
        ingredients: [
          { name: 'Vinaigre blanc 8%', quantity: '500ml', function: 'Degraissant acide' },
          { name: 'Eau demineralisee', quantity: '500ml', function: 'Diluant' },
          { name: 'Bicarbonate de sodium', quantity: '2 c. .s', function: 'Abrasif doux' },
          { name: 'Huile essentielle citron', quantity: '10 gouttes', function: 'Parfum naturel' }
        ],
        instructions: [
          'Melanger vinaigre et eau dans pulverisateur',
          'Ajouter bicarbonate progressivement (mousse normale)',
          'Parfumer avec huile essentielle citron',
          'Bien agiter avant chaque usage',
          'Conservation : 3 mois temperature ambiante'
        ],
        benefits: {
          health: ['Zero COV dangereux', 'Non irritant voies respiratoires', 'Sur contact cutane'],
          environment: ['100% biodegradable', 'Zero microplastique', 'Emballage reutilise'],
          economic: ['75% moins cher', 'Ingredients multiusages', 'Reduction dechets']
        },
        efficacy: 'Degraisse et desinfecte naturellement grace   acide acetique pH 2.4',
        scientific_basis: 'Acide acetique efficace contre 99% bacteries (Journal Food Protection 2024)',
        safety_profile: 'Non toxique, comestible, classification non dangereuse'
      },

      'laundry_detergent': {
        name: 'Lessive ‰cologique Maison',
        category: 'lessive',
        difficulty: 'moyen',
        time: '15 minutes + 24h repos',
        cost: '1,80â‚¬ pour 3L',
        improvement_score: 40,
        ingredients: [
          { name: 'Savon Marseille 72% olive', quantity: '150g rape', function: 'Tensioactif naturel' },
          { name: 'Eau chaude', quantity: '3L', function: 'Solvant' },
          { name: 'Bicarbonate de sodium', quantity: '3 c. .s', function: 'Adoucissant' },
          { name: 'Cristaux de soude', quantity: '3 c. .s', function: 'Degraissant' },
          { name: 'Huile essentielle lavande', quantity: '20 gouttes', function: 'Parfum naturel' }
        ],
        instructions: [
          'Raper finement le savon de Marseille',
          'Faire fondre dans 1L eau chaude en remuant',
          'Ajouter bicarbonate et cristaux de soude',
          'Completer avec 2L eau froide',
          'Mixer 2 minutes pour homogeneiser',
          'Laisser reposer 24h (texture gel normal)',
          'Parfumer avec huile essentielle si souhaite'
        ],
        benefits: {
          health: ['Hypoallergenique', 'Sans parfums synthetiques', 'pH physiologique'],
          environment: ['Biodegradable 100%', 'Zero phosphate', 'Packaging minimal'],
          economic: ['70% economie vs marques', 'Efficace jusqu\'  40Â°C', 'Longue conservation']
        },
        usage: 'Dosage : 100ml par machine, agiter avant usage',
        efficacy: 'Nettoie efficacement grace saponines naturelles',
        scientific_basis: 'Saponification traditionnelle, tensioactifs vegetaux doux'
      },

      'dishwashing_liquid': {
        name: 'Liquide Vaisselle Citron Maison',
        category: 'vaisselle',
        difficulty: 'moyen',
        time: '20 minutes',
        cost: '3,20â‚¬ pour 450ml',
        improvement_score: 30,
        ingredients: [
          { name: 'Eau chaude', quantity: '300ml', function: 'Solvant' },
          { name: 'Savon Castille liquide', quantity: '150ml', function: 'Tensioactif doux' },
          { name: 'Vinaigre blanc', quantity: '2 c. .s', function: 'Degraissant' },
          { name: 'Zeste citrons bio', quantity: '2 citrons', function: 'Parfum + degraissant' },
          { name: 'Glycerine vegetale', quantity: '1 c. .s', function: 'Hydratant mains' }
        ],
        instructions: [
          'Chauffer eau sans bouillir',
          'Infuser zestes citron 10 minutes',
          'Filtrer et ajouter savon Castille',
          'Incorporer vinaigre et glycerine',
          'Melanger delicatement (eviter mousse excessive)',
          'Conserver en flacon pompe'
        ],
        benefits: {
          health: ['Doux pour les mains', 'Hydratant naturel', 'Parfum naturel'],
          environment: ['Eaux grises non polluees', 'Zero microplastique', 'Agrumes locaux'],
          economic: ['60% economie', 'Degraisse efficacement', 'Multi-usage possible']
        },
        usage: 'Dosage : 1-2 pressions par evier, eau chaude recommandee',
        efficacy: 'Degraisse vaisselle et couverts, mousse controlee',
        scientific_basis: 'Acides citriques naturels + saponines vegetales douces'
      },

      'toilet_cleaner': {
        name: 'Nettoyant WC Desinfectant Naturel',
        category: 'sanitaire',
        difficulty: 'facile',
        time: '8 minutes',
        cost: '2,80â‚¬ pour 500ml',
        improvement_score: 45,
        ingredients: [
          { name: 'Vinaigre blanc 12%', quantity: '400ml', function: 'Detartrant acide' },
          { name: 'Eau', quantity: '100ml', function: 'Diluant' },
          { name: 'Bicarbonate de sodium', quantity: '2 c. .s', function: 'Abrasif doux' },
          { name: 'Huile essentielle tea tree', quantity: '20 gouttes', function: 'Antimicrobien' },
          { name: 'Liquide vaisselle maison', quantity: '1 c. .s', function: 'Adherence' }
        ],
        instructions: [
          'Melanger vinaigre et eau',
          'Ajouter bicarbonate (reaction normale)',
          'Incorporer tea tree et liquide vaisselle',
          'Transvaser en flacon pulverisateur',
          'Agiter energiquement avant usage'
        ],
        benefits: {
          health: ['Desinfectant naturel', 'Zero javel toxique', 'Anti-bacterien prouve'],
          environment: ['Biodegradable immediat', 'Zero chlore', 'Sur fosses septiques'],
          economic: ['80% economie vs marques', 'Detartre efficacement', 'Multi-surface']
        },
        efficacy: 'Detartre + desinfecte + parfume naturellement',
        scientific_basis: 'Tea tree : efficacite antibacterienne 99.9% (Antimicrob. Agents 2024)',
        safety: '‰viter melange avec javel, bien ventiler'
      }
    };
  }

  initializeEcoStandards() {
    return {
      'eu_ecolabel': {
        name: 'EU Ecolabel',
        description: 'Label ecologique officiel Union Europeenne',
        criteria: {
          biodegradability: 'Degradation >60% en 28 jours (OECD 301)',
          aquatic_toxicity: 'Tests ecotoxicite obligatoires',
          packaging: 'Materiaux recyclables, concentration minimale',
          phosphates: 'Interdits totalement',
          optical_brighteners: 'Limites ou interdits selon categorie'
        },
        score_bonus: 25
      },

      'nordic_swan': {
        name: 'Nordic Swan Ecolabel',
        description: 'Label ecologique pays nordiques',
        criteria: {
          ingredients: 'Liste positive ingredients autorises',
          biodegradability: 'Standards stricts + tests complementaires',
          emissions: 'Limitation COV + parfums',
          efficacy: 'Tests efficacite obligatoires'
        },
        score_bonus: 20
      },

      'cradle_to_cradle': {
        name: 'Cradle to Cradle Certified',
        description: 'Analyse cycle de vie complet',
        criteria: {
          material_health: '‰valuation toxicologique complete',
          renewable_energy: 'Fabrication energies renouvelables',
          water_stewardship: 'Gestion responsable eau',
          social_fairness: 'Standards sociaux'
        },
        score_bonus: 22
      },

      'epa_safer_choice': {
        name: 'EPA Safer Choice',
        description: 'Programme EPA ‰tats-Unis',
        criteria: {
          human_health: 'Criteres securite humaine stricts',
          environmental_safety: 'Impact environnemental reduit',
          performance: 'Efficacite equivalente produits conventionnels'
        },
        score_bonus: 18
      }
    };
  }

  // === M‰THODES DE RECHERCHE ===
  getSurfactant(name) {
    const normalizedName = name.toLowerCase().trim();
    return this.surfactants[normalizedName] || null;
  }

  getAdditive(name) {
    const normalizedName = name.toLowerCase().trim();
    return this.additives[normalizedName] || null;
  }

  searchByPerformance(performance_level) {
    return Object.entries(this.surfactants)
      .filter(([key, surfactant]) => surfactant.performance === performance_level)
      .map(([key, surfactant]) => ({ name: key, ...surfactant }));
  }

  searchEcoFriendly(min_safety_score = 80) {
    const ecoSurfactants = Object.entries(this.surfactants)
      .filter(([key, surfactant]) =>
        surfactant.safety_score >= min_safety_score &&
        surfactant.biodegradability === 'excellent'
      )
      .map(([key, surfactant]) => ({ name: key, ...surfactant }));

    const ecoAdditives = Object.entries(this.additives)
      .filter(([key, additive]) =>
        additive.safety_score >= min_safety_score &&
        additive.environmental_impact === 'low'
      )
      .map(([key, additive]) => ({ name: key, ...additive }));

    return { surfactants: ecoSurfactants, additives: ecoAdditives };
  }

  getAlternatives(ingredient_name, min_safety_score = 80) {
    const ingredient = this.getSurfactant(ingredient_name) || this.getAdditive(ingredient_name);
    if (!ingredient) return [];

    const surfactantAlternatives = Object.entries(this.surfactants)
      .filter(([key, surf]) =>
        surf.type === ingredient.type &&
        surf.safety_score >= min_safety_score &&
        key !== ingredient_name.toLowerCase()
      )
      .map(([key, surf]) => ({ name: key, ...surf }));

    const additiveAlternatives = Object.entries(this.additives)
      .filter(([key, add]) =>
        add.function === ingredient.function &&
        add.safety_score >= min_safety_score &&
        key !== ingredient_name.toLowerCase()
      )
      .map(([key, add]) => ({ name: key, ...add }));

    return [...surfactantAlternatives, ...additiveAlternatives];
  }

  getDIYRecipe(product_type) {
    return this.diyRecipes[product_type] || null;
  }

  getAllDIYRecipes() {
    return this.diyRecipes;
  }

  getEcoStandard(standard_name) {
    const normalizedName = standard_name.toLowerCase().replace(' ', '_');
    return this.ecoStandards[normalizedName] || null;
  }

  // === ANALYSES SP‰CIALIS‰ES ===
  analyzeFormulation(ingredients_list) {
    const analysis = {
      total_ingredients: ingredients_list.length,
      surfactants_detected: [],
      additives_detected: [],
      environmental_score: 0,
      safety_score: 0,
      performance_level: 'unknown',
      eco_compliance: [],
      concerns: [],
      improvements: []
    };

    let totalEnvironmentalScore = 0;
    let totalSafetyScore = 0;
    let scoredIngredients = 0;

    for (const ingredient of ingredients_list) {
      const surfactant = this.getSurfactant(ingredient);
      const additive = this.getAdditive(ingredient);

      if (surfactant) {
        analysis.surfactants_detected.push({
          name: ingredient,
          type: surfactant.type,
          performance: surfactant.performance,
          safety_score: surfactant.safety_score
        });
        totalSafetyScore += surfactant.safety_score;
        scoredIngredients++;

        if (surfactant.concerns.length > 0) {
          analysis.concerns.push(...surfactant.concerns);
        }
      }

      if (additive) {
        analysis.additives_detected.push({
          name: ingredient,
          function: additive.function,
          safety_score: additive.safety_score,
          environmental_impact: additive.environmental_impact
        });
        totalSafetyScore += additive.safety_score;
        scoredIngredients++;

        if (additive.concerns.length > 0) {
          analysis.concerns.push(...additive.concerns);
        }
      }
    }

    if (scoredIngredients > 0) {
      analysis.safety_score = Math.round(totalSafetyScore / scoredIngredients);
    }

    // ‰valuation niveau performance
    const excellentSurfactants = analysis.surfactants_detected.filter(s => s.performance === 'excellent').length;
    if (excellentSurfactants > 0) {
      analysis.performance_level = 'excellent';
    } else if (analysis.surfactants_detected.length > 0) {
      analysis.performance_level = 'good';
    }

    // Recommandations d'amelioration
    if (analysis.safety_score < 70) {
      analysis.improvements.push('Remplacer ingredients preoccupants par alternatives plus sures');
    }

    const phosphatesDetected = analysis.additives_detected.some(a => a.name.includes('phosphate'));
    if (phosphatesDetected) {
      analysis.improvements.push('‰liminer phosphates - impact eutrophisation majeur');
    }

    return analysis;
  }

  generateSafetyReport(ingredients_list) {
    const analysis = this.analyzeFormulation(ingredients_list);

    return {
      ...analysis,
      risk_assessment: this.assessRiskLevel(analysis),
      regulatory_compliance: this.checkRegulatoryCompliance(analysis),
      eco_recommendations: this.generateEcoRecommendations(analysis)
    };
  }

  assessRiskLevel(analysis) {
    if (analysis.safety_score >= 80 && analysis.concerns.length <= 1) {
      return 'low';
    } else if (analysis.safety_score >= 60 && analysis.concerns.length <= 3) {
      return 'moderate';
    } else {
      return 'high';
    }
  }

  checkRegulatoryCompliance(analysis) {
    const compliance = {
      eu_detergent_regulation: true,
      phosphate_ban: true,
      biocide_regulation: 'to_verify'
    };

    // Verification interdiction phosphates EU
    const hasPhosphates = analysis.additives_detected.some(a =>
      a.name.includes('phosphate') && a.function.includes('Builder')
    );
    if (hasPhosphates) {
      compliance.phosphate_ban = false;
      compliance.eu_detergent_regulation = false;
    }

    return compliance;
  }

  generateEcoRecommendations(analysis) {
    const recommendations = [];

    if (analysis.safety_score < 75) {
      recommendations.push('Privilegier tensioactifs APG ou coco glucoside');
    }

    const hasOpticalBrighteners = analysis.additives_detected.some(a =>
      a.name.includes('optical brightener')
    );
    if (hasOpticalBrighteners) {
      recommendations.push('Remplacer azurants optiques par percarbonate sodium');
    }

    const hasEDTA = analysis.additives_detected.some(a => a.name && a.name.includes('edta'));
    if (hasEDTA) {
      recommendations.push('Remplacer EDTA par MGDA ou citrates');
    }

    return recommendations;
  }

  // === STATISTIQUES ===
  getStatistics() {
    const totalSurfactants = Object.keys(this.surfactants).length;
    const ecoSurfactants = Object.values(this.surfactants).filter(s => s.safety_score >= 80).length;
    const totalAdditives = Object.keys(this.additives).length;
    const ecoAdditives = Object.values(this.additives).filter(a => a.safety_score >= 80).length;

    return {
      total_surfactants: totalSurfactants,
      eco_surfactants: ecoSurfactants,
      eco_surfactants_percentage: Math.round((ecoSurfactants / totalSurfactants) * 100),
      total_additives: Object.keys(this.additives).length,
      eco_additives: ecoAdditives,
      eco_additives_percentage: Math.round((ecoAdditives / totalAdditives) * 100),
      diy_recipes_available: Object.keys(this.diyRecipes).length,
      eco_standards_tracked: Object.keys(this.ecoStandards).length
    };
  }
}

// Export singleton
module.exports = new DetergentsFormulasDatabase();
