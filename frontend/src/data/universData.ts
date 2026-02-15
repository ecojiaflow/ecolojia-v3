import type { Quiz } from "./methodeData";

export interface UniverseStep {
  id: number;
  slug: string;
  title: string;
  icon: string;
  rule: string;
  explanation: string;
  quiz: Quiz;
  action: string;
  ficheSlug?: string;
}

export interface Universe {
  id: string;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  steps: UniverseStep[];
}

export const UNIVERSES: Universe[] = [
  {
    id: "alimentation", name: "Alimentation", icon: "🍎", color: "#10b981", tagline: "Comprendre ce que tu manges",
    steps: [
      { id: 1, slug: "transformation", title: "Transformation", icon: "⚙️",
        rule: "Plus un aliment est transforme, plus il s eloigne du naturel",
        explanation: "NOVA classe les aliments de 1 (brut) a 4 (ultra-transforme). Un produit NOVA 4 contient des substances que tu ne trouverais pas dans une cuisine.",
        quiz: { question: "Un plat prepare avec 25 ingredients est :", options: [{ id: "a", text: "Peu transforme", correct: false }, { id: "b", text: "Ultra-transforme (NOVA 4)", correct: true }, { id: "c", text: "Ca depend de la marque", correct: false }], feedback: { correct: "Oui. 25 ingredients avec additifs = NOVA 4.", incorrect: "Le nombre d ingredients et la presence d additifs industriels sont les signaux cles." } },
        action: "Choisis 1 produit chez toi. Regarde NOVA sur Open Food Facts.", ficheSlug: "ultra-transformation" },
      { id: 2, slug: "sucre", title: "Sucre cache", icon: "🍬",
        rule: "Le sucre le plus impactant est celui que tu ne vois pas",
        explanation: "Un jus pur jus contient autant de sucre qu un soda. La difference : l absence de fibres. Le sucre cache se trouve dans les sauces, cereales, pain de mie.",
        quiz: { question: "Ou trouve-t-on souvent du sucre cache ?", options: [{ id: "a", text: "Dans les fruits entiers", correct: false }, { id: "b", text: "Dans les sauces et cereales industrielles", correct: true }, { id: "c", text: "Dans l eau minerale", correct: false }], feedback: { correct: "Sauces, cereales, pain de mie, yaourts aromatises...", incorrect: "Les fruits entiers contiennent du sucre mais avec des fibres." } },
        action: "Verifie les sucres dans tes cereales du matin.", ficheSlug: "sucres-ajoutes" },
      { id: 3, slug: "sel", title: "Sel industriel", icon: "🧂",
        rule: "70-80% du sel vient des produits, pas de ta saliere",
        explanation: "Pain, charcuterie, fromage, plats prepares : ce sont les vrais vecteurs de sel. L OMS recommande moins de 5g/jour.",
        quiz: { question: "Quel est le premier vecteur de sel ?", options: [{ id: "a", text: "La saliere", correct: false }, { id: "b", text: "Le pain et la charcuterie", correct: true }, { id: "c", text: "Les boissons", correct: false }], feedback: { correct: "Le pain seul represente 20-25% de l apport en sel.", incorrect: "La saliere = 10-20% du sel. Le reste est dans les produits." } },
        action: "Compare le sel de 2 pains differents au supermarche.", ficheSlug: "sel-cache" },
      { id: 4, slug: "gras", title: "Lipides", icon: "🫒",
        rule: "Le type de gras compte plus que la quantite",
        explanation: "Olive, colza, noix = insatures (benefiques). Palme, graisses hydrogenes = a limiter. Varier les sources est la meilleure strategie.",
        quiz: { question: "Quelle approche pour les lipides ?", options: [{ id: "a", text: "Supprimer tout le gras", correct: false }, { id: "b", text: "Varier les sources", correct: true }, { id: "c", text: "Ne manger que du beurre", correct: false }], feedback: { correct: "La variete assure un bon equilibre omega-3/omega-6.", incorrect: "Supprimer le gras est contre-productif. C est la variete qui compte." } },
        action: "Verifie quelle huile tu utilises. Ajoutes-en une deuxieme.", ficheSlug: "huiles-vegetales" },
      { id: 5, slug: "additifs", title: "Additifs", icon: "🧪",
        rule: "Ce n est pas 1 additif, c est le cumul",
        explanation: "Un additif isole a faible dose est rarement problematique. Mais 5 produits industriels/jour = dizaines d additifs cumules. C est l effet cocktail.",
        quiz: { question: "Pourquoi les additifs meritent attention ?", options: [{ id: "a", text: "Ils sont tous dangereux", correct: false }, { id: "b", text: "C est le cumul quotidien qui compte", correct: true }, { id: "c", text: "Ils n ont aucun effet", correct: false }], feedback: { correct: "L effet cocktail : chaque additif est autorise, mais le cumul n est pas etudie.", incorrect: "Ni tous dangereux ni sans effet. C est la repetition qui compte." } },
        action: "Compte les E-numbers sur 3 produits de ton placard.", ficheSlug: "lire-ingredients" },
      { id: 6, slug: "frequence", title: "Frequence", icon: "🔁",
        rule: "La frequence definit l impact, pas le produit",
        explanation: "Un biscuit le dimanche = plaisir. Le meme chaque matin = exposition repetee. Meme produit, impact different.",
        quiz: { question: "Un produit a limiter est-il interdit ?", options: [{ id: "a", text: "Oui", correct: false }, { id: "b", text: "Non, c est la frequence qui compte", correct: true }, { id: "c", text: "Seulement si le score est bas", correct: false }], feedback: { correct: "Aucun produit n est interdit. C est la repetition qui transforme un plaisir en probleme.", incorrect: "Ecolojia ne juge jamais un produit. Elle qualifie un usage." } },
        action: "Identifie 1 produit que tu manges CHAQUE JOUR." },
      { id: 7, slug: "equilibre", title: "Equilibre semaine", icon: "📊",
        rule: "La semaine compte plus qu un repas isole",
        explanation: "Un repas desequilibre n a aucun impact si la semaine est variee. La base doit dominer, les plaisirs restent des plaisirs.",
        quiz: { question: "Meilleur indicateur d equilibre ?", options: [{ id: "a", text: "Ne jamais manger d ultra-transforme", correct: false }, { id: "b", text: "Que les produits de base dominent sur la semaine", correct: true }, { id: "c", text: "Manger bio a chaque repas", correct: false }], feedback: { correct: "L equilibre se mesure sur la semaine, pas sur un repas.", incorrect: "La perfection n est pas le but. C est la dominance de la base qui compte." } },
        action: "Estime : cette semaine, qu est-ce qui domine dans tes repas ?" }
    ]
  },
  {
    id: "cosmetique", name: "Cosmetique", icon: "🧴", color: "#8b5cf6", tagline: "Comprendre ce que tu appliques",
    steps: [
      { id: 1, slug: "rince-vs-non-rince", title: "Rince vs non-rince", icon: "🚿",
        rule: "Un produit qui reste sur la peau merite plus d attention",
        explanation: "Un gel douche est rince en 2 minutes. Une creme de jour reste 12 heures. La duree de contact change completement l exposition.",
        quiz: { question: "Quel produit merite le plus d attention ?", options: [{ id: "a", text: "Un shampooing", correct: false }, { id: "b", text: "Un deodorant (reste 24h)", correct: true }, { id: "c", text: "Un gel douche", correct: false }], feedback: { correct: "Le deodorant reste toute la journee sur une zone fine et absorbante.", incorrect: "Les produits rinces exposent beaucoup moins que ceux qui restent." } },
        action: "Trie tes produits : rinces vs non-rinces.", ficheSlug: "rince-vs-non-rince" },
      { id: 2, slug: "contact", title: "Duree de contact", icon: "⏱️",
        rule: "Plus le contact est long, plus la composition compte",
        explanation: "Peau du visage, aisselles, levres : zones fines et absorbantes. Un produit applique la = plus d exposition qu un produit sur les mains.",
        quiz: { question: "Quelle zone est la plus absorbante ?", options: [{ id: "a", text: "Les mains", correct: false }, { id: "b", text: "Les aisselles et le visage", correct: true }, { id: "c", text: "Les pieds", correct: false }], feedback: { correct: "Zones fines = absorption plus importante.", incorrect: "Les mains ont une peau epaisse. Le visage et les aisselles sont beaucoup plus permeables." } },
        action: "Identifie quel produit non-rince tu utilises sur le visage.", ficheSlug: "exposition-cutanee" },
      { id: 3, slug: "inci", title: "INCI : les 5 premiers", icon: "📋",
        rule: "Les 5 premiers ingredients = 80% du produit",
        explanation: "La liste INCI est classee par quantite decroissante. Les 5 premiers ingredients representent la quasi-totalite. Si tu vois de l eau + des silicones en tete, c est une base synthetique.",
        quiz: { question: "Que signifie un ingredient en 1re position ?", options: [{ id: "a", text: "Il est le moins present", correct: false }, { id: "b", text: "Il est le plus present", correct: true }, { id: "c", text: "C est le plus cher", correct: false }], feedback: { correct: "INCI = ordre decroissant de quantite.", incorrect: "L ordre INCI est strictement par quantite. Position 1 = ingredient dominant." } },
        action: "Lis les 5 premiers ingredients de ta creme ou ton shampooing.", ficheSlug: "composition-cosmetique" },
      { id: 4, slug: "parfums", title: "Parfums et conservateurs", icon: "🌸",
        rule: "Le mot Parfum peut cacher des dizaines de molecules",
        explanation: "La reglementation autorise le mot generique Parfum/Fragrance sans lister les molecules. Certaines sont allergeniques. Les conservateurs comme les parabenes sont debattus.",
        quiz: { question: "Que cache le mot Parfum sur une etiquette ?", options: [{ id: "a", text: "Une seule molecule naturelle", correct: false }, { id: "b", text: "Potentiellement des dizaines de molecules non listees", correct: true }, { id: "c", text: "Rien de special", correct: false }], feedback: { correct: "Parfum est un terme generique qui peut regrouper 50+ substances.", incorrect: "Le mot Parfum est reglementairement autorise sans detail. Il peut cacher de nombreuses molecules." } },
        action: "Compte combien de tes produits contiennent le mot Parfum/Fragrance." },
      { id: 5, slug: "cumul-cosmetique", title: "Cumul quotidien", icon: "📊",
        rule: "C est le nombre total de produits appliques qui compte",
        explanation: "Gel douche + shampooing + deodorant + creme + maquillage + parfum = 6+ produits/jour. Chacun avec ses ingredients. Le cumul est rarement evalue.",
        quiz: { question: "Combien de produits cosmetiques utilises-tu par jour ?", options: [{ id: "a", text: "1 a 2", correct: false }, { id: "b", text: "Probablement 5 a 10", correct: true }, { id: "c", text: "0", correct: false }], feedback: { correct: "La plupart des gens utilisent 5 a 10 produits/jour sans y penser.", incorrect: "Pense a tout : dentifrice, savon, creme, deodorant, maquillage, parfum..." } },
        action: "Compte TOUS les produits que tu appliques demain matin.", ficheSlug: "exposition-cutanee" }
    ]
  },
  {
    id: "menager", name: "Produits menagers", icon: "🏠", color: "#f59e0b", tagline: "Comprendre ce que tu utilises",
    steps: [
      { id: 1, slug: "spray-vs-liquide", title: "Spray vs liquide", icon: "💨",
        rule: "Un spray est inhale. Un liquide beaucoup moins.",
        explanation: "Les sprays dispersent des micro-gouttelettes que tu inhales directement. Un nettoyant liquide sur une eponge limite enormement l exposition respiratoire.",
        quiz: { question: "Pourquoi les sprays meritent plus d attention ?", options: [{ id: "a", text: "Ils sont plus chers", correct: false }, { id: "b", text: "On inhale les micro-gouttelettes", correct: true }, { id: "c", text: "Ils nettoient moins bien", correct: false }], feedback: { correct: "L inhalation directe est la voie d exposition la plus rapide.", incorrect: "Le probleme n est pas le prix ou l efficacite. C est l inhalation." } },
        action: "Compte tes sprays a la maison. Peux-tu en remplacer un par un liquide ?", ficheSlug: "inhalation-menagers" },
      { id: 2, slug: "ventilation", title: "Ventilation", icon: "🪟",
        rule: "Aerer apres le menage reduit l exposition de 80%",
        explanation: "Les composants volatils (COV) des produits menagers restent dans l air interieur. 10 minutes de ventilation apres le menage elimine la majorite.",
        quiz: { question: "Combien de temps faut-il aerer apres le menage ?", options: [{ id: "a", text: "Pas besoin", correct: false }, { id: "b", text: "10 minutes minimum", correct: true }, { id: "c", text: "2 heures", correct: false }], feedback: { correct: "10 minutes suffisent pour renouveler l air et evacuer les COV.", incorrect: "L aeration est essentielle. 10 minutes suffisent pour un renouvellement efficace." } },
        action: "Apres ton prochain menage, ouvre les fenetres 10 minutes.", ficheSlug: "air-interieur" },
      { id: 3, slug: "desinfection", title: "Desinfection inutile", icon: "🦠",
        rule: "Desinfecter est rarement necessaire a la maison",
        explanation: "Nettoyer (enlever les salissures) suffit dans 95% des cas. Desinfecter (tuer les microbes) est utile uniquement en cas de maladie. L abus de desinfectants favorise les resistances.",
        quiz: { question: "Quand desinfecter est-il vraiment utile ?", options: [{ id: "a", text: "Chaque jour", correct: false }, { id: "b", text: "Quand quelqu un est malade", correct: true }, { id: "c", text: "Jamais", correct: false }], feedback: { correct: "La desinfection est utile en cas de maladie. Le reste du temps, nettoyer suffit.", incorrect: "Nettoyer et desinfecter sont deux choses differentes. Nettoyer suffit au quotidien." } },
        action: "As-tu un desinfectant que tu utilises quotidiennement ? Est-ce necessaire ?", ficheSlug: "quand-desinfecter" },
      { id: 4, slug: "air-interieur", title: "Air interieur", icon: "🌬️",
        rule: "L air interieur est 5 a 10 fois plus pollue que l exterieur",
        explanation: "Bougies parfumees, encens, produits menagers, meubles neufs : tout emet des COV. L air interieur est souvent plus pollue que l air exterieur en ville.",
        quiz: { question: "L air interieur est generalement :", options: [{ id: "a", text: "Plus pur que l exterieur", correct: false }, { id: "b", text: "5 a 10 fois plus pollue que l exterieur", correct: true }, { id: "c", text: "Identique a l exterieur", correct: false }], feedback: { correct: "Meubles, produits, bougies, cuisson : tout contribue a la pollution interieure.", incorrect: "Contrairement a l intuition, l air interieur est bien plus charge en polluants." } },
        action: "Identifie 1 source de pollution interieure chez toi.", ficheSlug: "air-interieur" },
      { id: 5, slug: "simplifier", title: "Simplifier", icon: "✨",
        rule: "3 produits suffisent pour tout nettoyer",
        explanation: "Vinaigre blanc + savon noir + bicarbonate. Ces 3 produits couvrent 90% des besoins menagers. Moins de produits = moins d exposition = moins de depenses.",
        quiz: { question: "Combien de produits faut-il pour nettoyer toute la maison ?", options: [{ id: "a", text: "Un produit different par surface", correct: false }, { id: "b", text: "3 produits simples suffisent", correct: true }, { id: "c", text: "Il faut au moins 10 produits", correct: false }], feedback: { correct: "Vinaigre, savon noir, bicarbonate = trio qui couvre presque tout.", incorrect: "Le marketing nous fait croire qu il faut un produit par surface. 3 suffisent." } },
        action: "Essaie le vinaigre blanc pour une surface cette semaine." }
    ]
  }
];
