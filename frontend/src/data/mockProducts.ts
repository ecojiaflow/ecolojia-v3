// PATH: frontend/src/data/mockProducts.ts
export const mockProducts = [
  {
    _id: "mock-1",
    name: "Nutella",
    brand: "Ferrero",
    barcode: "3017620422003",
    category: "food" as const,
    images: {
      front: "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.jpg"
    },
    scores: {
      healthScore: 25,
      environmentScore: 35,
      nova: 4,
      nutriscore: "E",
      ecoscore: "D"
    }
  },
  {
    _id: "mock-2",
    name: "Coca-Cola Original",
    brand: "Coca-Cola",
    barcode: "5449000000996",
    category: "food" as const,
    images: {
      front: "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_fr.jpg"
    },
    scores: {
      healthScore: 15,
      environmentScore: 40,
      nova: 4,
      nutriscore: "E",
      ecoscore: "C"
    }
  },
  {
    _id: "mock-3",
    name: "Yaourt Nature Bio",
    brand: "Les 2 Vaches",
    barcode: "3023290769270",
    category: "food" as const,
    images: {
      front: "https://images.openfoodfacts.org/images/products/302/329/076/9270/front_fr.jpg"
    },
    scores: {
      healthScore: 85,
      environmentScore: 90,
      nova: 1,
      nutriscore: "A",
      ecoscore: "A"
    }
  },
  {
    _id: "mock-4",
    name: "Shampooing Doux",
    brand: "L'Oréal",
    barcode: "3600523584499",
    category: "cosmetics" as const,
    images: {
      front: "https://via.placeholder.com/200x300?text=Shampooing"
    },
    scores: {
      healthScore: 70,
      environmentScore: 60
    }
  },
  {
    _id: "mock-5",
    name: "Lessive Écologique",
    brand: "Ecover",
    barcode: "5412533416022",
    category: "detergents" as const,
    images: {
      front: "https://via.placeholder.com/200x300?text=Lessive"
    },
    scores: {
      healthScore: 85,
      environmentScore: 88,
      ecoscore: "A"
    }
  },
  {
    _id: "mock-6",
    name: "Chips Lay's Original",
    brand: "Lay's",
    barcode: "8710398156730",
    category: "food" as const,
    scores: {
      healthScore: 20,
      environmentScore: 45,
      nova: 4,
      nutriscore: "D",
      ecoscore: "C"
    }
  },
  {
    _id: "mock-7",
    name: "Eau Minérale Evian",
    brand: "Evian",
    barcode: "3068320055008",
    category: "food" as const,
    scores: {
      healthScore: 95,
      environmentScore: 70,
      nova: 1,
      nutriscore: "A",
      ecoscore: "B"
    }
  },
  {
    _id: "mock-8",
    name: "Crème Hydratante Nivea",
    brand: "Nivea",
    barcode: "4005900136114",
    category: "cosmetics" as const,
    scores: {
      healthScore: 75,
      environmentScore: 65
    }
  },
  {
    _id: "mock-9",
    name: "Gel Douche Bio",
    brand: "Weleda",
    barcode: "4001638088435",
    category: "cosmetics" as const,
    scores: {
      healthScore: 90,
      environmentScore: 92
    }
  },
  {
    _id: "mock-10",
    name: "Liquide Vaisselle",
    brand: "Paic",
    barcode: "8714789763132",
    category: "detergents" as const,
    scores: {
      healthScore: 60,
      environmentScore: 55,
      ecoscore: "C"
    }
  }
];

// Fonction de recherche mock
export function searchMockProducts(query: string, filters?: any) {
  const searchTerm = query.toLowerCase();
  
  let results = mockProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.brand.toLowerCase().includes(searchTerm) ||
    product.barcode?.includes(searchTerm)
  );

  // Appliquer les filtres de catégorie si présents
  if (filters?.category) {
    results = results.filter(p => p.category === filters.category);
  }

  return {
    success: true,
    products: results,
    pagination: {
      total: results.length,
      page: 1,
      pages: 1,
      limit: 20
    }
  };
}

// Fonction pour obtenir un produit par ID
export function getMockProductById(id: string) {
  return mockProducts.find(p => p._id === id);
}

// Fonction pour obtenir les produits tendance
export function getTrendingMockProducts(category?: string) {
  let trending = [...mockProducts]
    .sort((a, b) => (b.scores.healthScore || 0) - (a.scores.healthScore || 0))
    .slice(0, 6);

  if (category) {
    trending = trending.filter(p => p.category === category);
  }

  return trending;
}
