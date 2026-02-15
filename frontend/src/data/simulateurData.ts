export interface SimProduct {
  id: string;
  name: string;
  icon: string;
  universe: string;
  takeaway: string;
  reflexes: string[];
  signal: { label: string; ficheSlug: string };
}

export const SIM_PRODUCTS: SimProduct[] = [
  { id: "pate-a-tartiner", name: "Pate a tartiner", icon: "🍫", universe: "alimentation",
    takeaway: "Souvent ultra-transforme (NOVA 4), riche en sucre et huile de palme. L impact depend de la frequence.",
    reflexes: ["Limiter a 2-3 fois par semaine", "Preferer les versions avec liste courte", "Associer a du pain complet plutot que du pain blanc"],
    signal: { label: "Sucre + ultra-transformation", ficheSlug: "sucres-ajoutes" } },
  { id: "cereales-petit-dejeuner", name: "Cereales petit-dejeuner", icon: "🥣", universe: "alimentation",
    takeaway: "La plupart des cereales industrielles sont NOVA 4 avec du sucre cache. Meme les versions light.",
    reflexes: ["Verifier le sucre : souvent 25-35% du poids", "Preferer les flocons d avoine (NOVA 1)", "Ajouter des fruits frais plutot que des cereales sucrees"],
    signal: { label: "Sucre cache + transformation", ficheSlug: "sucres-ajoutes" } },
  { id: "yaourt", name: "Yaourt", icon: "🥛", universe: "alimentation",
    takeaway: "Un yaourt nature = 2 ingredients. Un yaourt aromatise = 8 a 15 ingredients. La simplicite est le signal.",
    reflexes: ["Nature > aromatise > dessert lacte", "Ajouter du miel ou des fruits toi-meme", "Varier : alterner avec des alternatives vegetales"],
    signal: { label: "Transformation variable", ficheSlug: "ultra-transformation" } },
  { id: "shampooing", name: "Shampooing", icon: "🧴", universe: "cosmetique",
    takeaway: "Produit rince : l exposition est courte. Regarde surtout les 5 premiers ingredients INCI.",
    reflexes: ["Rince = exposition limitee", "Eviter les silicones en tete de liste", "Alterner avec un shampooing solide (moins d emballage)"],
    signal: { label: "Composition INCI", ficheSlug: "composition-cosmetique" } },
  { id: "creme-visage", name: "Creme visage", icon: "✨", universe: "cosmetique",
    takeaway: "Produit non-rince, reste 12h+ sur une zone absorbante. La composition merite attention.",
    reflexes: ["Privilegier les listes courtes", "Attention au mot Parfum/Fragrance", "Zone visage = absorption elevee"],
    signal: { label: "Non-rince + zone sensible", ficheSlug: "rince-vs-non-rince" } },
  { id: "deodorant", name: "Deodorant", icon: "🫧", universe: "cosmetique",
    takeaway: "Reste 24h sur les aisselles (zone fine et absorbante). C est le produit cosmetique qui merite le plus d attention.",
    reflexes: ["Zone aisselle = tres absorbante", "Preferer les formules simples", "Eviter les sprays (inhalation)"],
    signal: { label: "Duree de contact + zone", ficheSlug: "exposition-cutanee" } },
  { id: "spray-nettoyant", name: "Spray nettoyant", icon: "💨", universe: "menager",
    takeaway: "Les sprays dispersent des micro-gouttelettes inhalees directement. Le liquide sur eponge reduit l exposition de 80%.",
    reflexes: ["Preferer le format liquide", "Aerer pendant et apres le menage", "Vinaigre blanc = alternative simple"],
    signal: { label: "Inhalation directe", ficheSlug: "inhalation-menagers" } },
  { id: "lessive", name: "Lessive", icon: "👕", universe: "menager",
    takeaway: "La lessive reste en traces sur les vetements portes toute la journee. Les parfums de synthese sont le premier point d attention.",
    reflexes: ["Doser correctement (moins = mieux)", "Preferer sans parfum pour le linge bebe", "Rincer suffisamment"],
    signal: { label: "Contact prolonge via vetements", ficheSlug: "exposition-cutanee" } }
];
