// PATH: backend\scripts\dev\dryRunAnalysis.js
// ExÃ©cute l'analyse directement, sans passer par la route Express.
// Objectif: vÃ©rifier que l'engine d'analyse rÃ©pond vite (donc la route est en cause si Ã§a bloque).
// Usage: node scripts/dev/dryRunAnalysis.js

(async () => {
  try {
    // Tente d'utiliser ton service rÃ©el s'il existe :
    let analysisService = null;
    try {
      analysisService = require('../../src/services/analysis/analysisService'); // JS
    } catch {
      // Fallback: mini analyse locale dÃ©terministe (NOVA + scores factices)
      analysisService = {
        async analyzeProduct(productData) {
          const text = (productData.ingredients?.text || productData.ingredients || '').toLowerCase();
          const addCount = (text.match(/\be ?\d{3,4}[a-z]?\b/g) || []).length;
          let nova = 1;
          if (text.includes('maltodextrine') || text.includes('sirop de glucose') || (addCount >= 3 && /ar[oÃ´]me/.test(text))) nova = 4;
          else if (addCount >= 1 || /ar[oÃ´]me|colorant|conservateur|Ã©mulsifiant|emulsifiant|acidifiant/.test(text)) nova = 3;
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
      name: 'CÃ©rÃ©ales chocolat',
      category: 'food',
      ingredients: { text: 'CÃ©rÃ©ales (blÃ©), sucre, cacao, sirop de glucose, E322, arÃ´me' }
    };

    const sw = Date.now();
    const res = await analysisService.analyzeProduct(payload, { updateDatabase: false, updateAlgolia: false });
    const ms = Date.now() - sw;

    console.log('Ã¢Å“â€¦ Analyse locale OK en', ms, 'ms');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Ã¢ÂÅ’ dryRunAnalysis error:', err);
    process.exit(1);
  }
})();
