export enum CategoryType {
  ALIMENTAIRE = 'alimentaire',
  COSMETIQUE = 'cosmetique', 
  MODE = 'mode',
  MAISON = 'maison',
  ELECTRONIQUE = 'electronique',
  SPORT = 'sport',
  MOBILITE = 'mobilite'
}

export interface CategoryConfig {
  name: string;
  icon: string;
  color: string;
  criteria: string[];
  weights: {
    health?: number;
    environmental?: number;
    social?: number;
    durability?: number;
  };
}

export const CATEGORIES: Record<CategoryType, CategoryConfig> = {
  [CategoryType.ALIMENTAIRE]: {
    name: "Alimentaire",
    icon: "Ã°Å¸ÂÅ½",
    color: "green",
    criteria: ["bio", "local", "équitable", "saisonnier"],
    weights: { health: 0.35, environmental: 0.3, social: 0.15 }
  },
  [CategoryType.COSMETIQUE]: {
    name: "Cosmétiques", 
    icon: "Ã°Å¸â€™â€ž",
    color: "pink",
    criteria: ["clean", "naturel", "cruelty-free", "vegan"],
    weights: { health: 0.4, environmental: 0.25, social: 0.15 }
  },
  [CategoryType.MODE]: {
    name: "Mode",
    icon: "Ã°Å¸â€˜â€¢", 
    color: "blue",
    criteria: ["éthique", "durable", "local", "recyclé"],
    weights: { environmental: 0.35, social: 0.25, durability: 0.15 }
  },
  [CategoryType.MAISON]: {
    name: "Maison",
    icon: "Ã°Å¸ÂÂ ",
    color: "orange", 
    criteria: ["écologique", "non-toxique", "durable", "local"],
    weights: { health: 0.3, environmental: 0.35, durability: 0.2 }
  },
  [CategoryType.ELECTRONIQUE]: {
    name: "Ãƒâ€°lectronique",
    icon: "Ã°Å¸â€œÂ±",
    color: "purple",
    criteria: ["reconditionné", "réparable", "efficace", "recyclable"],
    weights: { environmental: 0.4, durability: 0.3, social: 0.1 }
  },
  [CategoryType.SPORT]: {
    name: "Sport", 
    icon: "Ã°Å¸ÂÆ’",
    color: "red",
    criteria: ["recyclé", "éthique", "durable", "local"],
    weights: { environmental: 0.3, social: 0.25, durability: 0.25 }
  },
  [CategoryType.MOBILITE]: {
    name: "Mobilité",
    icon: "Ã°Å¸Å¡â€”", 
    color: "teal",
    criteria: ["électrique", "doux", "efficace", "partagé"],
    weights: { environmental: 0.45, social: 0.2, durability: 0.15 }
  }
};
