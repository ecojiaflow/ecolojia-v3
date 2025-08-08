// PATH: frontend/src/services/analysisService.js
import { demoMode } from './demoMode';

export const analysisService = {
  // Vérifier les quotas - MODE DÉMO
  checkQuota: async () => {
    console.log("🎭 DEMO: Check quota");
    return demoMode.getQuota();
  },

  // Analyser par code-barres - MODE DÉMO
  analyzeByBarcode: async (barcode) => {
    console.log("🎭 DEMO: Analyse barcode", barcode);
    const result = await demoMode.analyzeBarcode(barcode);
    demoMode.incrementScans();
    return result;
  },

  // Analyser manuellement - MODE DÉMO
  analyzeManual: async (data) => {
    console.log("🎭 DEMO: Analyse manuelle", data);
    const result = await demoMode.analyzeManual(data);
    demoMode.incrementScans();
    return result;
  },

  // Récupérer une analyse - MODE DÉMO
  getAnalysis: async (productId) => {
    console.log("🎭 DEMO: Get analysis", productId);
    return {
      product: {
        _id: productId,
        name: "Produit Demo",
        category: "food"
      },
      analysis: {
        healthScore: 75,
        novaScore: 2,
        nutriScore: "B"
      }
    };
  },

  // Historique - MODE DÉMO
  getHistory: async (options = {}) => {
    console.log("🎭 DEMO: Get history");
    return { 
      analyses: [], 
      total: 0, 
      page: 1, 
      totalPages: 1 
    };
  }
};

export default analysisService;
