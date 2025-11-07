/**
 * Service Recettes IA minimal (mock de suggestion).
 * TODO: brancher sur ton moteur d'enrichissement / embeddings si dispo.
 */
const suggestFromProduct = (product) => {
  // Entrée attendue: { name, categoryType, ingredients? ... }
  // Logique triviale pour valider la chaîne E2E
  const base = (product?.name || "Produit").toString();
  const cat  = (product?.categoryType || "food").toString();

  const generic = [
    { title: `Salade rapide à base de ${base}`, difficulty: "easy", time: 10 },
    { title: `Bowl ${base} & légumineuses`, difficulty: "medium", time: 20 },
  ];

  if (cat === "cosmetic") {
    return [{ title: "Routine soin — AUCUNE recette comestible", note: "Produit cosmétique détecté" }];
  }
  if (cat === "detergent") {
    return [{ title: "Conseils d’usage — Pas de recette alimentaire", note: "Détergent détecté" }];
  }
  return generic;
};

module.exports = { suggestFromProduct };
