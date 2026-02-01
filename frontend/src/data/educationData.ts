export interface Fiche {
  slug: string;
  title: string;
  quickTake: string;
  reflexes: string[];
  sources: string[];
}

export const FICHES: Record<string, Fiche> = {
  "produits-plaisir": {
    slug: "produits-plaisir",
    title: "Produits plaisir : la frequence est la seule question",
    quickTake: "Un produit plaisir ne pose pas de probleme en soi. C est la repetition quotidienne qui cree le desequilibre.",
    reflexes: [
      "Reserve aux moments choisis, pas par habitude",
      "Accompagne d un aliment brut (fruit, yaourt nature)",
      "Evite de cumuler plusieurs sources sucrees au meme repas",
      "Savoure en conscience — le plaisir conscient suffit",
    ],
    sources: ["OMS 2015 — Sucres libres", "NutriNet-Sante — Cohorte NOVA"],
  },
  "ultra-transformation": {
    slug: "ultra-transformation",
    title: "Ultra-transformation : pourquoi la matrice alimentaire compte",
    quickTake: "Un produit ultra-transforme (NOVA 4) a perdu sa structure d origine. Le corps ne le traite pas comme un aliment brut.",
    reflexes: [
      "Privilegie les aliments NOVA 1-2 au quotidien",
      "Compare les listes d ingredients : la plus courte est souvent meilleure",
      "Un NOVA 4 ponctuel dans une alimentation variee n est pas un probleme",
    ],
    sources: ["BMJ 2019 — Ultra-processed food intake and mortality", "ANSES 2021 — Classification NOVA et sante"],
  },
  "sucres-ajoutes": {
    slug: "sucres-ajoutes",
    title: "Sucres ajoutes : ce qui compte, c est la forme et la frequence",
    quickTake: "Les sucres libres (ajoutes, jus, sirops) sont absorbes vite. Les fibres du fruit entier ralentissent tout.",
    reflexes: [
      "Verifie les sucres sur l etiquette (souvent caches)",
      "Prefere le fruit entier au jus",
      "Associe les sources sucrees a des fibres ou proteines",
      "Limite les boissons sucrees (absorption la plus rapide)",
    ],
    sources: ["OMS 2015 — Sucres libres", "EU RI 1169/2011"],
  },
  "lire-ingredients": {
    slug: "lire-ingredients",
    title: "Lire les ingredients : la liste courte est ton alliee",
    quickTake: "Moins un produit a d ingredients, moins il a ete transforme. C est le reflexe le plus simple.",
    reflexes: [
      "Compare deux produits similaires : choisis la liste la plus courte",
      "Si tu ne reconnais pas un ingredient, c est un indice de transformation",
      "Les 3 premiers ingredients representent l essentiel du produit",
    ],
    sources: ["ANSES 2019", "Reglement EU 1169/2011"],
  },
  "pesticides": {
    slug: "pesticides",
    title: "Residus de pesticides : contexte et gestes simples",
    quickTake: "Des residus sont frequents sur certains fruits et legumes. Le bio reduit l exposition, mais le plus important est d en manger.",
    reflexes: [
      "Lave et brosse les fruits/legumes sous l eau courante",
      "Varie les sources (saisons, origines) pour diluer l exposition",
      "Le bio est un plus, mais n importe quel fruit vaut mieux que pas de fruit",
    ],
    sources: ["EFSA 2023 — Pesticide residues in food", "ANSES — Etudes de l alimentation totale"],
  },
};
