// Service de recherche simplifi?
const API_URL = import.meta.env.VITE_API_URL || "https://ecolojia-backendvf.onrender.com/api";

export const searchService = {
  async searchProducts(query) {
    try {
      const response = await fetch(`${API_URL}/products/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Erreur de recherche");
      return await response.json();
    } catch (error) {
      console.error("Erreur recherche:", error);
      return { products: [], total: 0 };
    }
  },

  async getProducts(page = 1, limit = 20) {
    try {
      const response = await fetch(`${API_URL}/products?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error("Erreur chargement produits");
      return await response.json();
    } catch (error) {
      console.error("Erreur produits:", error);
      return { products: [], total: 0 };
    }
  }
};

export default searchService;
