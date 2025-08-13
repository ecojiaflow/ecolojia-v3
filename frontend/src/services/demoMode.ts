// PATH: frontend/src/services/demoMode.ts
// Service de démonstration avec données complètes

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const demoMode = {
  isEnabled: () => true,
  
  toggle: (enabled) => {
    console.log(enabled ? "Ã°Å¸Å½Â­ Mode démo activé" : "Ã°Å¸â€Å’ Mode démo désactivé");
  },
  
  analyzeBarcode: async (barcode) => {
    console.log("Ã°Å¸Å½Â­ DEMO: Analyse barcode", barcode);
    await delay(1000);
    
    return {
      success: true,
      product: {
        _id: "demo-" + barcode,
        name: barcode === "3017620422003" ? "Nutella" : "Produit Test",
        barcode: barcode,
        brand: barcode === "3017620422003" ? "Ferrero" : "Marque Demo",
        category: "food",
        image: "https://via.placeholder.com/300",
        quantity: "400g"
      },
      analysis: {
        healthScore: 25,
        novaScore: 4,
        nutriScore: "E",
        ecoScore: "D",
        additives: ["E322 - Lécithines", "E330 - Acide citrique"],
        allergens: ["Lait", "Fruits ÃƒÂ  coque", "Soja"],
        warnings: ["Teneur élevée en sucre", "Ultra-transformé"],
        ingredients: "Sucre, huile de palme, NOISETTES 13%, cacao maigre, LAIT écrémé en poudre, lactoserum, lécithines, vanilline",
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
            name: "Pâte ÃƒÂ  tartiner bio sans huile de palme",
            brand: "Bio Brand",
            healthScore: 65,
            nutriScore: "C",
            image: "https://via.placeholder.com/150"
          },
          {
            _id: "alt2",
            name: "Purée d''amandes complètes",
            brand: "Nature",
            healthScore: 85,
            nutriScore: "A",
            image: "https://via.placeholder.com/150"
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
    console.log("Ã°Å¸Å½Â­ DEMO: Analyse image", file.name);
    await delay(2000);
    
    return {
      success: true,
      result: {
        productName: "Produit Détecté par Vision",
        confidence: 0.85,
        barcode: Math.random() > 0.5 ? "3017620422003" : null,
        extractedData: {
          name: "Produit Demo Vision",
          ingredients: "Eau, sucre, arômes naturels, conservateurs",
          category: "food",
          brand: "Marque Détectée"
        }
      }
    };
  },
  
  analyzeManual: async (data) => {
    console.log("Ã°Å¸Å½Â­ DEMO: Analyse manuelle", data);
    await delay(1500);
    
    return {
      success: true,
      product: {
        _id: "demo-manual-" + Date.now(),
        name: data.name,
        brand: data.brand || "Marque inconnue",
        category: data.category || "food",
        ingredients: data.ingredients,
        image: "https://via.placeholder.com/300"
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
    console.log("Ã°Å¸Å½Â­ Scan comptabilisé");
  }
};


export default demoMode;
