// PATH: backend/src/services/analysis/novaClassifier.js
const novaRules = require('../../data/nova-rules.json');

/**
 * Classifie un produit selon NOVA (1   4) â€“ methodologie INSERM simplifiee
 */
class NovaClassifier {
  /**
   * @param {string|string[]} ingredients
   * @param {string} productName
   * @returns {{group:number,confidence:number,reasoning:string[],detected_markers:Object,
   *            ingredients_count:number,classification_date:string}}
   */
  classify(ingredients, productName = '') {
    try {
      const list     = this.parseIngredients(ingredients);
      const markers  = this.detectProcessMarkers(ingredients, productName);

      const group       = this.determineNovaGroup(list, markers);
      const confidence  = this.calculateConfidence(list, markers);

      return {
        group,
        confidence,
        reasoning          : this.generateReasoning(group, markers),
        detected_markers   : markers,
        ingredients_count  : list.length,
        classification_date: new Date().toISOString()
      };
    } catch (err) {
      console.error('Erreur NOVA :', err);
      return {
        group: 1,
        confidence: 0.3,
        reasoning: ['Erreur classification â€“ groupe 1 par defaut'],
        detected_markers: {},
        ingredients_count: 0,
        classification_date: new Date().toISOString()
      };
    }
  }

  /* ---------- Helpers ---------- */
  parseIngredients(ing) {
    if (!ing) return [];
    const txt = Array.isArray(ing) ? ing.join(',') : ing;
    return txt
      .toLowerCase()
      .split(/[,;()]/)
      .map(s => s.trim())
      .filter(s => s.length > 1);
  }

  detectProcessMarkers(ingredients, productName) {
    const markers = {
      additives_count      : 0,
      industrial_ingredients: [],
      process_indicators   : [],
      ultra_processed_terms: []
    };
    const txt = (
      (Array.isArray(ingredients) ? ingredients.join(' ') : ingredients) +
      ' ' + productName
    ).toLowerCase();

    markers.additives_count = (txt.match(/e\d{3,4}/g) || []).length;

    novaRules.industrial_ingredients.forEach(i => {
      if (txt.includes(i.name)) markers.industrial_ingredients.push(i.name);
    });
    novaRules.process_indicators.forEach(p => {
      if (txt.includes(p)) markers.process_indicators.push(p);
    });
    novaRules.ultra_processed_terms.forEach(t => {
      if (txt.includes(t)) markers.ultra_processed_terms.push(t);
    });

    return markers;
  }

  determineNovaGroup(list, m) {
    if (
      m.additives_count >= 3 ||
      m.industrial_ingredients.length >= 2 ||
      m.ultra_processed_terms.length >= 1
    ) return 4;

    if (
      m.additives_count >= 1 ||
      m.process_indicators.length >= 1 ||
      list.length >= 8
    ) return 3;

    if (list.length >= 3) return 2;

    return 1;
  }

  calculateConfidence(list, m) {
    let c = 0.3;
    if (list.length) c += 0.3;
    if (m.additives_count) c += 0.2;
    if (m.industrial_ingredients.length) c += 0.2;
    return Math.min(1, +c.toFixed(2));
  }

  generateReasoning(group, m) {
    const r = [];
    if (group === 4) {
      if (m.additives_count >= 3) r.push(`${m.additives_count} additifs detectes`);
      if (m.industrial_ingredients.length)
        r.push(`Ingredients industriels : ${m.industrial_ingredients.join(', ')}`);
      if (m.ultra_processed_terms.length)
        r.push(`Termes ultra-transformes : ${m.ultra_processed_terms.join(', ')}`);
    } else if (group === 3) {
      if (m.additives_count) r.push(`${m.additives_count} additif(s) present(s)`);
      if (m.process_indicators.length)
        r.push(`Processus industriels : ${m.process_indicators.join(', ')}`);
    } else if (group === 2) {
      r.push('Produit peu transforme (3-7 ingredients)');
    } else {
      r.push('Produit non ou minimalement transforme');
    }
    return r;
  }
}

/*  âœ… Exporter directement lâ€™INSTANCE pour eviter
    TypeError: novaClassifier.classify is not a function */
module.exports = new NovaClassifier();
