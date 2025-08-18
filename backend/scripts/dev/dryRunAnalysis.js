// PATH: backend\scripts\dev\dryRunAnalysis.js
// Exécute l'analyse directement, sans passer par la route Express.
// Objectif: vérifier que l'engine d'analyse répond vite (donc la route est en cause si ça bloque).
// Usage: node scripts/dev/dryRunAnalysis.js

(async () => {
  try {
    // Tente d'utiliser ton service réel s'il existe :
    let analysisService = null;
    try {
      analysisService = require('../../src/services/analysis/analysisService'); // JS
    } catch {
      // Fallback: mini analyse locale déterministe (NOVA + scores factices)
      analysisService = {
        async analyzeProduct(productData) {
          const text = (productData.ingredients?.text || productData.ingredients || '').toLowerCase();
          const addCount = (text.match(/\be ?\d{3,4}[a-z]?\b/g) || []).length;
          let nova = 1;
          if (text.includes('maltodextrine') || text.includes('sirop de glucose') || (addCount >= 3 && /ar[oô]me/.test(text))) nova = 4;
          else if (addCount >= 1 || /ar[oô]me|colorant|conservateur|émulsifiant|emulsifiant|acidifiant/.test(text)) nova = 3;
          else if ((text.split(/,|;|\bet\b/gi).map(s=>s.trim()).filter(Boolean).length) > 1) nova = 2;
          const ecoscore = 'C', nutriscore = 'C';
          const healthScore = Math.max(0, 100 - (nova - 1) * 15 - 10);
          return {
            category: 'food',
            timestamp: new Date(),
            scores: { nova, nutriscore, ecoscore, healthScore, environmentScore: 60 },
            details: { ingredientsText: text, ultraProcessed: nova === 4 },
            recommendations: [],
            globalScore: Math.round((healthScore*0.4 + 60*0.3)),
            confidence: 0.8
          };
        }
      };
    }

    const payload = {
      name: 'Céréales chocolat',
      category: 'food',
      ingredients: { text: 'Céréales (blé), sucre, cacao, sirop de glucose, E322, arôme' }
    };

    const sw = Date.now();
    const res = await analysisService.analyzeProduct(payload, { updateDatabase: false, updateAlgolia: false });
    const ms = Date.now() - sw;

    console.log('âœ… Analyse locale OK en', ms, 'ms');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('âŒ dryRunAnalysis error:', err);
    process.exit(1);
  }
})();
