// Adaptateur pour normaliser les donnees Algolia vers le format attendu
export const normalizeAlgoliaProduct = (hit: any) => ({
  _id: hit.objectID,
  id: hit.objectID,
  name: hit.title || hit.name,
  brand: hit.brand,
  category: hit.category,
  barcode: hit.barcode,
  imageUrl: hit.imageUrl,
  ingredients: hit.ingredients,
  nova_group: hit.novaGroup,
  nutriscore_grade: hit.nutriscoreGrade,
  analysisData: {
    healthScore: hit.healthScore || 0,
    environmentScore: hit.environmentScore || 0
  }
});

// Wrapper pour l'API de recherche
export const searchProducts = async (query: string, options?: any) => {
  try {
    const response = await fetch(`/api/algolia/search?q=${query}&limit=20`);
    const data = await response.json();
    
    // Normaliser les produits Algolia
    if (dat?.data && dat?.dat?.products) {
      dat?.dat?.products = dat?.dat?.products.map(normalizeAlgoliaProduct);
    }
    
    return data;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};


