// PATH: frontend/src/services/demoMode.ts
// Service de demonstration avec donnees completes

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const demoMode = {
  isEnabled: () => true,
  
  toggle: (enabled) => {
    console.log(enabled ? "Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â½Æ’Ã¢â‚¬Å¡â€šÃ‚Â­ Mode demo active" : "Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬â€šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢â€šÂ¬Ã¢â€žÂ¢ Mode demo desactive");
  },
  
  analyzeBarcode: async (barcode) => {
    console.log("Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â½Æ’Ã¢â‚¬Å¡â€šÃ‚Â­ DEMO: Analyse barcode", barcode);
    await delay(1000);
    
    return {
      success: true,
      product: {
        _id: "demo-" + barcode,
        name: barcode === "3017620422003" ? "Nutella" : "Produit Test",
        barcode: barcode,
        brand: barcode === "3017620422003" ? "Ferrero" : "Marque Demo",
        category: "food",
        image: "https://vi?.placeholder.com/300",
        quantity: "400g"
      },
      analysis: {
        healthScore: 25,
        novaScore: 4,
        nutriScore: "E",
        ecoScore: "D",
        additives: ["E322 - Lecithines", "E330 - Acide citrique"],
        allergens: ["Lait", "Fruits Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  coque", "Soja"],
        warnings: ["Teneur elevee en sucre", "Ultra-transforme"],
        ingredients: "Sucre, huile de palme, NOISETTES 13%, cacao maigre, LAIT ecreme en poudre, lactoserum, lecithines, vanilline",
        nutritionalValues: {
          energy: 539,
          energyKj: 2252,
          fat: 30.9,
          saturatedFat: 10.6,
          carbohydrates: 57.5,
          sugars: 56.3,
          fiber: 3.5,
          proteins: 6.3,
          salt: 0.107,
          sodium: 0.0428
        },
        alternatives: [
          {
            _id: "alt1",
            name: "Pate Æ’Ã†â€™â€ Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡â€šÃ‚Â  tartiner bio sans huile de palme",
            brand: "Bio Brand",
            healthScore: 65,
            nutriScore: "C",
            image: "https://vi?.placeholder.com/150"
          },
          {
            _id: "alt2",
            name: "Puree d''amandes completes",
            brand: "Nature",
            healthScore: 85,
            nutriScore: "A",
            image: "https://vi?.placeholder.com/150"
          }
        ],
        impactEnvironmental: {
          co2: 3.2,
          water: 1500,
          landUse: 2.1
        },
        impactSocial: {
          fairTrade: false,
          localProduction: false,
          animalWelfare: "N/A"
        }
      }
    };
  },
  
  analyzeImage: async (file) => {
    console.log("Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â½Æ’Ã¢â‚¬Å¡â€šÃ‚Â­ DEMO: Analyse image", file.name);
    await delay(2000);
    
    return {
      success: true,
      result: {
        productName: "Produit Detecte par Vision",
        confidence: 0.85,
        barcode: Math.random() > 0.5 ? "3017620422003" : null,
        extractedData: {
          name: "Produit Demo Vision",
          ingredients: "Eau, sucre, aromes naturels, conservateurs",
          category: "food",
          brand: "Marque Detectee"
        }
      }
    };
  },
  
  analyzeManual: async (data) => {
    console.log("Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â½Æ’Ã¢â‚¬Å¡â€šÃ‚Â­ DEMO: Analyse manuelle", data);
    await delay(1500);
    
    return {
      success: true,
      product: {
        _id: "demo-manual-" + Date.now(),
        name: data?.name,
        brand: data?.brand || "Marque inconnue",
        category: data?.category || "food",
        ingredients: data?.ingredients,
        image: "https://vi?.placeholder.com/300"
      },
      analysis: {
        healthScore: 65,
        novaScore: 3,
        nutriScore: "C",
        ecoScore: "C",
        additives: ["E300 - Acide ascorbique"],
        allergens: [],
        warnings: ["Contient des additifs"],
        nutritionalValues: {
          energy: 250,
          energyKj: 1046,
          fat: 10,
          saturatedFat: 3,
          carbohydrates: 30,
          sugars: 15,
          fiber: 2,
          proteins: 5,
          salt: 0.5,
          sodium: 0.2
        },
        alternatives: [],
        impactEnvironmental: {
          co2: 1.5,
          water: 800,
          landUse: 1.0
        },
        impactSocial: {
          fairTrade: false,
          localProduction: true,
          animalWelfare: "N/A"
        }
      }
    };
  },
  
  getQuota: async () => ({
    remaining: 999,
    limit: 999,
    used: 0,
    plan: "premium"
  }),
  
  getDashboardStats: async () => ({
    totalScans: 42,
    monthlyScans: 12,
    averageScore: 73,
    healthScoreAverage: 73,
    categoriesAnalyzed: {
      food: 35,
      cosmetic: 5,
      detergent: 2
    },
    categoryBreakdown: {
      food: 35,
      cosmetics: 5,
      detergents: 2
    },
    recentAnalyses: [
      {
        _id: "1",
        productName: "Yaourt Nature Bio",
        score: 92,
        category: "food",
        date: new Date().toISOString()
      },
      {
        _id: "2",
        productName: "Nutella",
        score: 25,
        category: "food",
        date: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    quotaUsage: {
      used: 12,
      limit: 999,
      percentage: 1.2
    },
    weeklyTrend: [
      { day: "Lun", scans: 7 },
      { day: "Mar", scans: 9 },
      { day: "Mer", scans: 6 },
      { day: "Jeu", scans: 10 },
      { day: "Ven", scans: 8 },
      { day: "Sam", scans: 5 },
      { day: "Dim", scans: 2 }
    ]
  }),
  
  incrementScans: () => {
    console.log("Æ’Ã†â€™â€šÃ‚Â°Æ’Ã¢â‚¬Â¦â€šÃ‚Â¸Æ’Ã¢â‚¬Â¦â€šÃ‚Â½Æ’Ã¢â‚¬Å¡â€šÃ‚Â­ Scan comptabilise");
  }
};


export default demoMode;



