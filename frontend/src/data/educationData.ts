export interface Fiche {
  slug: string;
  title: string;
  quickTake: string;
  reflexes: string[];
  sources: string[];
}

export const FICHES: Record<string, Fiche> = {
  "equilibre-semaine": {
    slug: "equilibre-semaine",
    title: "L equilibre alimentaire : une vision semaine",
    quickTake: "Aucun aliment n est bon ou mauvais en soi. C est la frequence et la variete sur la semaine qui comptent.",
    reflexes: [
      "BASE (quotidien) : fruits, legumes, eau, legumineuses — sans limite",
      "REGULIER (quotidien) : feculents complets, proteines variees, produits laitiers — adapter aux besoins",
      "OCCASIONNEL (quelques fois/semaine) : plats prepares, snacks — plaisir conscient",
      "A LIMITER (1-2x/semaine max) : produits tres sucres, sodas, confiseries — moments choisis",
    ],
    sources: ["PNNS 2019 — Recommandations alimentaires", "ANSES — Reperes de consommation", "OMS — Alimentation saine"],
  },
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
  "poissons-metaux-lourds": {
    slug: "poissons-metaux-lourds",
    title: "Poissons et metaux lourds : varier pour reduire l exposition",
    quickTake: "Certains poissons accumulent du mercure ou d autres contaminants. La variete et la frequence permettent de profiter de leurs bienfaits tout en limitant l exposition.",
    reflexes: [
      "Alterne poissons gras (saumon, sardine) et poissons maigres (colin, cabillaud)",
      "Limite les grands predateurs (thon, espadon) a 1 fois par semaine",
      "2 portions de poisson par semaine suffisent pour les apports en omega-3",
    ],
    sources: ["ANSES 2022 — Consommation de poissons et contaminants", "EFSA 2015 — Methylmercury dietary exposure", "PNNS 2019 — Reperes poissons"],
  },
  "sel-cache": {
    slug: "sel-cache",
    title: "Sel cache : la majorite vient des produits transformes",
    quickTake: "Environ 70 a 80 % du sel consomme provient des produits industriels, pas de la saliere. La vigilance porte sur les sources repetees, pas sur un plat isole.",
    reflexes: [
      "Compare les etiquettes : prefere les produits sous 1 g de sel par portion",
      "Limite le cumul pain + fromage + charcuterie au meme repas",
      "Ajoute des epices et herbes pour reduire le besoin de saler",
    ],
    sources: ["OMS 2023 — Sodium intake", "ANSES 2019 — Sel et sante", "PNNS 2019 — Reperes sel"],
  },
  "huiles-vegetales": {
    slug: "huiles-vegetales",
    title: "Huiles vegetales : varier les sources de lipides",
    quickTake: "Toutes les huiles ne se valent pas. L equilibre entre omega-3, omega-6 et acides gras satures depend de la variete des huiles utilisees.",
    reflexes: [
      "Alterne colza (omega-3), olive (cuisson) et noix (assaisonnement)",
      "Limite l huile de palme et de coco (riches en acides gras satures)",
      "Verifie les huiles dans les produits transformes (souvent palme ou tournesol)",
    ],
    sources: ["ANSES 2019 — Acides gras et sante", "EFSA — Dietary reference values for fats"],
  },
  "plastique": {
    slug: "plastique",
    title: "Emballages plastiques : reduire l exposition au quotidien",
    quickTake: "Certains plastiques peuvent liberer des substances dans les aliments, surtout a la chaleur. Des gestes simples reduisent cette exposition.",
    reflexes: [
      "Ne chauffe pas d aliments dans des contenants plastiques",
      "Prefere le verre ou l inox pour le stockage longue duree",
      "Verifie les pictogrammes : evite les plastiques non alimentaires",
    ],
    sources: ["ANSES 2020 — Materiaux au contact des aliments", "ECHA — Substances in plastic food contact materials"],
  },
  "exposition-cutanee": {
    slug: "exposition-cutanee",
    title: "Exposition cutanee : ce qui reste sur la peau compte",
    quickTake: "Les produits appliques sur la peau sont en contact prolonge avec l organisme. La frequence d usage et la zone d application modulent l exposition.",
    reflexes: [
      "Reduis le nombre de cosmetiques utilises chaque jour",
      "Privilegie les listes d ingredients courtes",
      "Les produits non rinces (cremes, deodorants) impliquent un contact plus long",
    ],
    sources: ["ANSM 2023 — Cosmetiques et securite", "ECHA — Dermal exposure assessment"],
  },
  "composition-cosmetique": {
    slug: "composition-cosmetique",
    title: "Composition cosmetique : lire l essentiel en 3 reflexes",
    quickTake: "La liste INCI d un cosmetique fonctionne comme celle d un aliment : les premiers ingredients sont les plus presents.",
    reflexes: [
      "Les 5 premiers ingredients representent l essentiel du produit",
      "Moins la liste est longue, plus la formulation est simple",
      "Un label certifie (Cosmos, Ecocert) garantit l exclusion de certaines substances",
    ],
    sources: ["Reglement CE 1223/2009 — Cosmetiques", "ANSM — Guide de lecture INCI"],
  },
  "rince-vs-non-rince": {
    slug: "rince-vs-non-rince",
    title: "Rince vs non rince : le temps de contact change tout",
    quickTake: "Un produit rince (gel douche, shampoing) reste quelques secondes sur la peau. Un produit non rince (creme, serum) reste des heures. L exposition n est pas la meme.",
    reflexes: [
      "Sois plus vigilant sur les produits non rinces (cremes, deodorants, maquillage)",
      "Un gel douche avec un ingredient discute pose moins de questions qu une creme de jour",
      "Pour les bebe et enfants, privilegie les formulations les plus simples",
    ],
    sources: ["SCCS 2023 — Notes of guidance for cosmetic safety", "ANSM 2023 — Cosmetiques"],
  },
  "inhalation-menagers": {
    slug: "inhalation-menagers",
    title: "Produits menagers : l inhalation est la premiere voie d exposition",
    quickTake: "Les sprays et aerosols menagers liberent des particules fines dans l air interieur. La ventilation et le choix du format reduisent fortement l exposition.",
    reflexes: [
      "Prefere les formats liquides ou en gel aux sprays et aerosols",
      "Aere pendant et 10 minutes apres le menage",
      "Evite de melanger plusieurs produits (risque de reactions chimiques)",
    ],
    sources: ["ANSES 2021 — Qualite de l air interieur et produits menagers", "INERIS — Emissions de COV des produits de consommation"],
  },
  "air-interieur": {
    slug: "air-interieur",
    title: "Air interieur : les sources invisibles de pollution",
    quickTake: "L air interieur peut etre 5 a 10 fois plus pollue que l air exterieur. Les sources sont multiples : produits menagers, bougies, meubles neufs, cuisson.",
    reflexes: [
      "Aere au moins 10 minutes par jour, meme en hiver",
      "Limite les sources de combustion (bougies, encens, tabac)",
      "Laisse les meubles neufs degazer dans une piece ventilee",
    ],
    sources: ["ANSES 2023 — Qualite de l air interieur", "OMS — Indoor air quality guidelines"],
  },
  "quand-desinfecter": {
    slug: "quand-desinfecter",
    title: "Desinfecter : rarement necessaire, souvent excessif",
    quickTake: "Un nettoyage classique suffit dans la grande majorite des situations domestiques. La desinfection systematique peut favoriser les resistances bacteriennes.",
    reflexes: [
      "Nettoie au savon ou au vinaigre blanc pour l entretien courant",
      "Reserve la desinfection aux situations specifiques (gastro, personne immunodeprimee)",
      "Evite les lingettes desinfectantes au quotidien",
    ],
    sources: ["ANSES 2020 — Biocides et resistances", "OMS — Antimicrobial resistance and cleaning"],
  },
};
