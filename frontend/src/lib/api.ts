const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Récupère un produit par son slug
 */
export async function fetchProduct(slug: string) {
  const res = await fetch(`${API_URL}/api/products/${slug}`);
  if (!res.ok) throw new Error("Produit introuvable");
  return res.json();
}
