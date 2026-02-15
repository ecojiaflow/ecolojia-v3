export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface Quiz {
  question: string;
  options: QuizOption[];
  feedback: { correct: string; incorrect: string };
}

export interface MethodePrinciple {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  explanation: string;
  examples: { food: string; cosmetic: string; household: string };
  quiz: Quiz;
  action: string;
}

export const METHODE_PRINCIPLES: MethodePrinciple[] = [
  {
    id: 1,
    slug: "repetition",
    title: "La repetition faconne l'impact",
    subtitle: "Ce n'est jamais un produit isole qui compte",
    icon: "🔁",
    color: "#10b981",
    explanation: "Un ecart occasionnel n'a pas d'impact. C'est la repetition quotidienne qui faconne ta sante. Le Nutella du dimanche n'est pas le probleme. C'est Nutella + jus + biscuit, tous les matins.",
    examples: {
      food: "Un soda de temps en temps vs un soda chaque repas",
      cosmetic: "Un parfum le week-end vs 5 produits parfumes chaque jour",
      household: "Un spray une fois par mois vs un spray chaque jour"
    },
    quiz: {
      question: "Qu'est-ce qui a le plus d'impact sur ta sante ?",
      options: [
        { id: "a", text: "Manger un gateau a un anniversaire", correct: false },
        { id: "b", text: "Manger des biscuits industriels chaque matin", correct: true },
        { id: "c", text: "Boire un soda au restaurant", correct: false }
      ],
      feedback: {
        correct: "Exactement. C'est la repetition quotidienne qui compte, pas l'exception.",
        incorrect: "Pas tout a fait. Un ecart ponctuel a peu d'impact. C'est la repetition qui faconne."
      }
    },
    action: "Cette semaine, identifie 1 produit que tu consommes CHAQUE JOUR."
  },
  {
    id: 2,
    slug: "transformation",
    title: "Moins transforme = plus lisible",
    subtitle: "Liste courte = signal de simplicite",
    icon: "📋",
    color: "#0ea5e9",
    explanation: "Plus un produit a une liste d'ingredients longue, plus il s'eloigne de sa forme d'origine. Une pomme n'a pas de liste d'ingredients. Un yaourt nature en a 2. Un gateau industriel en a 20+.",
    examples: {
      food: "3 ingredients (farine, eau, sel) vs 25 ingredients avec noms chimiques",
      cosmetic: "Huile vegetale pure vs creme avec 30 composants INCI",
      household: "Vinaigre blanc vs spray multi-action avec 15 substances"
    },
    quiz: {
      question: "Quel signal indique qu'un produit est tres transforme ?",
      options: [
        { id: "a", text: "Il est bio", correct: false },
        { id: "b", text: "Sa liste d'ingredients est tres longue", correct: true },
        { id: "c", text: "Il est cher", correct: false }
      ],
      feedback: {
        correct: "Oui. La longueur de la liste est un indicateur simple et fiable de transformation.",
        incorrect: "Le prix ou le label bio ne disent rien sur le niveau de transformation. Regarde la liste d'ingredients."
      }
    },
    action: "Retourne un produit chez toi. Compte les ingredients. Plus de 10 ? C'est un signal."
  },
  {
    id: 3,
    slug: "invisible",
    title: "Le visible cache l'invisible",
    subtitle: "Sucre cache, sel industriel, parfums synthetiques",
    icon: "👁️",
    color: "#f59e0b",
    explanation: "70% du sel que tu consommes vient des produits industriels, pas de la saliere. Les parfums dans les cosmetiques peuvent contenir des dizaines de molecules non listees. L'air interieur est 5 a 10 fois plus pollue que l'exterieur.",
    examples: {
      food: "Du sucre dans une sauce tomate, du sel dans des cereales",
      cosmetic: "Le mot 'parfum' sur l'etiquette cache parfois 50+ molecules",
      household: "Un spray desodorisant libere des COV dans ton air"
    },
    quiz: {
      question: "D'ou vient la majorite du sel dans notre alimentation ?",
      options: [
        { id: "a", text: "La saliere a table", correct: false },
        { id: "b", text: "Les produits industriels", correct: true },
        { id: "c", text: "L'eau du robinet", correct: false }
      ],
      feedback: {
        correct: "Exact. 70 a 80% du sel consomme est deja dans les produits avant que tu ne les achetes.",
        incorrect: "En realite, la majorite vient des produits industriels (pain, charcuterie, plats prepares), pas de la saliere."
      }
    },
    action: "Verifie le sel dans ton pain ou tes cereales. Tu seras probablement surpris."
  },
  {
    id: 4,
    slug: "contexte",
    title: "Le contexte change tout",
    subtitle: "Dose, frequence, duree de contact, population",
    icon: "🎯",
    color: "#8b5cf6",
    explanation: "Un produit n'est jamais 'bon' ou 'mauvais' dans l'absolu. Un shampooing se rince en 2 minutes. Une creme de jour reste 12 heures sur la peau. La meme substance dans les deux n'a pas le meme impact.",
    examples: {
      food: "Un yaourt par jour vs 4 produits laitiers a chaque repas",
      cosmetic: "Un gel douche (rince) vs un deodorant (reste 24h)",
      household: "Un nettoyant sol (evapore) vs un spray (inhale directement)"
    },
    quiz: {
      question: "Entre un shampooing et une creme visage, lequel pose plus de questions ?",
      options: [
        { id: "a", text: "Le shampooing (on en met plus)", correct: false },
        { id: "b", text: "La creme visage (reste des heures sur la peau)", correct: true },
        { id: "c", text: "Aucun des deux", correct: false }
      ],
      feedback: {
        correct: "Oui. La duree de contact est determinante. Un produit rince en 2 min a moins d'impact qu'un produit qui reste 12h.",
        incorrect: "La quantite compte moins que la duree de contact. Un produit non rince reste des heures sur ta peau."
      }
    },
    action: "Parmi tes produits cosmetiques, identifie ceux qui RESTENT sur ta peau vs ceux qui sont rinces."
  },
  {
    id: 5,
    slug: "autonomie",
    title: "L'autonomie est le but",
    subtitle: "Ecolojia n'impose pas : elle apprend a decider",
    icon: "🌱",
    color: "#059669",
    explanation: "Ecolojia ne te dira jamais 'ne mange pas ca'. L'objectif est que TU comprennes pourquoi certaines repetitions meritent attention. Pas de perfection. De la progression. Pas de peur. De la conscience.",
    examples: {
      food: "Savoir pourquoi tu choisis, pas suivre un score",
      cosmetic: "Comprendre les 5 premiers ingredients, pas memoriser une liste noire",
      household: "Decider si un desinfectant est vraiment necessaire"
    },
    quiz: {
      question: "Quel est l'objectif d'Ecolojia ?",
      options: [
        { id: "a", text: "Interdire les mauvais produits", correct: false },
        { id: "b", text: "Donner un score a chaque produit", correct: false },
        { id: "c", text: "T'aider a comprendre pour decider par toi-meme", correct: true }
      ],
      feedback: {
        correct: "C'est ca. L'autonomie, pas la dependance a une app. Tu apprends a raisonner.",
        incorrect: "Ecolojia ne juge pas et ne note pas. Elle t'aide a comprendre pour que TU decides."
      }
    },
    action: "La prochaine fois que tu achetes un produit, pose-toi 1 question : est-ce que je le repete souvent ?"
  }
];
