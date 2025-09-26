class ScoringV2Service {
  static calculateScores(product, domain = 'food') {
    const base = {
      domain,
      productName: product.product_name || product.name || 'Produit inconnu',
      barcode: product.code || 'N/A',
      timestamp: new Date().toISOString()
    };

    switch(domain) {
      case 'food':
        return { ...base, ...this.scoreFoodProduct(product) };
      case 'beauty':
        return { ...base, ...this.scoreBeautyProduct(product) };
      case 'detergent':
        return { ...base, ...this.scoreDetergentProduct(product) };
      default:
        return { ...base, ...this.scoreGenericProduct(product) };
    }
  }

  static scoreFoodProduct(product) {
    // Nutri-Score (A=5, B=4, C=3, D=2, E=1)
    const nutriGrade = (product.nutrition_grades || '').toLowerCase();
    const nutriScore = { 'a': 95, 'b': 80, 'c': 60, 'd': 40, 'e': 20 }[nutriGrade] || 50;

    // NOVA (1=excellent, 2=bon, 3=moyen, 4=éviter)
    const nova = parseInt(product.nova_group) || 2;
    const novaScore = { 1: 95, 2: 75, 3: 50, 4: 25 }[nova] || 50;

    // Additifs (moins = mieux)
    const additives = product.additives_tags?.length || 0;
    const additiveScore = Math.max(20, 100 - (additives * 8));

    // Ingrédients problématiques
    const badIngredients = this.detectBadIngredients(product.ingredients_text || '');
    const ingredientScore = Math.max(30, 90 - (badIngredients.length * 15));

    const globalScore = Math.round((nutriScore + novaScore + additiveScore + ingredientScore) / 4);

    return {
      scores: {
        nutrition: nutriScore,
        nova: novaScore,
        additives: additiveScore,
        ingredients: ingredientScore,
        global: globalScore
      },
      details: {
        nutriGrade: nutriGrade.toUpperCase() || 'N/A',
        novaGroup: nova,
        additivesCount: additives,
        badIngredients,
        processingLevel: this.getProcessingLevel(nova)
      },
      recommendations: this.getFoodRecommendations(globalScore, nova, additives)
    };
  }

  static scoreBeautyProduct(product) {
    const ingredients = (product.ingredients_text || '').toLowerCase();
    
    // Composants problématiques cosmétiques
    const harmfulComponents = [
      'paraben', 'sulfate', 'alcohol denat', 'parfum', 'phthalate', 
      'formaldehyde', 'triclosan', 'oxybenzone'
    ];
    
    const safeComponents = [
      'aloe', 'ceramide', 'hyaluronic', 'niacinamide', 'vitamin', 
      'natural', 'organic', 'bio'
    ];

    const harmfulFound = harmfulComponents.filter(comp => ingredients.includes(comp));
    const safeFound = safeComponents.filter(comp => ingredients.includes(comp));

    const safetyScore = Math.max(20, 80 - (harmfulFound.length * 12) + (safeFound.length * 5));
    const naturalScore = safeFound.length > 0 ? Math.min(100, 60 + safeFound.length * 8) : 40;

    const globalScore = Math.round((safetyScore + naturalScore) / 2);

    return {
      scores: {
        safety: safetyScore,
        natural: naturalScore,
        global: globalScore
      },
      details: {
        harmfulComponents: harmfulFound,
        beneficialComponents: safeFound,
        riskLevel: globalScore > 70 ? 'Faible' : globalScore > 50 ? 'Modéré' : 'Élevé'
      },
      recommendations: this.getBeautyRecommendations(globalScore, harmfulFound)
    };
  }

  static scoreDetergentProduct(product) {
    const ingredients = (product.ingredients_text || '').toLowerCase();
    
    const ecoFriendly = ['biodegradable', 'phosphate-free', 'eco', 'green', 'plant-based'];
    const harmful = ['phosphate', 'chlorine', 'ammonia', 'synthetic fragrance', 'dye'];

    const ecoFound = ecoFriendly.filter(comp => ingredients.includes(comp));
    const harmfulFound = harmful.filter(comp => ingredients.includes(comp));

    const ecoScore = Math.min(100, 50 + ecoFound.length * 15);
    const safetyScore = Math.max(30, 90 - harmfulFound.length * 18);

    const globalScore = Math.round((ecoScore + safetyScore) / 2);

    return {
      scores: {
        environmental: ecoScore,
        safety: safetyScore,
        global: globalScore
      },
      details: {
        ecoComponents: ecoFound,
        harmfulComponents: harmfulFound,
        impactLevel: globalScore > 70 ? 'Faible' : globalScore > 50 ? 'Modéré' : 'Fort'
      },
      recommendations: this.getDetergentRecommendations(globalScore, harmfulFound, ecoFound)
    };
  }

  static detectBadIngredients(ingredientsText) {
    const bad = ['sirop de glucose-fructose', 'huile de palme', 'aspartame', 'glutamate', 'nitrite'];
    const text = ingredientsText.toLowerCase();
    return bad.filter(ingredient => text.includes(ingredient));
  }

  static getProcessingLevel(nova) {
    const levels = {
      1: 'Non transformé',
      2: 'Peu transformé', 
      3: 'Transformé',
      4: 'Ultra-transformé'
    };
    return levels[nova] || 'Inconnu';
  }

  static getFoodRecommendations(score, nova, additives) {
    const recs = [];
    if (score < 60) recs.push("Consommation occasionnelle recommandée");
    if (nova >= 4) recs.push("Privilégier des aliments moins transformés");
    if (additives > 5) recs.push("Attention au nombre d'additifs élevé");
    if (score > 80) recs.push("Bon choix nutritionnel");
    return recs;
  }

  static getBeautyRecommendations(score, harmful) {
    const recs = [];
    if (harmful.length > 0) recs.push(`Éviter: ${harmful.join(', ')}`);
    if (score < 50) recs.push("Produit à risque, vérifier les composants");
    if (score > 75) recs.push("Composition respectueuse de la peau");
    return recs;
  }

  static getDetergentRecommendations(score, harmful, eco) {
    const recs = [];
    if (harmful.length > 0) recs.push("Utiliser avec précaution, bien aérer");
    if (eco.length > 0) recs.push("Choix respectueux de l'environnement");
    if (score < 50) recs.push("Impact environnemental élevé");
    return recs;
  }

  static scoreGenericProduct(product) {
    return {
      scores: { global: 50 },
      details: { info: "Analyse générique" },
      recommendations: ["Informations insuffisantes pour une analyse détaillée"]
    };
  }
}

module.exports = { ScoringV2Service };
